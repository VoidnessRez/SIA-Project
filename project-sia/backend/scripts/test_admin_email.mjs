import dotenv from 'dotenv';

dotenv.config({ path: './.env', override: true });

const { default: emailService } = await import('../services/emailService.js');
const targetEmail = process.argv[2] || process.env.TEST_EMAIL || 'khenardgwapo123@gmail.com';

try {
  const result = await emailService.sendOTP(targetEmail, '123456', 'Admin Test');
  console.log('RESULT', result);
} catch (e) {
  console.error('ADMIN_EMAIL_ERROR', e?.message || e);
  process.exitCode = 1;
}
