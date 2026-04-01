// Platform detection — runs once at startup, never changes.
export const Platform = {
    isMobile: false,

    detect() {
        // 1. User Agent (covers most standard browsers)
        const ua = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // 2. Small viewport fallback
        const small = window.innerWidth < 800;

        // 3. iOS Standalone (PWA installed via Safari "Add to Home Screen")
        const standalone = !!navigator.standalone;

        // 4. Coarse pointer = touch device (most reliable, works even in PWA standalone mode)
        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

        this.isMobile = ua || small || standalone || coarsePointer;

        if (this.isMobile) {
            document.body.classList.add('mobile');
        }

        console.log(`[Platform] Detected: ${this.isMobile ? 'MOBILE' : 'PC'} (ua=${ua}, width=${window.innerWidth}, standalone=${standalone}, coarsePointer=${coarsePointer})`);
        return this.isMobile;
    }
};
