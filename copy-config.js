const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'config');
const destDir = path.join(__dirname, 'dist', 'config');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

fs.readdirSync(srcDir).forEach(file => {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
});

console.log('Config files copied successfully.');
