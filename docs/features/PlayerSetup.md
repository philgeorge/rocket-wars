# Player Setup Feature

## Feature Overview

Add a second game setup stage called "Player Setup" that occurs after the landscape has been generated but before the actual combat begins. This stage allows players to personalize their experience by choosing their name and turret placement location.

## Requirements Analysis

Based on the user description, this feature needs to:

1. **Timing**: Execute after landscape generation but before shooting begins
2. **Player Input**: Collect player name (max 10 characters) for each player
3. **Location Selection**: Allow players to click on flat bases to place their turret
4. **Conflict Prevention**: Prevent multiple players from selecting the same turret location
5. **UI Display**: Show a floating panel with instructions and name input
6. **Sequence Management**: Process players one by one until all have completed setup
7. **Integration**: Use actual player names in the existing player info panel instead of "Player 1", etc.

## Current Game Flow Analysis

The current game flow is:
1. **Pre-game Config** (index.html form) → collects numPlayers, windVariation, gravity
2. **Game Start** (main.js) → generates landscape, places turrets automatically on flat bases, starts combat

The new flow will be:
1. **Pre-game Config** → same as current
2. **Landscape Generation** → generate terrain and identify flat bases
3. **🆕 Player Setup Stage** → players choose names and turret locations
4. **Combat Start** → begin turn-based gameplay with personalized players

## Technical Architecture

### New Files to Create:
- `src/playerSetup.js` - Main player setup logic and scene management
- `src/playerSetupUI.js` - UI components for the setup stage

### Files to Modify:
- `src/main.js` - Integrate player setup stage into game flow
- `src/ui.js` - Update player stats panel to use actual names
- `src/turret.js` - Modify turret creation to accept player data instead of auto-generation

### Key Data Structures:

```javascript
// Player data structure
const playerData = {
    id: 'player1',
    name: 'Alice',        // User-entered name (max 10 chars)
    team: 'player1',      // Team identifier for colors
    baseIndex: 2,         // Index of chosen flat base
    health: 100,          // Starting health
    turret: null          // Will hold turret object reference
};

// Setup stage state
const setupState = {
    currentPlayerIndex: 0,
    players: [],
    availableBases: [],   // Array of unused flat base indices
    isComplete: false
};
```

## Implementation Steps

### Phase 1: Core Infrastructure
1. **Create playerSetup.js module**
   - Export `initializePlayerSetup()` function
   - Handle player setup scene state management
   - Manage progression through each player

2. **Create playerSetupUI.js module** 
   - Create floating instruction panel
   - Handle name input field
   - Show available base highlighting
   - Display current player being processed

3. **Modify main.js game flow**
   - After landscape generation, call player setup instead of auto-placing turrets
   - Wait for player setup completion before starting combat
   - Pass player data to turret creation

### Phase 2: User Interaction
4. **Implement base selection system**
   - Highlight available flat bases when hovering
   - Handle click events on bases
   - Validate base availability 
   - Visual feedback for selected vs unavailable bases

5. **Create name input system**
   - HTML input field in floating panel
   - 10 character limit validation
   - Default name fallback if empty
   - Focus management for better UX

### Phase 3: Integration
6. **Update turret placement system**
   - Modify `placeTurretsOnBases()` to accept player data array
   - Create turrets at player-selected locations only
   - Associate turrets with player names and data

7. **Update UI panels**
   - Modify `createPlayerStatsPanel()` to display actual player names
   - Update all player-related UI text throughout the game
   - Ensure consistent player identification

### Phase 4: Polish & Testing
8. **Add visual polish**
   - Smooth transitions between setup phases  
   - Clear visual indicators for each step
   - Responsive design for different screen sizes

9. **Error handling & edge cases**
   - Handle players backing out or refreshing
   - Validate all required data before proceeding
   - Graceful fallbacks for incomplete setup

10. **Cross-device compatibility**
    - Touch-friendly base selection
    - Mobile-optimized input panels
    - Test on various screen sizes

## User Experience Flow

1. **Player 1 Setup**:
   - Panel appears: "Player 1, enter your name then click to place your turret"
   - Available bases are highlighted
   - Player enters name and clicks a base
   - Base becomes unavailable, player data stored

2. **Player 2+ Setup** (repeat for each):
   - Panel updates: "Player 2, enter your name then click to place your turret"  
   - Only remaining bases are highlighted
   - Process repeats until all players complete setup

3. **Transition to Combat**:
   - Setup panel disappears
   - Game begins with personalized player names
   - Combat proceeds as normal with existing mechanics

## Technical Considerations

- **State Management**: Maintain setup state separately from game state until completion
- **Input Handling**: Ensure name input doesn't conflict with Phaser input systems
- **Camera Control**: Keep camera management during setup (pan to show available bases)
- **Performance**: Minimal impact on existing game performance
- **Accessibility**: Clear instructions and visual feedback for all interactions

## Success Criteria

- [ ] Players can enter custom names (max 10 chars)
- [ ] Players can select different turret locations  
- [ ] No two players can select the same location
- [ ] Setup completes for all players before combat starts
- [ ] Player names appear correctly in game UI
- [ ] Feature works on desktop, tablet, and mobile
- [ ] Smooth integration with existing game flow
- [ ] No breaking changes to current functionality
