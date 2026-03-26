import time
from typing import Optional, Dict, Any
from enum import Enum

try:
    from pyfingerprint import PyFingerPrint
    PyFingerprint = PyFingerPrint
    FINGERPRINT_AVAILABLE = True
except ImportError:
    try:
        from pyfingerprint import PyFingerprint
        FINGERPRINT_AVAILABLE = True
    except ImportError:
        FINGERPRINT_AVAILABLE = False


class EnrollmentStep(Enum):
    IDLE = "idle"
    WAITING_FIRST = "waiting_first_scan"
    WAITING_SECOND = "waiting_second_scan"
    COMPLETED = "completed"
    FAILED = "failed"


class FingerprintHardware:
    def __init__(self, port='/dev/ttyAMA0', baudrate=57600, password=0xFFFFFFFF, address=0x00000000):
        self.port = port
        self.baudrate = baudrate
        self.password = password
        self.address = address
        self.finger: Optional[PyFingerprint] = None
        self._is_initialized = False
        
        self._enrollment_step = EnrollmentStep.IDLE
        self._temp_characteristics = None
        self._stored_fingerprint_id: Optional[int] = None
        self._step_start_time: float = 0
        self._timeout_seconds = 30

    def initialize(self) -> Dict[str, Any]:
        if not FINGERPRINT_AVAILABLE:
            return {
                "available": False,
                "error": "pyfingerprint library not installed"
            }
        
        try:
            self.finger = PyFingerprint(self.port, self.baudrate, self.password, self.address)
            
            if not self.finger.verifyPassword():
                return {
                    "available": False,
                    "error": "Fingerprint sensor password verification failed"
                }
            
            self._is_initialized = True
            self._reset_enrollment()
            
            return {
                "available": True,
                "status": "ready",
                "sensor_info": self._get_sensor_info()
            }
        except Exception as e:
            return {
                "available": False,
                "error": str(e)
            }

    def _get_sensor_info(self) -> Dict[str, Any]:
        if not self.finger:
            return {}
        
        try:
            return {
                "capacity": self.finger.getStorageCapacity(),
                "library_size": self.finger.getLibrarySize()
            }
        except:
            return {}

    def health_check(self) -> Dict[str, Any]:
        if not self._is_initialized or not self.finger:
            return {"status": "unavailable"}
        
        try:
            self.finger.verifyPassword()
            return {
                "status": "online",
                "available": True,
                "info": self._get_sensor_info()
            }
        except Exception as e:
            return {
                "status": "error",
                "available": False,
                "error": str(e)
            }

    def _reset_enrollment(self):
        self._enrollment_step = EnrollmentStep.IDLE
        self._temp_characteristics = None
        self._stored_fingerprint_id = None
        self._step_start_time = 0

    def _check_timeout(self) -> bool:
        if time.time() - self._step_start_time > self._timeout_seconds:
            self._enrollment_step = EnrollmentStep.FAILED
            return True
        return False

    def start_enrollment(self) -> Dict[str, Any]:
        if not self._is_initialized:
            return {"error": "Fingerprint sensor not initialized"}
        
        if self._enrollment_step != EnrollmentStep.IDLE:
            return {
                "error": "Enrollment already in progress",
                "step": self._enrollment_step.value
            }
        
        self._reset_enrollment()
        self._enrollment_step = EnrollmentStep.WAITING_FIRST
        self._step_start_time = time.time()
        
        return {
            "success": True,
            "step": "place_finger",
            "message": "Place finger on sensor"
        }

    def poll_enrollment(self) -> Dict[str, Any]:
        if self._enrollment_step == EnrollmentStep.IDLE:
            return {"step": "idle", "message": "No enrollment in progress"}
        
        if self._enrollment_step == EnrollmentStep.COMPLETED:
            return {
                "step": "completed",
                "fingerprintId": self._stored_fingerprint_id,
                "message": "Enrollment successful"
            }
        
        if self._enrollment_step == EnrollmentStep.FAILED:
            return {
                "step": "failed",
                "error": "Enrollment timed out or failed",
                "message": "Please restart enrollment"
            }
        
        if self._check_timeout():
            return {
                "step": "failed",
                "error": "Enrollment timed out",
                "message": "Please restart enrollment"
            }
        
        try:
            if self._enrollment_step == EnrollmentStep.WAITING_FIRST:
                if self.finger.readImage():
                    self.finger.convertImage(0x01)
                    
                    result = self.finger.searchTemplate()
                    position = result[0]
                    
                    if position >= 0:
                        self._reset_enrollment()
                        return {
                            "step": "failed",
                            "error": f"Finger already enrolled (ID: {position})"
                        }
                    
                    self._temp_characteristics = self.finger.downloadCharacteristics(0x01)
                    self._enrollment_step = EnrollmentStep.WAITING_SECOND
                    self._step_start_time = time.time()
                    
                    return {
                        "step": "remove_finger",
                        "message": "Remove finger, then place same finger again"
                    }
                
                return {
                    "step": "waiting",
                    "substep": "first_scan",
                    "message": "Waiting for finger placement..."
                }
            
            elif self._enrollment_step == EnrollmentStep.WAITING_SECOND:
                if self.finger.readImage():
                    self.finger.convertImage(0x02)
                    char_set_2 = self.finger.downloadCharacteristics(0x02)
                    
                    if self._temp_characteristics != char_set_2:
                        self._reset_enrollment()
                        return {
                            "step": "failed",
                            "error": "Finger mismatch - please restart"
                        }
                    
                    self.finger.createTemplate()
                    position = self.finger.storeTemplate()
                    
                    self._stored_fingerprint_id = position
                    self._enrollment_step = EnrollmentStep.COMPLETED
                    
                    return {
                        "step": "completed",
                        "fingerprintId": position,
                        "message": "Fingerprint enrolled successfully"
                    }
                
                return {
                    "step": "waiting",
                    "substep": "second_scan",
                    "message": "Place same finger again..."
                }
        
        except Exception as e:
            self._reset_enrollment()
            return {
                "step": "failed",
                "error": str(e)
            }

    def verify(self, fingerprint_id: Optional[int] = None) -> Dict[str, Any]:
        if not self._is_initialized or not self.finger:
            return {"error": "Fingerprint sensor not initialized"}
        
        try:
            if not self.finger.readImage():
                return {
                    "verified": False,
                    "status": "waiting",
                    "message": "Place finger on sensor"
                }
            
            self.finger.convertImage(0x01)
            result = self.finger.searchTemplate()
            position = result[0]
            
            if position < 0:
                return {
                    "verified": False,
                    "status": "not_found",
                    "message": "Fingerprint not enrolled"
                }
            
            if fingerprint_id is not None and position != fingerprint_id:
                return {
                    "verified": False,
                    "status": "mismatch",
                    "message": f"Expected ID {fingerprint_id}, found {position}",
                    "foundId": position
                }
            
            return {
                "verified": True,
                "fingerprintId": position,
                "message": "Fingerprint verified successfully"
            }
        
        except Exception as e:
            return {
                "verified": False,
                "error": str(e)
            }

    def delete(self, fingerprint_id: int) -> Dict[str, Any]:
        if not self._is_initialized or not self.finger:
            return {"error": "Fingerprint sensor not initialized"}
        
        try:
            self.finger.deleteTemplate(fingerprint_id)
            return {
                "success": True,
                "deletedId": fingerprint_id,
                "message": f"Fingerprint ID {fingerprint_id} deleted"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def cancel_enrollment(self):
        self._reset_enrollment()
        return {"success": True, "message": "Enrollment cancelled"}

    def get_enrollment_status(self) -> Dict[str, Any]:
        return {
            "step": self._enrollment_step.value,
            "fingerprintId": self._stored_fingerprint_id,
            "timeout_active": self._step_start_time > 0 and self._enrollment_step not in [EnrollmentStep.IDLE, EnrollmentStep.COMPLETED, EnrollmentStep.FAILED]
        }
