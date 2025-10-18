
export async function sendOtp(email) {

  const simulatedRequestId = 'req_' + Math.random().toString(36).substring(2, 9);
  // Simulate OTP stored in sessionStorage for dev/test only (not secure)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  sessionStorage.setItem(simulatedRequestId, otp);
  console.info('[otpService] simulated OTP for', email, otp);
  return { success: true, requestId: simulatedRequestId };
}

// verifyOtp checks the OTP against the stored value (simulated)
export async function verifyOtp(requestId, otp) {
  const stored = sessionStorage.getItem(requestId);
  if (!stored) return { success: false, error: 'Request not found or expired' };
  if (stored !== otp) return { success: false, error: 'Invalid OTP' };
  sessionStorage.removeItem(requestId);
  return { success: true };
}

export default { sendOtp, verifyOtp };
