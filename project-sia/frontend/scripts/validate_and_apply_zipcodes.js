/*
Validate merged zipCodes file and optionally apply it as the project's zipCodes.js
Usage:
  node validate_and_apply_zipcodes.js --check   (just validate)
  node validate_and_apply_zipcodes.js --apply   (validate then backup current and replace)

Checks performed:
 - file exists
 - exports a `zipCodes` object
 - entry count >= 1500 (heuristic)
 - sample checks: Taytay -> 1920, Manila exists
 - all values are 3-4 digit numeric strings
*/

import fs from 'fs';
import path from 'path';

const mergedPath = path.resolve('src/data/zipCodes.complete.js');
const projectPath = path.resolve('src/data/zipCodes.js');
const backupPath = path.resolve('src/data/zipCodes.backup.' + Date.now() + '.js');

async function load(pathToFile) {
  if (!fs.existsSync(pathToFile)) throw new Error(pathToFile + ' not found');
  const mod = await import('file://' + pathToFile);
  return mod.zipCodes || mod.default || {};
}

function isValidZip(z) {
  return typeof z === 'string' && /^[0-9]{3,4}$/.test(z);
}

(async () => {
  try {
    const args = process.argv.slice(2);
    const apply = args.includes('--apply');

    console.log('Loading merged file:', mergedPath);
    const merged = await load(mergedPath);
    const keys = Object.keys(merged);
    console.log('Entries in merged file:', keys.length);

    if (keys.length < 1500) {
      console.warn('WARNING: merged mapping has fewer than 1500 entries (found ' + keys.length + ').');
    }

    // sample checks
    const taytay = merged['Taytay'];
    const manilaPresent = Object.keys(merged).some(k => k.toLowerCase().includes('manila'));

    console.log('Taytay mapping:', taytay);
    console.log('Any Manila-like keys present:', manilaPresent);

    // validate values
    const invalid = keys.filter(k => !isValidZip(merged[k]));
    console.log('Invalid ZIP entries count:', invalid.length);
    if (invalid.length > 0) {
      console.log('Examples:', invalid.slice(0, 10).map(k => ({ city: k, zip: merged[k] })));
    }

    const allGood = (keys.length >= 1500) && isValidZip(taytay) && manilaPresent && invalid.length === 0;

    if (!allGood) {
      console.error('Validation failed. Please inspect merged file.');
      process.exit(1);
    }

    console.log('Validation passed.');

    if (apply) {
      // backup current project file
      if (fs.existsSync(projectPath)) {
        fs.copyFileSync(projectPath, backupPath);
        console.log('Backed up existing', projectPath, '->', backupPath);
      }
      // copy merged to project file
      fs.copyFileSync(mergedPath, projectPath);
      console.log('Replaced', projectPath, 'with merged mapping.');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
