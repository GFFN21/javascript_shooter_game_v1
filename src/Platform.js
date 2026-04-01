// Platform detection — runs once at startup, never changes.
// The result is persisted in localStorage so the input method
// is locked to whatever device first launched the app.
export const Platform = {
    isMobile: false,
    STORAGE_KEY: 'pwa_platform',

    detect() {
        // --- Allow forced reset via URL param (e.g. ?reset_platform) ---
        if (new URLSearchParams(window.location.search).has('reset_platform')) {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('[Platform] Preference cleared via URL param. Re-detecting...');
        }

        // --- Check for a saved preference from a previous launch ---
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            this.isMobile = (saved === 'mobile');
            if (this.isMobile) document.body.classList.add('mobile');
            console.log(`[Platform] Loaded saved preference: ${saved}`);
            return this.isMobile;
        }

        // --- First launch: run full detection and save the result ---
        // 1. User Agent
        const ua = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        // 2. Small viewport fallback
        const small = window.innerWidth < 800;
        // 3. iOS PWA standalone mode
        const standalone = !!navigator.standalone;
        // 4. Coarse pointer = touch device (most reliable across all contexts)
        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

        this.isMobile = ua || small || standalone || coarsePointer;

        // Persist the result — this is the definitive "installation-time" lock
        const platformString = this.isMobile ? 'mobile' : 'desktop';
        localStorage.setItem(this.STORAGE_KEY, platformString);

        if (this.isMobile) {
            document.body.classList.add('mobile');
        }

        console.log(`[Platform] First launch detected: ${platformString.toUpperCase()} (ua=${ua}, small=${small}, standalone=${standalone}, coarsePointer=${coarsePointer}). Saved to localStorage.`);
        return this.isMobile;
    },

    // Expose a helper to manually reset (can be called from the browser console)
    reset() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('[Platform] Preference reset. Reload the page to re-detect.');
    }
};
