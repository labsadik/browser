// installer/package-win.js
const packager = require('electron-packager');
const path = require('path');

(async () => {
  try {
    const opts = {
      dir: path.resolve(__dirname, '..'),
      out: path.resolve(__dirname, '..', 'dist'),
      name: 'PolishedBrowser',
      platform: 'win32',
      arch: 'x64',
      overwrite: true,
      asar: true,
      icon: path.resolve(__dirname, '..', 'icons', 'app.ico'),
      prune: true
    };
    const appPaths = await packager(opts);
    console.log('Packaged apps:', appPaths);
  } catch (err) {
    console.error('Packaging failed', err);
  }
})();
