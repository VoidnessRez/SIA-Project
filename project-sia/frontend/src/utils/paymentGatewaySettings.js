import StorageUtils from './storageUtils.js';

export const PAYMENT_SETTINGS_STORAGE_KEY = 'systemSettings';

export const DEFAULT_GCASH_QR_SETTINGS = {
  qrFirstName: '',
  qrLastName: '',
  qrNumber: '',
  qrImageUrl: '',
  qrLimitNote: 'Replace this QR when your receiving limit is reached.'
};

export function loadGcashQrSettings() {
  const saved = StorageUtils.getFromLocalStorage(PAYMENT_SETTINGS_STORAGE_KEY, {});

  return {
    qrFirstName: String(saved.gcashQrFirstName || '').trim(),
    qrLastName: String(saved.gcashQrLastName || '').trim(),
    qrNumber: String(saved.gcashNumber || '').trim(),
    qrImageUrl: String(saved.gcashQrImageUrl || '').trim(),
    qrLimitNote: String(saved.gcashQrLimitNote || DEFAULT_GCASH_QR_SETTINGS.qrLimitNote).trim() || DEFAULT_GCASH_QR_SETTINGS.qrLimitNote
  };
}

function maskWord(word, minStars = 6) {
  const clean = String(word || '').trim();
  if (!clean) return '';
  return `${clean.charAt(0)}${'*'.repeat(Math.max(minStars, clean.length - 1))}`;
}

export function getMaskedGcashName(firstName, lastName) {
  const first = maskWord(firstName, 6);
  const last = maskWord(lastName, 7);
  return [first, last].filter(Boolean).join(' ');
}

export function getMaskedGcashNumber(number) {
  const digits = String(number || '').replace(/\D/g, '');
  if (!digits) return '';

  const firstTwo = digits.slice(0, 2);
  const lastTwo = digits.slice(-2);
  return `${firstTwo}${'*'.repeat(8)}${lastTwo}`;
}
