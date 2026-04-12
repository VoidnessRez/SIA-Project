import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as phGeo from 'ph-geo-admin-divisions';
import { getZipCode } from '../../data/zipCodes.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDarkMode } from '../../context/DarkModeContext.jsx';
import './SignUpPage.css';

const SignUpPage = () => {
  const { isDarkMode } = useDarkMode();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    phone: '',
    region: '',
    province: '',
    city: '',
    barangay: '',
    zipCode: '',
    streetAddress: '',
    username: '',
    email: '',
    birthday: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // removed checkbox fallback state; we require reCAPTCHA
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState(null);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const recaptchaRef = useRef(null);
  const [recaptchaLoading, setRecaptchaLoading] = useState(false);
  const [recaptchaLoadFailed, setRecaptchaLoadFailed] = useState(false);
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
  const [availableRegions, setAvailableRegions] = useState([]);
  const [availableProvinces, setAvailableProvinces] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableBarangays, setAvailableBarangays] = useState([]);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const totalSteps = 3;

  // Load regions on mount
  useEffect(() => {
    setAvailableRegions(phGeo.regions);
  }, []);

  // Load provinces when region changes
  useEffect(() => {
    if (formData.region) {
      const selectedRegion = phGeo.regions.find(r => r.name === formData.region);
      if (selectedRegion) {
        const provincesArray = phGeo.provinces.filter(p => p.regionId === selectedRegion.regionId);
        setAvailableProvinces(provincesArray);
      }
      // Reset dependent fields
      setFormData(prev => ({ ...prev, province: '', city: '', barangay: '', zipCode: '' }));
      setAvailableCities([]);
      setAvailableBarangays([]);
    }
  }, [formData.region]);

  // Load cities/municipalities when province changes
  useEffect(() => {
    if (formData.province) {
      const selectedProvince = phGeo.provinces.find(p => p.name === formData.province);
      if (selectedProvince) {
        const citiesArray = phGeo.municipalities.filter(
          m => m.regionId === selectedProvince.regionId && m.provinceId === selectedProvince.provinceId
        );
        setAvailableCities(citiesArray);
      }
      // Reset dependent fields
      setFormData(prev => ({ ...prev, city: '', barangay: '', zipCode: '' }));
      setAvailableBarangays([]);
    }
  }, [formData.province]);

  // Load barangays and auto-fill ZIP code when city changes
  useEffect(() => {
    if (formData.city) {
      const selectedCity = phGeo.municipalities.find(m => m.name === formData.city);
      if (selectedCity) {
        const barangaysArray = phGeo.baranggays.filter(
          b => b.regionId === selectedCity.regionId && 
               b.provinceId === selectedCity.provinceId && 
               b.municipalityId === selectedCity.municipalityId
        );
        setAvailableBarangays(barangaysArray);
        
        // Auto-fill ZIP code from our complete database (try multiple formats)
        let zipCode = getZipCode(formData.city) || 
                     getZipCode(formData.city + ' City') ||
                     getZipCode('City of ' + formData.city) ||
                     getZipCode('City of ' + formData.city + ' (Capital)');
        
        setFormData(prev => ({ ...prev, barangay: '', zipCode: zipCode || '' }));
      }
    }
  }, [formData.city]);

  // Load reCAPTCHA script and render widget if site key exists
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      console.warn('[SignUpPage] No RECAPTCHA_SITE_KEY found in environment');
      return;
    }
    
    console.log('[SignUpPage] reCAPTCHA site key present, starting loader');
    setRecaptchaLoading(true);
    setRecaptchaLoadFailed(false);

    // If grecaptcha already present, render immediately
    const tryRender = () => {
      console.log('[SignUpPage] tryRender called, grecaptcha present?', !!window.grecaptcha, 'widgetId', recaptchaWidgetId);
      try {
        if (!window.grecaptcha || !window.grecaptcha.render) {
          console.log('[SignUpPage] grecaptcha not ready yet');
          return;
        }

        // Avoid double rendering
        if (recaptchaWidgetId !== null) {
          console.log('[SignUpPage] recaptcha already rendered, skipping');
          return;
        }

        // Prefer the actual DOM node (safer than id string when element may not exist yet)
        const container = recaptchaRef.current || document.getElementById('recaptcha');
        if (!container) {
          console.log('[SignUpPage] recaptcha container not in DOM yet; deferring render');
          return;
        }

        console.log('[SignUpPage] Attempting to render reCAPTCHA widget...');
        const id = window.grecaptcha.render(container, { 
          sitekey: RECAPTCHA_SITE_KEY,
          theme: isDarkMode ? 'dark' : 'light',
          callback: function() {
            console.log('[SignUpPage] ✅ reCAPTCHA completed by user');
            setRecaptchaLoaded(true);
            setRecaptchaLoading(false);
            setRecaptchaLoadFailed(false);
          },
          'expired-callback': function() {
            console.log('[SignUpPage] ⚠️ reCAPTCHA expired');
          }
        });
        console.log('[SignUpPage] grecaptcha.render returned widget id', id);
        setRecaptchaWidgetId(id);
        setRecaptchaLoaded(true);
        setRecaptchaLoading(false);
        setRecaptchaLoadFailed(false);
      } catch (err) {
        console.error('[SignUpPage] grecaptcha.render error', err);
        setRecaptchaLoading(false);
        setRecaptchaLoadFailed(true);
      }
    };

    if (window.grecaptcha && window.grecaptcha.render) {
      tryRender();
      return;
    }

    // Create callback for onload
    // Install onload callback (preserve existing if present)
    const previousOnLoad = window.__recaptchaOnLoad;
    window.__recaptchaOnLoad = () => {
      console.log('[SignUpPage] __recaptchaOnLoad invoked');
      setTimeout(() => tryRender(), 100); // Small delay to ensure grecaptcha is fully ready
      if (typeof previousOnLoad === 'function') {
        try { previousOnLoad(); } catch (e) { console.error('Previous onload error:', e); }
      }
    };

    // Don't add the script if it's already present
    const scriptSelector = 'script[src*="recaptcha/api.js"]';
    let scriptEl = document.querySelector(scriptSelector);
    if (!scriptEl) {
      console.log('[SignUpPage] Adding reCAPTCHA script to page...');
      scriptEl = document.createElement('script');
      scriptEl.src = 'https://www.google.com/recaptcha/api.js?onload=__recaptchaOnLoad&render=explicit';
      scriptEl.async = true;
      scriptEl.defer = true;
      scriptEl.onload = () => {
        console.log('[SignUpPage] recaptcha script loaded successfully');
      };
      scriptEl.onerror = (e) => {
        console.error('[SignUpPage] recaptcha script failed to load', e);
        setRecaptchaLoading(false);
        setRecaptchaLoadFailed(true);
      };
      document.head.appendChild(scriptEl);
    } else {
      console.log('[SignUpPage] recaptcha script already present in document');
      // Script exists but maybe grecaptcha isn't ready yet
      if (window.grecaptcha && window.grecaptcha.render) {
        tryRender();
      }
    }

    // Start a 10s timeout fallback in case widget never becomes available
    const timeout = setTimeout(() => {
      if (!window.grecaptcha || recaptchaWidgetId === null) {
        console.warn('[SignUpPage] reCAPTCHA did not initialize within timeout');
        setRecaptchaLoading(false);
        setRecaptchaLoadFailed(true);
      }
    }, 10000);

    return () => {
      // restore previous onload if any
      try { 
        if (previousOnLoad) {
          window.__recaptchaOnLoad = previousOnLoad;
        }
      } catch (e) { console.error('Cleanup error:', e); }
      try { clearTimeout(timeout); } catch (e) { console.error('Timeout clear error:', e); }
    };
  }, [RECAPTCHA_SITE_KEY, isDarkMode]);

  // If the recaptcha script loaded before the container mounted, retry a few times
   
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    if (!window.grecaptcha) return;
    if (recaptchaWidgetId !== null) return;

    let attempts = 0;
    const maxAttempts = 5;
    const interval = 200; // ms

    const tryInterval = setInterval(() => {
      attempts += 1;
      const container = (recaptchaRef && recaptchaRef.current) || document.getElementById('recaptcha');
      if (container && window.grecaptcha && recaptchaWidgetId === null) {
        try {
          const id = window.grecaptcha.render(container, { sitekey: RECAPTCHA_SITE_KEY });
          console.log('[SignUpPage] grecaptcha.render (retry) returned widget id', id);
          setRecaptchaWidgetId(id);
          setRecaptchaLoaded(true);
          setRecaptchaLoading(false);
          clearInterval(tryInterval);
        } catch (e) {
          console.error('[SignUpPage] grecaptcha.render (retry) error', e);
        }
      }
      if (attempts >= maxAttempts) {
        clearInterval(tryInterval);
      }
    }, interval);

    return () => clearInterval(tryInterval);
  }, [RECAPTCHA_SITE_KEY, recaptchaWidgetId]);

  // Ensure we try to render when the account step (3) becomes visible and container is mounted
  useEffect(() => {
    if (currentStep !== 3) return;
    if (!RECAPTCHA_SITE_KEY) return;
    if (!window.grecaptcha) return;
    if (recaptchaWidgetId !== null) return;

    try {
      const container = (recaptchaRef && recaptchaRef.current) || document.getElementById('recaptcha');
      if (!container) {
        console.log('[SignUpPage] account step: recaptcha container still not mounted');
        return;
      }
      const id = window.grecaptcha.render(container, { 
        sitekey: RECAPTCHA_SITE_KEY,
        theme: isDarkMode ? 'dark' : 'light',
        callback: function() {
          console.log('[SignUpPage] ✅ reCAPTCHA completed by user (step render)');
          setRecaptchaLoaded(true);
          setRecaptchaLoading(false);
          setRecaptchaLoadFailed(false);
        }
      });
      console.log('[SignUpPage] grecaptcha.render (on step visible) returned widget id', id);
      setRecaptchaWidgetId(id);
      setRecaptchaLoaded(true);
      setRecaptchaLoading(false);
      setRecaptchaLoadFailed(false);
    } catch (e) {
      console.error('[SignUpPage] grecaptcha.render (on step visible) error', e);
      setRecaptchaLoadFailed(true);
      setRecaptchaLoading(false);
    }
  }, [currentStep, RECAPTCHA_SITE_KEY, recaptchaWidgetId, isDarkMode]);

  // Debug output to quickly inspect state when user hits submit



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    setError(''); // Clear error on input change
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.firstName || !formData.lastName || !formData.phone) {
          setError('Please fill in all required fields');
          return false;
        }
        if (formData.phone.length < 10) {
          setError('Please enter a valid phone number');
          return false;
        }
        return true;
      
      case 2:
        if (!formData.region || !formData.city || !formData.barangay || !formData.zipCode || !formData.streetAddress) {
          setError('Please fill in all address fields');
          return false;
        }
        // ZIP codes can be 3-4 digits (e.g., 1000 for Manila, 9000 for Cagayan de Oro)
        if (formData.zipCode.length < 3 || formData.zipCode.length > 4) {
          setError('ZIP code must be 3-4 digits');
          return false;
        }
        return true;
      
      case 3: {
        if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
          setError('Please fill in all account fields');
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        return true;
      }
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setError('');
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
    
    // Reset reCAPTCHA when going back from step 3
    if (currentStep === 3 && window.grecaptcha && recaptchaWidgetId !== null) {
      try {
        window.grecaptcha.reset(recaptchaWidgetId);
        console.log('[SignUpPage] 🔄 reCAPTCHA reset on back');
      } catch (err) {
        console.error('[SignUpPage] Failed to reset reCAPTCHA:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log('[SignUpPage] 🚀 handleSubmit called');
    
    if (!validateStep(3)) {
      console.log('[SignUpPage] ❌ Step 3 validation failed');
      return;
    }
    console.log('[SignUpPage] ✅ Step 3 validation passed');

    // reCAPTCHA Verification (REQUIRED)
    if (RECAPTCHA_SITE_KEY) {
      console.log('[SignUpPage] 🔍 Checking reCAPTCHA...');
      console.log('[SignUpPage] States:', { recaptchaLoaded, recaptchaLoadFailed, recaptchaLoading, recaptchaWidgetId });
      
      // Check if widget is still loading
      if (recaptchaLoading && !recaptchaLoaded) {
        console.log('[SignUpPage] ⏳ reCAPTCHA still loading');
        setError('reCAPTCHA is still loading. Please wait a moment.');
        return;
      }
      
      // Check if widget failed to load
      if (recaptchaLoadFailed && !recaptchaLoaded) {
        console.log('[SignUpPage] ❌ reCAPTCHA failed to load');
        setError('reCAPTCHA failed to load. Please refresh the page and try again.');
        return;
      }

      try {
        const grecaptcha = window.grecaptcha;
        if (!grecaptcha || recaptchaWidgetId === null) {
          console.warn('[SignUpPage] ❌ reCAPTCHA not ready');
          setError('reCAPTCHA not ready. Please wait a moment and try again.');
          return;
        }

        const token = grecaptcha.getResponse(recaptchaWidgetId);
        console.log('[SignUpPage] 🔑 reCAPTCHA token length:', token ? token.length : 0);
        
        if (!token) {
          console.log('[SignUpPage] ❌ reCAPTCHA not checked');
          setError('Please complete the reCAPTCHA verification by checking the box.');
          return;
        }

        // Verify token server-side
        console.log('[SignUpPage] 📡 Verifying reCAPTCHA with backend...');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';
        const resp = await fetch(`${API_URL}/api/recaptcha/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        
        if (!resp.ok) {
          throw new Error(`Server responded with ${resp.status}`);
        }
        
        const data = await resp.json();
        
        if (!data.success) {
          console.log('[SignUpPage] ❌ reCAPTCHA verification failed');
          setError('reCAPTCHA verification failed. Please try again.');
          // Reset the widget so user can try again
          try {
            grecaptcha.reset(recaptchaWidgetId);
          } catch (e) {
            console.error('Failed to reset reCAPTCHA:', e);
          }
          return;
        }
        console.log('[SignUpPage] ✅ reCAPTCHA verified successfully');
      } catch (err) {
        console.error('[SignUpPage] 💥 reCAPTCHA verification error:', err);
        setError('Failed to verify reCAPTCHA. Please check your connection and try again.');
        return;
      }
    } else {
      console.log('[SignUpPage] ⚠️ reCAPTCHA not configured');
      setError('reCAPTCHA not configured. Please contact support.');
      return;
    }

    setLoading(true);
    console.log('[SignUpPage] 🔄 Starting signup process...');
    
    try {
      // Prepare complete user data for backend API
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        gender: formData.gender,
        birthday: formData.birthday,
        street: formData.streetAddress,
        barangay: formData.barangay,
        city: formData.city,
        province: formData.province,
        region: formData.region,
        zip_code: formData.zipCode
      };

      console.log('[SignUpPage] 📦 Prepared userData:', {
        username: userData.username,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        hasPassword: !!userData.password,
        passwordLength: userData.password?.length
      });

      console.log('[SignUpPage] 📡 Calling signUp from AuthContext...');
      const result = await signUp(userData);
      console.log('[SignUpPage] 📨 SignUp result:', result);

      if (result.success) {
        console.log('[SignUpPage] ✅ Signup successful!');
        alert('Sign up successful! You can now log in.');
        navigate('/login');
      } else {
        console.log('[SignUpPage] ❌ Signup failed:', result.error);
        setError(result.error || 'Sign up failed. Please try again.');
      }
    } catch (err) {
      console.error('[SignUpPage] 💥 Sign up error:', err);
      console.error('[SignUpPage] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      console.log('[SignUpPage] 🏁 Signup process completed');
    }
  };

  return (
    <div className={`signup-container ${isDarkMode ? 'dark-mode' : ''}`} data-theme={isDarkMode ? 'dark' : 'light'}>
      <div className="signup-form">
        <h2>Create Account</h2>
        
        {/* Progress Indicator */}
        <div className="progress-indicator">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Personal</div>
          </div>
          <div className={`progress-line ${currentStep >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Address</div>
          </div>
          <div className={`progress-line ${currentStep >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Account</div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="form-step step-fade-in">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="09XX XXX XXXX"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Address Information */}
          {currentStep === 2 && (
            <div className="form-step step-fade-in">
              <div className="form-group">
                <label htmlFor="region">Region *</label>
                <select
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Region</option>
                  {availableRegions.map((region) => (
                    <option key={region.psgcId} value={region.name}>{region.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="province">Province *</label>
                <select
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  required
                  disabled={!formData.region}
                >
                  <option value="">{formData.region ? 'Select Province' : 'Select Region First'}</option>
                  {availableProvinces.map((province) => (
                    <option key={province.psgcId} value={province.name}>{province.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="city">City/Municipality *</label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  disabled={!formData.province}
                >
                  <option value="">{formData.province ? 'Select City/Municipality' : 'Select Province First'}</option>
                  {availableCities.map((city) => (
                    <option key={city.psgcId} value={city.name}>{city.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="barangay">Barangay *</label>
                <select
                  id="barangay"
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleChange}
                  required
                  disabled={!formData.city}
                >
                  <option value="">{formData.city ? 'Select Barangay' : 'Select City First'}</option>
                  {availableBarangays.map((barangay) => (
                    <option key={barangay.psgcId} value={barangay.name}>{barangay.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="zipCode">ZIP Code *</label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  placeholder="Auto-filled from city"
                  maxLength="4"
                  required
                  readOnly
                  className="readonly-field"
                  title="ZIP code is automatically filled based on your selected city"
                />
                {formData.zipCode && (
                  <small style={{ color: '#28a745', marginTop: '4px', display: 'block' }}>
                    ✓ ZIP code auto-filled for {formData.city}
                  </small>
                )}
              </div>
              <div className="form-group full-width">
                <label htmlFor="streetAddress">Street Address *</label>
                <textarea
                  id="streetAddress"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  placeholder="House No., Street Name, Subdivision"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 3: Account Information */}
          {currentStep === 3 && (
            <div className="form-step step-fade-in">
              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="birthday">Birthday (Optional)</label>
                <input
                  type="date"
                  id="birthday"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  required
                />
              </div>

              {/* Human verification - simple checkbox + small challenge */}
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px' }}>Verify you are a human *</label>
                {RECAPTCHA_SITE_KEY ? (
                  <>
                    {recaptchaLoading && !recaptchaLoaded && !recaptchaLoadFailed && (
                      <div style={{ marginTop: '6px', color: '#666', fontSize: '14px' }}>
                        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}>⏳</span>
                        Loading reCAPTCHA...
                      </div>
                    )}
                    {recaptchaLoadFailed && !recaptchaLoaded && (
                      <div style={{ marginTop: '6px', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
                        <div style={{ color: '#dc2626', fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>
                          ⚠️ reCAPTCHA failed to load
                        </div>
                        <div style={{ color: '#7f1d1d', fontSize: '13px', marginBottom: '8px' }}>
                          This could be due to network issues or ad blockers.
                        </div>
                        <button 
                          type="button"
                          onClick={() => window.location.reload()}
                          style={{ 
                            padding: '6px 12px', 
                            background: '#dc2626', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          Refresh Page
                        </button>
                      </div>
                    )}
                    <div id="recaptcha" ref={recaptchaRef} style={{ marginTop: '6px' }} />
                  </>
                ) : (
                  <div style={{ marginTop: '6px', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '14px' }}>
                    ⚠️ reCAPTCHA is not configured. Please contact the administrator.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OTP flow removed — using only human-check before signup */}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {currentStep > 1 && (
              <button type="button" onClick={handleBack} className="btn-secondary">
                Back
              </button>
            )}
            {currentStep < totalSteps ? (
              <button type="button" onClick={handleNext} className="btn-primary">
                Next
              </button>
            ) : (
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            )}
          </div>
        </form>
        
        <p>Already have an account? <button type="button" onClick={() => navigate('/login')} className="link-button">Log In</button></p>
      </div>
    </div>
  );
};

export default SignUpPage;