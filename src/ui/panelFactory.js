// panelFactory.js
// Base panel creation utilities for consistent UI panels

import { isTouchDevice } from '../deviceDetection.js';

/**
 * Default panel styling options
 */
const DEFAULT_PANEL_STYLES = {
    background: {
        color: 0x000000,
        alpha: 0.8
    },
    border: {
        color: 0xffffff,
        alpha: 0.6,
        width: 2
    },
    cornerRadius: 8,
    padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
    }
};

/**
 * Create a base floating panel with common styling
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Object} [options] - Panel configuration options
 * @param {number} [options.width] - Fixed width (if not provided, will auto-size)
 * @param {number} [options.height] - Fixed height (if not provided, will auto-size)
 * @param {Object} [options.styles] - Style overrides
 * @returns {Phaser.GameObjects.Container & {panelWidth?: number, panelHeight?: number, updateSize: Function}}
 */
export function createBasePanel(scene, options = {}) {
    const styles = { ...DEFAULT_PANEL_STYLES, ...options.styles };
    
    // Create main container
    /** @type {Phaser.GameObjects.Container & {panelWidth?: number, panelHeight?: number, updateSize: Function}} */
    const panel = /** @type {any} */ (scene.add.container(0, 0));
    
    // Create background graphics object
    const bg = scene.add.graphics();
    panel.add(bg);
    
    // Store the background for later updates
    /** @type {any} */ (panel).background = bg;
    
    // Method to update panel size based on content
    panel.updateSize = function(width, height) {
        const self = /** @type {typeof panel} */ (this);
        
        // Store dimensions
        self.panelWidth = width;
        self.panelHeight = height;
        
        // Clear and redraw background
        const background = /** @type {any} */ (self).background;
        background.clear();
        background.fillStyle(styles.background.color, styles.background.alpha);
        background.lineStyle(styles.border.width, styles.border.color, styles.border.alpha);
        background.fillRoundedRect(0, 0, width, height, styles.cornerRadius);
        background.strokeRoundedRect(0, 0, width, height, styles.cornerRadius);
    };
    
    // Set initial size if provided
    if (options.width && options.height) {
        panel.updateSize(options.width, options.height);
    }
    
    // Keep panel fixed on screen regardless of camera movement
    panel.setScrollFactor(0);
    
    return panel;
}

/**
 * Add text content to a panel with automatic sizing
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Phaser.GameObjects.Container} panel - The panel container
 * @param {Array<{key?: string, text: string, style?: Object, x?: number, y?: number}>} textItems - Text configuration (key and style are optional, will auto-generate key and use default style if not provided)
 * @param {Object} [options] - Layout options
 * @param {number} [options.startX=10] - Starting X position
 * @param {number} [options.startY=10] - Starting Y position
 * @param {number} [options.lineHeight=18] - Spacing between lines
 * @param {number} [options.minWidth=100] - Minimum panel width
 * @param {number} [options.maxWidth=300] - Maximum panel width
 * @returns {Object} Object containing references to created text elements by key
 */
export function addPanelText(scene, panel, textItems, options = {}) {
    const {
        startX = 10,
        startY = 10,
        lineHeight = 18,
        minWidth = 100,
        maxWidth = 300
    } = options;
    
    const textElements = {};
    let currentY = startY;
    let maxTextWidth = 0;
    
    // Get current touch device status
    const isTouch = isTouchDevice();
    const keyboardWords = ['keyboard', 'Tab', 'Enter', 'ESC', 'key', 'keys'];
    
    // Filter text items based on touchDevice property
    const filteredTextItems = textItems.filter(item => {
        if (isTouch) {
            // probably no keyboard, so don't show keyboard instructions
            if (keyboardWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(item.text))) {
                console.log(`📜 Filtering out keyboard instruction: ${item.text}`);
                return false;
            }
        }
        return true;
    });
    console.log(`📜 Adding ${filteredTextItems} text items to panel (touch: ${isTouch})`);

    // modify words in instructions to suit touch devices over mouse
    const wordReplacements = {
        "click": "tap",
        "Click": "Tap"
    }

    // Create text elements for filtered items
    filteredTextItems.forEach((item, index) => {
        const x = item.x !== undefined ? item.x : startX;
        const y = item.y !== undefined ? item.y : currentY;

        // Replace mouse-specific words with touch-friendly alternatives on touch devices
        if (isTouch) {
            for (const [original, replacement] of Object.entries(wordReplacements)) {
                item.text = item.text.replace(new RegExp(`\\b${original}\\b`, 'g'), replacement);
            }
        }

        const textElement = scene.add.text(x, y, item.text, item.style || {});
        panel.add(textElement);
        
        // Store reference by key (auto-generate if not provided)
        const elementKey = item.key || `text_${index}`;
        textElements[elementKey] = textElement;
        
        // Track maximum width
        const textWidth = textElement.width + x;
        maxTextWidth = Math.max(maxTextWidth, textWidth);
        
        // Advance Y position if not explicitly set
        if (item.y === undefined) {
            currentY += lineHeight;
        }
    });
    
    // Calculate panel dimensions
    const panelWidth = Math.max(minWidth, Math.min(maxWidth, maxTextWidth + startX));
    const panelHeight = Math.max(currentY + (startY / 2), 60); // Minimum height of 60
    
    // Update panel size
    const panelAny = /** @type {any} */ (panel);
    if (panelAny.updateSize) {
        panelAny.updateSize(panelWidth, panelHeight);
    }
    
    return textElements;
}

/**
 * Position panel at specific screen location
 * @param {Phaser.GameObjects.Container} panel - The panel to position
 * @param {string} position - Position string: 'top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'
 * @param {number} viewportWidth - Viewport width
 * @param {number} viewportHeight - Viewport height
 * @param {number} [padding=20] - Padding from screen edges
 */
export function positionPanel(panel, position, viewportWidth, viewportHeight, padding = 20) {
    const panelWidth = /** @type {any} */ (panel).panelWidth || 200;
    const panelHeight = /** @type {any} */ (panel).panelHeight || 100;
    
    switch (position) {
        case 'top-left':
            panel.x = padding;
            panel.y = padding;
            break;
            
        case 'top-right':
            panel.x = viewportWidth - (panelWidth + padding);
            panel.y = padding;
            break;
            
        case 'center':
            panel.x = (viewportWidth - panelWidth) / 2;
            panel.y = (viewportHeight - panelHeight) / 2;
            break;
            
        case 'bottom-left':
            panel.x = padding;
            panel.y = viewportHeight - (panelHeight + padding);
            break;
            
        case 'bottom-right':
            panel.x = viewportWidth - (panelWidth + padding);
            panel.y = viewportHeight - (panelHeight + padding);
            break;
            
        default:
            console.warn(`Unknown panel position: ${position}`);
            panel.x = padding;
            panel.y = padding;
    }
}

/**
 * Create an interactive button for panels
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Phaser.GameObjects.Container} panel - The panel to add the button to
 * @param {Object} config - Button configuration
 * @param {number} config.x - X position within the panel
 * @param {number} config.y - Y position within the panel
 * @param {number} [config.width=24] - Button width
 * @param {number} [config.height=24] - Button height
 * @param {string} config.text - Button text
 * @param {Function} config.onClick - Click handler function
 * @param {number} [config.fontSize=14] - Font size for button text
 * @returns {Object} Button object with background, text, and control methods
 */
export function addPanelButton(scene, panel, config) {
    const {
        x,
        y,
        width = 24,
        height = 24,
        text,
        onClick,
        fontSize = 14
    } = config;
    
    // Fixed button styling
    const buttonStyle = {
        fontSize: fontSize,
        cornerRadius: 4,
        normal: {
            fill: 0x004400, // darker green
            fillAlpha: 0.9,
            stroke: 0x006600,
            strokeAlpha: 1.0,
            strokeWidth: 1,
            textColor: '#ffffff'
        },
        hover: {
            fill: 0x00ff00,
            fillAlpha: 0.9,
            stroke: 0x00aa00,
            strokeAlpha: 1.0,
            strokeWidth: 2,
            textColor: '#000000'
        },
        disabled: {
            fill: 0x666666,
            fillAlpha: 0.5,
            stroke: 0x999999,
            strokeAlpha: 0.5,
            strokeWidth: 1,
            textColor: '#999999'
        },
        toggleOn: {
            fill: 0x00aa00,
            fillAlpha: 0.7,
            stroke: 0x00ff00,
            strokeAlpha: 0.8,
            strokeWidth: 1,
            textColor: '#ffffff'
        }
    };
    
    // Button background (rounded rectangle)
    const buttonBg = scene.add.graphics();
    buttonBg.setPosition(x, y);
    panel.add(buttonBg);
    
    // Button text
    const buttonText = scene.add.text(x + width/2, y + height/2, text, {
        fontSize: `${buttonStyle.fontSize}px`,
        color: buttonStyle.normal.textColor,
        fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5, 0.5);
    panel.add(buttonText);
    
    // Create invisible interactive zone for reliable click detection
    const buttonZone = scene.add.zone(x + width/2, y + height/2, width, height);
    buttonZone.setInteractive();
    panel.add(buttonZone);
    
    // Ensure the zone has the same scroll factor as the panel (should inherit, but make sure)
    buttonZone.setScrollFactor(0);
    
    // Button state management
    let isDisabled = false;
    let isToggleOn = false;
    
    // Button drawing function
    const drawButton = (isHovered = false, disabled = false, toggleOn = false) => {
        buttonBg.clear();
        
        let stateStyle;
        if (disabled) {
            stateStyle = buttonStyle.disabled;
        } else if (toggleOn) {
            stateStyle = buttonStyle.toggleOn;
        } else if (isHovered) {
            stateStyle = buttonStyle.hover;
        } else {
            stateStyle = buttonStyle.normal;
        }

        // Draw button background
        buttonBg.fillStyle(stateStyle.fill, stateStyle.fillAlpha);
        buttonBg.lineStyle(stateStyle.strokeWidth, stateStyle.stroke, stateStyle.strokeAlpha);
        buttonBg.fillRoundedRect(0, 0, width, height, buttonStyle.cornerRadius);
        buttonBg.strokeRoundedRect(0, 0, width, height, buttonStyle.cornerRadius);
        
        // Update text color
        buttonText.setColor(stateStyle.textColor);
    };
    
    // Initial button draw
    drawButton();
    
    // Button interaction handlers
    buttonZone.on('pointerover', () => {
        if (!isDisabled) {
            drawButton(true, false, isToggleOn);
        }
    });
    
    buttonZone.on('pointerout', () => {
        drawButton(false, isDisabled, isToggleOn);
    });
    
    buttonZone.on('pointerdown', (pointer, localX, localY, event) => {
        if (!isDisabled && onClick) {
            // Stop the event from propagation to prevent global handlers from processing it
            event.stopPropagation();
            onClick();
        }
    });
    
    // Return button object with control methods
    return {
        background: buttonBg,
        text: buttonText,
        zone: buttonZone,
        draw: (isHovered = false, disabled = false, toggleOn = false) => {
            // Update internal state
            isToggleOn = toggleOn;
            // Call the draw function
            drawButton(isHovered, disabled, toggleOn);
        },
        setDisabled: (disabled) => {
            isDisabled = disabled;
            drawButton(false, disabled, isToggleOn);
        },
        setEnabled: (enabled) => {
            isDisabled = !enabled;
            drawButton(false, !enabled, isToggleOn);
        },
        destroy: () => {
            buttonBg.destroy();
            buttonText.destroy();
            buttonZone.destroy();
        }
    };
}
