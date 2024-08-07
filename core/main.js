// Custom function to parse CSV content
function parseCSV(csvContent, callback) {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== headers.length) continue; // Skip invalid rows

    const row = {};
    headers.forEach((header, index) => {
      let value = values[index].trim();
      // Convert to number if applicable
      if (!isNaN(value)) value = parseFloat(value);
      row[header] = value;
    });
    data.push(row);
  }

  callback(data);
}

// AI translation function to map formula fields to CSV headers
function aiTranslater(headers, field) {
  // Function to perform basic stemming
  function stem(word) {
    // Example stemmer: removes common suffixes for a simple stemming approach
    return word.replace(/(ing|ed|s|es|er|est|ly)$/i, '');
  }

  // Create stemmed versions of headers and field
  const headersLower = headers.map(header => stem(header.toLowerCase()));
  const stemmedField = stem(field.toLowerCase());

  // Find a matching header based on stemmed forms
  const matchingHeader = headersLower.find(header => header.includes(stemmedField));

  // Return the original header if a match is found, otherwise return null
  return matchingHeader ? headers[headersLower.indexOf(matchingHeader)] : null;
}


// Function to extract unique source names from the formula
function extractSources(formula) {
  const sourceSet = new Set();
  const regex = /(\w+)\.(\w+)/g;
  let match;
  while ((match = regex.exec(formula)) !== null) {
    sourceSet.add(match[1]);
  }
  return Array.from(sourceSet);
}

function processFormula(identifiedSources, formula, uniqueKey, csvData) {
  const results = {};
  
  // Get today's date
  const today = new Date();

  // Iterate over each source's data to ensure flexibility with multiple sources
  identifiedSources.forEach(sourceName => {
    const sourceData = csvData[sourceName];

    sourceData.forEach(row => {
      const uniqueId = row[uniqueKey];

      // Translate the formula by replacing source.field with actual data
      const translatedFormula = formula.replace(/(\w+)\.(\w+)/g, (match, sourceName, field) => {
        const source = csvData[sourceName]; // Get the CSV data for the current source
        const headers = Object.keys(source[0]);
        const translatedHeader = aiTranslater(headers, field); // Translate the field using aiTranslater

        // Ensure matchingRow is defined here for each field reference
        if (translatedHeader) {
          const value = row[translatedHeader];

          // Check if the field is a date and calculate the difference in days
          if (isDate(value)) {
            const dateValue = new Date(value);
            const differenceInTime = today - dateValue;
            const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
            return differenceInDays; // Return the difference in days
          } else {
            return `${parseFloat(value)}`; // Return the numeric value as a string
          }
        }
        return 'null'; // Default if no matching data
      });

      // Evaluate the translated formula
      const formulaFunction = new Function(`return (${translatedFormula});`);

      // Execute the formula function to calculate the result
      const result = formulaFunction();

      // Store the evaluation result by unique identifier
      if (result !== null) { // Only store non-null results
        if (!results[uniqueId]) {
          results[uniqueId] = { result: 0, count: 0 }; // Initialize if not present
        }
        results[uniqueId]['result'] += result; // Increment the result
        results[uniqueId]['count'] += 1; // Increment the count

        // Populate other fields based on the presentation configuration
        if (appConfig.presentation && appConfig.presentation.columns) {
          appConfig.presentation.columns.forEach(column => {
            const headers = Object.keys(csvData[sourceName][0]);
            const translatedColumn = aiTranslater(headers, column.field);
            if (translatedColumn) {
              results[uniqueId][column.field] = row[translatedColumn] || 'N/A'; // Use the current row
            }
          });
        }
      }
    });
  });

  return results; // Return the final results object containing all evaluated results
}

// Helper function to check if a value is a valid date
function isDate(value) {
  return !isNaN(Date.parse(value)) && isNaN(value);
}


let combinedResults = {};
// Function to read files and process data
function readFilesAndProcess(fileInputs, identifiedSources, appConfig) {
  const csvData = {};
  const promises = identifiedSources.map(sourceName => {
    return new Promise((resolve, reject) => {
      const input = fileInputs[sourceName];
      if (input.files.length > 0) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
          parseCSV(event.target.result, (data) => {
            csvData[sourceName] = data;
            resolve();
          });
        };
        reader.onerror = function() {
          reject(new Error(`Failed to read file for ${sourceName}`));
        };
        reader.readAsText(file);
      } else {
        reject(new Error(`No file selected for ${sourceName}`));
      }
    });
  });


  // Wait for all files to be read, then process the formula
  Promise.all(promises)
    .then(() => {
      combinedResults = processFormula(identifiedSources, appConfig.formula, appConfig.unique, csvData);
      displayResultsInTable(combinedResults);
    })
    .catch(error => {
      console.error('Error processing files:', error);
      alert('Error processing files. Please ensure all files are selected and valid.');
    });
}