# JavaScript Action Shooter RPG

**🎮 Play the Game Live Here:** [https://gffn21.github.io/javascript_shooter_game_v1/](https://gffn21.github.io/javascript_shooter_game_v1/)

## ⚔️ About the Game
This is a 2D Angled Top-Down Action Shooter RPG. Built entirely from scratch using HTML, CSS, and Vanilla JavaScript, it features a bullet-hell roguelike gameplay loop. Players must navigate procedurally generated dungeon rooms, battle waves of varied enemies, uncover loot chests, and survive long enough to purchase permanent stat upgrades and abilities using collected gold.

## 🕹️ How to Play

### PC Controls
* **Movement:** `W`, `A`, `S`, `D` 
* **Aiming & Shooting:** Mouse cursor to aim, `Left Click` to fire.
* **Dash:** `Spacebar` or `Right Click`
* **Switch Weapon:** `Q` or `Mouse Scroll Wheel`
* **Interact:** `E` (when near chests, altars, or exit portals)

### Mobile Controls
* **Movement:** Left Virtual Joystick area.
* **Aiming & Shooting:** Right Virtual Joystick area (drag to aim, push outward to fire).
* **HUD Buttons:** Tap the on-screen UI buttons to Dash, Swap Weapons, and access Menus.

### In-Game Menus
* **Inventory (`I`):** Equip and manage found weapons and items.
* **Stats (`P`):** View your current combat modifiers.
* **Skills/Abilities (`O`):** Spend your hard-earned gold (`G`) to purchase powerful permanent upgrades.

---

## 📖 Documentation (`/docs`)

If you are interested in the technical systems and architecture driving the game engine, check out the `docs/` folder. It contains detailed breakdowns of the codebase's design:

* **[Full Architecture Documentation](docs/DOCUMENTATION.md)**: A comprehensive guide to the core game loop, entity class hierarchy, 2.5D rendering pipeline, and spatial hash collision systems.
* **[Game Lifecycle](docs/game_lifecycle.md)**: An in-depth look at how the application boots, loads assets, and algorithmically generates levels.
* **[Gameplay Walkthrough](docs/gameplay_walkthrough.md)**: A step-by-step technical sequence map modeling a typical player session from spawning to combat.
* **[State Machine Design](docs/game_state_machine_design.md)**: Documentation on the finite state machine (FSM) pattern used to manage pausing, menus, and screen transitions cleanly.
