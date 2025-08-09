// deviceDetectionTest.js
// Test file to demonstrate device detection capabilities

import { 
    getPrimaryInputMethod,
    getDeviceCategory,
    shouldUseTouchUI,
    shouldUseMobilePositioning,
    logDeviceInfo,
    InputMethod,
    DeviceCategory
} from './deviceDetection.js';

/**
 * Run device detection tests and log results
 */
import { info } from './logger.js';
function runDeviceDetectionTest() {
    info('🧪 Running Device Detection Tests...\n');
    
    // Log all device info
    logDeviceInfo();
    
    info('\n📱 UI Recommendations:');
    info(`  Use Touch UI: ${shouldUseTouchUI()}`);
    info(`  Use Mobile Positioning: ${shouldUseMobilePositioning()}`);
    
    info('\n🎮 Input Method Examples:');
    const primaryInput = getPrimaryInputMethod();
    if (primaryInput === InputMethod.TOUCH) {
        info('  Recommended: "Tap to select" instructions');
    } else if (primaryInput === InputMethod.MOUSE) {
        info('  Recommended: "Click to select" instructions');  
    } else if (primaryInput === InputMethod.HYBRID) {
        info('  Recommended: "Click or tap to select" instructions');
    }
    
    info('\n📋 Available Enums:');
    info('  InputMethod:', Object.keys(InputMethod).join(', '));
    info('  DeviceCategory:', Object.keys(DeviceCategory).join(', '));
    info('  Current values:', primaryInput, 'on', getDeviceCategory());
    // Test different screen sizes (for demonstration)
    info('\n📏 Screen Size Analysis:');
    const width = window.innerWidth;
    const height = window.innerHeight;
    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);
    info(`  Current: ${width}x${height} (min: ${minDim}, max: ${maxDim})`);
    
    if (minDim < 480) {
        info('  🤳 Small phone size');
    } else if (minDim < 768) {
        info('  📱 Large phone size');
    } else if (minDim < 1024) {
        info('  📟 Tablet size');
    } else {
        info('  💻 Desktop size');
    }
}

// Export for use in other files
export { runDeviceDetectionTest };
