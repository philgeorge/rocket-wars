// index.js
// Main UI module exports

export { createBasePanel, addPanelText, positionPanel, setupPanelInputDismissal } from './panelFactory.js';
export { createEnvironmentPanel, positionEnvironmentPanel } from './environmentPanel.js';
export { createPlayerStatsPanel, positionPlayerStatsPanel } from './playerStatsPanel.js';
export { createResultsPanel, positionResultsPanel, setupResultsPanelRestart } from './resultsPanel.js';
export { createBaseSelectionPanel, positionBaseSelectionPanel, hideBaseSelectionPanel, showBaseSelectionPanel } from './baseSelectionPanel.js';
export { 
    createAimingInstructionsPanel, 
    hideAimingInstructionsPanel, 
    showAimingInstructionsPanel,
    showAimingInstructionsIfNeeded
} from './aimingInstructionsPanel.js';
