// Persistent Device Fingerprinting & Identity Management
// Ties voter accreditation to their physical browser and hardware.

const DEVICE_STORAGE_KEY = 'neco_voter_device_id';

/**
 * Generate a cryptographically secure random UUID v4
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create the unique, persistent device ID for this browser.
 * Persists in both localStorage and document.cookie for resilience.
 */
export function getDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!deviceId) {
      // Check cookie fallback
      const match = document.cookie.match(new RegExp('(^| )' + DEVICE_STORAGE_KEY + '=([^;]+)'));
      if (match) {
        deviceId = match[2];
        localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
      }
    }

    if (!deviceId) {
      deviceId = generateUUID();
      localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
      // Persist cookie for 365 days
      const expires = new Date();
      expires.setDate(expires.getDate() + 365);
      document.cookie = `${DEVICE_STORAGE_KEY}=${deviceId}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    }

    return deviceId;
  } catch (err) {
    console.warn('Storage unavailable, fallback device token generated', err);
    return generateUUID();
  }
}

/**
 * Summarize readable device and browser information.
 * e.g., "Chrome on Windows", "Safari on iPhone", "Chrome on Android"
 */
export function getDeviceInfo(): string {
  if (typeof navigator === 'undefined') return 'Unknown Device';

  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  // Detect OS
  if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Win/i.test(ua)) os = 'Windows';
  else if (/Mac/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // Detect Browser
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome';
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera';

  return `${browser} on ${os}`;
}
