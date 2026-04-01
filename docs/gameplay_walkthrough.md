# Gameplay Walkthrough: Sequential Flow

This document illustrates the sequential steps of a typical game session from launch to Game Over.

---

## Session Overview

**Duration:** ~7 minutes  
**Outcome:** Death on Level 2, 850 points  
**Key Events:** 10 enemy kills (Level 1), 8 enemy kills (Level 2)

---

## Phase 1: Initialization

```mermaid
flowchart TD
    A([Page Load]) --> B[Platform Detection]
    B --> C{Device Type?}
    C -->|Mobile| D[Set isMobile = true<br/>Add 'mobile' class]
    C -->|Desktop| E[Set isMobile = false]
    D --> F[Create Game Instance]
    E --> F
    F --> G[Create World #1<br/>Constructor artifact]
    G --> H[Show Save Selection Screen]
    H --> I([Wait for User Input])
    
    style G fill:#ffcccc
    style H fill:#ccffcc
```

**System State:**
- Game loop: NOT started
- World created: Yes (unused)
- UI visible: Save selection screen (3 slots)
- Touch controls: Hidden

---

## Phase 2: Save Selection & World Generation

```mermaid
flowchart TD
    A([User Clicks Slot 1]) --> B[Load save data]
    B --> C{Save exists?}
    C -->|No| D[Initialize fresh run<br/>bank=0, level=1]
    C -->|Yes| E[Restore bank, skills, level]
    D --> F[Destroy World #1]
    E --> F
    F --> G[Create World #2<br/>PLAYABLE]
    G --> H[Generate Map BSP]
    H --> I[Create 5 rooms + corridors]
    I --> J[Place 4 doors]
    J --> K[Set start point 320,240]
    K --> L[Set exit point 1280,720]
    L --> M[Spawn Player at start]
    M --> N[Spawn TrapDoor at exit]
    N --> O[Start game loop]
    O --> P([Gameplay Active])
    
    style G fill:#ccffcc
    style O fill:#ffffcc
```

**System State:**
- Game loop: RUNNING (60 FPS)
- World: #2 (playable)
- Entities: Player, TrapDoor, 4 Doors
- Enemies: 0 (lazy spawn)
- HUD: ❤️❤️❤️ | Level: 1 | Score: 0

---

## Phase 3: Room Entry & Enemy Spawn

```mermaid
flowchart TD
    A([Player Moves Right]) --> B[Update position<br/>x += velocity.x]
    B --> C{Crossed room<br/>boundary?}
    C -->|No| A
    C -->|Yes| D[Update currentRoom]
    D --> E{Room.spawned?}
    E -->|Yes| A
    E -->|No| F[Calculate enemy count<br/>2 + level*0.5]
    F --> G[Spawn 2 Walkers<br/>random positions]
    G --> H[Set Room.spawned = true]
    H --> I([Combat Phase])
    
    style I fill:#ffcccc
```

**System State:**
- Entities: Player, TrapDoor, 4 Doors, **2 Walkers**
- Enemies visible: 2
- Room 1 status: spawned=true

**Enemy Stats (Walker):**
- HP: 3, Speed: 1.5, Damage: 1
- AI: Direct chase

---

## Phase 4: Combat Loop

```mermaid
flowchart TD
    A([Combat Active]) --> B[Player aims joystick]
    B --> C[Player shoots]
    C --> D{Cooldown<br/>ready?}
    D -->|No| B
    D -->|Yes| E[Spawn Bullet<br/>damage=2, speed=8]
    E --> F[Bullet travels]
    F --> G{Hit enemy?}
    G -->|No| H{Bullet off-screen?}
    G -->|Yes| I[Enemy.takeDamage 2]
    H -->|No| F
    H -->|Yes| J[Remove bullet]
    I --> K{Enemy HP <= 0?}
    K -->|No| B
    K -->|Yes| L[Enemy.die]
    L --> M[Spawn Coin value=5]
    M --> N[Score += 10]
    N --> O{All enemies<br/>dead?}
    O -->|No| B
    O -->|Yes| P([Room Cleared])
    
    style P fill:#ccffcc
```

**Combat Results:**
- Bullets fired: ~8
- Hits: 4 (2 per enemy)
- Coins dropped: 2
- Score: 0 → 20
- Bank: 0 → 10

---

## Phase 5: Door Progression

```mermaid
flowchart TD
    A([Room Cleared]) --> B[Player collects coins<br/>bank += 10]
    B --> C[Player moves to door]
    C --> D{Door collision?}
    D -->|No| C
    D -->|Yes| E{Room cleared?}
    E -->|No| F[Door stays closed]
    E -->|Yes| G[Door opens<br/>Remove collision]
    F --> C
    G --> H[Player walks through]
    H --> I[Enter Room 2]
    I --> J{Room 2 spawned?}
    J -->|No| K[Spawn 2 enemies]
    J -->|Yes| L([Continue])
    K --> L
    
    style G fill:#ccffcc
```

**Progression:**
- Rooms cleared: 1/5
- Doors opened: 1/4
- Current room: Room 2

---

## Phase 6: Damage & Healing

```mermaid
flowchart TD
    A([Enemy Contact]) --> B[Player.takeDamage 1]
    B --> C[HP: 3 → 2]
    C --> D[Set iframes = 60<br/>1 second invulnerable]
    D --> E[Player flashes white]
    E --> F[Kill enemy]
    F --> G{20% chance}
    G -->|Success| H[Spawn HealthPack]
    G -->|Fail| I[Spawn Coin only]
    H --> J[Player collects pack]
    I --> K([Continue])
    J --> L[HP: 2 → 3]
    L --> K
    
    style C fill:#ffcccc
    style L fill:#ccffcc
```

**Health State:**
- Before: ❤️❤️❤️
- After hit: ❤️❤️🖤
- After heal: ❤️❤️❤️

---

## Phase 7: Level Completion

```mermaid
flowchart TD
    A([Clear All 5 Rooms]) --> B[Navigate to exit room]
    B --> C[Touch TrapDoor]
    C --> D[World.nextLevel]
    D --> E[game.level++<br/>1 → 2]
    E --> F[game.score += 100<br/>350 → 450]
    F --> G[Clear all entities<br/>except Player]
    G --> H[Generate new Map]
    H --> I[Create 6 rooms<br/>more complex]
    I --> J[Respawn Player<br/>at new start]
    J --> K[Spawn new doors<br/>and TrapDoor]
    K --> L([Level 2 Active])
    
    style L fill:#ffffcc
```

**Level 2 Changes:**
- Rooms: 5 → 6
- Enemies per room: 2 → 3-4
- Enemy types: Walker, SmartEnemy, RapidFireEnemy, ShotgunEnemy
- Difficulty: Increased

---

## Phase 8: Death Sequence

```mermaid
flowchart TD
    A([Level 2 Combat]) --> B[ShotgunEnemy fires<br/>3 bullets]
    B --> C[Player hit by 2<br/>HP: 3 → 1]
    C --> D[Player retreats]
    D --> E[ShotgunEnemy fires again]
    E --> F[Player hit by 1<br/>HP: 1 → 0]
    F --> G[Player.die]
    G --> H[game.gameOver]
    H --> I{score > highScore?}
    I -->|Yes| J[Update highScore<br/>850]
    I -->|No| K[Keep old highScore]
    J --> L[Save to localStorage]
    K --> L
    L --> M[Stop game loop]
    M --> N[Show Game Over screen]
    N --> O([Game Over State])
    
    style F fill:#ff0000
    style O fill:#cccccc
```

**Final Stats:**
- Level reached: 2
- Score: 850
- High Score: 850 (new)
- Bank: 10 gold
- Total kills: 18 enemies

---

## Phase 9: Restart Flow

```mermaid
flowchart TD
    A([Game Over Screen]) --> B{User Action?}
    B -->|Click Restart| C[Save current inventory]
    B -->|Exit| D[End session]
    C --> E[game.level = 1]
    E --> F[game.score = 0]
    F --> G[game.isGameOver = false]
    G --> H[Create World #3<br/>with saved inventory]
    H --> I[Generate Level 1 map]
    I --> J[Spawn Player<br/>HP = 3]
    J --> K[Start game loop]
    K --> L([Back to Phase 3])
    D --> M([Session End])
    
    style L fill:#ccffcc
    style M fill:#cccccc
```

**Restart Behavior:**
- **Preserved:** Bank (10), unlocked skills, backpack items
- **Reset:** Level (→1), Score (→0), HP (→3)
- **New:** Fresh map, new enemy spawns

---

## Complete Session Timeline

```mermaid
gantt
    title Typical 7-Minute Session
    dateFormat mm:ss
    axisFormat %M:%S
    
    section Init
    Page Load               :00:00, 00:03
    Save Selection          :00:03, 00:05
    
    section Level 1
    Map Gen                 :00:05, 00:07
    Rooms 1-5               :00:07, 04:00
    
    section Level 2
    Map Gen                 :04:00, 04:05
    Rooms 1-3               :04:05, 07:00
    
    section End
    Game Over               :07:00, 07:30
```

---

## Key Metrics

### Timing
- Map generation: ~2 seconds
- Room combat: 30-60 seconds
- Level transition: Instant
- Death → Game Over: 0.5 seconds

### Progression Table

| Metric | Start | After L1 | After L2 | At Death |
|:-------|:------|:---------|:---------|:---------|
| Level | 1 | 2 | 2 | 2 |
| Score | 0 | 450 | 850 | 850 |
| Bank | 0 | 10 | 10 | 10 |
| HP | 3/3 | 3/3 | 1/3 | 0/3 |

### Enemy Scaling

**Level 1:** 2 per room, Walker only, 10 total kills  
**Level 2:** 3-4 per room, mixed types, 8 total kills (died early)

---

## System Behavior

### Deterministic
- Map generation algorithm (BSP)
- Enemy spawn counts (formula: `2 + level * 0.5`)
- Damage values (fixed per weapon/enemy)

### Random
- Room placement and connections
- Enemy type selection (weighted)
- Loot drops (20% health pack chance)
- Weapon stat ranges

### Performance
- Target: 60 FPS
- Spatial Hash: O(N) collision detection
- Lazy spawning: Enemies created on room entry only


**Player:** Sarah (new player)  
**Goal:** Reach Level 3 and unlock the "Speed Boost" skill  
**Duration:** ~15 minutes  
**Outcome:** Death on Level 2, 850 points earned

---

## Step 1: Page Load & Platform Detection

```mermaid
sequenceDiagram
    participant Sarah
    participant Browser
    participant Platform
    participant Game
    
    Sarah->>Browser: Opens localhost:8000
    Browser->>Platform: DOMContentLoaded fires
    Platform->>Platform: Check user agent
    Note over Platform: iPhone detected<br/>Sets isMobile = true
    Platform->>Browser: Add 'mobile' class to body
    
    Browser->>Game: new Game(canvas)
    Note over Game: Creates Input, Camera, World<br/>Shows Save Selection screen
    
    Game-->>Sarah: Display: "SELECT RUN"<br/>3 empty save slots
```

**What Sarah Sees:**
- Black screen with "SELECT RUN" title
- Three buttons: "EMPTY SLOT" (all three)
- No joysticks yet (game hasn't started)

---

## Step 2: Save Slot Selection

```mermaid
sequenceDiagram
    participant Sarah
    participant UIManager
    participant SaveManager
    participant Game
    participant World
    
    Sarah->>UIManager: Taps "EMPTY SLOT" (Slot 1)
    UIManager->>SaveManager: loadSlot("1")
    SaveManager-->>UIManager: null (no save data)
    
    UIManager->>Game: loadGame("1")
    activate Game
    
    Note over Game: Initialize fresh run:<br/>bank = 0<br/>unlockedStats = []<br/>level = 1
    
    Game->>World: new World(this)
    activate World
    
    World->>World: Generate Map (BSP)
    Note over World: Creates 5 rooms<br/>Connects with corridors<br/>Places 4 doors
    
    World->>World: Spawn Player at (320, 240)
    World->>World: Spawn TrapDoor at (1280, 720)
    
    deactivate World
    
    Game->>Game: start() → Begin game loop
    deactivate Game
    
    Game-->>Sarah: Display: Game world<br/>+ Touch controls (joysticks + buttons)
```

**What Sarah Sees:**
- Canvas shows dungeon with stone walls
- Player character (white square) at spawn point
- Two joysticks appear (bottom corners)
- Action buttons appear (right side)
- HUD shows: ❤️❤️❤️ | Level: 1 | Score: 0

**Map Generated:**
```
Room Layout (5 rooms):
┌─────┐     ┌─────┐
│  1  │─────│  2  │
└─────┘     └──┬──┘
               │
            ┌──┴──┐
            │  3  │
            └──┬──┘
         ┌─────┴─────┐
      ┌──┴──┐     ┌──┴──┐
      │  4  │     │  5  │ (Exit)
      └─────┘     └─────┘
```

---

## Step 3: First Room Entry & Enemy Spawn

```mermaid
sequenceDiagram
    participant Sarah
    participant Player
    participant World
    participant Room1
    participant Enemy
    
    Sarah->>Player: Moves joystick right
    Note over Player: velocity.x = 3.0<br/>x += 3.0 per frame
    
    Player->>Player: x = 400 (crosses room boundary)
    Player->>World: Update currentRoom
    World->>Room1: Check if spawned
    Room1-->>World: spawned = false
    
    World->>World: spawnEnemiesForRoom(Room1)
    activate World
    
    Note over World: Level 1 formula:<br/>2 + (1 * 0.5) = 2 enemies
    
    World->>Enemy: new Walker(x: 450, y: 250)
    World->>Enemy: new Walker(x: 500, y: 280)
    
    World->>Room1: spawned = true
    deactivate World
    
    World-->>Sarah: 2 red squares appear!
```

**What Sarah Sees:**
- Two red enemies suddenly appear in the room
- They start moving toward her character
- No warning or fade-in (instant spawn)

**Enemy Stats (Level 1 Walker):**
- HP: 3
- Speed: 1.5
- Damage: 1
- Behavior: Chase player directly

---

## Step 4: Combat Sequence

```mermaid
sequenceDiagram
    participant Sarah
    participant Player
    participant Bullet
    participant Walker1
    participant World
    
    Sarah->>Player: Drags right joystick up
    Note over Player: Aim vector: (0, -1)
    
    Sarah->>Player: Holds right joystick (shooting)
    Player->>Player: shootCooldown check
    Note over Player: 0.2s elapsed since last shot<br/>✓ Can shoot
    
    Player->>Bullet: new Bullet(x, y, vx, vy, damage: 2)
    Player->>World: addEntity(bullet)
    
    Note over Bullet: Travels at speed 8<br/>Direction: (0, -1)
    
    Bullet->>Walker1: Collision detected!
    Bullet->>Walker1: takeDamage(2)
    Walker1->>Walker1: hp = 3 - 2 = 1
    
    Note over Bullet: marked.dead = true<br/>Removed next frame
    
    Sarah->>Player: Shoots again (0.2s later)
    Player->>Bullet: new Bullet(...)
    Bullet->>Walker1: Hit!
    Walker1->>Walker1: hp = 1 - 2 = -1
    Walker1->>Walker1: die()
    
    Walker1->>World: Spawn Coin(x, y, value: 5)
    Walker1->>World: marked.dead = true
    
    World-->>Sarah: Enemy disappears<br/>Gold coin appears
```

**What Sarah Sees:**
- White projectiles shoot from player toward enemies
- Enemy flashes when hit
- Enemy disappears, gold coin drops
- Score: 0 → 10 (10 points per kill)

---

## Step 5: Loot Collection & Door Opening

```mermaid
sequenceDiagram
    participant Sarah
    participant Player
    participant Coin
    participant Door
    participant Room2
    
    Player->>Coin: Collision detected
    Coin->>Player: collect()
    Player->>Player: game.bank += 5
    Coin->>Coin: marked.dead = true
    
    Note over Sarah: Kills second Walker<br/>Collects second coin
    
    Player->>Player: game.bank = 10
    
    Sarah->>Player: Moves toward Door
    Player->>Door: Collision detected
    Door->>Door: Check if room cleared
    Door->>Room1: areEnemiesCleared()
    Room1-->>Door: true (0 enemies alive)
    
    Door->>Door: open()
    Note over Door: Changes sprite<br/>Removes collision
    
    Player->>Door: Walks through
    Player->>Room2: Enter new room
    
    Room2->>World: Trigger spawn
    World->>World: spawnEnemiesForRoom(Room2)
    Note over World: Spawns 2 new enemies<br/>in Room 2
```

**What Sarah Sees:**
- "Gold: 10" appears in HUD
- Door changes from closed (red) to open (green)
- She walks through freely
- New room revealed, 2 more enemies spawn

---

## Step 6: Taking Damage & Health Pack

```mermaid
sequenceDiagram
    participant Sarah
    participant Player
    participant SmartEnemy
    participant HealthPack
    
    SmartEnemy->>SmartEnemy: A* pathfinding to Player
    Note over SmartEnemy: Calculates optimal path<br/>around walls
    
    SmartEnemy->>Player: Collision detected!
    SmartEnemy->>Player: takeDamage(1)
    Player->>Player: hp = 3 - 1 = 2
    Player->>Player: iframes = 60 (1 second)
    
    Note over Player: Flashes white<br/>Invulnerable for 1s
    
    Sarah->>Player: Retreats, kills SmartEnemy
    SmartEnemy->>World: 20% chance → Spawn HealthPack
    
    Player->>HealthPack: Collision
    HealthPack->>Player: heal(1)
    Player->>Player: hp = min(2 + 1, 3) = 3
    HealthPack->>HealthPack: marked.dead = true
```

**What Sarah Sees:**
- Enemy touches her → Heart in HUD turns grey (❤️❤️🖤)
- Player character flashes white briefly
- Kills enemy → Green health pack drops
- Picks up pack → Heart refills (❤️❤️❤️)

---

## Step 7: Level Completion (TrapDoor)

```mermaid
sequenceDiagram
    participant Sarah
    participant Player
    participant TrapDoor
    participant World
    participant Game
    
    Note over Sarah: Clears all 5 rooms<br/>Reaches final room
    
    Player->>TrapDoor: Collision detected
    TrapDoor->>World: nextLevel()
    activate World
    
    World->>Game: level++
    Note over Game: level = 1 → 2
    
    World->>Game: score += 100
    Note over Game: score = 350 → 450
    
    World->>World: Clear all entities (except Player)
    World->>World: new Map(game)
    Note over World: Generate fresh Level 2 map<br/>6 rooms this time
    
    World->>World: Respawn Player at new startPoint
    World->>World: Spawn new Doors & TrapDoor
    
    deactivate World
    
    World-->>Sarah: Screen fades<br/>New level appears
```

**What Sarah Sees:**
- Walks onto glowing purple trapdoor
- Brief fade to black
- New dungeon layout appears
- HUD updates: "Level: 2" | "Score: 450"
- Player HP and inventory preserved

**Level 2 Changes:**
- More rooms (6 instead of 5)
- More enemies per room (3-4 instead of 2)
- Tougher enemy types (RapidFireEnemy, ShotgunEnemy)

---

## Step 8: Death & Game Over

```mermaid
sequenceDiagram
    participant Sarah
    participant Player
    participant ShotgunEnemy
    participant Game
    participant UIManager
    
    Note over Sarah: Level 2, Room 3<br/>Surrounded by 3 enemies
    
    ShotgunEnemy->>Player: Fires shotgun blast (3 bullets)
    Player->>Player: Hit by 2 bullets<br/>hp = 3 - 2 = 1
    
    Note over Player: ❤️🖤🖤 (1 HP left)
    
    ShotgunEnemy->>Player: Fires again
    Player->>Player: Hit by 1 bullet<br/>hp = 1 - 1 = 0
    
    Player->>Player: die()
    Player->>Game: gameOver()
    activate Game
    
    Game->>Game: isGameOver = true
    Game->>Game: Check highScore
    Note over Game: 850 > 0<br/>New high score!
    
    Game->>Game: Save to localStorage
    Game->>UIManager: showGameOver(850, 850)
    
    deactivate Game
    
    UIManager-->>Sarah: Display Game Over screen
```

**What Sarah Sees:**
- Player character flashes red
- Screen shakes briefly
- Game Over screen appears:
  ```
  GAME OVER
  Score: 850
  High Score: 850
  
  [Restart Button]
  ```
- Touch controls remain visible but inactive

---

## Step 9: Restart Decision

```mermaid
flowchart TD
    Start([Game Over Screen]) --> Decision{Sarah's Choice}
    
    Decision -->|Tap Restart| Restart[Game.restart]
    Decision -->|Close Tab| Exit[Session Ends]
    
    Restart --> SaveInventory[Save current backpack items]
    SaveInventory --> ResetStats[level = 1<br/>score = 0<br/>isGameOver = false]
    ResetStats --> NewWorld[new World with savedInventory]
    NewWorld --> StartLoop[game.start]
    StartLoop --> Playing([Back to Step 3])
    
    Exit --> End([Session Complete])
    
    style Playing fill:#90EE90
    style End fill:#FFB6C1
```

**If Sarah Restarts:**
- Keeps: Bank (10 gold), any items in backpack
- Resets: Level → 1, Score → 0, HP → 3
- Gets: Fresh Level 1 map, new enemy spawns

**If Sarah Exits:**
- Progress saved to Slot 1:
  - Bank: 10 gold
  - High Score: 850
  - Unlocked Stats: (none yet)

---

## Complete Session Timeline

```mermaid
gantt
    title Sarah's 15-Minute Session
    dateFormat mm:ss
    axisFormat %M:%S
    
    section Initialization
    Page Load & Platform Detection    :00:00, 00:03
    Save Slot Selection               :00:03, 00:05
    
    section Level 1
    Map Generation                    :00:05, 00:07
    Room 1 Combat                     :00:07, 01:00
    Room 2-3 Combat                   :01:00, 02:30
    Room 4 (Health Pack)              :02:30, 03:15
    Room 5 & TrapDoor                 :03:15, 04:00
    
    section Level 2
    Map Generation                    :04:00, 04:05
    Room 1-2 Combat                   :04:05, 06:30
    Room 3 (Death)                    :06:30, 07:00
    
    section Meta
    Game Over Screen                  :07:00, 07:30
    Viewing Stats                     :07:30, 08:00
```

---

## Key Observations

### Timing Patterns

1. **Map Generation:** ~2 seconds (BSP algorithm + entity spawning)
2. **Room Combat:** 30-60 seconds per room (depends on enemy count)
3. **Level Transition:** Instant (no loading screen)
4. **Death → Game Over:** ~0.5 seconds

### Player Progression

| Metric | Start | After L1 | After L2 | At Death |
|:-------|:------|:---------|:---------|:---------|
| Level | 1 | 2 | 2 | 2 |
| Score | 0 | 450 | 850 | 850 |
| Bank | 0 | 10 | 10 | 10 |
| HP | 3/3 | 3/3 | 1/3 | 0/3 |

### Enemy Scaling

**Level 1:**
- 2 enemies per room
- Types: Walker only
- Total kills: 10 enemies

**Level 2:**
- 3-4 enemies per room
- Types: Walker, SmartEnemy, RapidFireEnemy, ShotgunEnemy
- Total kills: 8 enemies (died in Room 3)

---

## Common Player Paths

### Path A: "The Speedrunner"
1. Skip all optional rooms
2. Rush to TrapDoor
3. Reach Level 5+ in 10 minutes
4. Die to boss-level enemy swarms

### Path B: "The Completionist"
1. Clear every room
2. Collect all coins and items
3. Unlock skills between levels
4. Slower but stronger progression

### Path C: "The Unlucky"
1. Enter first room
2. Get cornered by Walkers
3. Die in 2 minutes
4. Restart immediately

---

## System Behavior Summary

### Deterministic Elements
- Map generation (same seed = same layout)
- Enemy spawn counts (formula-based)
- Damage values (fixed per weapon/enemy)

### Random Elements
- Room placement (BSP algorithm)
- Enemy types (weighted random)
- Loot drops (20% health pack chance)
- Weapon stats (random within range)

### Performance Checkpoints
- **60 FPS Target:** Maintained with <100 entities
- **Spatial Hash:** Reduces collision checks from O(N²) to O(N)
- **Lazy Spawning:** Enemies only created when room entered
