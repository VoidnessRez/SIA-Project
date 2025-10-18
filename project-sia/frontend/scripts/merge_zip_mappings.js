/*
Merge manual zipCodes.js with generated mapping from package.
Priority: manual `src/data/zipCodes.js` overrides package-generated `src/data/zipCodes.frompkg.generated.js`.
Usage:
  node merge_zip_mappings.js
Output:
  src/data/zipCodes.merged.js
*/

import fs from 'fs';
import path from 'path';

const manualPath = path.resolve('src/data/zipCodes.js');
const pkgPath = path.resolve('src/data/zipCodes.frompkg.generated.js');
const outPath = path.resolve('src/data/zipCodes.merged.js');

async function loadModule(filePath) {
  // dynamic import requires file:// urls
  const full = path.resolve(filePath);
  if (!fs.existsSync(full)) return {};
  const module = await import('file://' + full);
  return module.zipCodes || module.default || {};
}

(async () => {
  try {
    const manual = await loadModule(manualPath);
    const pkg = await loadModule(pkgPath);
    // Merge: start with pkg, then overwrite with manual
    const merged = { ...pkg, ...manual };
    const header = `// Merged ZIP codes (package + manual overrides)\n// Generated: ${new Date().toISOString()}\n\n`;
    const body = `export const zipCodes = ${JSON.stringify(merged, null, 2)};\n\nexport const getZipCode = (cityName) => {\n  return zipCodes[cityName] || '';\n};\n\nexport const searchZipCode = (cityName) => {\n  const normalizedSearch = cityName.toLowerCase().trim();\n  const entry = Object.entries(zipCodes).find(([city]) => city.toLowerCase() === normalizedSearch);\n  return entry ? entry[1] : '';\n};\n\nexport default zipCodes;\n`;
    fs.writeFileSync(outPath, header + body, 'utf8');
    console.log('Merged', Object.keys(merged).length, 'entries into', outPath);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
