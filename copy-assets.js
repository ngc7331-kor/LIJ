import fs from 'fs';
import path from 'path';

const publicLogo = path.resolve('public/logo.png');
const assetsDir = path.resolve('assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

fs.copyFileSync(publicLogo, path.join(assetsDir, 'icon.png'));
fs.copyFileSync(publicLogo, path.join(assetsDir, 'splash.png'));
fs.copyFileSync(publicLogo, path.join(assetsDir, 'splash-dark.png'));
fs.copyFileSync(publicLogo, path.join(assetsDir, 'icon-only.png'));
fs.copyFileSync(publicLogo, path.join(assetsDir, 'icon-foreground.png'));
fs.copyFileSync(publicLogo, path.join(assetsDir, 'icon-background.png'));

console.log('Assets copied successfully.');
