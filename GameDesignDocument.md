# Game Design Document (GDD)

## 1. Game Overview
- **Game Title**: Rocket Wars 
- **Genre**: 2D turn-based strategy shooter
- **Target Audience**: Retro game fans, idle time filler
- **Platform**: Browser (Laptop, Tablet, Mobile)
- **Game Summary**: Player attempts to launch rockets from their base, through a generated 2D landscape, to hit and destroy the opponents base.

## 2. Gameplay
- **Core Mechanics**:
  - Randomly generated 2D landscapes provide unique challenges each game.
  - Players aim and launch rockets by adjusting angle and power.
  - Rockets are affected by gravity and wind.
  - Terrain is destructible, creating craters upon impact.
  - Turns alternate between players, with a time limit for each turn.
  - Bases have health or durability that decreases when hit.
  - Each game should be limited to something like 10 turns each so that games don't go on forever.
  - The opponent can be a computer controlled player; future enhancement is to have online multi-player
  - Players can use power-ups or special rocket types for strategic advantages. (future enhancement)
- **Objective**: 
  - Primary: To destroy the other player's base before they destroy yours
  - Secondary: To have greater base health left than your opponent after all turns completed
- **Challenges**:
  - Randomly generated terrain makes every game different to find your range
  - Varying wind over the course of a single game requires player to adjust constantly aim
  - Varying gravity from one game to the next also requires good judgement from player
- **Rewards**: 
  - Points for destroying part or all of the opponent's base
  - Bonus points based on how much of your base is left at the end of a game
  - Future enhancement: power-ups, shield (or base rebuild) could be placed elsewhere on the landscape - if you hit them you get the bonus for the rest of that game

## 3. Visual and Audio Design
- **Art Style**: 
  - Simple, retro-inspired 2D graphics reminiscent of 1980s games.
  - Side-on view with clear differentiation between landscape (hills, valleys, caves) and important objects (bases).
  - Use of higher resolution for smoother visuals while maintaining a pixel-art aesthetic.
  - Minimalistic color palette to enhance clarity and focus on gameplay.

- **Sound Design**: 
  - Optional simple sound effects for rocket launches and explosions (future enhancement).
  - Most players are expected to play with sound off, so sound is not a priority.

## 4. Technical Details
- **Frameworks/Tools**: 
  - Phaser.js: A feature-rich 2D game framework for browser-based games, providing built-in support for physics, animations, and input handling.

- **Phaser.js Architecture Principles**:
  - **Always follow standard Phaser.js conventions** - When implementing any feature, prioritize established Phaser patterns over custom solutions
  - **Camera System**: Use Phaser's built-in camera bounds and controls for large worlds, not browser scrolling
  - **Coordinate Systems**: Use Phaser's world coordinates (pointer.worldX/worldY) for game logic, screen coordinates only for UI
  - **Scene Management**: Structure code using Phaser's scene lifecycle (preload, create, update) rather than ad-hoc initialization
  - **Input Handling**: Use Phaser's input events and pointer system rather than DOM event listeners where possible  
  - **Physics Integration**: Leverage Phaser's physics systems (Arcade, Matter) rather than custom physics calculations
  - **Scaling Strategy**: Use appropriate Phaser scale modes (NONE, FIT, etc.) based on responsive requirements
  - **Asset Management**: Use Phaser's loader and asset cache systems for consistent resource handling
  - **Graphics Rendering**: Prefer Phaser's Graphics API and sprite systems over direct canvas manipulation

- **Responsive Design**: 
  - Ensure the game scales and adapts to different screen sizes (laptop, tablet, mobile).
  - Ensure compatibility with all modern browsers (e.g., Chrome, Firefox, Safari, Edge).

- **Performance Considerations**: 
  - Optimize rendering and physics calculations for smooth gameplay on a variety of devices.

- **Hosting**: 
  - Use GitHub Pages for hosting the game initially. It is free, easy to set up, and integrates well with version control.
  - Future enhancement: If the project grows, consider migrating to platforms like Netlify or Vercel for additional features.

- **Version Control**: 
  - Use GitHub for version control to track changes and collaborate effectively.

- **Build Tools**: 
  - Start without a build tool for simplicity.
  - Future enhancement: Use Parcel or Vite for faster builds if the project grows in complexity.

- **Server Technology**: 
  - No backend required initially as the game is single-player.
  - Future enhancement: Use Firebase or Supabase for real-time multiplayer or leaderboards if needed.

- **Other Tools**: 
  - Graphics: Use tools like Piskel or GIMP for creating assets.
  - Testing: Test on multiple browsers and devices to ensure compatibility.

## 5. Levels and Progression
- **Level Design**: 
  - Initially we'll have just single games
  - The player can pick gravity (from within a range)
  - The player can set a range of wind speed
  - The game itself will then generate a landscape that would fit on a laptop or horizontal table screen when zoomed fully out
  - The landscape must have some flat areas where the bases could be positions
  - The landscape may have varying amounts of either gentle rolling hills or more spiky mountains
  - There should be at least 1 hill or mountain in the middle of the landscape, because the players bases will be on opposite sides of this
  - The player gets to choose where to place their base within 50% of the landscape
  - The opponent (CPU controlled) will place their base within the other 50%, this can be random but would skew in favour of lower, flatter land
- **Difficulty Curve**:
  - Initially just single, configurable games.
  - Future enhancement: More consideration to be given to increasing difficulty over time.

## 6. Monetization (Optional)
- **Free-to-Play**: 
  - The game will definitely be free to play
  - This game is intended as a fun experiment which I will only share with friends if it works at all
  - Future Enhancement: If it becomes popular I would consider payments for things like customised base graphics, or weapons that aren't more powerful but look interesting or funny
- **Ads**: I may consider inserting ads in the future, but preferably never!

## 7. Development Plan
- **Milestones**: 
  1. **Week 1-2**: Set up the project structure and environment.
     - Create the basic HTML, CSS, and JavaScript files.
     - Integrate Phaser.js and test a simple game scene.
  2. **Week 3-4**: Implement basic gameplay mechanics.
     - Add rocket launching with adjustable angle and power.
     - Implement gravity and wind effects.
  3. **Week 5-6**: Create terrain generation and base placement.
     - Generate random 2D landscapes with hills and valleys.
     - Allow players to place their base and implement CPU base placement.
  4. **Week 7-8**: Add turn-based gameplay and scoring.
     - Alternate turns between player and CPU.
     - Implement base health and scoring system.
  5. **Week 9-10**: Polish visuals and add basic UI.
     - Add retro-inspired graphics and clear differentiation of objects.
     - Create a simple UI for turn indicators and score display.
  6. **Week 11-12**: Playtesting and bug fixes.
     - Test the game thoroughly for bugs and balance issues.
     - Make adjustments based on feedback.
  7. **Future Enhancements**: 
     - Add sound effects, power-ups, and online multiplayer if time permits.

- **Timeline**: 
  - Estimated completion: 3 months (12 weekends) with 2 hours per weekend.

## 8. Team (Optional)
- **Roles**:
  - Game Designer: Phil
  - Developer/Programmer: Phil
  - Artist: Phil
  - Sound Designer: Phil
  - Tester: Phil

All roles will be handled by me (Phil) with the assistance of Copilot for the foreseeable future.
