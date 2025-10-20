/**
 * Serial Codec - Simple wrapper functions for the serial decoder
 */

export interface BasicInfo {
  type: string;
  length: number;
}

/**
 * Get basic info from serial
 */
export function getBasicInfo(serial: string): BasicInfo {
  return {
    type: serial[2] || '?',
    length: serial.length
  };
}

/**
 * Check if serial is valid
 */
export function isValidSerial(serial: string): boolean {
  return serial.startsWith('@U') && serial.length > 3;
}
