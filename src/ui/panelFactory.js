// panelFactory.js
// Base panel creation utilities for consistent UI panels

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
 * @param {Array<{key: string, text: string, style: Object, x?: number, y?: number}>} textItems - Text configuration
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
    
    // Create text elements
    textItems.forEach(item => {
        const x = item.x !== undefined ? item.x : startX;
        const y = item.y !== undefined ? item.y : currentY;
        
        const textElement = scene.add.text(x, y, item.text, item.style);
        panel.add(textElement);
        
        // Store reference by key
        textElements[item.key] = textElement;
        
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
