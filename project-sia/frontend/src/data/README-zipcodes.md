ZIP Codes generation helper

This folder contains a sample CSV and a simple script to convert a full ZIP code dataset into a JS module used by the app.

How to use

1. Get a CSV of city/municipality -> ZIP code. Required header: `city,zip` (or `zipcode`/`zip_code`).
2. Put the CSV in the repo, for example `frontend/src/data/zip_codes_full.csv`.
3. Run the generator script from the `frontend` folder:

```bash
node ./scripts/import_zipcodes.js ./src/data/zip_codes_full.csv ./src/data/zipCodes.generated.js
```

4. You can then replace `src/data/zipCodes.js` with `zipCodes.generated.js` or import the generated file directly.

Notes
- The script is intentionally minimal. It expects CSV to be UTF-8 and comma-separated.
- The generated file exports `zipCodes`, `getZipCode`, `searchZipCode` and default export.
- If you need to support multiple spellings, preprocess the CSV to include aliases.
