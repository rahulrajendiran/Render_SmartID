const hardwareBridgeUrl = process.env.HARDWARE_BRIDGE_URL;
const hardwareBridgeKey = process.env.HARDWARE_BRIDGE_KEY;

const buildHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (hardwareBridgeKey) {
    headers.Authorization = `Bearer ${hardwareBridgeKey}`;
  }

  return headers;
};

export const isHardwareBridgeConfigured = () => Boolean(hardwareBridgeUrl);

export const callHardwareBridge = async (path, options = {}) => {
  if (!hardwareBridgeUrl) {
    return null;
  }

  const response = await fetch(`${hardwareBridgeUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      ...buildHeaders(),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'string'
      ? payload
      : payload?.message || `Hardware bridge request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const normalizeHardwareStatus = (payload) => {
  const services = payload?.services || payload || {};

  return {
    bridgeConfigured: isHardwareBridgeConfigured(),
    nfc: services.nfc || 'unavailable',
    fingerprint: services.fingerprint || 'unavailable',
    gsm: services.gsm || 'unavailable',
    pi: services.pi || services.raspberryPi || 'unavailable',
    database: services.database || payload?.database || 'unknown',
    api: services.api || payload?.api || 'online',
    lastCheck: payload?.lastCheck || new Date().toISOString()
  };
};
