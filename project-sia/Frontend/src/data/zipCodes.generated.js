// Generated ZIP codes module
// Generated: 2025-10-18T18:45:50.354Z

export const zipCodes = {
  "Taytay": "1920",
  "Manila": "1000",
  "Quezon City": "1100",
  "Antipolo": "1870",
  "Caloocan": "1400"
};

export const getZipCode = (cityName) => {
  return zipCodes[cityName] || '';
};

export const searchZipCode = (cityName) => {
  const normalizedSearch = cityName.toLowerCase().trim();
  const entry = Object.entries(zipCodes).find(([city]) => city.toLowerCase() === normalizedSearch);
  return entry ? entry[1] : '';
};

export default zipCodes;
