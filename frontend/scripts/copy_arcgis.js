// Copy arcgis assets to the static folder.

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs-extra');
const path = require('path');
const srcDir = path.resolve(__dirname, '../node_modules/@arcgis/core/assets');
const dstDir = path.resolve(__dirname, '../static/assets');

console.log('## Install arcgis');
// Creates or empties the destination folder.
console.log('  - Empty dest folder');
fs.rmdirSync(dstDir, { recursive: true });
console.log('  - Copy files');
fs.copySync(srcDir, dstDir);
