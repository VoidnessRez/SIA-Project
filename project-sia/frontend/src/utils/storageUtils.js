/**
 * Safe Storage Access Utilities
 * Prevents crashes from JSON.parse on null/invalid data
 */

export const StorageUtils = {
  /**
   * Safely get and parse JSON from localStorage
   */
  getFromLocalStorage: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to parse localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Safely set JSON to localStorage
   */
  setToLocalStorage: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set localStorage key "${key}":`, error);
      return false;
    }
  },

  /**
   * Safely remove item from localStorage
   */
  removeFromLocalStorage: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove localStorage key "${key}":`, error);
      return false;
    }
  },

  /**
   * Safely get and parse JSON from sessionStorage
   */
  getFromSessionStorage: (key, defaultValue = null) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to parse sessionStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Safely set JSON to sessionStorage
   */
  setToSessionStorage: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set sessionStorage key "${key}":`, error);
      return false;
    }
  },

  /**
   * Safely remove item from sessionStorage
   */
  removeFromSessionStorage: (key) => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove sessionStorage key "${key}":`, error);
      return false;
    }
  },

  /**
   * Check if a key exists in localStorage
   */
  existsInLocalStorage: (key) => {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Failed to check localStorage key "${key}":`, error);
      return false;
    }
  },

  /**
   * Check if a key exists in sessionStorage
   */
  existsInSessionStorage: (key) => {
    try {
      return sessionStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Failed to check sessionStorage key "${key}":`, error);
      return false;
    }
  }
};

export default StorageUtils;
