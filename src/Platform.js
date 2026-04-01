// Platform detection — runs once at startup, never changes.
//
// WHY NOT localStorage:
//   On iOS, the standalone PWA context has a SEPARATE storage partition
//   from the browser. A value saved in Safari is invisible to the installed
//   home-screen app. We therefore rely on robust runtime detection instead.
//
// Detection priority (highest to lowest reliability):
//   1. (pointer: coarse)  — hardware touch screen query, never spoofed
//   2. navigator.standalone — iOS reports true when launched from home screen
//   3. display-mode: standalone — Android Chrome PWA standalone check
//   4. User Agent          — standard mobile browser string
//   5. viewport width      — last-resort fallback
export const Platform = {
    isMobile: false,

    detect() {
        // 1. Coarse pointer = physical touch screen (most reliable in ALL contexts)
        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

        // 2. iOS home-screen standalone mode
        const iosStandalone = !!navigator.standalone;

        // 3. Android/Chrome PWA display-mode: standalone
        const androidStandalone = window.matchMedia('(display-mode: standalone)').matches;

        // 4. User Agent string
        const ua = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // 5. Small viewport last-resort fallback
        const small = window.innerWidth < 800;

        this.isMobile = coarsePointer || iosStandalone || androidStandalone || ua || small;

        if (this.isMobile) {
            document.body.classList.add('mobile');
        }

        console.log(
            `[Platform] Detected: ${this.isMobile ? 'MOBILE ✓' : 'DESKTOP ✓'} ` +
            `(coarse=${coarsePointer}, iosStandalone=${iosStandalone}, ` +
            `androidStandalone=${androidStandalone}, ua=${ua}, small=${small})`
        );
        return this.isMobile;
    }
};
