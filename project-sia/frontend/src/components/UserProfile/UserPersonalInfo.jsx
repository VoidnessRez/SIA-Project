import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './UserPersonalInfo.css';

console.log('🚀 [UserPersonalInfo] Component file loaded!');

const UserPersonalInfo = () => {
  console.log('🎯 [UserPersonalInfo] Component rendering...');
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();
  console.log('👤 [UserPersonalInfo] Current user:', user);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    // Address fields from addresses table (read-only)
    street_address: '',
    barangay: '',
    city: '',
    province: '',
    region: '',
    zipcode: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Fetch user profile data on mount
   
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('[UserPersonalInfo] 📋 Fetching profile for user:', user?.id);
      
      if (!user || !user.id) {
        console.error('[UserPersonalInfo] ❌ No user ID available');
        setMessage({ type: 'error', text: 'User not logged in' });
        return;
      }
      
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('[UserPersonalInfo] 📨 Profile query result:', { profile, error: profileError });

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[UserPersonalInfo] ❌ Profile fetch error:', profileError);
        throw profileError;
      }

      // Fetch primary address from addresses table
      if (profile?.id) {
        const { data: address, error: addressError } = await supabase
          .from('addresses')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('is_primary', true)
          .single();

        console.log('[UserPersonalInfo] 📨 Address query result:', { address, error: addressError });

        // Populate form with data
        const formDataToSet = {
          username: user.username || '',
          email: user.email || '',
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          phone: profile?.phone || '',
          street_address: address?.street || '',
          barangay: address?.barangay || '',
          city: address?.city || '',
          province: address?.province || '',
          region: address?.region || '',
          zipcode: address?.zip_code || ''
        };

        console.log('[UserPersonalInfo] ✅ Setting form data:', formDataToSet);
        setFormData(formDataToSet);
      } else {
        // No profile yet, just use user data
        setFormData({
          username: user.username || '',
          email: user.email || '',
          first_name: '',
          last_name: '',
          phone: '',
          street_address: '',
          barangay: '',
          city: '',
          province: '',
          region: '',
          zipcode: ''
        });
      }
    } catch (error) {
      console.error('[UserPersonalInfo] 💥 Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      // Validate password change if attempting to change password
      if (showPasswordSection && passwordData.new_password) {
        if (!passwordData.current_password) {
          setMessage({ type: 'error', text: 'Current password is required to change password' });
          setLoading(false);
          return;
        }
        if (passwordData.new_password.length < 6) {
          setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
          setLoading(false);
          return;
        }
        if (passwordData.new_password !== passwordData.confirm_password) {
          setMessage({ type: 'error', text: 'New passwords do not match' });
          setLoading(false);
          return;
        }

        // Change password using Supabase auth
        const { error: pwError } = await supabase.auth.updateUser({
          password: passwordData.new_password
        });

        if (pwError) {
          throw new Error('Failed to update password: ' + pwError.message);
        }

        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      }

      // ✅ Use backend API to update profile
      console.log('[UserPersonalInfo] 📤 Updating profile via backend API...');

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';
      const response = await fetch(`${API_URL}/api/auth/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name?.trim(),
          last_name: formData.last_name?.trim(),
          phone: formData.phone,
          bio: formData.bio
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[UserPersonalInfo] ❌ Update failed:', errorData);
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}` 
          : (errorData.error || 'Failed to update profile');
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[UserPersonalInfo] ✅ Profile updated successfully:', result);
      setMessage({ type: 'success', text: 'Profile updated successfully! ✅' });
      
      // Update user context with new data (NOT address - that needs admin approval)
      updateUserData({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        email: formData.email,
        username: formData.username
      });
      
      // Redirect back to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('[UserPersonalInfo] Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  console.log('🎨 [UserPersonalInfo] ABOUT TO RENDER! User:', user);
  
  return (
    <div className="personal-info-container" style={{ padding: '120px 20px 40px 20px', background: '#0f1419', minHeight: '100vh' }}>
      <div className="personal-info-box" style={{ maxWidth: '800px', margin: '0 auto', background: '#1a1d29', borderRadius: '12px', padding: '30px', color: 'white' }}>
        <div className="personal-info-header" style={{ marginBottom: '30px' }}>
          <button className="back-btn" onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', background: '#374151', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            ← Back
          </button>
          <h2 style={{ color: 'white', fontSize: '24px', marginTop: '20px' }}><br></br>Edit Personal Information<br></br></h2>
        </div>

        {loading && <div className="loading-spinner" style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading...</div>}

        <form onSubmit={handleSubmit} className="personal-info-form" style={{ display: 'block' }}>
          {/* Basic Info */}
          <div className="form-section" style={{ marginBottom: '24px', padding: '20px', background: '#262b35', borderRadius: '8px' }}>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>📋 Basic Information</h3>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="username" style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px', fontSize: '14px' }}>Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Enter username"
                style={{ width: '100%', padding: '12px', background: '#1a1d29', border: '1px solid #374151', borderRadius: '6px', color: 'white', fontSize: '14px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="email" style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px', fontSize: '14px' }}>Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter email"
                style={{ width: '100%', padding: '12px', background: '#1a1d29', border: '1px solid #374151', borderRadius: '6px', color: 'white', fontSize: '14px' }}
              />
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>⚠️ Changing email requires verification</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label htmlFor="first_name" style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px', fontSize: '14px' }}>First Name *</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  placeholder="Enter first name"
                  style={{ width: '100%', padding: '12px', background: '#1a1d29', border: '1px solid #374151', borderRadius: '6px', color: 'white', fontSize: '14px' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name" style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px', fontSize: '14px' }}>Last Name *</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  placeholder="Enter last name"
                  style={{ width: '100%', padding: '12px', background: '#1a1d29', border: '1px solid #374151', borderRadius: '6px', color: 'white', fontSize: '14px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="phone" style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px', fontSize: '14px' }}>Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="09XX XXX XXXX"
                style={{ width: '100%', padding: '12px', background: '#1a1d29', border: '1px solid #374151', borderRadius: '6px', color: 'white', fontSize: '14px' }}
              />
            </div>
          </div>

        {/* Password Change Section */}
        <div className="form-section" style={{ marginBottom: '24px', padding: '20px', background: '#262b35', borderRadius: '8px' }}>
          <div className="section-header-toggle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'white', margin: 0 }}>🔒 Change Password</h3>
            <button
              type="button"
              className="toggle-section-btn"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
            >
              {showPasswordSection ? '▼ Hide' : '▶ Show'}
            </button>
          </div>

          {showPasswordSection && (
            <div className="password-section">
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="current_password" style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px', fontSize: '14px' }}>Current Password *</label>
                <div className="password-input-wrapper" style={{ position: 'relative' }}>
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    id="current_password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    style={{ width: '100%', padding: '12px 48px 12px 12px', background: '#1a1d29', border: '1px solid #374151', borderRadius: '6px', color: 'white', fontSize: '14px' }}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => togglePasswordVisibility('current')}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                  >
                    {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="new_password" style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px', fontSize: '14px' }}>New Password *</label>
                <div className="password-input-wrapper" style={{ position: 'relative' }}>
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    id="new_password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password (min 6 characters)"
                    style={{ width: '100%', padding: '12px 48px 12px 12px', background: '#1a1d29', border: '1px solid #374151', borderRadius: '6px', color: 'white', fontSize: '14px' }}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => togglePasswordVisibility('new')}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                  >
                    {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="confirm_password" style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px', fontSize: '14px' }}>Confirm New Password *</label>
                <div className="password-input-wrapper" style={{ position: 'relative' }}>
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    id="confirm_password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    style={{ width: '100%', padding: '12px 48px 12px 12px', background: '#1a1d29', border: '1px solid #374151', borderRadius: '6px', color: 'white', fontSize: '14px' }}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => togglePasswordVisibility('confirm')}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                  >
                    {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
                💡 Leave password fields empty if you don't want to change your password
              </p>
            </div>
          )}
        </div>

        {/* Address Info - READ ONLY */}
        <div className="form-section" style={{ marginBottom: '24px', padding: '20px', background: '#262b35', borderRadius: '8px' }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>📍 Address Information</h3>
          <p style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '16px', padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid #f59e0b', borderRadius: '4px' }}>
            ⚠️ Address changes require admin approval. Contact support to update your address.
          </p>
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="street_address" style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px', fontSize: '14px' }}>Street Address</label>
            <input
              type="text"
              id="street_address"
              name="street_address"
              value={formData.street_address}
              disabled
              readOnly
              placeholder="No address saved"
              style={{ width: '100%', padding: '12px', background: '#1a1d29', border: '1px solid #374151', borderRadius: '6px', color: '#9ca3af', fontSize: '14px', cursor: 'not-allowed', opacity: '0.7' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="barangay" style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px', fontSize: '14px' }}>Barangay</label>
            <input
              type="text"
              id="barangay"
              name="barangay"
              value={formData.barangay}
              disabled
              readOnly
              placeholder="No barangay saved"
              style={{ width: '100%', padding: '12px', background: '#1a1d29', border: '1px solid #374151', borderRadius: '6px', color: '#9ca3af', fontSize: '14px', cursor: 'not-allowed', opacity: '0.7' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label htmlFor="city" style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px', fontSize: '14px' }}>City/Municipality</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                disabled
                readOnly
                placeholder="No city saved"
                style={{ width: '100%', padding: '12px', background: '#1a1d29', border: '1px solid #374151', borderRadius: '6px', color: '#9ca3af', fontSize: '14px', cursor: 'not-allowed', opacity: '0.7' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="province" style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px', fontSize: '14px' }}>Province</label>
              <input
                type="text"
                id="province"
                name="province"
                value={formData.province}
                disabled
                readOnly
                placeholder="No province saved"
                style={{ width: '100%', padding: '12px', background: '#1a1d29', border: '1px solid #374151', borderRadius: '6px', color: '#9ca3af', fontSize: '14px', cursor: 'not-allowed', opacity: '0.7' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="zipcode" style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px', fontSize: '14px' }}>Zip Code</label>
            <input
              type="text"
              id="zipcode"
              name="zipcode"
              value={formData.zipcode}
              disabled
              readOnly
              placeholder="No zipcode saved"
              style={{ width: '100%', padding: '12px', background: '#1a1d29', border: '1px solid #374151', borderRadius: '6px', color: '#9ca3af', fontSize: '14px', cursor: 'not-allowed', opacity: '0.7' }}
            />
          </div>

          <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
            📧 To update your address, please contact our support team.
          </p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`message ${message.type}`} style={{ 
            padding: '12px 16px', 
            borderRadius: '6px', 
            marginBottom: '20px',
            background: message.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            fontSize: '14px'
          }}>
            {message.text}
          </div>
        )}

        {/* Action Buttons */}
        <div className="form-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={() => navigate(-1)}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-save"
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default UserPersonalInfo;
