const fs = require('fs');

// Simple static check of how UIManager reads weapons array
const UIManagerRaw = fs.readFileSync('src/ui/UIManager.js', 'utf8');
const linesArr = UIManagerRaw.split('\n');

for (let i = 0; i < linesArr.length; i++) {
    if (linesArr[i].includes('player.weapons')) {
        console.log(`Line ${i}: ${linesArr[i]}`);
    }
}
