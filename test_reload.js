const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    await page.goto('http://localhost:8000', {waitUntil: 'networkidle2'});

    // Wait until PLAYING state
    await page.waitForFunction('window.game && window.game.stateMachine.currentState.name === "PLAYING"');

    // Give the player a weapon manually
    await page.evaluate(() => {
        const item = new window.game.world.entities.find(e => e.type !== undefined); // just hack something, wait no the classes are obfuscated by ES modules
        // we can dispatch an event or just do it via window.game
        const WeaponItem = window.WeaponItemClass; // wait, not exported
    });

    console.log("Done");
    await browser.close();
})();
