import { CONFIG } from '../Config.js';
import SaveManager from '../utils/SaveManager.js';
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
        this.skillsScreen = document.getElementById('skills-screen');
        this.abilitiesScreen = document.getElementById('abilities-screen');
        this.saveScreen = document.getElementById('save-screen'); // New
        this.saveSlotsContainer = document.getElementById('save-slots-container'); // New
        this.inventoryGrid = document.getElementById('inventory-grid');
        this.equipmentGrid = document.getElementById('equipment-grid');
        this.weaponsGrid = document.getElementById('weapons-grid');

        // Inventory Click Handlers (Keep for click-to-equip/unequip if desired, or replace with DnD?)
        // Let's keep clicks as fallback or complementary.
        this.inventoryGrid.addEventListener('click', (e) => this.handleInventoryClick(e, 'backpack'));
        this.weaponsGrid.addEventListener('click', (e) => this.handleInventoryClick(e, 'weapon'));

        this.restartBtn = document.getElementById('restart-btn');

        const triggerRestart = (e) => {
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
            console.log('Restart button triggered via', e.type);
            this.game.restart();
        };

        this.restartBtn.addEventListener('click', triggerRestart);
        this.restartBtn.addEventListener('touchstart', triggerRestart, { passive: false });

        // Exit Button
        // Exit Button & Confirmation
        this.exitBtn = document.getElementById('exit-btn');
        this.exitConfirmModal = document.getElementById('exit-confirm-modal');
        this.confirmExitBtn = document.getElementById('confirm-exit-btn');
        this.cancelExitBtn = document.getElementById('cancel-exit-btn');

        this.exitBtn.addEventListener('click', () => {
            this.exitConfirmModal.classList.remove('hidden');
        });

        this.confirmExitBtn.addEventListener('click', () => {
            this.exitConfirmModal.classList.add('hidden');
            this.game.saveProgress();
            this.game.stateMachine.transition('SAVE_SELECT');
        });

        this.cancelExitBtn.addEventListener('click', () => {
            this.exitConfirmModal.classList.add('hidden');
        });

        this.lastHp = -1;

        // Drag & Drop State
        this.draggedSource = null; // 'backpack' or 'weapon'
        this.draggedIndex = -1;
        this.hoveredSlot = null; // { source: '...', index: ... }
    }

    showSaveSelection() {
        this.saveScreen.classList.remove('hidden');
        this.renderSaveSlots();
        this.game.isPaused = true;
    }

    hideSaveSelection() {
        this.saveScreen.classList.add('hidden');
        this.game.isPaused = false;
    }

    renderSaveSlots() {
        // Note: We need SaveManager here. Since this is an ESM project, 
        // we should probably import it at the top.
        // I'll add the import at the top in a separate chunk.

        const slots = [1, 2, 3]; // Support 3 slots
        const metadata = SaveManager.listSlots();

        this.saveSlotsContainer.innerHTML = '';

        slots.forEach(slotId => {
            const id = slotId.toString();
            const slotData = metadata[id];

            const slotEl = document.createElement('div');
            slotEl.className = `save-slot ${!slotData ? 'empty' : ''}`;

            if (slotData) {
                slotEl.innerHTML = `
                    <div class="save-slot-info">
                        <h3>${slotData.name}</h3>
                        <p>Level ${slotData.level} | Score: ${slotData.score}</p>
                        <p>Last Saved: ${new Date(slotData.lastSaved).toLocaleString()}</p>
                    </div>
                `;

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-slot-btn';
                deleteBtn.textContent = 'DELETE';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${slotData.name}?`)) {
                        SaveManager.deleteSlot(id);
                        this.renderSaveSlots();
                    }
                };
                slotEl.appendChild(deleteBtn);
            } else {
                slotEl.innerHTML = `<h3>EMPTY SLOT</h3><p>Click to start new run</p>`;
            }

            slotEl.onclick = () => {
                this.game.loadGame(id);
            };

            this.saveSlotsContainer.appendChild(slotEl);
        });
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
            this.toggleStats(); // Close stats
        }
        if (!this.abilitiesScreen.classList.contains('hidden')) {
            this.toggleAbilities(); // Close abilities
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

    toggleStats() {
        if (!this.inventoryScreen.classList.contains('hidden')) {
            this.toggleInventory(); // Close inventory
        }
        if (!this.abilitiesScreen.classList.contains('hidden')) {
            this.toggleAbilities(); // Close abilities
        }

        const isHidden = this.skillsScreen.classList.contains('hidden');
        if (isHidden) {
            this.skillsScreen.classList.remove('hidden');
            this.renderStats(); // Render List
            this.game.isPaused = true;
        } else {
            this.skillsScreen.classList.add('hidden');
            this.game.isPaused = false;
        }
    }

    toggleAbilities() {
        if (!this.inventoryScreen.classList.contains('hidden')) {
            this.toggleInventory(); // Close inventory
        }
        if (!this.skillsScreen.classList.contains('hidden')) {
            this.toggleStats(); // Close stats
        }

        const isHidden = this.abilitiesScreen.classList.contains('hidden');
        if (isHidden) {
            this.abilitiesScreen.classList.remove('hidden');
            this.renderAbilities(); // Render List
            this.game.isPaused = true;
        } else {
            this.abilitiesScreen.classList.add('hidden');
            this.game.isPaused = false;
        }
    }

    renderStats() {
        const list = document.getElementById('skills-list');
        if (!list) return;

        list.innerHTML = '';

        // Bank Display (spans all columns)
        const bankDisplay = document.createElement('div');
        bankDisplay.style.gridColumn = '1 / -1';
        bankDisplay.style.color = '#FFD700';
        bankDisplay.style.marginBottom = '10px';
        bankDisplay.style.fontSize = '20px';
        bankDisplay.style.textAlign = 'center';
        bankDisplay.textContent = `Bank: ${this.game.bank} G`;
        list.appendChild(bankDisplay);

        // Group stats by category
        const categories = {
            attack: [],
            health: [],
            mobility: []
        };

        Object.values(CONFIG.STAT_UPGRADES).forEach(stat => {
            if (categories[stat.category]) {
                categories[stat.category].push(stat);
            }
        });

        // Create columns for each category
        const categoryNames = {
            attack: 'Attack',
            health: 'Health',
            mobility: 'Mobility'
        };

        ['attack', 'health', 'mobility'].forEach(categoryKey => {
            const column = document.createElement('div');
            column.className = 'stat-category';

            // Category header
            const header = document.createElement('h3');
            header.textContent = categoryNames[categoryKey];
            column.appendChild(header);

            // Stats in this category
            categories[categoryKey].forEach(stat => {
                const isUnlocked = this.game.unlockedStats.has(stat.id);
                const canAfford = this.game.bank >= stat.cost;

                const item = document.createElement('div');
                item.className = `skill-item ${isUnlocked ? 'unlocked' : ''}`;

                // Info Section
                const info = document.createElement('div');
                info.className = 'skill-info';

                const name = document.createElement('div');
                name.className = 'skill-name';
                name.textContent = stat.name;

                const desc = document.createElement('div');
                desc.className = 'skill-desc';
                desc.textContent = stat.description;

                info.appendChild(name);
                info.appendChild(desc);

                // Action Section
                const action = document.createElement('div');
                action.className = 'skill-action';

                if (!isUnlocked) {
                    const cost = document.createElement('div');
                    cost.className = 'skill-cost';
                    cost.textContent = `${stat.cost} G`;
                    action.appendChild(cost);
                }

                const btn = document.createElement('button');
                btn.className = 'buy-btn';

                if (isUnlocked) {
                    btn.textContent = 'Owned';
                    btn.disabled = true;
                } else {
                    btn.textContent = 'Buy';
                    btn.disabled = !canAfford;
                    if (canAfford) {
                        btn.onclick = () => this.handleStatBuy(stat);
                    }
                }

                action.appendChild(btn);
                item.appendChild(info);
                item.appendChild(action);

                column.appendChild(item);
            });

            list.appendChild(column);
        });
    }

    renderAbilities() {
        const list = document.getElementById('abilities-list');
        if (!list) return;

        list.innerHTML = '';

        // Bank Display
        const bankDisplay = document.createElement('div');
        bankDisplay.style.color = '#FFD700';
        bankDisplay.style.marginBottom = '10px';
        bankDisplay.style.fontSize = '20px';
        bankDisplay.style.textAlign = 'center';
        bankDisplay.textContent = `Bank: ${this.game.bank} G`;
        list.appendChild(bankDisplay);

        Object.values(CONFIG.SKILLS).forEach(skill => {
            const isUnlocked = this.game.unlockedSkills.has(skill.id);
            const canAfford = this.game.bank >= skill.cost;

            const item = document.createElement('div');
            item.className = `skill-item ${isUnlocked ? 'unlocked' : ''}`;

            // Info Section
            const info = document.createElement('div');
            info.className = 'skill-info';

            const name = document.createElement('div');
            name.className = 'skill-name';
            name.textContent = skill.name;

            const desc = document.createElement('div');
            desc.className = 'skill-desc';
            desc.textContent = skill.description;

            info.appendChild(name);
            info.appendChild(desc);

            // Action Section
            const action = document.createElement('div');
            action.className = 'skill-action';

            if (!isUnlocked) {
                const cost = document.createElement('div');
                cost.className = 'skill-cost';
                cost.textContent = `${skill.cost} G`;
                action.appendChild(cost);
            }

            const btn = document.createElement('button');
            btn.className = 'buy-btn';

            if (isUnlocked) {
                btn.textContent = 'Owned';
                btn.disabled = true;
            } else {
                btn.textContent = 'Buy';
                btn.disabled = !canAfford;
                if (canAfford) {
                    btn.onclick = () => this.handleSkillBuy(skill);
                }
            }

            action.appendChild(btn);
            item.appendChild(info);
            item.appendChild(action);

            list.appendChild(item);
        });
    }

    handleSkillBuy(skill) {
        if (this.game.bank >= skill.cost) {
            this.game.bank -= skill.cost;
            this.game.unlockedSkills.add(skill.id);
            this.game.saveProgress();

            this.renderAbilities(); // Refresh UI
        }
    }

    handleStatBuy(stat) {
        if (this.game.bank >= stat.cost) {
            this.game.bank -= stat.cost;
            this.game.unlockedStats.add(stat.id);
            this.game.saveProgress();

            // Apply immediately to Player
            if (this.game.world.player) {
                this.game.world.player.applySkills();
            }

            this.renderStats(); // Refresh UI

            // Optional: Play unlock sound?
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

        // Update Hearts on HP or MaxHP change
        if (p.hp !== this.lastHp || p.maxHp !== this.lastMaxHp) {
            this.lastHp = p.hp;
            this.lastMaxHp = p.maxHp;

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
        // Show Bank Gold as it's the spending currency
        this.moneyDisplay.textContent = 'Gold: ' + this.game.bank;

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

        console.log('DEBUG: updateWeaponHUD', player.weapons.length, player.weapons);

        const maxSlots = player.weapons.length; // Should be 2 now
        for (let i = 0; i < maxSlots; i++) {
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

    hideAllMenus() {
        this.inventoryScreen.classList.add('hidden');
        this.skillsScreen.classList.add('hidden');
        this.abilitiesScreen.classList.add('hidden');
        this.exitConfirmModal.classList.add('hidden');
    }
}
