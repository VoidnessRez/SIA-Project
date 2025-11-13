import nodemailer from 'nodemailer';

// Email service configuration
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Use Gmail SMTP (you can change to other providers)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'mejia.spareparts.system@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-app-password' // Use App Password, not regular password
        },
        // Alternative: Use a different SMTP service
        // host: 'smtp.ethereal.email', // For testing
        // port: 587,
        // secure: false,
        // auth: {
        //   user: 'ethereal-user',
        //   pass: 'ethereal-pass'
        // }
      });

      // Verify connection
      await this.transporter.verify();
      console.log('✅ Email service connected successfully');
    } catch (error) {
      console.error('❌ Email service connection failed:', error.message);
      
      // Fallback to Ethereal Email for testing
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log('📧 Using Ethereal Email for testing');
        console.log('Test account:', testAccount.user);
      } catch (testError) {
        console.error('❌ Fallback email service failed:', testError.message);
      }
    }
  }

  async sendOTP(email, otpCode, adminUser = 'Admin') {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const mailOptions = {
      from: {
        name: 'MSAdevsUnit3',
        address: process.env.EMAIL_USER || 'mejia.spareparts.system@gmail.com'
      },
      to: email,
      subject: '🔐 Admin Access Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 40px 30px; }
            .otp-box { background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: white; letter-spacing: 8px; margin: 10px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #ecf0f1; padding: 20px; text-align: center; color: #7f8c8d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛡️ MSAdevsUnit3</h1>
              <p style="color: #ecf0f1; margin: 5px 0 0 0;">Admin Access Verification</p>
            </div>
            
            <div class="content">
              <h2>Hello ${adminUser}!</h2>
              <p>You've requested access to the <strong>Administrative Inventory Management System</strong>.</p>
              
              <div class="otp-box">
                <p style="color: white; margin: 0; font-size: 14px;">Your verification code:</p>
                <div class="otp-code">${otpCode}</div>
                <p style="color: white; margin: 0; font-size: 12px;">Valid for 5 minutes</p>
              </div>
              
              <div class="warning">
                <h4 style="margin: 0 0 10px 0; color: #d68910;">⚠️ Security Notice</h4>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>This code expires in <strong>5 minutes</strong></li>
                  <li>Never share this code with anyone</li>
                  <li>If you didn't request this, contact IT immediately</li>
                  <li>All admin activities are logged and monitored</li>
                </ul>
              </div>
              
              <p>If you have any questions, please contact the system administrator.</p>
              
              <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
              <p style="color: #7f8c8d; font-size: 12px;">
                This is an automated security message. Please do not reply to this email.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Mejia Spareparts Management System</strong></p>
              <p>Secure • Reliable • Professional</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        MSAdevsUnit3 - Admin Access Verification
        
        Hello ${adminUser}!
        
        Your OTP verification code is: ${otpCode}
        
        This code expires in 5 minutes.
        
        Security Notice:
        - Never share this code with anyone
        - If you didn't request this, contact IT immediately
        - All admin activities are logged and monitored
        
        Generated on ${new Date().toLocaleString()}
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ OTP email sent successfully:', info.messageId);
      
      // For Ethereal Email, provide preview URL
      if (nodemailer.getTestMessageUrl(info)) {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error);
      throw error;
    }
  }

  async sendSecurityAlert(email, alertType, details = {}) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const mailOptions = {
      from: {
        name: 'MSAdevsUnit3',
        address: process.env.EMAIL_USER || 'mejia.spareparts.system@gmail.com'
      },
      to: email,
      subject: '🚨 Admin Security Alert',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🚨 Security Alert</h1>
            </div>
            <div style="padding: 30px;">
              <h2>Admin Access Notification</h2>
              <p><strong>Action:</strong> ${action}</p>
              <p><strong>User:</strong> ${adminUser}</p>
              <p><strong>IP Address:</strong> ${ipAddress}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              
              <div style="background: #ffebee; border: 1px solid #ef5350; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>If this wasn't you:</strong></p>
                <ul style="margin: 10px 0;">
                  <li>Change your admin password immediately</li>
                  <li>Contact the system administrator</li>
                  <li>Review recent admin activities</li>
                </ul>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send security alert:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new EmailService();