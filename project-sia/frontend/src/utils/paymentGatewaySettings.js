import StorageUtils from './storageUtils.js';

export const PAYMENT_SETTINGS_STORAGE_KEY = 'systemSettings';

export const DEFAULT_GCASH_QR_SETTINGS = {
  qrImageUrl: '/assets/gcash-qr.jpg',
  qrLimitNote: ''
};

export function loadGcashQrSettings() {
  const saved = StorageUtils.getFromLocalStorage(PAYMENT_SETTINGS_STORAGE_KEY, {});

  return {
    qrImageUrl: String(saved.gcashQrImageUrl || DEFAULT_GCASH_QR_SETTINGS.qrImageUrl).trim(),
    qrLimitNote: ''
  };
}
