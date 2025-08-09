// deviceDetection.js
// Device detection utilities for Rocket Wars

/**
 * Input method enumeration
 * @readonly
 * @enum {string}
 */
export const InputMethod = Object.freeze({
    MOUSE: 'mouse',
    TOUCH: 'touch',
    HYBRID: 'hybrid'
});

/**
 * Device category enumeration
 * @readonly
 * @enum {string}
 */
export const DeviceCategory = Object.freeze({
    DESKTOP: 'desktop',
    TABLET: 'tablet',
    MOBILE: 'mobile'
});

/**
 * Detect if the current device has touch capabilities
 * @returns {boolean} True if device supports touch
 */
export function isTouchDevice() {
    // Check for touch support using multiple methods
    return ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
}

/**
 * Detect if the device likely has a physical keyboard
 * @returns {boolean} True if device likely has a proper keyboard
 */
export function hasPhysicalKeyboard() {
    // Desktop devices typically have keyboards
    if (!isTouchDevice()) {
        return true;
    }
    
    // Large tablets might have keyboards, small phones typically don't
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const minDimension = Math.min(screenWidth, screenHeight);
    
    // Tablets (iPad size and up) might have keyboards
    // iPhone/small Android phones typically don't
    return minDimension >= 768; // Tablet size threshold
}

/**
 * Detect the primary input method for the device
 * @returns {InputMethod} Primary input method
 */
export function getPrimaryInputMethod() {
    // Check CSS media queries for pointer precision
    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
        // Fine pointer = mouse/trackpad
        if (isTouchDevice()) {
            return InputMethod.HYBRID; // Laptop with touchscreen
        }
        return InputMethod.MOUSE;
    } else if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
        // Coarse pointer = finger/stylus
        return InputMethod.TOUCH;
    }
    
    // Fallback to touch detection
    return isTouchDevice() ? InputMethod.TOUCH : InputMethod.MOUSE;
}

/**
 * Get device category based on size and capabilities
 * @returns {DeviceCategory} Device category
 */
export function getDeviceCategory() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const minDimension = Math.min(screenWidth, screenHeight);
    const _maxDimension = Math.max(screenWidth, screenHeight); // Unused presently; underscore to silence lint
    
    if (!isTouchDevice()) {
        return DeviceCategory.DESKTOP;
    }
    
    // Large screens are likely tablets or larger
    if (minDimension >= 768) {
        return DeviceCategory.TABLET;
    }
    
    // Small touch screens are mobile phones
    return DeviceCategory.MOBILE;
}

/**
 * Check if the device should show touch-optimized UI
 * @returns {boolean} True if touch UI should be used
 */
export function shouldUseTouchUI() {
    const inputMethod = getPrimaryInputMethod();
    const deviceCategory = getDeviceCategory();
    
    // Always use touch UI for mobile devices
    if (deviceCategory === DeviceCategory.MOBILE) {
        return true;
    }
    
    // Use touch UI for tablets without keyboards
    if (deviceCategory === DeviceCategory.TABLET && !hasPhysicalKeyboard()) {
        return true;
    }
    
    // Use touch UI if primary input is touch (even on larger screens)
    return inputMethod === InputMethod.TOUCH;
}

/**
 * Check if device should use mobile-optimized positioning
 * @returns {boolean} True if mobile positioning should be used
 */
export function shouldUseMobilePositioning() {
    return getDeviceCategory() === DeviceCategory.MOBILE || 
           (getDeviceCategory() === DeviceCategory.TABLET && window.innerWidth < 750);
}

/**
 * Log device detection results for debugging
 */
export function logDeviceInfo() {
    console.log('🔍 Device Detection Results:');
    console.log(`  Touch Device: ${isTouchDevice()}`);
    console.log(`  Physical Keyboard: ${hasPhysicalKeyboard()}`);
    console.log(`  Primary Input: ${getPrimaryInputMethod()}`);
    console.log(`  Device Category: ${getDeviceCategory()}`);
    console.log(`  Use Touch UI: ${shouldUseTouchUI()}`);
    console.log(`  Use Mobile Positioning: ${shouldUseMobilePositioning()}`);
    console.log(`  Screen: ${window.innerWidth}x${window.innerHeight}`);
    console.log(`  Touch Points: ${navigator.maxTouchPoints || 0}`);
}
