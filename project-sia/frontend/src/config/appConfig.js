// Configuration file for application settings
export const APP_CONFIG = {
  // Delivery fees by service area keyword
  DELIVERY_AREA_FEES: {
    bulacan: 150,
    cavite: 200,
    laguna: 200,
    rizal: 180,
    batangas: 250,
    quezon: 300,
    ncr: 150,
    'metro manila': 150,
    manila: 150,
  },
  DEFAULT_DELIVERY_FEE: 250,

  // Payment methods
  PAYMENT_METHODS: [
    { id: 'cod', label: 'Cash on Delivery (COD)', enabled: true },
    { id: 'bank_transfer', label: 'Bank Transfer', enabled: true },
    { id: 'credit_card', label: 'Credit/Debit Card', enabled: false }
  ],

  // Order status values
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  },

  // Cart settings
  CART: {
    MAX_ITEMS_PER_PRODUCT: 999,
    MIN_ORDER_VALUE: 500 // Minimum order amount in PHP
  },

  // Tax rates (percentage)
  TAX_RATE: 0.12, // 12% VAT

  // Shipping timeframes
  SHIPPING_TIMES: {
    METRO_MANILA: '1-3 days',
    PROVINCIAL_NEARBY: '3-5 days',
    PROVINCIAL_FAR: '5-7 days'
  }
};

// API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5174',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3
};

// Authentication tokens
export const AUTH_CONFIG = {
  TOKEN_STORAGE_KEY: 'authToken',
  USER_STORAGE_KEY: 'authUser',
  BIKE_PROFILE_STORAGE_KEY: 'customerBikeProfile',
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

export default APP_CONFIG;
