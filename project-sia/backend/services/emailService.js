import nodemailer from 'nodemailer';

// Email service configuration
class EmailService {
  constructor() {
    this.adminTransporter = null;
    this.ordersTransporter = null;
    this.emailTransport = process.env.EMAIL_TRANSPORT || 'auto';
    this.fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_ADMIN_USER || process.env.EMAIL_USER || process.env.EMAIL_ORDERS_USER || 'mejia.spareparts.system@gmail.com';
    this.adminFromAddress = process.env.EMAIL_ADMIN_FROM || process.env.EMAIL_FROM || process.env.EMAIL_ADMIN_USER || process.env.EMAIL_USER || process.env.EMAIL_ORDERS_USER || 'mejia.spareparts.system@gmail.com';
    this.ordersFromAddress = process.env.EMAIL_ORDERS_FROM || process.env.EMAIL_FROM || process.env.EMAIL_ORDERS_USER || process.env.EMAIL_ADMIN_USER || process.env.EMAIL_USER || 'mejia.spareparts.system@gmail.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Mejia Spareparts';
    this.useResend = !!process.env.RESEND_API_KEY;
    this.useBrevo = !!process.env.BREVO_API_KEY;
    this.initializeTransporters().catch(err => {
      console.error('❌ Failed to initialize email service:', err);
    });
  }

  getActiveProvider() {
    if (this.useResend) return 'resend';
    if (this.useBrevo) return 'brevo';
    return 'smtp';
  }

  logReadinessChecks() {
    const provider = this.getActiveProvider();
    const transport = this.emailTransport;
    const adminReady = provider === 'smtp' ? !!this.adminTransporter : (this.useResend || this.useBrevo);
    const ordersReady = provider === 'smtp' ? !!this.ordersTransporter : (this.useResend || this.useBrevo);

    console.log(`[Email Check] Admin flow: ready=${adminReady} transport=${transport} provider=${provider} from=${this.adminFromAddress}`);
    console.log(`[Email Check] Orders flow: ready=${ordersReady} transport=${transport} provider=${provider} from=${this.ordersFromAddress}`);
  }

  async initializeTransporters() {
    if (this.emailTransport === 'api' || (this.emailTransport === 'auto' && (this.useResend || this.useBrevo))) {
      if (this.useResend) {
        console.log('✅ Email service configured: Resend API');
      } else if (this.useBrevo) {
        console.log('✅ Email service configured: Brevo API');
      } else {
        console.warn('⚠️ EMAIL_TRANSPORT=api but no RESEND_API_KEY/BREVO_API_KEY found; falling back to SMTP');
      }

      if (this.useResend || this.useBrevo) {
        this.logReadinessChecks();
        return;
      }
    }

    try {
      const adminEmailUser = process.env.EMAIL_ADMIN_USER || process.env.EMAIL_USER || process.env.EMAIL_ORDERS_USER || 'mejia.spareparts.system@gmail.com';
      const adminEmailPass = process.env.EMAIL_ADMIN_PASS || process.env.EMAIL_PASS || process.env.EMAIL_ORDERS_PASS || 'your-app-password';
      const ordersEmailUser = process.env.EMAIL_ORDERS_USER || process.env.EMAIL_ADMIN_USER || process.env.EMAIL_USER || 'mejia.spareparts.system@gmail.com';
      const ordersEmailPass = process.env.EMAIL_ORDERS_PASS || process.env.EMAIL_ADMIN_PASS || process.env.EMAIL_PASS || 'your-app-password';

      // Admin Email Transporter (for OTP, security alerts)
      this.adminTransporter = nodemailer.createTransport({
        service: 'gmail',
        connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 8000),
        greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 8000),
        socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 12000),
        auth: {
          user: adminEmailUser,
          pass: adminEmailPass
        }
      });

      // Orders Email Transporter (for order receipts)
      this.ordersTransporter = nodemailer.createTransport({
        service: 'gmail',
        connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 8000),
        greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 8000),
        socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 12000),
        auth: {
          user: ordersEmailUser,
          pass: ordersEmailPass
        }
      });

      // Verify both connections
      await this.adminTransporter.verify();
      console.log(`✅ Admin email service connected (${adminEmailUser})`);
      
      await this.ordersTransporter.verify();
      console.log(`✅ Orders email service connected (${ordersEmailUser})`);
      this.logReadinessChecks();
      
    } catch (error) {
      console.error('❌ Email service connection failed:', error.message);
      
      // Fallback to Ethereal Email for testing
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.adminTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 8000),
          greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 8000),
          socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 12000),
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.ordersTransporter = this.adminTransporter; // Use same for both in test mode
        console.log('📧 Using Ethereal Email for testing');
        console.log('Test account:', testAccount.user);
      } catch (testError) {
        console.error('❌ Fallback email service failed:', testError.message);
        console.warn('⚠️ Email service will be unavailable, but server will continue running');
        // Don't throw - let the server continue without email service
      }
    }
  }

  async sendWithResend({ to, subject, html, text, fromAddress, fromName }) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${fromName || this.fromName} <${fromAddress || this.fromAddress}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.message || payload?.error || 'Resend API request failed');
    }

    return {
      success: true,
      provider: 'resend',
      messageId: payload?.id || payload?.data?.id || null
    };
  }

  async sendWithBrevo({ to, subject, html, text, fromAddress, fromName }) {
    const recipients = Array.isArray(to) ? to : [to];
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: fromName || this.fromName,
          email: fromAddress || this.fromAddress
        },
        to: recipients.map((email) => ({ email })),
        subject,
        htmlContent: html,
        textContent: text
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.message || payload?.code || 'Brevo API request failed');
    }

    return {
      success: true,
      provider: 'brevo',
      messageId: payload?.messageId || null
    };
  }

  async sendViaApi({ to, subject, html, text, fromAddress, fromName }) {
    if (this.useResend) {
      return this.sendWithResend({ to, subject, html, text, fromAddress, fromName });
    }
    if (this.useBrevo) {
      return this.sendWithBrevo({ to, subject, html, text, fromAddress, fromName });
    }
    throw new Error('No API email provider configured');
  }

  async sendViaSmtp(transporter, mailOptions) {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      provider: 'smtp',
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
  }

  async sendOTP(email, otpCode, adminUser = 'Admin') {
    const shouldUseApi = this.emailTransport === 'api' || (this.emailTransport === 'auto' && (this.useResend || this.useBrevo));
    if (!shouldUseApi && !this.adminTransporter) {
      throw new Error('Admin email service not initialized');
    }

    console.log(`[Email Check] Admin OTP send attempt: to=${email} provider=${shouldUseApi ? this.getActiveProvider() : 'smtp'} from=${this.adminFromAddress}`);

    const mailOptions = {
      from: {
        name: 'Mejia Spareparts Admin',
        address: this.adminFromAddress
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
      const result = shouldUseApi
        ? await this.sendViaApi({
          to: email,
          subject: mailOptions.subject,
          html: mailOptions.html,
          text: mailOptions.text,
          fromAddress: this.adminFromAddress,
          fromName: 'Mejia Spareparts Admin'
        })
        : await this.sendViaSmtp(this.adminTransporter, mailOptions);

      console.log(`✅ OTP email sent successfully via ${result.provider}:`, result.messageId || 'no-message-id');
      if (result.previewUrl) {
        console.log('📧 Preview URL:', result.previewUrl);
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error);
      throw error;
    }
  }

  async sendSecurityAlert(email, alertType, details = {}) {
    const shouldUseApi = this.emailTransport === 'api' || (this.emailTransport === 'auto' && (this.useResend || this.useBrevo));
    if (!shouldUseApi && !this.adminTransporter) {
      throw new Error('Admin email service not initialized');
    }

    const { action = alertType, adminUser = 'Unknown', ipAddress = 'Unknown' } = details;

    const mailOptions = {
      from: {
        name: 'Mejia Spareparts Admin',
        address: this.adminFromAddress
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
      const result = shouldUseApi
        ? await this.sendViaApi({
          to: email,
          subject: mailOptions.subject,
          html: mailOptions.html,
          fromAddress: this.adminFromAddress,
          fromName: 'Mejia Spareparts Admin'
        })
        : await this.sendViaSmtp(this.adminTransporter, mailOptions);

      return { success: true, messageId: result.messageId, provider: result.provider };
    } catch (error) {
      console.error('❌ Failed to send security alert:', error);
      throw error;
    }
  }

  /**
   * Send order receipt email (uses Orders email)
   */
  async sendOrderReceipt(orderDetails) {
    const shouldUseApi = this.emailTransport === 'api' || (this.emailTransport === 'auto' && (this.useResend || this.useBrevo));
    if (!shouldUseApi && !this.ordersTransporter) {
      throw new Error('Orders email service not initialized');
    }

    console.log(`[Email Check] Orders receipt send attempt: to=${orderDetails?.customerEmail || 'unknown'} provider=${shouldUseApi ? this.getActiveProvider() : 'smtp'} from=${this.ordersFromAddress}`);

    const {
      orderNumber,
      customerName,
      customerEmail,
      items = [],
      subtotal = 0,
      tax = 0,
      shippingFee = 0,
      discount = null,
      total = 0,
      paymentMethod,
      timestamp
    } = orderDetails;

    // Ensure numeric values with defaults
    const safeSubtotal = parseFloat(subtotal) || 0;
    const safeTax = parseFloat(tax) || 0;
    const safeShippingFee = parseFloat(shippingFee) || 0;
    const safeTotal = parseFloat(total) || 0;
    const safeDiscount = discount ? {
      type: discount.type || 'Discount',
      amount: parseFloat(discount.amount) || 0
    } : null;

    // Generate items HTML
    const itemsHtml = items.map(item => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      const total = price * quantity;
      
      return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">${item.image || '⚙️'}</span>
            <div>
              <strong>${item.name || 'Unknown Product'}</strong>
              <br/>
              <small style="color: #999;">${item.sku || 'N/A'}</small>
            </div>
          </div>
        </td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f0f0f0;">${quantity}</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f0f0f0;">₱${price.toLocaleString()}</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f0f0f0;">₱${total.toLocaleString()}</td>
      </tr>
    `;
    }).join('');

    const mailOptions = {
      from: {
        name: 'Mejia Spareparts',
        address: this.ordersFromAddress
      },
      to: customerEmail,
      subject: `Order Acknowledgement - ${orderNumber} (Pending Approval)`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 700px; margin: 0 auto; background-color: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">🏍️</div>
              <h1 style="color: white; margin: 0; font-size: 24px;">Mejia Spareparts</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">and Accessories</p>
            </div>

            <!-- Success Badge -->
            <div style="background: #f8f9fa; padding: 20px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: white; padding: 10px 25px; border-radius: 25px; font-weight: 600;">
                ⏳ Order Received - Pending Approval
              </div>
            </div>

            <!-- Order Info -->
            <div style="padding: 30px;">
              <h2 style="color: #333; margin-bottom: 20px;">Order Acknowledgement</h2>
              <p style="color: #666; margin-bottom: 20px;">Thank you for your order! This is an acknowledgement that we have received your order. Once your order is approved by our admin team, you will receive an official receipt via email.</p>
              
              <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">${orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Date:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">${new Date(timestamp).toLocaleString('en-PH')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Customer:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">${customerName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">${paymentMethod}</td>
                  </tr>
                </table>
              </div>

              <!-- Items -->
              <h3 style="color: #333; margin: 20px 0 15px 0;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase;">Item</th>
                    <th style="padding: 12px; text-align: center; font-size: 12px; color: #666; text-transform: uppercase;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; color: #666; text-transform: uppercase;">Price</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; color: #666; text-transform: uppercase;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals -->
              <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin-top: 20px;">
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0;">Subtotal:</td>
                    <td style="padding: 8px 0; text-align: right;">₱${safeSubtotal.toLocaleString()}</td>
                  </tr>
                  ${safeShippingFee > 0 ? `
                  <tr>
                    <td style="padding: 8px 0;">🚚 Shipping Fee:</td>
                    <td style="padding: 8px 0; text-align: right;">₱${safeShippingFee.toLocaleString()}</td>
                  </tr>
                  ` : ''}
                  
                  ${safeDiscount && safeDiscount.amount > 0 ? `
                  <tr style="color: #28a745; font-weight: 600;">
                    <td style="padding: 8px 0;">🎉 ${safeDiscount.type} (20%):</td>
                    <td style="padding: 8px 0; text-align: right;">-₱${safeDiscount.amount.toLocaleString()}</td>
                  </tr>
                  ` : ''}
                  <tr style="border-top: 3px solid #667eea; font-size: 18px; font-weight: 700; color: #667eea;">
                    <td style="padding: 15px 0 0 0;">TOTAL:</td>
                    <td style="padding: 15px 0 0 0; text-align: right;">₱${safeTotal.toLocaleString()}</td>
                  </tr>
                </table>
              </div>

              <!-- Status Notice -->
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin-top: 20px;">
                <p style="margin: 0; color: #856404; font-weight: 600;">⚠️ Order Status: PENDING APPROVAL</p>
                <p style="margin: 10px 0 0 0; color: #856404;">Your order has been received and is pending approval from our admin team. You will receive an email notification once your order is approved and ready for processing.</p>
              </div>

              <!-- Contact Info -->
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #f0f0f0; color: #666;">
                <p><strong>Contact Us:</strong></p>
                <p>📧 support@mejiaspareparts.com</p>
                <p>📞 09123456789</p>
                <p>📍 Antipolo City, Rizal</p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 20px;">
                <p style="color: #333; font-weight: 600; margin: 10px 0;">Thank you for shopping with us!</p>
                <p style="color: #999; font-size: 14px; font-style: italic; margin: 5px 0;">Your trusted motorcycle parts supplier</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = shouldUseApi
        ? await this.sendViaApi({
          to: customerEmail,
          subject: mailOptions.subject,
          html: mailOptions.html,
          fromAddress: this.ordersFromAddress,
          fromName: 'Mejia Spareparts'
        })
        : await this.sendViaSmtp(this.ordersTransporter, mailOptions);

      console.log(`✅ Receipt email sent via ${result.provider}:`, result.messageId || 'no-message-id');
      return { success: true, messageId: result.messageId, provider: result.provider };
    } catch (error) {
      console.error('❌ Failed to send receipt email:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new EmailService();