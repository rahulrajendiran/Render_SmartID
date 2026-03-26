import serial
import time
from typing import Optional, Dict, Any, List

try:
    import serial
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False


class GSMHardware:
    def __init__(self, port='/dev/ttyUSB0', baudrate=9600):
        self.port = port
        self.baudrate = baudrate
        self.serial: Optional[serial.Serial] = None
        self._is_initialized = False

    def initialize(self) -> Dict[str, Any]:
        if not SERIAL_AVAILABLE:
            return {
                "available": False,
                "error": "pySerial library not installed"
            }
        
        try:
            self.serial = serial.Serial(self.port, self.baudrate, timeout=15)
            time.sleep(5)
            
            self._send_command("AT")
            response = self._read_response()
            
            if "OK" in response:
                self._is_initialized = True
                return {
                    "available": True,
                    "status": "ready",
                    "signal": self._get_signal_strength()
                }
            else:
                return {
                    "available": False,
                    "error": "GSM module not responding to AT commands"
                }
        except Exception as e:
            return {
                "available": False,
                "error": str(e)
            }

    def _send_command(self, command: str, delay: float = 1) -> str:
        if not self.serial:
            return ""
        
        self.serial.write(f"{command}\r\n".encode())
        time.sleep(delay)
        return self._read_response()

    def _read_response(self) -> str:
        if not self.serial or not self.serial.in_waiting:
            return ""
        
        response = self.serial.read(self.serial.in_waiting).decode('utf-8', errors='ignore')
        return response

    def _get_signal_strength(self) -> Dict[str, Any]:
        response = self._send_command("AT+CSQ")
        
        try:
            if "+CSQ:" in response:
                parts = response.split("+CSQ:")[1].split(",")[0].strip()
                rssi = int(parts)
                
                if rssi == 0:
                    quality = "not detectable"
                elif rssi <= 9:
                    quality = "poor"
                elif rssi <= 14:
                    quality = "fair"
                elif rssi <= 19:
                    quality = "good"
                else:
                    quality = "excellent"
                
                return {"rssi": rssi, "quality": quality}
        except:
            pass
        
        return {"rssi": None, "quality": "unknown"}

    def health_check(self) -> Dict[str, Any]:
        if not self._is_initialized:
            return {"status": "unavailable"}
        
        try:
            signal = self._get_signal_strength()
            return {
                "status": "online",
                "available": True,
                "signal": signal
            }
        except Exception as e:
            return {
                "status": "error",
                "available": False,
                "error": str(e)
            }

    def send_sms(self, phone: str, message: str) -> Dict[str, Any]:
        if not self._is_initialized:
            return {"error": "GSM module not initialized"}

        if not phone or not message:
            return {"error": "Phone number and message are required"}

        phone = phone.strip()
        if not phone.startswith("+"):
            phone = "+" + phone

        try:
            self._send_command("AT+CMGF=1", delay=2)
            
            self.serial.write(f'AT+CMGS="{phone}"\r\n'.encode())
            time.sleep(2)
            
            self.serial.write(f"{message}\r\n".encode())
            self.serial.write(bytes([26]))
            
            time.sleep(5)
            response = self._read_response()
            
            if "OK" in response or "+CMGS:" in response:
                return {
                    "success": True,
                    "to": phone,
                    "message": "SMS sent successfully"
                }
            else:
                return {
                    "success": False,
                    "error": "SMS send failed",
                    "response": response
                }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def send_at_command(self, command: str) -> Dict[str, Any]:
        try:
            response = self._send_command(command)
            return {
                "success": True,
                "response": response
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def close(self):
        if self.serial and self.serial.is_open:
            self.serial.close()
