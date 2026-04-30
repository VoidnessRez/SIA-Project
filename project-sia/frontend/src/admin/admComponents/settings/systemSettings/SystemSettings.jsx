import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import SkeletonLoader from '../../inventory/SkeletonLoader.jsx';
import StorageUtils from '../../../../utils/storageUtils';
import './SystemSettings.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Mejia Motor Parts',
    siteEmail: 'admin@mejiamotorparts.com',
    sitePhone: '+63 123 456 7890',
    currency: 'PHP',
    timezone: 'Asia/Manila',
    
    // Business Settings
    lowStockThreshold: 10,
    taxRate: 12,
    shippingFee: 50,
    
    // Business Hours
    businessHours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '08:00', close: '18:00', closed: false },
      sunday: { open: '08:00', close: '18:00', closed: true }
    },
    
    // Shipping Fees by Location
    shippingFees: {
      bulacan: 150,
      cavite: 200,
      laguna: 200,
      rizal: 180,
      batangas: 250,
      quezon: 300,
      ncr: 150,
      metroManila: 150,
      defaultFee: 250
    },
    
    // Email Configuration
    emailService: 'gmail',
    emailHost: 'smtp.gmail.com',
    emailPort: 587,
    emailUser: 'mejia.spareparts.system@gmail.com',
    emailPassword: '',
    emailSenderName: 'MSAdevsUnit3',
    emailSecure: false,
    
    // reCAPTCHA Settings
    recaptchaSiteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
    recaptchaSecretKey: '',
    enableRecaptcha: true,
    
    // Payment Gateway
    paymentMethods: {
      cod: true,
      gcash: false,
      paymaya: false,
      bankTransfer: false
    },
    gcashQrImageUrl: '',
    payMayaNumber: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankName: '',
    
    // Branding
    siteLogo: '',
    siteFavicon: '',
    primaryColor: '#2c3e50',
    secondaryColor: '#f39c12',
    
    // Notifications
    enableNotifications: true,
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    
    // Security
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    
    // Backup & Database
    autoBackup: false,
    backupFrequency: 'daily',
    lastBackup: 'Nov 20, 2025 02:00 AM',
    databaseSize: '2.4 GB'
  });

  const [activeTab, setActiveTab] = useState('general');
  const [qrFile, setQrFile] = useState(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      const savedSettings = StorageUtils.getFromLocalStorage('systemSettings', null);
      if (savedSettings && typeof savedSettings === 'object') {
        setSettings((prev) => ({ ...prev, ...savedSettings }));
      }
      setLoading(false);
    }, 800);
  }, []);

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = () => {
    console.log('[SystemSettings] 💾 Saving settings to localStorage...', {
      hasGcashQr: Boolean(settings.gcashQrImageUrl),
      gcashQrImageUrl: settings.gcashQrImageUrl || null,
      paymentMethods: settings.paymentMethods
    });
    StorageUtils.setToLocalStorage('systemSettings', settings);
    console.log('[SystemSettings] ✅ Saved settings:', settings);
    alert('Settings saved successfully!');
  };

  const handleUploadGcashQr = async () => {
    if (!qrFile) {
      alert('Please choose a QR image first.');
      return;
    }

    try {
      console.log('[SystemSettings] 📤 Uploading GCash QR...', {
        fileName: qrFile?.name,
        fileSize: qrFile?.size,
        fileType: qrFile?.type
      });
      setUploadingQr(true);
      const formData = new FormData();
      formData.append('qr', qrFile);

      const response = await fetch(`${API_URL}/api/upload/gcash-qr`, {
        method: 'POST',
        body: formData
      });

      console.log('[SystemSettings] 📡 Upload response status:', response.status);
      let result = null;
      try {
        result = await response.json();
      } catch (parseError) {
        const rawText = await response.text().catch(() => '');
        console.error('[SystemSettings] ❌ Upload response parse failed:', parseError);
        console.log('[SystemSettings] 📄 Upload raw response:', rawText);
      }
      console.log('[SystemSettings] 📦 Upload response body:', result);
      if (!response.ok || !result.success) {
        throw new Error(result?.message || 'Failed to upload QR');
      }

      const nextSettings = {
        ...settings,
        gcashQrImageUrl: result.url
      };
      setSettings(nextSettings);
      StorageUtils.setToLocalStorage('systemSettings', nextSettings);
      setQrFile(null);
      console.log('[SystemSettings] ✅ GCash QR set to:', result.url);
      alert('✅ GCash QR uploaded and saved. Refresh checkout to view it.');
    } catch (error) {
      console.error('GCash QR upload error:', error);
      alert(`Failed to upload GCash QR: ${error.message}`);
    } finally {
      setUploadingQr(false);
    }
  };

  return (
    <AdminLayout title="System Settings" description="Configure system preferences and settings">
      <div className="system-settings-container">
        {/* Summary Cards */}
        {loading ? (
          <SkeletonLoader type="stats" />
        ) : (
          <div className="settings-summary">
            <div className="summary-card">
              <div className="summary-label">System Status</div>
              <div className="summary-value success">Online</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Last Updated</div>
              <div className="summary-value">Nov 22, 2025</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Active Users</div>
              <div className="summary-value">245</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Database Size</div>
              <div className="summary-value">2.4 GB</div>
            </div>
          </div>
        )}

        {/* Settings Tabs */}
        {!loading && (
          <div className="settings-tabs">
            <button
              className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`tab-btn ${activeTab === 'business' ? 'active' : ''}`}
              onClick={() => setActiveTab('business')}
            >
              Business
            </button>
            <button
              className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipping')}
            >
              Shipping
            </button>
            <button
              className={`tab-btn ${activeTab === 'hours' ? 'active' : ''}`}
              onClick={() => setActiveTab('hours')}
            >
              Business Hours
            </button>
            <button
              className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
              onClick={() => setActiveTab('email')}
            >
              Email
            </button>
            <button
              className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
              onClick={() => setActiveTab('payment')}
            >
              Payment
            </button>
            <button
              className={`tab-btn ${activeTab === 'branding' ? 'active' : ''}`}
              onClick={() => setActiveTab('branding')}
            >
              Branding
            </button>
            <button
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            <button
              className={`tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
              onClick={() => setActiveTab('backup')}
            >
              Backup
            </button>
          </div>
        )}

        {/* Settings Content */}
        <div className="settings-content">
          {loading ? (
            <SkeletonLoader />
          ) : (
            <>
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="settings-section">
                  <h2>General Settings</h2>
                  <div className="settings-form">
                    <div className="form-group">
                      <label>Site Name</label>
                      <input
                        type="text"
                        value={settings.siteName}
                        onChange={(e) => handleInputChange('siteName', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Site Email</label>
                      <input
                        type="email"
                        value={settings.siteEmail}
                        onChange={(e) => handleInputChange('siteEmail', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Phone</label>
                      <input
                        type="text"
                        value={settings.sitePhone}
                        onChange={(e) => handleInputChange('sitePhone', e.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Currency</label>
                        <select
                          value={settings.currency}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                        >
                          <option value="PHP">PHP (₱)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Timezone</label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => handleInputChange('timezone', e.target.value)}
                        >
                          <option value="Asia/Manila">Asia/Manila</option>
                          <option value="UTC">UTC</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Business Tab */}
              {activeTab === 'business' && (
                <div className="settings-section">
                  <h2>Business Settings</h2>
                  <div className="settings-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Low Stock Threshold</label>
                        <input
                          type="number"
                          value={settings.lowStockThreshold}
                          onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value))}
                        />
                        <small>Alert when stock falls below this number</small>
                      </div>
                      <div className="form-group">
                        <label>Tax Rate (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={settings.taxRate}
                          onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
                        />
                        <small>VAT percentage applied to orders</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Tab */}
              {activeTab === 'shipping' && (
                <div className="settings-section">
                  <h2>Shipping Fee Management</h2>
                  <div className="settings-form">
                    <p className="section-note">Configure delivery fees by location. Used in checkout page.</p>
                    
                    <div className="shipping-grid">
                      <div className="form-group">
                        <label>Bulacan</label>
                        <div className="input-with-currency">
                          <span>₱</span>
                          <input
                            type="number"
                            value={settings.shippingFees.bulacan}
                            onChange={(e) => handleInputChange('shippingFees', {
                              ...settings.shippingFees,
                              bulacan: parseInt(e.target.value)
                            })}
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Cavite</label>
                        <div className="input-with-currency">
                          <span>₱</span>
                          <input
                            type="number"
                            value={settings.shippingFees.cavite}
                            onChange={(e) => handleInputChange('shippingFees', {
                              ...settings.shippingFees,
                              cavite: parseInt(e.target.value)
                            })}
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Laguna</label>
                        <div className="input-with-currency">
                          <span>₱</span>
                          <input
                            type="number"
                            value={settings.shippingFees.laguna}
                            onChange={(e) => handleInputChange('shippingFees', {
                              ...settings.shippingFees,
                              laguna: parseInt(e.target.value)
                            })}
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Rizal</label>
                        <div className="input-with-currency">
                          <span>₱</span>
                          <input
                            type="number"
                            value={settings.shippingFees.rizal}
                            onChange={(e) => handleInputChange('shippingFees', {
                              ...settings.shippingFees,
                              rizal: parseInt(e.target.value)
                            })}
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Batangas</label>
                        <div className="input-with-currency">
                          <span>₱</span>
                          <input
                            type="number"
                            value={settings.shippingFees.batangas}
                            onChange={(e) => handleInputChange('shippingFees', {
                              ...settings.shippingFees,
                              batangas: parseInt(e.target.value)
                            })}
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Quezon</label>
                        <div className="input-with-currency">
                          <span>₱</span>
                          <input
                            type="number"
                            value={settings.shippingFees.quezon}
                            onChange={(e) => handleInputChange('shippingFees', {
                              ...settings.shippingFees,
                              quezon: parseInt(e.target.value)
                            })}
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>NCR / Metro Manila</label>
                        <div className="input-with-currency">
                          <span>₱</span>
                          <input
                            type="number"
                            value={settings.shippingFees.ncr}
                            onChange={(e) => handleInputChange('shippingFees', {
                              ...settings.shippingFees,
                              ncr: parseInt(e.target.value),
                              metroManila: parseInt(e.target.value)
                            })}
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Default Fee (Other Areas)</label>
                        <div className="input-with-currency">
                          <span>₱</span>
                          <input
                            type="number"
                            value={settings.shippingFees.defaultFee}
                            onChange={(e) => handleInputChange('shippingFees', {
                              ...settings.shippingFees,
                              defaultFee: parseInt(e.target.value)
                            })}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="info-box">
                      <strong>💡 Note:</strong> Pickup orders are always free. These fees apply to delivery orders only.
                    </div>
                  </div>
                </div>
              )}

              {/* Business Hours Tab */}
              {activeTab === 'hours' && (
                <div className="settings-section">
                  <h2>Business Hours</h2>
                  <div className="settings-form">
                    <p className="section-note">Set your operating hours. Displayed on Contact page.</p>
                    
                    {Object.entries(settings.businessHours).map(([day, hours]) => (
                      <div key={day} className="hours-row">
                        <div className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</div>
                        <div className="hours-controls">
                          <div className="form-toggle">
                            <label>Closed</label>
                            <input
                              type="checkbox"
                              checked={hours.closed}
                              onChange={(e) => handleInputChange('businessHours', {
                                ...settings.businessHours,
                                [day]: { ...hours, closed: e.target.checked }
                              })}
                            />
                          </div>
                          {!hours.closed && (
                            <>
                              <input
                                type="time"
                                value={hours.open}
                                onChange={(e) => handleInputChange('businessHours', {
                                  ...settings.businessHours,
                                  [day]: { ...hours, open: e.target.value }
                                })}
                              />
                              <span>to</span>
                              <input
                                type="time"
                                value={hours.close}
                                onChange={(e) => handleInputChange('businessHours', {
                                  ...settings.businessHours,
                                  [day]: { ...hours, close: e.target.value }
                                })}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Email Configuration Tab */}
              {activeTab === 'email' && (
                <div className="settings-section">
                  <h2>Email Configuration</h2>
                  <div className="settings-form">
                    <p className="section-note">Configure SMTP settings for sending emails (OTP, notifications, etc.)</p>
                    
                    <div className="form-group">
                      <label>Email Service</label>
                      <select
                        value={settings.emailService}
                        onChange={(e) => handleInputChange('emailService', e.target.value)}
                      >
                        <option value="gmail">Gmail</option>
                        <option value="outlook">Outlook</option>
                        <option value="custom">Custom SMTP</option>
                      </select>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>SMTP Host</label>
                        <input
                          type="text"
                          value={settings.emailHost}
                          onChange={(e) => handleInputChange('emailHost', e.target.value)}
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div className="form-group">
                        <label>SMTP Port</label>
                        <input
                          type="number"
                          value={settings.emailPort}
                          onChange={(e) => handleInputChange('emailPort', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={settings.emailUser}
                        onChange={(e) => handleInputChange('emailUser', e.target.value)}
                      />
                      <small>Email used to send system emails</small>
                    </div>
                    
                    <div className="form-group">
                      <label>Email Password / App Password</label>
                      <input
                        type="password"
                        value={settings.emailPassword}
                        onChange={(e) => handleInputChange('emailPassword', e.target.value)}
                        placeholder="••••••••"
                      />
                      <small>For Gmail, use App Password not regular password</small>
                    </div>
                    
                    <div className="form-group">
                      <label>Sender Name</label>
                      <input
                        type="text"
                        value={settings.emailSenderName}
                        onChange={(e) => handleInputChange('emailSenderName', e.target.value)}
                      />
                      <small>Display name in sent emails</small>
                    </div>
                    
                    <div className="form-toggle">
                      <label>Enable SSL/TLS</label>
                      <input
                        type="checkbox"
                        checked={settings.emailSecure}
                        onChange={(e) => handleInputChange('emailSecure', e.target.checked)}
                      />
                    </div>
                    
                    <div className="test-email-section">
                      <button className="test-btn">📧 Send Test Email</button>
                      <small>Verify your email configuration</small>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Gateway Tab */}
              {activeTab === 'payment' && (
                <div className="settings-section">
                  <h2>Payment Gateway Configuration</h2>
                  <div className="settings-form">
                    <p className="section-note">Configure available payment methods for customers</p>
                    
                    <h3>Payment Methods</h3>
                    <div className="payment-methods">
                      <div className="form-toggle">
                        <label>💵 Cash on Delivery (COD)</label>
                        <input
                          type="checkbox"
                          checked={settings.paymentMethods.cod}
                          onChange={(e) => handleInputChange('paymentMethods', {
                            ...settings.paymentMethods,
                            cod: e.target.checked
                          })}
                        />
                      </div>
                      
                      <div className="form-toggle">
                        <label>💙 GCash</label>
                        <input
                          type="checkbox"
                          checked={settings.paymentMethods.gcash}
                          onChange={(e) => handleInputChange('paymentMethods', {
                            ...settings.paymentMethods,
                            gcash: e.target.checked
                          })}
                        />
                      </div>
                      
                      <div className="form-toggle">
                        <label>💚 PayMaya</label>
                        <input
                          type="checkbox"
                          checked={settings.paymentMethods.paymaya}
                          onChange={(e) => handleInputChange('paymentMethods', {
                            ...settings.paymentMethods,
                            paymaya: e.target.checked
                          })}
                        />
                      </div>
                      
                      <div className="form-toggle">
                        <label>🏦 Bank Transfer</label>
                        <input
                          type="checkbox"
                          checked={settings.paymentMethods.bankTransfer}
                          onChange={(e) => handleInputChange('paymentMethods', {
                            ...settings.paymentMethods,
                            bankTransfer: e.target.checked
                          })}
                        />
                      </div>
                    </div>
                    
                    {settings.paymentMethods.gcash && (
                      <>
                        <p className="section-note">
                          Upload the active GCash QR image. Checkout will show this QR for payment.
                        </p>
                        <div className="form-group">
                          <label>GCash QR Image</label>
                          <div className="gcash-qr-upload">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                              disabled={uploadingQr}
                            />
                            <button
                              type="button"
                              className="test-btn"
                              onClick={handleUploadGcashQr}
                              disabled={uploadingQr || !qrFile}
                            >
                              {uploadingQr ? 'Uploading...' : 'Upload / Replace QR'}
                            </button>
                          </div>
                          {settings.gcashQrImageUrl && (
                            <>
                              <img src={settings.gcashQrImageUrl} alt="GCash QR" className="gcash-qr-preview" />
                              <div className="gcash-qr-actions">
                                <a
                                  className="test-btn"
                                  href={settings.gcashQrImageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View QR
                                </a>
                                <a
                                  className="test-btn"
                                  href={settings.gcashQrImageUrl}
                                  download
                                >
                                  Save QR
                                </a>
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                    
                    {settings.paymentMethods.paymaya && (
                      <div className="form-group">
                        <label>PayMaya Number</label>
                        <input
                          type="text"
                          value={settings.payMayaNumber}
                          onChange={(e) => handleInputChange('payMayaNumber', e.target.value)}
                          placeholder="09XX XXX XXXX"
                        />
                      </div>
                    )}
                    
                    {settings.paymentMethods.bankTransfer && (
                      <>
                        <div className="form-group">
                          <label>Bank Name</label>
                          <input
                            type="text"
                            value={settings.bankName}
                            onChange={(e) => handleInputChange('bankName', e.target.value)}
                            placeholder="e.g. BDO, BPI, Metrobank"
                          />
                        </div>
                        <div className="form-group">
                          <label>Account Name</label>
                          <input
                            type="text"
                            value={settings.bankAccountName}
                            onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Account Number</label>
                          <input
                            type="text"
                            value={settings.bankAccountNumber}
                            onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    
                    <h3 style={{ marginTop: '30px' }}>reCAPTCHA Settings</h3>
                    <div className="form-toggle">
                      <label>Enable reCAPTCHA</label>
                      <input
                        type="checkbox"
                        checked={settings.enableRecaptcha}
                        onChange={(e) => handleInputChange('enableRecaptcha', e.target.checked)}
                      />
                      <small>Protect forms from spam and bots</small>
                    </div>
                    
                    {settings.enableRecaptcha && (
                      <>
                        <div className="form-group">
                          <label>reCAPTCHA Site Key</label>
                          <input
                            type="text"
                            value={settings.recaptchaSiteKey}
                            onChange={(e) => handleInputChange('recaptchaSiteKey', e.target.value)}
                            placeholder="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                          />
                          <small>Public key for frontend</small>
                        </div>
                        <div className="form-group">
                          <label>reCAPTCHA Secret Key</label>
                          <input
                            type="password"
                            value={settings.recaptchaSecretKey}
                            onChange={(e) => handleInputChange('recaptchaSecretKey', e.target.value)}
                            placeholder="••••••••••••••••••••"
                          />
                          <small>Private key for backend verification</small>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Branding Tab */}
              {activeTab === 'branding' && (
                <div className="settings-section">
                  <h2>Branding & Appearance</h2>
                  <div className="settings-form">
                    <div className="form-group">
                      <label>Site Logo</label>
                      <div className="file-upload-area">
                        <input type="file" accept="image/*" />
                        <p>Upload your site logo (PNG, JPG, SVG)</p>
                        {settings.siteLogo && <img src={settings.siteLogo} alt="Logo" className="logo-preview" />}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Favicon</label>
                      <div className="file-upload-area">
                        <input type="file" accept="image/*" />
                        <p>Upload favicon (ICO, PNG 32x32)</p>
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Primary Color</label>
                        <div className="color-input">
                          <input
                            type="color"
                            value={settings.primaryColor}
                            onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          />
                          <input
                            type="text"
                            value={settings.primaryColor}
                            onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Secondary Color</label>
                        <div className="color-input">
                          <input
                            type="color"
                            value={settings.secondaryColor}
                            onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                          />
                          <input
                            type="text"
                            value={settings.secondaryColor}
                            onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="settings-section">
                  <h2>Notification Settings</h2>
                  <div className="settings-form">
                    <div className="form-toggle">
                      <label>Enable Notifications</label>
                      <input
                        type="checkbox"
                        checked={settings.enableNotifications}
                        onChange={(e) => handleInputChange('enableNotifications', e.target.checked)}
                      />
                    </div>
                    <div className="form-toggle">
                      <label>Email Notifications</label>
                      <input
                        type="checkbox"
                        checked={settings.enableEmailNotifications}
                        onChange={(e) => handleInputChange('enableEmailNotifications', e.target.checked)}
                      />
                    </div>
                    <div className="form-toggle">
                      <label>SMS Notifications</label>
                      <input
                        type="checkbox"
                        checked={settings.enableSMSNotifications}
                        onChange={(e) => handleInputChange('enableSMSNotifications', e.target.checked)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="settings-section">
                  <h2>Security Settings</h2>
                  <div className="settings-form">
                    <div className="form-toggle">
                      <label>Maintenance Mode</label>
                      <input
                        type="checkbox"
                        checked={settings.maintenanceMode}
                        onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                      />
                      <small>Enable to put site in maintenance mode</small>
                    </div>
                    <div className="form-toggle">
                      <label>Allow User Registration</label>
                      <input
                        type="checkbox"
                        checked={settings.allowRegistration}
                        onChange={(e) => handleInputChange('allowRegistration', e.target.checked)}
                      />
                    </div>
                    <div className="form-toggle">
                      <label>Require Email Verification</label>
                      <input
                        type="checkbox"
                        checked={settings.requireEmailVerification}
                        onChange={(e) => handleInputChange('requireEmailVerification', e.target.checked)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Backup & Database Tab */}
              {activeTab === 'backup' && (
                <div className="settings-section">
                  <h2>Backup & Database</h2>
                  <div className="settings-form">
                    <div className="backup-status">
                      <div className="status-card">
                        <div className="status-label">Database Size</div>
                        <div className="status-value">{settings.databaseSize}</div>
                      </div>
                      <div className="status-card">
                        <div className="status-label">Last Backup</div>
                        <div className="status-value">{settings.lastBackup}</div>
                      </div>
                    </div>
                    
                    <div className="form-toggle">
                      <label>Enable Automatic Backup</label>
                      <input
                        type="checkbox"
                        checked={settings.autoBackup}
                        onChange={(e) => handleInputChange('autoBackup', e.target.checked)}
                      />
                    </div>
                    
                    {settings.autoBackup && (
                      <div className="form-group">
                        <label>Backup Frequency</label>
                        <select
                          value={settings.backupFrequency}
                          onChange={(e) => handleInputChange('backupFrequency', e.target.value)}
                        >
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    )}
                    
                    <div className="backup-actions">
                      <button className="backup-btn">💾 Backup Now</button>
                      <button className="restore-btn">📥 Restore from Backup</button>
                      <button className="export-btn">📤 Export Database</button>
                    </div>
                    
                    <div className="warning-box">
                      <strong>⚠️ Warning:</strong> Creating backups may temporarily affect system performance. Schedule backups during low-traffic hours.
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="settings-actions">
                <button className="save-btn" onClick={handleSaveSettings}>
                  💾 Save Settings
                </button>
                <button className="reset-btn">
                  ↺ Reset to Default
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SystemSettings;
