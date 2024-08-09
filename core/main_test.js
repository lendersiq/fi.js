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
  function stem(word) {
    return word.replace(/(ing|ed|s|es|er|est|ly)$/i, '');
  }

  const headersLower = headers.map(header => stem(header.toLowerCase()));
  const stemmedField = stem(field.toLowerCase());

  const matchingHeader = headersLower.find(header => header.includes(stemmedField));

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

  console.log('Starting formula processing...');
  console.log('Identified Sources:', identifiedSources);
  console.log('Formula:', formula);
  console.log('Unique Key:', uniqueKey);
  console.log('CSV Data:', csvData);

  // Iterate over each source's data to ensure flexibility with multiple sources
  identifiedSources.forEach(sourceName => {
    const sourceData = csvData[sourceName];
    console.log(`Processing source: ${sourceName}`);
    console.log('Source Data:', sourceData);

    sourceData.forEach(row => {
      const uniqueId = row[uniqueKey];
      console.log('Processing row:', row);
      console.log('Unique ID:', uniqueId);

      // Translate the formula by replacing source.field with actual data and executing functions
      const translatedFormula = formula.replace(/(\w+)\.(\w+)/g, (match, source, field) => {
        console.log('Match found:', match);
        console.log('Source:', source, 'Field:', field);

        // Handle normal field data or potential function calls
        let headers = Object.keys(row);
        let translatedHeader = aiTranslater(headers, field);

        // Check if this match is a function call in the libraries object
        for (const libName in window.libraries) {
          const lib = window.libraries[libName];

          if (lib[field] && typeof lib[field].implementation === 'function') {
            const functionDef = lib[field];
            console.log(`Function detected in library '${libName}': ${field}`);

            // Extract parameter values required by the function
            const paramNames = functionDef.implementation
              .toString()
              .match(/\(([^)]*)\)/)[1]
              .split(',')
              .map(param => param.trim());
            console.log('Function Parameter Names:', paramNames);

            // Retrieve parameter values from the CSV data
            const args = paramNames.map(paramName => {
              const paramHeader = aiTranslater(headers, paramName); // Translate param to CSV header
              const paramValue = paramHeader ? parseFloat(row[paramHeader]) : 0; // Get value from CSV
              console.log(`Parameter: ${paramName}, Value: ${paramValue}`);
              return paramValue;
            });

            // Execute the function with the extracted parameters
            const result = functionDef.implementation(...args);
            console.log('Function result:', result);
            return result;
          }
        }

        // Handle normal field data if no function is detected
        if (translatedHeader) {
          const value = row[translatedHeader];
          console.log('Field Value:', value);

          // Check if the field is a date and calculate the difference in days
          if (isDate(value)) {
            const dateValue = new Date(value);
            const differenceInTime = today - dateValue;
            const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
            console.log('Date Difference:', differenceInDays);
            return differenceInDays; // Return the difference in days
          } else {
            return `${parseFloat(value)}`; // Return the numeric value as a string
          }
        }
        return '0'; // Default to zero if no matching data
      });

      console.log('Translated Formula:', translatedFormula);

      // Evaluate the translated formula
      try {
        const formulaFunction = new Function(`return (${translatedFormula});`);
        const result = formulaFunction();
        console.log('Formula Evaluation Result:', result);

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
              const headers = Object.keys(row);
              const translatedColumn = aiTranslater(headers, column.field);
              if (translatedColumn) {
                results[uniqueId][column.field] = row[translatedColumn] || 'N/A'; // Use the current row
              }
            });
          }
        }
      } catch (error) {
        console.error('Error evaluating formula:', error);
      }
    });
  });

  console.log('Final Results:', results);
  return results; // Return the final results object containing all evaluated results
}

// Helper function to check if a value is a valid date
function isDate(value) {
  return !isNaN(Date.parse(value)) && isNaN(value);
}

function loadLibraryScripts(filePaths, callback) {
  // Initialize a global libraries object to store all exports
  window.libraries = {};
  let loadedScripts = 0;

  // Callback function to handle each script load
  function scriptLoaded() {
    loadedScripts += 1;
    if (loadedScripts === filePaths.length && typeof callback === 'function') {
      callback();
    }
  }

  // Iterate over each file path to create and load script elements
  filePaths.forEach(filePath => {
    const script = document.createElement('script');
    script.src = filePath;
    script.type = 'text/javascript';
    script.async = false; // Ensure scripts are loaded in order

    script.onload = function() {
      // Determine the library name from the file path
      const libName = filePath.split('/').pop().replace('.js', '');
      if (window[libName]) {
        // Merge each library into the global libraries object
        window.libraries[libName] = window[libName];
      }
      scriptLoaded();
    };

    script.onerror = (e) => console.error(`Failed to load script: ${filePath}`, e);

    document.head.appendChild(script);
  });
}

// Specify the list of library files to load
const libraryFiles = [
  '../libraries/financial.js',
  '../libraries/analytics.js' // Add more library files here as needed
];

// Load the specified library files
loadLibraryScripts(libraryFiles, () => {
  console.log('All libraries loaded:', window.libraries);

  // Example usage: Call a function from the loaded libraries
  if (window.libraries.financial && window.libraries.financial.interestIncome) {
    const result = window.libraries.financial.interestIncome.implementation(1000, 0.05);
    console.log('Interest Income Result:', result);
  }
});

window.readFilesAndProcess = function(fileInputs, identifiedSources, appConfig) {
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

  // Show the spinner before starting the promise
  showSpinner();

  Promise.all(promises)
    .then(() => {
      combinedResults = processFormula(identifiedSources, appConfig.formula, appConfig.unique, csvData);
      displayResultsInTable(combinedResults);
    })
    .catch(error => {
      console.error('Error processing files:', error);
      alert('Error processing files. Please ensure all files are selected and valid.');
    })
    .finally(() => {
      // Hide the spinner after processing
      hideSpinner();
    });
};

// Function to show the spinner
function showSpinner() {
  let spinner = document.getElementById('spinner');
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = 'spinner';
    spinner.style.position = 'fixed';
    spinner.style.top = '50%';
    spinner.style.left = '50%';
    spinner.style.transform = 'translate(-50%, -50%)';
    spinner.style.border = '16px solid #f3f3f3';
    spinner.style.borderTop = '16px solid #3498db';
    spinner.style.borderRadius = '50%';
    spinner.style.width = '120px';
    spinner.style.height = '120px';
    spinner.style.animation = 'spin 2s linear infinite';
    document.body.appendChild(spinner);
  }
  spinner.style.display = 'block';
}

// Function to hide the spinner
function hideSpinner() {
  const spinner = document.getElementById('spinner');
  if (spinner) {
    spinner.style.display = 'none';
  }
}

// Add CSS for spinner animation
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`;
document.head.appendChild(spinnerStyle);
