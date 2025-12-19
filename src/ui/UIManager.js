export default class UIManager {
    constructor(game) {
        this.game = game;

        this.heartsContainer = document.getElementById('hearts-container');
        this.levelDisplay = document.getElementById('level-display');
        this.scoreDisplay = document.getElementById('score-display');
        this.moneyDisplay = document.getElementById('money-display');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.finalScore = document.getElementById('final-score');
        this.inventoryScreen = document.getElementById('inventory-screen');
        this.skillsScreen = document.getElementById('skills-screen'); // New
        this.inventoryGrid = document.getElementById('inventory-grid');
        this.equipmentGrid = document.getElementById('equipment-grid');
        this.weaponsGrid = document.getElementById('weapons-grid');

        // Inventory Click Handlers (Keep for click-to-equip/unequip if desired, or replace with DnD?)
        // Let's keep clicks as fallback or complementary.
        this.inventoryGrid.addEventListener('click', (e) => this.handleInventoryClick(e, 'backpack'));
        this.weaponsGrid.addEventListener('click', (e) => this.handleInventoryClick(e, 'weapon'));

        this.restartBtn = document.getElementById('restart-btn');
        this.restartBtn.addEventListener('click', () => {
            this.game.restart();
            this.hideGameOver();
        });

        this.lastHp = -1;

        // Drag & Drop State
        this.draggedSource = null; // 'backpack' or 'weapon'
        this.draggedIndex = -1;
        this.hoveredSlot = null; // { source: '...', index: ... }
    }

    handleInventoryClick(e, source) {
        const slot = e.target.closest('.slot');
        if (!slot) return;

        const index = parseInt(slot.dataset.index);
        const player = this.game.world.player;

        if (source === 'backpack') {
            const item = player.inventory[index];
            if (item && item.stats) { // Ensure it's a weapon (we assume all items are weapons for now)
                // Try to equip
                const wIndex = player.weapons.indexOf(null);
                if (wIndex !== -1) {
                    player.weapons[wIndex] = item;
                    player.inventory[index] = null;
                    this.renderAllInventory();
                } else {
                    // Swap with current selected? Or just warn?
                    // Let's swap with slot 0 for simplicity or just do declared slots
                }
            }
        } else if (source === 'weapon') {
            const item = player.weapons[index];
            if (item) {
                // Unequip
                const iIndex = player.inventory.indexOf(null);
                if (iIndex !== -1) {
                    player.inventory[iIndex] = item;
                    player.weapons[index] = null;
                    this.renderAllInventory();
                }
            }
        }
    }

    toggleInventory() {
        // If skills is open, close it first? Or just toggle inventory.
        // Let's ensure mutually exclusive UI
        if (!this.skillsScreen.classList.contains('hidden')) {
            this.toggleSkills(); // Close skills
        }

        const isHidden = this.inventoryScreen.classList.contains('hidden');
        if (isHidden) {
            this.inventoryScreen.classList.remove('hidden');
            this.renderAllInventory();
            this.game.isPaused = true;
        } else {
            this.inventoryScreen.classList.add('hidden');
            this.game.isPaused = false;
        }
    }

    toggleSkills() {
        if (!this.inventoryScreen.classList.contains('hidden')) {
            this.toggleInventory(); // Close inventory
        }

        const isHidden = this.skillsScreen.classList.contains('hidden');
        if (isHidden) {
            this.skillsScreen.classList.remove('hidden');
            this.game.isPaused = true;
        } else {
            this.skillsScreen.classList.add('hidden');
            this.game.isPaused = false;
        }
    }

    renderAllInventory() {
        this.renderGrid(this.inventoryGrid, this.game.world.player.inventory, 'backpack');
        // Equipment grid not fully implemented for DnD yet, but we pass source
        this.renderGrid(this.equipmentGrid, this.game.world.player.equipment, 'equipment');
        this.renderGrid(this.weaponsGrid, this.game.world.player.weapons, 'weapon');
    }

    renderGrid(gridElement, itemsArray, source) {
        gridElement.innerHTML = '';
        itemsArray.forEach((item, index) => {
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.dataset.index = index;
            slot.dataset.source = source;

            // Hover Tracking
            slot.addEventListener('mouseenter', () => {
                this.hoveredSlot = { source, index };
                slot.style.borderColor = '#fa0'; // Highlight
            });
            slot.addEventListener('mouseleave', () => {
                if (this.hoveredSlot && this.hoveredSlot.index === index && this.hoveredSlot.source === source) {
                    this.hoveredSlot = null;
                }
                slot.style.borderColor = '#444'; // Reset
            });

            // Drag & Drop
            slot.addEventListener('dragover', (e) => e.preventDefault()); // Allow Drop
            slot.addEventListener('drop', (e) => this.handleDrop(e, source, index));

            if (item) {
                const icon = document.createElement('div');
                // Use stats.name if avaliable, else try item.name, else '?'
                const name = item.stats ? item.stats.name : (item.name || '?');
                icon.textContent = name[0];
                icon.style.color = 'white';
                icon.style.fontSize = '24px';
                icon.style.lineHeight = '46px';
                icon.draggable = true;

                // Drag Start
                icon.addEventListener('dragstart', (e) => {
                    this.draggedSource = source;
                    this.draggedIndex = index;
                    // e.dataTransfer.effectAllowed = 'move'; // Optional
                });

                slot.appendChild(icon);
            }
            gridElement.appendChild(slot);
        });
    }

    handleDrop(e, targetSource, targetIndex) {
        e.preventDefault();
        const player = this.game.world.player;
        const sSource = this.draggedSource;
        const sIndex = this.draggedIndex;

        if (sSource === null || sIndex === -1) return;

        // Helper to get array ref
        const getArray = (src) => {
            if (src === 'backpack') return player.inventory;
            if (src === 'weapon') return player.weapons;
            if (src === 'equipment') return player.equipment;
            return null;
        };

        const sourceArray = getArray(sSource);
        const targetArray = getArray(targetSource);

        if (!sourceArray || !targetArray) return;

        // Swap Logic
        const sourceItem = sourceArray[sIndex];
        const targetItem = targetArray[targetIndex];

        // Basic swap
        sourceArray[sIndex] = targetItem;
        targetArray[targetIndex] = sourceItem;

        // Reset & Render
        this.draggedSource = null;
        this.draggedIndex = -1;
        this.renderAllInventory();

        // If weapon changed, might need to update HUD or current weapon
        this.updateWeaponHUD();
    }

    update() {
        if (!this.game.world.player) return;

        // Trash Interaction
        if (this.game.isPaused && !this.inventoryScreen.classList.contains('hidden')) {
            if (this.game.input.isPressed('KeyT') && this.hoveredSlot) {
                const { source, index } = this.hoveredSlot;
                const player = this.game.world.player;

                if (source === 'backpack') player.inventory[index] = null;
                if (source === 'weapon') player.weapons[index] = null;

                this.renderAllInventory();
                this.updateWeaponHUD();
            }
        }

        const p = this.game.world.player;

        // Update Hearts only on change
        if (p.hp !== this.lastHp) {
            this.lastHp = p.hp;
            this.heartsContainer.innerHTML = '';
            for (let i = 0; i < p.maxHp; i++) {
                const heart = document.createElement('div');
                heart.className = 'heart';
                if (i >= p.hp) {
                    heart.classList.add('empty');
                }
                this.heartsContainer.appendChild(heart);
            }
        }

        this.levelDisplay.textContent = this.game.level;
        this.scoreDisplay.textContent = this.game.score;
        this.moneyDisplay.textContent = 'Gold: ' + this.game.world.player.money;

        this.updateWeaponHUD();
    }

    updateWeaponHUD() {
        if (!this.weaponHudContainer) {
            this.weaponHudContainer = document.getElementById('weapon-hud');
        }
        if (!this.weaponHudContainer) return; // Safety

        this.weaponHudContainer.innerHTML = '';
        const player = this.game.world.player;
        if (!player) return;

        for (let i = 0; i < 3; i++) {
            const slot = document.createElement('div');
            slot.classList.add('slot');
            if (i === player.currentWeaponIndex) {
                slot.classList.add('selected');
            }

            // Item
            const item = player.weapons[i];
            if (item) {
                // Determine display based on item type
                // Simple text for now, or stats.color box
                const icon = document.createElement('div');
                icon.style.width = '30px';
                icon.style.height = '10px';
                icon.style.backgroundColor = item.stats ? item.stats.color : '#fff';
                icon.title = item.stats ? item.stats.name : 'Weapon';
                slot.appendChild(icon);
            } else {
                // Empty slot -> Visual placeholder or nothing
            }

            this.weaponHudContainer.appendChild(slot);
        }
    }

    showGameOver(score, highScore) {
        this.finalScore.innerHTML = `${score}<br>High Score: ${highScore}`;
        this.gameOverScreen.classList.remove('hidden');
    }

    hideGameOver() {
        this.gameOverScreen.classList.add('hidden');
    }
}
