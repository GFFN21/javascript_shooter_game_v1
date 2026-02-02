export default class SaveManager {
    static PREFIX = 'roguelike_save_slot_';
    static METADATA_KEY = 'roguelike_saves_metadata';

    /**
     * Get a list of all save slots with their metadata.
     */
    static listSlots() {
        const metadata = JSON.parse(localStorage.getItem(this.METADATA_KEY) || '{}');
        return metadata;
    }

    /**
     * Load a specific save slot.
     */
    static loadSlot(slotId) {
        const data = localStorage.getItem(this.PREFIX + slotId);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error(`Failed to parse save data for slot ${slotId}:`, e);
            return null;
        }
    }

    /**
     * Save data to a specific slot and update metadata.
     */
    static saveSlot(slotId, data) {
        // Save the main data
        localStorage.setItem(this.PREFIX + slotId, JSON.stringify(data));

        // Update metadata
        const metadata = this.listSlots();
        metadata[slotId] = {
            id: slotId,
            name: data.metadata?.name || `Run #${slotId.split('_')[1] || slotId}`,
            lastSaved: Date.now(),
            level: data.gameplay?.level || 1,
            score: data.gameplay?.score || 0
        };
        localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    }

    /**
     * Delete a specific save slot.
     */
    static deleteSlot(slotId) {
        localStorage.removeItem(this.PREFIX + slotId);

        const metadata = this.listSlots();
        delete metadata[slotId];
        localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    }

    /**
     * Migration helper: Check for old flat storage keys and convert to a slot if needed.
     */
    static checkLegacyMigration() {
        const legacyBank = localStorage.getItem('roguelike_bank');
        if (legacyBank !== null) {
            // We have legacy data
            const stats = JSON.parse(localStorage.getItem('roguelike_stats') || '[]');
            const skills = JSON.parse(localStorage.getItem('roguelike_skills') || '[]');
            const highScore = localStorage.getItem('roguelike_highscore') || 0;

            const legacyData = {
                metadata: { name: "Legacy Save", lastSaved: Date.now() },
                gameplay: {
                    bank: parseInt(legacyBank),
                    unlockedStats: stats,
                    unlockedSkills: skills,
                    highScore: parseInt(highScore),
                    level: 1,
                    score: 0
                }
            };

            // Save to slot 1 and clear legacy keys
            this.saveSlot('1', legacyData);

            // Clean up legacy keys
            localStorage.removeItem('roguelike_bank');
            localStorage.removeItem('roguelike_stats');
            localStorage.removeItem('roguelike_skills');
            // We keep highscore for now as it might be global? 
            // In multi-slot, we probably want per-slot highscores + a global best.
            // For now, move it into the slot.
        }
    }
}
