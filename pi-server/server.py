import os
import time
import uuid
from flask import Flask, jsonify, request
from flask_cors import CORS

from hardware.fingerprint import FingerprintHardware
from hardware.nfc import NFCHardware
from hardware.gsm import GSMHardware
from state import state_manager, OperationState

app = Flask(__name__)
CORS(app)

fingerprint = FingerprintHardware(port='/dev/ttyAMA0', baudrate=57600)
nfc = NFCHardware()
gsm = GSMHardware(port='/dev/ttyUSB0', baudrate=9600)


@app.route("/health", methods=["GET"])
def health_check():
    state_manager.cleanup_old_operations()
    
    fp_health = fingerprint.health_check()
    nfc_health = nfc.health_check()
    gsm_health = gsm.health_check()
    
    all_available = (
        fp_health.get("available", False) and
        nfc_health.get("available", False) and
        gsm_health.get("available", False)
    )
    
    return jsonify({
        "status": "online" if any(h.get("available") for h in [fp_health, nfc_health, gsm_health]) else "degraded",
        "services": {
            "fingerprint": fp_health,
            "nfc": nfc_health,
            "gsm": gsm_health
        },
        "stateManager": state_manager.get_status(),
        "lastCheck": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })


@app.route("/scan-nfc", methods=["POST"])
def scan_nfc():
    data = request.get_json() or {}
    timeout = data.get("timeout", 30)
    
    op_id = str(uuid.uuid4())[:8]
    state_manager.create_operation(op_id, "nfc_scan", timeout=timeout)
    state_manager.set_step(op_id, "waiting_nfc")
    
    result = nfc.read_card(timeout=timeout)
    
    if result.get("success"):
        state_manager.complete_operation(op_id, {
            "nfcId": result["nfcId"],
            "nfcText": result.get("nfcText"),
            "scanTime": result.get("scanTime", 0)
        })
        return jsonify({
            "success": True,
            "nfcId": result["nfcId"],
            "nfcText": result.get("nfcText"),
            "operationId": op_id
        })
    else:
        state_manager.fail_operation(op_id, result.get("error", "Unknown error"))
        return jsonify({
            "success": False,
            "error": result.get("error", "NFC scan failed"),
            "operationId": op_id
        }), 400


@app.route("/enroll-fingerprint", methods=["POST"])
def enroll_fingerprint():
    op_id = str(uuid.uuid4())[:8]
    
    result = fingerprint.start_enrollment()
    
    if "error" in result:
        return jsonify({
            "success": False,
            "error": result["error"]
        }), 400
    
    state_manager.create_operation(op_id, "fingerprint_enroll", timeout=60)
    state_manager.set_step(op_id, "place_finger", {
        "fingerprintId": None
    })
    
    return jsonify({
        "success": True,
        "operationId": op_id,
        "step": result["step"],
        "message": result["message"]
    })


@app.route("/enroll-fingerprint/status", methods=["GET"])
def enroll_fingerprint_status():
    op_id = request.args.get("operationId")
    
    if op_id:
        op = state_manager.get_operation(op_id)
        if not op:
            return jsonify({
                "success": False,
                "error": "Operation not found"
            }), 404
    else:
        op = state_manager.get_current_operation()
        if not op or op.operation_type != "fingerprint_enroll":
            fp_status = fingerprint.get_enrollment_status()
            return jsonify({
                "success": True,
                "enrollment": fp_status
            })
    
    result = fingerprint.poll_enrollment()
    
    if result.get("step") == "completed":
        state_manager.complete_operation(op.operation_id, {
            "fingerprintId": result["fingerprintId"]
        })
        return jsonify({
            "success": True,
            "operationId": op.operation_id,
            "completed": True,
            "fingerprintId": result["fingerprintId"],
            "message": result.get("message")
        })
    
    elif result.get("step") == "failed":
        state_manager.fail_operation(op.operation_id, result.get("error", "Enrollment failed"))
        return jsonify({
            "success": False,
            "operationId": op.operation_id,
            "failed": True,
            "error": result.get("error")
        }), 400
    
    state_manager.set_step(op.operation_id, result.get("step", "waiting"))
    
    return jsonify({
        "success": True,
        "operationId": op.operation_id,
        "step": result.get("step"),
        "substep": result.get("substep"),
        "message": result.get("message"),
        "timeout": op.timeout_seconds - (time.time() - op.updated_at)
    })


@app.route("/enroll-fingerprint/complete", methods=["POST"])
def enroll_fingerprint_complete():
    result = fingerprint.poll_enrollment()
    
    if result.get("step") == "completed":
        return jsonify({
            "success": True,
            "fingerprintId": result["fingerprintId"],
            "message": result.get("message")
        })
    elif result.get("step") == "failed":
        return jsonify({
            "success": False,
            "error": result.get("error")
        }), 400
    
    return jsonify({
        "success": True,
        "in_progress": True,
        "step": result.get("step"),
        "message": result.get("message")
    })


@app.route("/enroll-fingerprint/cancel", methods=["POST"])
def enroll_fingerprint_cancel():
    fingerprint.cancel_enrollment()
    
    op = state_manager.get_current_operation()
    if op and op.operation_type == "fingerprint_enroll":
        state_manager.cancel_operation(op.operation_id)
    
    return jsonify({
        "success": True,
        "message": "Enrollment cancelled"
    })


@app.route("/verify-fingerprint", methods=["POST"])
def verify_fingerprint():
    data = request.get_json() or {}
    fingerprint_id = data.get("fingerprintId")
    
    op_id = str(uuid.uuid4())[:8]
    state_manager.create_operation(op_id, "fingerprint_verify", timeout=30)
    state_manager.set_step(op_id, "waiting_fingerprint")
    
    result = fingerprint.verify(fingerprint_id=fingerprint_id)
    
    if result.get("verified"):
        state_manager.complete_operation(op_id, {
            "fingerprintId": result["fingerprintId"]
        })
        return jsonify({
            "success": True,
            "verified": True,
            "fingerprintId": result["fingerprintId"],
            "operationId": op_id
        })
    elif result.get("status") == "waiting":
        state_manager.set_step(op_id, "waiting_fingerprint", {
            "expectedId": fingerprint_id
        })
        return jsonify({
            "success": True,
            "verified": False,
            "status": "waiting",
            "message": result.get("message"),
            "operationId": op_id
        })
    else:
        state_manager.fail_operation(op_id, result.get("error", "Verification failed"))
        return jsonify({
            "success": False,
            "verified": False,
            "error": result.get("error"),
            "operationId": op_id
        }), 400


@app.route("/send-sms", methods=["POST"])
def send_sms():
    data = request.get_json()
    
    if not data:
        return jsonify({
            "success": False,
            "error": "Request body required"
        }), 400
    
    phone = data.get("phone")
    message = data.get("message")
    
    if not phone:
        return jsonify({
            "success": False,
            "error": "Phone number required"
        }), 400
    
    if not message:
        return jsonify({
            "success": False,
            "error": "Message required"
        }), 400
    
    op_id = str(uuid.uuid4())[:8]
    state_manager.create_operation(op_id, "send_sms", timeout=30)
    state_manager.set_step(op_id, "sending_sms")
    
    result = gsm.send_sms(phone, message)
    
    if result.get("success"):
        state_manager.complete_operation(op_id, {
            "to": phone
        })
        return jsonify({
            "success": True,
            "message": result.get("message"),
            "to": phone,
            "operationId": op_id
        })
    else:
        state_manager.fail_operation(op_id, result.get("error", "SMS send failed"))
        return jsonify({
            "success": False,
            "error": result.get("error"),
            "operationId": op_id
        }), 400


@app.route("/operation/<operation_id>", methods=["GET"])
def get_operation(operation_id):
    op = state_manager.get_operation(operation_id)
    
    if not op:
        return jsonify({
            "success": False,
            "error": "Operation not found"
        }), 404
    
    return jsonify({
        "operationId": op.operation_id,
        "type": op.operation_type,
        "state": op.state.value,
        "step": op.step,
        "data": op.data,
        "result": op.result,
        "error": op.error,
        "age_seconds": time.time() - op.created_at,
        "updated_ago_seconds": time.time() - op.updated_at
    })


@app.route("/operation/<operation_id>/cancel", methods=["POST"])
def cancel_operation(operation_id):
    op = state_manager.get_operation(operation_id)
    
    if not op:
        return jsonify({
            "success": False,
            "error": "Operation not found"
        }), 404
    
    if op.operation_type == "fingerprint_enroll":
        fingerprint.cancel_enrollment()
    
    state_manager.cancel_operation(operation_id)
    
    return jsonify({
        "success": True,
        "message": "Operation cancelled"
    })


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500


def initialize_hardware():
    print("Initializing hardware...")
    
    fp_result = fingerprint.initialize()
    if fp_result.get("available"):
        print(f"  Fingerprint: OK - {fp_result.get('sensor_info', {})}")
    else:
        print(f"  Fingerprint: FAILED - {fp_result.get('error')}")
    
    nfc_result = nfc.initialize()
    if nfc_result.get("available"):
        print("  NFC: OK")
    else:
        print(f"  NFC: FAILED - {nfc_result.get('error')}")
    
    gsm_result = gsm.initialize()
    if gsm_result.get("available"):
        print("  GSM: OK")
    else:
        print(f"  GSM: FAILED - {gsm_result.get('error')}")
    
    print("Hardware initialization complete.")


if __name__ == "__main__":
    initialize_hardware()
    
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
