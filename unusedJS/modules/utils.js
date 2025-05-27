/**
 * utils.js
 * Utility functions for the Video Quiz application
 */

import state from './state.js';

/**
 * Parse URL parameters into an object
 * @returns {Object} URL parameters as key-value pairs
 */
export function getUrlVars() {
    const vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
        vars[key] = value;
    });
    return vars;
}

/**
 * Convert seconds to a formatted time string (MM:SS)
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    
    return (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

/**
 * Process text with URL detection to create hyperlinks
 * @param {string} text - Text to process
 * @returns {string} Text with URLs converted to hyperlinks
 */
export function urlify(text) {
    if (!text) return "";
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return '<a href="' + url + '" target="_blank">' + url + '</a>';
    });
}

/**
 * Safely access nested object properties without errors
 * @param {Object} obj - Object to access
 * @param {string} path - Dot notation path to property
 * @param {*} defaultValue - Default value if property doesn't exist
 * @returns {*} Property value or default
 */
export function getProperty(obj, path, defaultValue = undefined) {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
        if (result === undefined || result === null) {
            return defaultValue;
        }
        result = result[key];
    }
    
    return result === undefined ? defaultValue : result;
}

/**
 * Check if the browser can access local storage
 * @returns {boolean} True if local storage is available
 */
export function canAccessLocalStorage() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Check if parent window can be accessed (for iframe detection)
 * @returns {boolean} True if parent window is accessible
 */
export function canAccessParent() {
    try {
        return window.self !== window.top && window.parent && window.parent.location.href;
    } catch (e) {
        return false;
    }
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Throttle a function to limit how often it can be called
 * @param {Function} callback - Function to throttle
 * @param {number} delay - Minimum time between calls in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(callback, delay) {
    let timeout = null;
    let lastCall = 0;
    
    return function(...args) {
        const now = Date.now();
        const remaining = delay - (now - lastCall);
        
        if (remaining <= 0) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            lastCall = now;
            callback.apply(this, args);
        } else if (!timeout) {
            timeout = setTimeout(() => {
                lastCall = Date.now();
                timeout = null;
                callback.apply(this, args);
            }, remaining);
        }
    };
}

/**
 * Detect browser type for compatibility handling
 * @returns {Object} Browser information
 */
export function detectBrowser() {
    const userAgent = navigator.userAgent;
    let browser = "unknown";
    
    if (/Firefox/i.test(userAgent)) {
        browser = "firefox";
    } else if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) {
        browser = "chrome";
    } else if (/Edge/i.test(userAgent)) {
        browser = "edge";
    } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
        browser = "safari";
    } else if (/MSIE/i.test(userAgent) || /Trident/i.test(userAgent)) {
        browser = "ie";
    }
    
    return {
        name: browser,
        mobile: /Mobi|Android/i.test(userAgent),
        ios: /iPad|iPhone|iPod/i.test(userAgent)
    };
}

/**
 * Update accessibility attributes for screen readers
 * @param {string} elementId - ID of element to update
 * @param {string} message - Message to announce to screen readers
 */
export function announceToScreenReader(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.setAttribute('aria-live', 'assertive');
        element.textContent = message;
    }
}