/*
Generate city->ZIP mapping from node_modules/zipcodes-ph/build/zipcodes.json
Usage:
  node generate_zip_from_pkg.js <outPath>

This script will read the package JSON and invert mappings so that each city name maps to its ZIP code.
*/

import fs from 'fs';
import path from 'path';

const pkgPath = path.resolve('node_modules/zipcodes-ph/build/zipcodes.json');

function loadPackage() {
  if (!fs.existsSync(pkgPath)) throw new Error('zipcodes.json not found in installed package');
  const raw = fs.readFileSync(pkgPath, 'utf8');
  return JSON.parse(raw);
}

function buildMapping(pkgObj) {
  const mapping = {};
  Object.entries(pkgObj).forEach(([zip, names]) => {
    if (Array.isArray(names)) {
      names.forEach(name => {
        // normalize name by trimming
        const cleaned = name.replace(/\(.*\)/g, '').trim();
        if (cleaned) mapping[cleaned] = zip;
      });
    } else if (typeof names === 'string') {
      const cleaned = names.replace(/\(.*\)/g, '').trim();
      if (cleaned) mapping[cleaned] = zip;
    }
  });
  return mapping;
}

function emit(outPath, mapping) {
  const header = `// Generated from zipcodes-ph package\n// Generated: ${new Date().toISOString()}\n\n`;
  const body = `export const zipCodes = ${JSON.stringify(mapping, null, 2)};\n\nexport const getZipCode = (cityName) => {\n  return zipCodes[cityName] || '';\n};\n\nexport const searchZipCode = (cityName) => {\n  const normalizedSearch = cityName.toLowerCase().trim();\n  const entry = Object.entries(zipCodes).find(([city]) => city.toLowerCase() === normalizedSearch);\n  return entry ? entry[1] : '';\n};\n\nexport default zipCodes;\n`;
  fs.writeFileSync(outPath, header + body, 'utf8');
}

(async () => {
  try {
    const args = process.argv.slice(2);
    if (args.length < 1) {
      console.error('Usage: node generate_zip_from_pkg.js <outPath>');
      process.exit(2);
    }
    const outPath = args[0];
    const pkg = loadPackage();
    const mapping = buildMapping(pkg);
    emit(outPath, mapping);
    console.log('Generated', outPath, 'with', Object.keys(mapping).length, 'entries');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
