import StorageUtils from './storageUtils.js';

export const PAYMENT_SETTINGS_STORAGE_KEY = 'systemSettings';

export const DEFAULT_GCASH_QR_SETTINGS = {
  qrImageUrl: '',
  qrLimitNote: ''
};

export function loadGcashQrSettings() {
  const saved = StorageUtils.getFromLocalStorage(PAYMENT_SETTINGS_STORAGE_KEY, {});

  return {
    qrImageUrl: String(saved.gcashQrImageUrl || DEFAULT_GCASH_QR_SETTINGS.qrImageUrl).trim(),
    qrLimitNote: ''
  };
}

export async function fetchGcashQrSettings(apiBaseUrl) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/system-settings/gcash-qr`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result?.message || 'Failed to load GCash QR');
    }

    return {
      qrImageUrl: String(result.url || '').trim(),
      qrLimitNote: ''
    };
  } catch (error) {
    console.error('[PaymentSettings] Failed to fetch GCash QR:', error);
    return loadGcashQrSettings();
  }
}
