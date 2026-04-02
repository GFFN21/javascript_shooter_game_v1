// Platform — pure read/write module.
// The platform is set explicitly by the user via PlatformSelectState.
// This module just reads/writes the chosen value from localStorage.
export const Platform = {
    isMobile: false,
    STORAGE_KEY: 'pwa_platform',

    // Returns true if a saved preference exists in localStorage.
    hasSavedPreference() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    },

    // Called by PlatformSelectState when the user makes a choice.
    setMobile(isMobile) {
        this.isMobile = isMobile;
        const value = isMobile ? 'mobile' : 'desktop';
        localStorage.setItem(this.STORAGE_KEY, value);
        if (isMobile) {
            document.body.classList.add('mobile');
        } else {
            document.body.classList.remove('mobile');
        }
        console.log(`[Platform] Set to: ${value.toUpperCase()} (saved)`);
    },

    // Called once at startup to restore any saved preference.
    // Returns true if a preference was found and applied.
    restore() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (!saved) return false;
        this.isMobile = (saved === 'mobile');
        if (this.isMobile) document.body.classList.add('mobile');
        console.log(`[Platform] Restored saved preference: ${saved}`);
        return true;
    },

    // Clears the preference (for testing or reset flows).
    reset() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.isMobile = false;
        document.body.classList.remove('mobile');
        console.log('[Platform] Preference cleared.');
    }
};
