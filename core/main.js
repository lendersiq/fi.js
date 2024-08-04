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
function aiTranslate(source, field) {
  const headers = source[0] ? Object.keys(source[0]) : [];
  const headersLower = headers.map(header => header.toLowerCase());
  const matchingHeader = headersLower.find(header => header.includes(field.toLowerCase()));
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

// Function to process the formula dynamically across identified sources
function processFormula(identifiedSources, formula, uniqueKey, csvData) {
  const results = {};
  const preResult = {};

  // Parse and store data for each identified source
  identifiedSources.forEach(sourceName => {
    const sourceData = csvData[sourceName];
    preResult[sourceName] = {};

    sourceData.forEach(row => {
      const uniqueId = row[uniqueKey];
      preResult[sourceName][uniqueId] = row;
    });
  });

  // Process each unique identifier found in the primary source
  Object.keys(preResult[identifiedSources[0]]).forEach(uniqueId => {
    // Translate the formula by replacing source.field with actual data
    const translatedFormula = formula.replace(/(\w+)\.(\w+)/g, (match, sourceName, field) => {
      const source = csvData[sourceName];
      const translatedHeader = aiTranslate(source, field);
      return translatedHeader && preResult[sourceName][uniqueId] && preResult[sourceName][uniqueId][translatedHeader]
        ? `parseFloat(preResult['${sourceName}']['${uniqueId}']['${translatedHeader}'])` : 'null';
    });

    // Evaluate the translated formula
    const formulaFunction = new Function('preResult', `return ${translatedFormula};`);
    const result = formulaFunction(preResult);

    // Store the evaluation result by unique identifier
    if (result !== null) { // Only store non-null results
      results[uniqueId] = result;
    }
  });

  return results;
}

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
      const combinedResults = processFormula(identifiedSources, appConfig.formula, appConfig.unique, csvData);
      displayResultsInTable(combinedResults);
    })
    .catch(error => {
      console.error('Error processing files:', error);
      alert('Error processing files. Please ensure all files are selected and valid.');
    });
}