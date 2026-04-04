import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  // Get cart items from location state or localStorage
  const [cartItems, setCartItems] = useState(location.state?.cartItems || []);
  const [loading, setLoading] = useState(false);

  // Form states
  const [shippingInfo, setShippingInfo] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    barangay: '',
    city: '',
    province: '',
    zipCode: '',
    notes: ''
  });

  const [fulfillmentMethod, setFulfillmentMethod] = useState('pickup'); // pickup or delivery
  const [useProfileAddress, setUseProfileAddress] = useState(true); // use saved address or new
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState({});

  // Load user's profile address when component mounts or when switching to saved address
  useEffect(() => {
    console.log('[Checkout] 🔍 User object:', user);
    console.log('[Checkout] 📍 Address fields:', {
      address: user?.address,
      barangay: user?.barangay,
      city: user?.city,
      province: user?.province,
      zip_code: user?.zip_code
    });
    
    if (useProfileAddress && user) {
      setShippingInfo(prev => ({
        ...prev,
        address: user?.address || '',
        barangay: user?.barangay || '',
        city: user?.city || '',
        province: user?.province || '',
        zipCode: user?.zip_code || user?.zipCode || ''
      }));
    }
  }, [useProfileAddress, user]);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    // Redirect if no cart items
    if (!cartItems || cartItems.length === 0) {
      // Try to get from localStorage
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      } else {
        navigate('/products');
      }
    }
  }, [isAuthenticated, navigate, cartItems]);

  // Calculate totals
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Delivery Fee Table (Draft - Subject to admin approval)
  const deliveryFees = {
    'bulacan': 150,
    'cavite': 200,
    'laguna': 200,
    'rizal': 180,
    'batangas': 250,
    'quezon': 300,
    'ncr': 150,
    'metro manila': 150,
    'manila': 150
  };

  const calculateShipping = () => {
    if (fulfillmentMethod === 'pickup') return 0; // Free for pickup
    
    // For delivery, check province/city for delivery fee
    const province = shippingInfo.province?.toLowerCase().trim() || '';
    const city = shippingInfo.city?.toLowerCase().trim() || '';
    
    // Check if province matches any delivery area
    for (const [area, fee] of Object.entries(deliveryFees)) {
      if (province.includes(area) || city.includes(area)) {
        return fee;
      }
    }
    
    // Default delivery fee if area not in list (subject to admin approval)
    return 250; // Default fee for areas requiring review
  };

  // Calculate wholesale discount based on total quantity
  const calculateWholesaleDiscount = () => {
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = calculateSubtotal();
    
    let discountRate = 0;
    let discountTier = '';
    
    // Tiered discount structure
    if (totalQuantity >= 100) {
      discountRate = 0.20; // 20% discount
      discountTier = 'Platinum (100+ items)';
    } else if (totalQuantity >= 50) {
      discountRate = 0.15; // 15% discount
      discountTier = 'Gold (50+ items)';
    } else if (totalQuantity >= 25) {
      discountRate = 0.10; // 10% discount
      discountTier = 'Silver (25+ items)';
    } else if (totalQuantity >= 10) {
      discountRate = 0.05; // 5% discount
      discountTier = 'Bronze (10+ items)';
    }
    
    return {
      amount: subtotal * discountRate,
      rate: discountRate * 100,
      tier: discountTier,
      qualified: totalQuantity >= 10
    };
  };

  const calculateTotal = () => {
    const discount = calculateWholesaleDiscount();
    return calculateSubtotal() - discount.amount + calculateShipping();
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!shippingInfo.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!shippingInfo.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!shippingInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(shippingInfo.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!shippingInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{11}$/.test(shippingInfo.phone.replace(/[-\s]/g, ''))) {
      newErrors.phone = 'Phone number must be 11 digits';
    }
    
    // Only validate address fields if delivery is selected
    if (fulfillmentMethod === 'delivery') {
      if (!shippingInfo.address.trim()) newErrors.address = 'Address is required';
      if (!shippingInfo.barangay.trim()) newErrors.barangay = 'Barangay is required';
      if (!shippingInfo.city.trim()) newErrors.city = 'City is required';
      if (!shippingInfo.province.trim()) newErrors.province = 'Province is required';
      if (!shippingInfo.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    }
    
    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Shopee payment (redirect to not found for now)
  const handleShopeePayment = () => {
    window.location.href = '/page-not-found';
  };

  // Handle order submission
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // If Shopee payment, redirect to not found
    if (paymentMethod === 'shopee') {
      handleShopeePayment();
      return;
    }

    if (!validateForm()) {
      alert('Please fill in all required fields correctly');
      return;
    }

    setLoading(true);

    try {
      console.log('[Checkout] 📦 Creating order...');

      // Prepare order data
      const orderData = {
        user_id: user?.id,
        customer_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        customer_email: shippingInfo.email,
        customer_phone: shippingInfo.phone,
        fulfillment_method: fulfillmentMethod,
        payment_method: paymentMethod,
        delivery_address: fulfillmentMethod === 'delivery' ? shippingInfo.address : null,
        delivery_barangay: fulfillmentMethod === 'delivery' ? shippingInfo.barangay : null,
        delivery_city: fulfillmentMethod === 'delivery' ? shippingInfo.city : null,
        delivery_province: fulfillmentMethod === 'delivery' ? shippingInfo.province : null,
        delivery_zipcode: fulfillmentMethod === 'delivery' ? shippingInfo.zipCode : null,
        delivery_notes: fulfillmentMethod === 'delivery' ? shippingInfo.notes : null,
        items: cartItems.map(item => ({
          product_type:
            item.productType === 'accessory' || item.category === 'accessories'
              ? 'accessory'
              : 'sparepart',
          product_id: item.id,
          product_sku: item.sku,
          product_name: item.name,
          product_image: item.image || item.image_url || '🏍️',
          selected_size: item.size || null,
          selected_color: item.color || null,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
          discount: 0,
          total: item.price * item.quantity
        })),
        subtotal: calculateSubtotal(),
        shipping_fee: calculateShipping(),
        tax_amount: 0,
        discount_amount: calculateWholesaleDiscount().amount,
        discount_type: calculateWholesaleDiscount().qualified ? calculateWholesaleDiscount().tier : null,
        total_amount: calculateTotal()
      };

      console.log('[Checkout] 📤 Sending order to backend:', orderData);

      // Send to backend
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';
      const response = await fetch(`${API_URL}/api/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to create order';
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          // Server returned HTML or other non-JSON (likely server is down or wrong endpoint)
          const text = await response.text();
          console.error('[Checkout] ❌ Server returned non-JSON response:', text.substring(0, 200));
          errorMessage = 'Cannot connect to server. Please ensure the backend is running on port 5174.';
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[Checkout] 📥 Response from server:', result);

      if (!result.success) {
        console.error('[Checkout] ❌ Order creation failed:', result);
        throw new Error(result.message || 'Failed to create order');
      }

      console.log('[Checkout] ✅ Order created successfully:', result.data);

      // Prepare receipt data
      const receiptData = {
        orderNumber: result.data.order_number,
        timestamp: new Date().toISOString(),
        customer: {
          name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          email: shippingInfo.email,
          phone: shippingInfo.phone
        },
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          image: item.image || '🏍️',
          price: item.price,
          quantity: item.quantity
        })),
        subtotal: calculateSubtotal(),
        shippingFee: calculateShipping(),
        discount: calculateWholesaleDiscount().amount > 0 ? {
          type: calculateWholesaleDiscount().tier,
          amount: calculateWholesaleDiscount().amount
        } : null,
        total: calculateTotal(),
        paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 
                      paymentMethod === 'gcash' ? 'GCash' : 'Bank Transfer',
        fulfillmentMethod: fulfillmentMethod
      };

      // Clear cart
      localStorage.removeItem('cart');

      // Navigate to receipt page with order details
      navigate('/receipt', { 
        state: { orderDetails: receiptData },
        replace: true 
      });

    } catch (error) {
      console.error('Error placing order:', error);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      alert(`Failed to place order: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Order success screen - DISABLED: Now redirecting to receipt page instead
  // if (orderPlaced) { ... }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>🛒 Checkout</h1>
          <p>Complete your purchase</p>
        </div>

        <form onSubmit={handlePlaceOrder} className="checkout-form">
          <div className="checkout-grid">
            {/* Left Column - Forms */}
            <div className="checkout-main">
              {/* Fulfillment Method */}
              <div className="checkout-section">
                <h2>Fulfillment Method</h2>
                
                <div className="fulfillment-methods">
                  <label className={`fulfillment-option ${fulfillmentMethod === 'pickup' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="fulfillment"
                      value="pickup"
                      checked={fulfillmentMethod === 'pickup'}
                      onChange={(e) => setFulfillmentMethod(e.target.value)}
                    />
                    <div className="fulfillment-content">
                      <div className="fulfillment-icon">🏪</div>
                      <div className="fulfillment-details">
                        <h3>Store Pickup</h3>
                        <p>Pick up your order from our store</p>
                        <span className="fulfillment-badge free">FREE</span>
                      </div>
                    </div>
                  </label>

                  <label className={`fulfillment-option ${fulfillmentMethod === 'delivery' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="fulfillment"
                      value="delivery"
                      checked={fulfillmentMethod === 'delivery'}
                      onChange={(e) => setFulfillmentMethod(e.target.value)}
                    />
                    <div className="fulfillment-content">
                      <div className="fulfillment-icon">🚚</div>
                      <div className="fulfillment-details">
                        <h3>Home Delivery</h3>
                        <p>We'll deliver to your address</p>
                        <span className="fulfillment-badge">Note: Additional charges may apply</span>
                      </div>
                    </div>
                  </label>
                </div>

                {fulfillmentMethod === 'delivery' && (
                  <div className="delivery-info-notice">
                    <div className="notice-header">
                      <span className="info-icon">ℹ️</span>
                      <strong>Delivery Information & Fees (Draft)</strong>
                    </div>
                    
                    <div className="delivery-fee-table">
                      <h4>📍 Service Areas & Delivery Fees:</h4>
                      <div className="fee-grid">
                        <div className="fee-item">
                          <span className="area-name">Bulacan</span>
                          <span className="area-fee">₱150</span>
                        </div>
                        <div className="fee-item">
                          <span className="area-name">NCR / Metro Manila</span>
                          <span className="area-fee">₱150</span>
                        </div>
                        <div className="fee-item">
                          <span className="area-name">Rizal</span>
                          <span className="area-fee">₱180</span>
                        </div>
                        <div className="fee-item">
                          <span className="area-name">Cavite</span>
                          <span className="area-fee">₱200</span>
                        </div>
                        <div className="fee-item">
                          <span className="area-name">Laguna</span>
                          <span className="area-fee">₱200</span>
                        </div>
                        <div className="fee-item">
                          <span className="area-name">Batangas</span>
                          <span className="area-fee">₱250</span>
                        </div>
                        <div className="fee-item">
                          <span className="area-name">Quezon Province</span>
                          <span className="area-fee">₱300</span>
                        </div>
                        <div className="fee-item other-areas">
                          <span className="area-name">Other Nearby Areas</span>
                          <span className="area-fee">₱250+</span>
                        </div>
                      </div>
                    </div>

                    <ul>
                      <li>⏳ <strong>Approval Required:</strong> Admin will review your location before confirming</li>
                      <li>📞 <strong>Confirmation:</strong> We'll contact you within 24 hours</li>
                      <li>🏢 <strong>Wholesale Orders:</strong> Special delivery arrangements available</li>
                      <li>💰 <strong>Final Fee:</strong> May vary based on exact location and order details</li>
                    </ul>
                    <p className="note-text">
                      <strong>Note:</strong> Delivery fees shown are estimates. Final fee will be confirmed by admin based on your exact location, order size, and delivery requirements. We service Calabarzon and nearby NCR areas.
                    </p>
                  </div>
                )}
              </div>

              {/* Shipping Information */}
              <div className="checkout-section">
                <h2>{fulfillmentMethod === 'pickup' ? 'Contact Information' : 'Shipping Information'}</h2>
                
                {/* Address Selection - Only show for delivery */}
                {fulfillmentMethod === 'delivery' && (
                  <div className="address-selection">
                    <div className="address-options">
                      <label className={`address-option ${useProfileAddress ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="addressType"
                          checked={useProfileAddress}
                          onChange={() => setUseProfileAddress(true)}
                        />
                        <div className="address-option-content">
                          <span className="address-icon">📍</span>
                          <div className="address-details">
                            <strong>Use My Saved Address</strong>
                            {user?.address ? (
                              <small>
                                {user.address}, {user.barangay}, {user.city}, {user.province} {user.zip_code || user.zipCode}
                              </small>
                            ) : (
                              <small className="no-address">No saved address in profile</small>
                            )}
                          </div>
                        </div>
                      </label>

                      <label className={`address-option ${!useProfileAddress ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="addressType"
                          checked={!useProfileAddress}
                          onChange={() => setUseProfileAddress(false)}
                        />
                        <div className="address-option-content">
                          <span className="address-icon">📝</span>
                          <div className="address-details">
                            <strong>Enter New Shipping Address</strong>
                            <small>Use a different address for this order</small>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={shippingInfo.firstName}
                      onChange={handleInputChange}
                      className={errors.firstName ? 'error' : ''}
                    />
                    {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={shippingInfo.lastName}
                      onChange={handleInputChange}
                      className={errors.lastName ? 'error' : ''}
                    />
                    {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={shippingInfo.email}
                      onChange={handleInputChange}
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleInputChange}
                      placeholder="09123456789"
                      className={errors.phone ? 'error' : ''}
                    />
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                  </div>
                </div>

                {fulfillmentMethod === 'delivery' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="address">
                        Street Address *
                        {useProfileAddress && <span className="readonly-badge">From Profile</span>}
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={shippingInfo.address}
                        onChange={handleInputChange}
                        placeholder="House number, street name"
                        className={errors.address ? 'error' : ''}
                        readOnly={useProfileAddress}
                      />
                      {errors.address && <span className="error-message">{errors.address}</span>}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="barangay">
                          Barangay *
                          {useProfileAddress && <span className="readonly-badge">From Profile</span>}
                        </label>
                        <input
                          type="text"
                          id="barangay"
                          name="barangay"
                          value={shippingInfo.barangay}
                          onChange={handleInputChange}
                          className={errors.barangay ? 'error' : ''}
                          readOnly={useProfileAddress}
                        />
                        {errors.barangay && <span className="error-message">{errors.barangay}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="city">
                          City *
                          {useProfileAddress && <span className="readonly-badge">From Profile</span>}
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={shippingInfo.city}
                          onChange={handleInputChange}
                          className={errors.city ? 'error' : ''}
                          readOnly={useProfileAddress}
                        />
                        {errors.city && <span className="error-message">{errors.city}</span>}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="province">
                          Province *
                          {useProfileAddress && <span className="readonly-badge">From Profile</span>}
                        </label>
                        <input
                          type="text"
                          id="province"
                          name="province"
                          value={shippingInfo.province}
                          onChange={handleInputChange}
                          className={errors.province ? 'error' : ''}
                          readOnly={useProfileAddress}
                        />
                        {errors.province && <span className="error-message">{errors.province}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="zipCode">
                          Zip Code *
                          {useProfileAddress && <span className="readonly-badge">From Profile</span>}
                        </label>
                        <input
                          type="text"
                          id="zipCode"
                          name="zipCode"
                          value={shippingInfo.zipCode}
                          onChange={handleInputChange}
                          placeholder="1000"
                          className={errors.zipCode ? 'error' : ''}
                          readOnly={useProfileAddress}
                        />
                        {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
                      </div>
                    </div>

                    {useProfileAddress && !user?.address && (
                      <div className="address-warning">
                        <span className="warning-icon">⚠️</span>
                        <div className="warning-content">
                          <strong>No Saved Address</strong>
                          <p>You don't have a saved address in your profile. Please select "Enter New Shipping Address" or update your profile.</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {fulfillmentMethod === 'pickup' && (
                  <div className="pickup-info-box">
                    <h4>🏪 Store Location</h4>
                    <p><strong>Mejia Spareparts</strong></p>
                    <p>123 gwapo Street, Barangay pogi</p>
                    <p>Antipolo City, Province of khenard</p>
                    <p>📞 Contact: 09123456789</p>
                    <p>⏰ Store Hours: Mon-Sat, 8:00 AM - 6:00 PM</p>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="notes">Order Notes (Optional)</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={shippingInfo.notes}
                    onChange={handleInputChange}
                    placeholder="Special instructions or delivery notes"
                    rows="3"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="checkout-section">
                <h2>💳 Payment Method</h2>
                
                <div className="payment-methods">
                  <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-content">
                      <span className="payment-icon">💵</span>
                      <div className="payment-info">
                        <strong>Cash on Delivery</strong>
                        <small>Pay when you receive your order</small>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'gcash' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="gcash"
                      checked={paymentMethod === 'gcash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-content">
                      <span className="payment-icon">📱</span>
                      <div className="payment-info">
                        <strong>GCash</strong>
                        <small>Pay via GCash mobile wallet</small>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'bank' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="bank"
                      checked={paymentMethod === 'bank'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-content">
                      <span className="payment-icon">🏦</span>
                      <div className="payment-info">
                        <strong>Bank Transfer</strong>
                        <small>Direct bank deposit or transfer</small>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'shopee' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="shopee"
                      checked={paymentMethod === 'shopee'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-content">
                      <span className="payment-icon">🛍️</span>
                      <div className="payment-info">
                        <strong>Shopee Checkout</strong>
                        <small>Coming soon - Currently unavailable</small>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="checkout-section">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => {
                      setAgreeToTerms(e.target.checked);
                      if (e.target.checked && errors.terms) {
                        setErrors(prev => ({ ...prev, terms: '' }));
                      }
                    }}
                  />
                  <span>
                    I agree to the <a href="/terms" target="_blank">Terms and Conditions</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
                  </span>
                </label>
                {errors.terms && <span className="error-message">{errors.terms}</span>}
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="checkout-sidebar">
              <div className="order-summary sticky">
                <h3>📦 Order Summary</h3>
                
                <div className="summary-items">
                  {cartItems.map((item) => (
                    <div key={item.id} className="summary-item">
                      <div className="item-image">
                        {item.image ? (
                          <img src={item.image} alt={item.name} />
                        ) : (
                          <span className="item-emoji">{item.images?.[0] || '📦'}</span>
                        )}
                      </div>
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        <p>Qty: {item.quantity}</p>
                      </div>
                      <div className="item-price">
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="summary-divider" />

                <div className="summary-calculations">
                  <div className="calc-row">
                    <span>Subtotal:</span>
                    <span>₱{calculateSubtotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="calc-row">
                    <span>Shipping:</span>
                    <span>
                      {calculateShipping() === 0 ? (
                        <span className="free-shipping">FREE</span>
                      ) : (
                        `₱${calculateShipping().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      )}
                    </span>
                  </div>
                  {calculateWholesaleDiscount().qualified && (
                    <div className="calc-row discount-row">
                      <span>
                        🎉 Wholesale Discount<br />
                        <small>{calculateWholesaleDiscount().tier}</small>
                      </span>
                      <span className="discount-amount">
                        -{calculateWholesaleDiscount().rate}%<br />
                        <small>-₱{calculateWholesaleDiscount().amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</small>
                      </span>
                    </div>
                  )}
                </div>

                <div className="summary-divider" />

                <div className="summary-total">
                  <span>Total:</span>
                  <span className="total-amount">₱{calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {fulfillmentMethod === 'delivery' && (
                  <div className="shipping-notice">
                    💡 Delivery fee based on location - Subject to admin confirmation
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn-place-order"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      🎯 Place Order
                    </>
                  )}
                </button>

                <div className="security-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                  </svg>
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
