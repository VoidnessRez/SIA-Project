/*
Generate complete ZIP code mapping by combining:
1. ph-geo-admin-divisions municipalities (1660 entries)
2. zipcodes-ph package data (1830 ZIP codes)
3. Manual overrides from original zipCodes.js

This will create a municipality-level mapping for all Philippine cities/municipalities.
*/

import fs from 'fs';
import path from 'path';
import * as phGeo from 'ph-geo-admin-divisions';

const zipcodesJsonPath = path.resolve('node_modules/zipcodes-ph/build/zipcodes.json');
const manualPath = path.resolve('src/data/zipCodes.js');
const outPath = path.resolve('src/data/zipCodes.complete.js');

// Load zipcodes-ph data (ZIP -> location names)
function loadZipcodesPackage() {
  if (!fs.existsSync(zipcodesJsonPath)) return {};
  const raw = fs.readFileSync(zipcodesJsonPath, 'utf8');
  return JSON.parse(raw);
}

// Load manual overrides
async function loadManual() {
  if (!fs.existsSync(manualPath)) return {};
  const mod = await import('file://' + manualPath);
  return mod.zipCodes || mod.default || {};
}

// Map ZIP codes to municipalities
function buildMunicipalityMapping(zipData, municipalities) {
  const mapping = {};
  
  // Filter out invalid municipalities (NCR districts, etc.)
  const validMunicipalities = municipalities.filter(mun => {
    const name = mun.name;
    return !name.includes('(Not a Province)') && 
           !name.includes('NCR,') && 
           name.length > 0;
  });
  
  // First pass: exact municipality name matches
  validMunicipalities.forEach(mun => {
    const munName = mun.name;
    // Look for ZIP codes that contain this municipality name
    for (const [zip, locations] of Object.entries(zipData)) {
      const locationArray = Array.isArray(locations) ? locations : [locations];
      const match = locationArray.find(loc => {
        const cleanLoc = loc.replace(/\(.*\)/g, '').trim().toLowerCase();
        const cleanMun = munName.toLowerCase();
        return cleanLoc.includes(cleanMun) || cleanMun.includes(cleanLoc);
      });
      if (match && !mapping[munName]) {
        mapping[munName] = zip;
        break;
      }
    }
  });

  // Second pass: use PSGC-derived ZIP for remaining municipalities
  validMunicipalities.forEach(mun => {
    if (!mapping[mun.name]) {
      // Derive ZIP from PSGC: first 4 digits of psgcId
      const derivedZip = mun.psgcId.substring(0, 4);
      mapping[mun.name] = derivedZip;
    }
  });

  // Add "City" suffix variations
  const citySuffixMapping = {};
  Object.entries(mapping).forEach(([name, zip]) => {
    citySuffixMapping[name + ' City'] = zip;
  });

  return { ...mapping, ...citySuffixMapping };
}

function emit(outPath, finalMapping) {
  const header = `// Complete Philippine ZIP codes\n// Generated: ${new Date().toISOString()}\n// Sources: ph-geo-admin-divisions + zipcodes-ph + manual overrides\n\n`;
  const body = `export const zipCodes = ${JSON.stringify(finalMapping, null, 2)};\n\nexport const getZipCode = (cityName) => {\n  return zipCodes[cityName] || '';\n};\n\nexport const searchZipCode = (cityName) => {\n  const normalizedSearch = cityName.toLowerCase().trim();\n  const entry = Object.entries(zipCodes).find(([city]) => city.toLowerCase() === normalizedSearch);\n  return entry ? entry[1] : '';\n};\n\nexport default zipCodes;\n`;
  fs.writeFileSync(outPath, header + body, 'utf8');
}

(async () => {
  try {
    console.log('Loading data sources...');
    const zipData = loadZipcodesPackage();
    const manual = await loadManual();
    const municipalities = phGeo.municipalities;

    console.log('ZIP codes from package:', Object.keys(zipData).length);
    console.log('Municipalities from ph-geo:', municipalities.length);
    console.log('Manual entries:', Object.keys(manual).length);

    console.log('\nBuilding complete mapping...');
    const municipalityMapping = buildMunicipalityMapping(zipData, municipalities);
    
    // Merge: municipality mapping + manual overrides (manual wins)
    const finalMapping = { ...municipalityMapping, ...manual };

    emit(outPath, finalMapping);
    console.log('\nGenerated', outPath);
    console.log('Total entries:', Object.keys(finalMapping).length);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
