import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the CSV file
const CSV_FILE = path.join(__dirname, 'tolls-with-metadata.csv');
// Path to output JSON file
const OUTPUT_FILE = path.join(__dirname, '..', 'tollplazas_india.json');

// Read the CSV file
const csvData = fs.readFileSync(CSV_FILE, 'utf8');

// Parse the CSV data
function parseCSV(csvText) {
  // Split by lines
  const lines = csvText.split('\n').filter(line => line.trim());
  
  // Extract data rows
  const dataRows = [];
  
  for (let i = 0; i < lines.length; i++) {
    try {
      // This is a simple CSV parser that handles quoted fields
      // It's not perfect but should work for this specific file
      const row = [];
      let inQuote = false;
      let currentField = '';
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          row.push(currentField);
          currentField = '';
        } else {
          currentField += char;
        }
      }
      
      // Add the last field
      row.push(currentField);
      
      // Skip header row or empty rows
      if (row.length > 1) {
        dataRows.push(row);
      }
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error);
    }
  }
  
  return dataRows;
}

// Convert to our application's JSON format
function convertToAppFormat(dataRows) {
  const tollPlazas = [];
  let idCounter = 1;
  
  for (const row of dataRows) {
    try {
      // Extract name, lat, lng from the row
      const name = row[0];
      const lat = parseFloat(row[2]);
      const lng = parseFloat(row[3]);
      
      // Extract price from rates JSON
      let price = 60; // Default price
      try {
        const ratesStr = row[7];
        if (ratesStr) {
          // Find the car_multi rate in the JSON string
          const ratesMatch = ratesStr.match(/"car_multi":(\d+)/);
          if (ratesMatch && ratesMatch[1]) {
            price = parseInt(ratesMatch[1], 10);
          }
        }
      } catch (e) {
        console.error(`Error parsing rates for ${name}:`, e);
      }
      
      // Skip entries with invalid coordinates
      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Skipping ${name} due to invalid coordinates: ${lat}, ${lng}`);
        continue;
      }
      
      // Create toll plaza object in our application format
      tollPlazas.push({
        id: `TOLL_${idCounter++}`,
        name,
        lat,
        lng,
        price,
        currency: "INR"
      });
    } catch (error) {
      console.error(`Error processing row:`, error, row);
    }
  }
  
  return tollPlazas;
}

// Main function
function main() {
  try {
    console.log(`Reading CSV file: ${CSV_FILE}`);
    const dataRows = parseCSV(csvData);
    console.log(`Parsed ${dataRows.length} rows from CSV`);
    
    const tollPlazas = convertToAppFormat(dataRows);
    console.log(`Converted ${tollPlazas.length} toll plazas to application format`);
    
    // Write to JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tollPlazas, null, 2));
    console.log(`Successfully wrote toll plaza data to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main();