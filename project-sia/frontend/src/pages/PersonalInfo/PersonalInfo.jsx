import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './PersonalInfo.css';

const PersonalInfo = () => {
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    barangay: '',
    city: '',
    province: '',
    zipCode: ''
  });

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
        barangay: user.barangay || '',
        city: user.city || '',
        province: user.province || '',
        zipCode: user.zip_code || user.zipCode || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      errors.phone = 'Invalid phone number format';
    }
    
    if (formData.zipCode && !/^\d{4}$/.test(formData.zipCode)) {
      errors.zipCode = 'Zip code must be 4 digits';
    }
    
    return errors;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setMessage({ 
        type: 'error', 
        text: Object.values(validationErrors).join(', ') 
      });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      console.log('[PersonalInfo] 💾 Saving user data:', formData);

      // Update profile in Supabase
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          barangay: formData.barangay.trim(),
          city: formData.city.trim(),
          province: formData.province.trim(),
          zip_code: formData.zipCode.trim()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('[PersonalInfo] ❌ Error updating profile:', error);
        throw error;
      }

      console.log('[PersonalInfo] ✅ Profile updated:', data);

      // Update user context
      updateUserData({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        barangay: formData.barangay.trim(),
        city: formData.city.trim(),
        province: formData.province.trim(),
        zip_code: formData.zipCode.trim()
      });

      setMessage({ type: 'success', text: '✅ Profile updated successfully!' });
      setHasChanges(false);

      // Auto-redirect back to dashboard after 1.5 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('[PersonalInfo] 💥 Error saving profile:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to save: ${error.message || 'Unknown error'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="personal-info-page">
      <div className="personal-info-container">
        <div className="personal-info-header">
          <button className="back-btn" onClick={handleCancel}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M7.28 7.72a.75.75 0 010 1.06l-2.47 2.47H21a.75.75 0 010 1.5H4.81l2.47 2.47a.75.75 0 11-1.06 1.06l-3.75-3.75a.75.75 0 010-1.06l3.75-3.75a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <h1>✏️ Edit Personal Information</h1>
          <p className="subtitle">Update your profile details and address</p>
        </div>

        <form onSubmit={handleSave} className="personal-info-form">
          {/* Personal Details Section */}
          <div className="form-section">
            <h2>Personal Details</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Juan"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Dela Cruz"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="09XX XXX XXXX"
              />
              <small className="form-hint">Format: 09XX XXX XXXX</small>
            </div>
          </div>

          {/* Address Section */}
          <div className="form-section">
            <h2>Address Information</h2>
            <p className="section-info">
              💡 Save your address here to use it for faster checkout on delivery orders
            </p>

            <div className="form-group">
              <label htmlFor="address">Street Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main Street, Subdivision Name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="barangay">Barangay</label>
              <input
                type="text"
                id="barangay"
                name="barangay"
                value={formData.barangay}
                onChange={handleChange}
                placeholder="Barangay Name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City/Municipality</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City Name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="province">Province</label>
                <input
                  type="text"
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  placeholder="Province Name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="zipCode">Zip Code</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="1234"
                maxLength="4"
              />
              <small className="form-hint">4-digit postal code</small>
            </div>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-save"
              disabled={loading || !hasChanges}
            >
              {loading ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalInfo;
