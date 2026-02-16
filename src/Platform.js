// Platform detection — runs once at startup, never changes.
export const Platform = {
    isMobile: false,

    detect() {
        const ua = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const small = window.innerWidth < 800;
        this.isMobile = ua || small;

        if (this.isMobile) {
            document.body.classList.add('mobile');
        }

        console.log(`[Platform] Detected: ${this.isMobile ? 'MOBILE' : 'PC'} (ua=${ua}, width=${window.innerWidth})`);
        return this.isMobile;
    }
};
