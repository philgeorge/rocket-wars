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
function runDeviceDetectionTest() {
    console.log('🧪 Running Device Detection Tests...\n');
    
    // Log all device info
    logDeviceInfo();
    
    console.log('\n📱 UI Recommendations:');
    console.log(`  Use Touch UI: ${shouldUseTouchUI()}`);
    console.log(`  Use Mobile Positioning: ${shouldUseMobilePositioning()}`);
    
    console.log('\n🎮 Input Method Examples:');
    const primaryInput = getPrimaryInputMethod();
    if (primaryInput === InputMethod.TOUCH) {
        console.log('  Recommended: "Tap to select" instructions');
    } else if (primaryInput === InputMethod.MOUSE) {
        console.log('  Recommended: "Click to select" instructions');  
    } else if (primaryInput === InputMethod.HYBRID) {
        console.log('  Recommended: "Click or tap to select" instructions');
    }
    
    console.log('\n📋 Available Enums:');
    console.log('  InputMethod:', Object.keys(InputMethod).join(', '));
    console.log('  DeviceCategory:', Object.keys(DeviceCategory).join(', '));
    console.log('  Current values:', primaryInput, 'on', getDeviceCategory());
    // Test different screen sizes (for demonstration)
    console.log('\n📏 Screen Size Analysis:');
    const width = window.innerWidth;
    const height = window.innerHeight;
    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);
    console.log(`  Current: ${width}x${height} (min: ${minDim}, max: ${maxDim})`);
    
    if (minDim < 480) {
        console.log('  🤳 Small phone size');
    } else if (minDim < 768) {
        console.log('  📱 Large phone size');
    } else if (minDim < 1024) {
        console.log('  📟 Tablet size');
    } else {
        console.log('  💻 Desktop size');
    }
}

// Export for use in other files
export { runDeviceDetectionTest };
