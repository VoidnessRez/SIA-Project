/*
Simple CSV -> JS module converter for Philippine ZIP codes (ES module version).
Usage:
  node import_zipcodes.js path/to/zip_codes.csv output/path/zipCodes.generated.js

CSV format expected (header):
city,zip
Taytay,1920
Manila,1000

This script will read the CSV and emit a JS module that exports an object of city->zip and helper functions.
*/

import fs from 'fs';
import readline from 'readline';

async function parseCSV(filePath) {
  const stream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const rows = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    rows.push(line);
  }
  // assume first line header
  const header = rows.shift().split(',').map(h => h.trim().toLowerCase());
  const cityIdx = header.indexOf('city');
  const zipIdx = header.indexOf('zip') !== -1 ? header.indexOf('zip') : header.indexOf('zipcode') || header.indexOf('zip_code');
  if (cityIdx === -1 || zipIdx === -1) throw new Error('CSV header must include city and zip (or zipcode/zip_code)');

  const result = {};
  rows.forEach(line => {
    const cols = line.split(',');
    const city = cols[cityIdx].trim();
    const zip = cols[zipIdx].trim();
    if (city) result[city] = zip;
  });
  return result;
}

function emitJS(obj, outPath) {
  const header = `// Generated ZIP codes module\n// Generated: ${new Date().toISOString()}\n\n`;
  const body = `export const zipCodes = ${JSON.stringify(obj, null, 2)};\n\nexport const getZipCode = (cityName) => {\n  return zipCodes[cityName] || '';\n};\n\nexport const searchZipCode = (cityName) => {\n  const normalizedSearch = cityName.toLowerCase().trim();\n  const entry = Object.entries(zipCodes).find(([city]) => city.toLowerCase() === normalizedSearch);\n  return entry ? entry[1] : '';\n};\n\nexport default zipCodes;\n`;
  fs.writeFileSync(outPath, header + body, 'utf8');
}

(async () => {
  try {
    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.error('Usage: node import_zipcodes.js <csvPath> <outJsPath>');
      process.exit(2);
    }
    const [csvPath, outJsPath] = args;
    const data = await parseCSV(csvPath);
    emitJS(data, outJsPath);
    console.log('Generated', outJsPath);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
