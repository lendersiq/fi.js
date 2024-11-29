// main.js

// Ensure appConfig is defined
if (typeof appConfig === 'undefined') {
  throw new Error('appConfig is not defined. Please ensure it is defined before including main.js.');
}

// if logger is true, select console.logs will log
let logger = false; 

/**
* Extracts unique source names from the formula.
* parser handles:
* -Quoted fields containing commas.
* -Escaped quotes within fields (represented as double quotes "").
* -Newlines within quoted fields.
* -Leading and trailing whitespace.
*/
function parseCSV(csvContent, callback) {
  const data = [];
  let headers = [];
  let isHeader = true;
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      // Handle escaped quotes
      currentField += '"';
      i++;
    } else if (char === '"' && inQuotes) {
      // End of quoted field
      inQuotes = false;
    } else if (char === '"' && !inQuotes) {
      // Start of quoted field
      inQuotes = true;
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        currentField = '';
        if (isHeader) {
          headers = currentRow;
          isHeader = false;
        } else {
          const rowData = {};
          for (let j = 0; j < headers.length; j++) {
            let value = currentRow[j];
            // Convert to number if applicable
            if (value && !isNaN(value)) value = parseFloat(value);
            rowData[headers[j]] = value;
          }
          data.push(rowData);
        }
        currentRow = [];
      }
    } else {
      currentField += char;
    }
  }

  // Handle the last line if it doesn't end with a newline
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (isHeader) {
      headers = currentRow;
    } else {
      const rowData = {};
      for (let j = 0; j < headers.length; j++) {
        let value = currentRow[j];
        // Convert to number if applicable
        if (value && !isNaN(value)) value = parseFloat(value);
        rowData[headers[j]] = value;
      }
      data.push(rowData);
    }
  }

  callback(data);
}

function isDate(value) {
  // Remove any surrounding single or double quotes
  const strippedValue = value.replace(/^['"]|['"]$/g, '');
  console('inside isDate', strippedValue);
  return !isNaN(Date.parse(strippedValue)) && isNaN(value);
}

function evaluateExpression(expression) {
  if (expression.length === 0) return { result: 0, nonNullCount: 0 };
  let conditionLocked = false; // Initialize within the function to ensure it resets each time
  let nonNullCount = 0; // Initialize a counter for non-null values
  console.log('Original Expression:', expression);

  // Step 1: Replace conditions where 'null' is the first part of the condition with 'false'
  expression = expression.replace(/\{\{\s*null\s*[!=><]=?\s*[^}]+\}\}/g, '{{ false }}');
  console.log('Expression after replacing conditions starting with null:', expression);

  // Step 2: Wrap each ternary operation with parentheses, but avoid including surrounding operators
  expression = expression.replace(/(\{\{[^{}]+\}\}\s*\?\s*[^:]+:\s*[^+]+)/g, '($&)');
  console.log('Expression after wrapping ternary operations:', expression);

  // Regex to match conditions inside double curly braces {{ }}
  const conditionRegex = /\{\{([\s\S]+?)\}\}/g;
  let match;

  // First pass: Evaluate conditions inside double curly braces and determine if any are true
  while ((match = conditionRegex.exec(expression)) !== null) {
    let condition = match[1]; // Extract the condition inside {{ }}
    console.log('')

    // Convert any dates within the condition to day difference values
    condition = condition.replace(/(['"]?\b\d{4}[-/\.]\d{2}[-/\.]\d{2}\b['"]?|\b\d{2}[-/\.]\d{2}[-/\.]\d{4}\b|\b\d{2}[-/\.]\d{2}[-/\.]\d{2}\b)/g, (value) => {
      return isDate(value) ? convertDateToDays(value) : value;
    });

    try {
      const evaluatedCondition = Function(`'use strict'; return (${condition})`)();
      console.log(`Condition "${condition}" evaluated to: ${evaluatedCondition}`);

      // Lock condition if any evaluates to true
      if (evaluatedCondition === true) {
        conditionLocked = true;
      }
    } catch (error) {
      console.error(`Error evaluating condition: ${condition}`, error);
    }
  }

  // Second pass: Apply Truth Propagation if conditionLocked is true
  if (conditionLocked) {
    // Replace all conditions inside {{ }} with `true`
    expression = expression.replace(/\{\{([\s\S]+?)\}\}/g, 'true');
  } else {
    // Evaluate all conditions normally if none are locked
    // Step 1: Replace dates with integer expression of days since the date
    expression = expression.replace(/(['"]?\b\d{4}[-/.]\d{2}[-/.]\d{2}\b['"]?|['"]?\b\d{2}[-/.]\d{2}[-/.]\d{4}\b['"]?|['"]?\b\d{2}[-/.]\d{2}[-/.]\d{2}\b['"]?)/g, (value) => {
      if (logger) console.log('Found Date Value:', value); // Log each date identified by regex
      return isDate(value) ? convertDateToDays(value) : value;
    });

    // Step 2: Process any conditions within double curly braces (if present)
    expression = expression.replace(/\{\{([\s\S]+?)\}\}/g, (match, condition) => {
      try { 
        const evaluatedCondition = Function(`'use strict'; return (${condition})`)();
        return evaluatedCondition ? 'true' : 'false';
      } catch (error) {
        console.error(`Error evaluating condition: ${condition}`, error);
        return 'false';
      }
    });
  }
  if (logger) console.log('Expression after processing:', expression);

  // **New step to convert 'x in [a, b, c]' syntax to array membership checks**
  expression = expression.replace(/(\S+)\s+in\s+\[([^\]]+)\]/g, 'includes([$2], $1)');

  // Define includes function within scope for array membership checks
  function includes(array, value) {
    return array.some(element => element == value);
  }

  // Replace 'null' with '0' to prevent evaluation issues
  const sanitizedExpression = expression.replace(/null/g, '0');

  // Allow letters, numbers, underscores, dots, arithmetic operators, parentheses,
  // comparison operators, ternary operators, logical operators, whitespace, and quotes
  const safeExpression = sanitizedExpression.replace(/[^a-zA-Z0-9_+.\\\-*/%(),<>=!?:|& \n\r\t'"\[\]]+/g, '');

  try {
    // Split the expression by '+' to evaluate each subexpression
    const subexpressions = safeExpression.split('+');
    subexpressions.forEach(subexpr => {
      try {
        const result = Function('includes', `'use strict'; return (${subexpr.trim()})`)(includes);
        if (result !== null && result !== 0) {
          nonNullCount++;
        }
      } catch (error) {
        console.error('Error evaluating subexpression:', error, subexpr);
      }
    });
    // Use includes function in evaluation
    const finalResult = Function('includes', `'use strict'; return (${safeExpression})`)(includes);
    if (logger) console.log(`Final Expression ${safeExpression}`);
    if (logger) console.log('Final Evaluated Result:', result);
    return { result: finalResult, nonNullCount };
  } catch (error) {
    console.error('Error evaluating expression:', error, safeExpression);
    return { result: 0, nonNullCount };
  }
}

// Helper function to convert a date to the number of days since the date
function convertDateToDays(dateString) {
  const dateValue = new Date(dateString);
  const differenceInTime = dateValue - new Date();
  return Math.floor(differenceInTime / (1000 * 3600 * 24)); // Return difference in days
}

// Test the aiTranslater function
const headers = ['Portfolio', 'Date_Opened', 'Maturity_Date', 'Branch_Number', 'Class_Code', 'Opened_by_Resp_Code', 'Late_Charges'];
const translatedHeader = aiTranslater(headers, 'fees');
console.log('Translated Header:', translatedHeader);
//console.log('yearToDateFactor Testing', yearToDateFactor('PMTD'));
//console.log('evaluateExpression:', evaluateExpression('2021-10-31' > '2020-10-31'))

// extract unique source and input names from the formula
function extractPipes(formula, presentation) {
  const sourceSet = new Set();
  const inputSet = new Set();
  
  // Regex to match {source}.{function or object} format, excluding 'input'
  const sourceRegex = /\b(?!input\b)(\w+)\.\w+/g;
  
  // Regex to match input.function(args) format
  const inputRegex = /input\.\w+\(([^)]*)\)/g;
  
  let match;

  // Extract sources from {source}.{function or object} notation
  while ((match = sourceRegex.exec(formula)) !== null) {
    sourceSet.add(match[1]);
  }

  // Extract inputs from input.function(args) notation
  while ((match = inputRegex.exec(formula)) !== null) {
    const args = match[1].split(',').map(arg => arg.trim());
    args.forEach(arg => {
      if (arg) {
        inputSet.add(arg);
      }
    });
  }

  // Extract sources from presentation columns
  if (presentation && Array.isArray(presentation.columns)) {
    presentation.columns.forEach(column => {
      if (column.field.includes('.')) {
        const source = column.field.split('.')[0];
        sourceSet.add(source);
      }
    });
  }

  return {
    sources: Array.from(sourceSet),
    inputs: Array.from(inputSet)
  };
}


function processFormula(identifiedPipes, formula, groupKey, digestData) {
  const results = {};

  console.log('Starting formula processing...');
  console.log('Identified Pipes:', identifiedPipes);
  console.log('Formula:', formula);
  //console.log('Group Key:', groupKey);
  console.log('Digested Data:', digestData);

  // Iterate over each source's data to ensure flexibility with multiple sources
  // Initialize identifiedResources as needed (array or object)
  const identifiedResources = [];

  // Iterate over the values in identifiedPipes
  Object.values(identifiedPipes).forEach(value => {
    if (Array.isArray(value)) {
        // If the value is an array, concatenate its elements into identifiedResources
        identifiedResources.push(...value);
    } else {
        // If the value is not an array, add it directly
        identifiedResources.push(value);
    }
  });
  // Output the identifiedResources
  console.log('identifiedResources:', identifiedResources);

  // Now, iterate over identifiedResources to process each resource
  identifiedResources.forEach(resourceID => {
    console.log(`Processing source: ${resourceID}`);
    var resourceData;
    var resourceName = resourceID;
    if (digestData.input && digestData.input.some(obj => obj.hasOwnProperty(resourceName))) {
      console.log('digestData.input', digestData.input)
      resourceData = digestData.input;
      resourceName = 'input';
    } else {
      resourceData = digestData[resourceID];
    }
    console.log('resource Name:', resourceName);
    console.log('resource Data:', resourceData);

    const headers = resourceData.length > 0 ? Object.keys(resourceData[0]) : [];
    const translatedGroupKey = aiTranslater(headers, groupKey);
    resourceData.forEach(row => {
      const uniqueId = row[translatedGroupKey];
      console.log('Processing row:', row);
      if (!results[uniqueId]) {
        results[uniqueId] = { result: 0, count: 0, formula: '' };
      }

      // remove input parameters
      const scrubbedFormula = formula.replace(/(input\.\w+)\([^)]*\)/g, '$1');
      console.log('scrubbed formula', scrubbedFormula)
      // Replace source.field with actual data or function results
      const updatedFormula = scrubbedFormula.replace(new RegExp(`(${resourceName})\\.(\\w+)`, 'g'), (match, source, sourceObject) => {
        console.log('Match found:', match);
        console.log('Source:', source, 'sourceObject:', sourceObject);  //sourceObjects can be functions or data field in pipe
      
        //if libraries are present verify sourceObject against library functions
        for (const libName in window.libraries) {
          const lib = window.libraries[libName];
      
          if (lib.functions && lib.functions[sourceObject] && typeof lib.functions[sourceObject].implementation === 'function') {
            const functionDef = lib.functions[sourceObject];
            console.log(`Function detected in library '${libName}': ${sourceObject}`);
      
            // Extract function parameter names and determine if they are optional
            let paramInfo = functionDef.implementation
              .toString()
              .match(/\(([^)]*)\)/)[1]
              .split(',')
              .map(param => {
                const parts = param.split('=');
                return {
                  name: parts[0].trim(),
                  isOptional: parts.length > 1 // If there's a default value, it's optional
                };
              });
      
            // Safely add 'source' as an optional parameter if it's not already included
            if (!paramInfo.some(param => param.name === 'source')) {
              paramInfo.push({ name: 'source', isOptional: true });
            }
            //console.log('Function Parameter Info:', paramInfo);
      
            const args = paramInfo.map(info => {
              if (info.name === 'source') {
                // Include source as the resource name
                return resourceName;
              }
      
              const paramHeader = aiTranslater(headers, info.name);
              if (paramHeader) {
                const paramValue = row[paramHeader];
                if (isDate(paramValue)) {
                  return new Date(paramValue);
                } else if (typeof paramValue === "string") {
                  return paramValue.trim();
                } else {
                  return parseFloat(paramValue);
                }
              }
              return info.isOptional ? undefined : null; // Undefined for optional, null for required and missing
            });
      
            // Check if any required args (non-optional) are null
            const hasNullRequiredArgs = args.some((arg, index) => arg === null && !paramInfo[index].isOptional);
            if (hasNullRequiredArgs) {
              console.log('Skipping function evaluation due to missing required arguments.', args);
              return '0';
            }
            
            const result = functionDef.implementation(...args);
            console.log('Function result:', result);
            return result;
          }
        }
      
        //if data sourced from pipe
        const translatedHeader = aiTranslater(headers, sourceObject);
        console.log(`headers: ${headers} -- translated header: ${translatedHeader}`);
        if (translatedHeader) {
          const value = row[translatedHeader];
          console.log('Field Value:', value);
      
          if (isDate(value)) {
            return convertDateToDays(value); 
          } else {
            return isNaN(value) ? `"${value}"` : `${parseFloat(value)}`;
          }
        }
        return '0';
      });
      
      console.log('Updated Formula:', updatedFormula);
      // make sure all components of the formula are resolved before stored in results[uniqueId].formula object
      const resolvedFormula = updatedFormula.replace(/(\w+)\.(\w+)/g, (match) => {
        if (/^\d+(\.\d+)?$/.test(match)) {
            // If match is already a number, leave it as is
            return match;
        } else {
          console.log(`Unresolved part found: ${match}, setting it to null.`);
          return null;
        }
      });
      
      if (results[uniqueId].formula) {
        results[uniqueId].formula = `${results[uniqueId].formula}, ${resolvedFormula}`;
      } else {
          results[uniqueId].formula = resolvedFormula;
      }
      //console.log(`formula by uniqueId: ${uniqueId} = ${results[uniqueId].formula}`);
      // Populate other fields based on the presentation configuration
      if (appConfig.presentation && appConfig.presentation.columns) {
        appConfig.presentation.columns.forEach(column => {
          const headers = Object.keys(row);
          const translatedColumn = aiTranslater(headers, column.field);
          if (translatedColumn) {
            if (results[uniqueId][column.field] !== undefined) {
              results[uniqueId][column.field] = `${results[uniqueId][column.field]}, ${row[translatedColumn]}`;
            } else if (row[translatedColumn]) {
              results[uniqueId][column.field] = row[translatedColumn];
            }
          }
        });
      }
    });
  
  });

  // After processing all sources, evaluate the complete formula for each uniqueId
  Object.keys(results).forEach(uniqueId => {
    let formula = results[uniqueId].formula.replace(/^,\s*/, '');
    //console.log('Formula before evaluation:', formula);

    try {
        // Enclose each comma-delimited section in parentheses and replace commas with "+"
        let bracketDepth = 0;
        const finalFormula = formula.replace(/([^,\[\]]+)|([,\[\]])/g, (match, group, symbol) => {
          if (symbol === '[') {
            bracketDepth++;
            return symbol;
          } else if (symbol === ']') {
            bracketDepth--;
            return symbol;
          } else if (symbol === ',' && bracketDepth === 0) {
            return ' + ';
          } else {
            return match;
          }
        });
        console.log('Final Formula for Evaluation (pre-eval):', finalFormula);
        
        const finalEvaluation = evaluateExpression(finalFormula);
        const finalResult = finalEvaluation.result;
        const finalCount = finalEvaluation.nonNullCount;
        console.log('Final Formula Evaluation Result:', finalResult);

        results[uniqueId].result = finalResult;
        results[uniqueId].result = finalCount;
    } catch (error) {
        console.error('Error evaluating final formula:', error);
        results[uniqueId].result = 0;
    }
  });

  console.log('Final Results:', results);
  return results;
}

function getFilenameWithoutExtension(url) {
  const urlObject = new URL(url);
  const pathname = urlObject.pathname;

  // Remove trailing slash if present
  const trimmedPathname = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  const filename = trimmedPathname.substring(trimmedPathname.lastIndexOf('/') + 1);
  const filenameWithoutExtension = filename.split('.').slice(0, -1).join('.') || filename;

  console.log('filenameWithoutExtension', filenameWithoutExtension);
  return filenameWithoutExtension;
}

function loadLibraryScripts(filePaths, callback) {
  console.log('filePaths', filePaths);
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
    if (typeof filePath === 'string' && (filePath.startsWith('http://') || filePath.startsWith('https://'))) {
      // Handle API URL
      fetch(filePath)
        .then(response => response.json())
        .then(data => {
          const libName = getFilenameWithoutExtension(filePath); // Use the new function
          window.libraries.api = window.libraries.api || {};
          window.libraries.api[libName] = data;
          console.log(`API library '${libName}' loaded:`, data);
          scriptLoaded();
        })
        .catch(error => {
          console.error(`Failed to load API from ${filePath}:`, error);
          scriptLoaded(); // Still call the callback to continue the process
        });
    } else {
      // Handle local JS file
      const script = document.createElement('script');
      script.src = '../../libraries/' + filePath + '.js';
      script.type = 'text/javascript';
      script.async = false; // Ensure scripts are loaded in order

      script.onload = function() {
        const libName = filePath.split('/').pop().replace('.js', ''); // Extract the name without extension
        if (window[libName]) {
          window.libraries[libName] = window[libName];
        }
        scriptLoaded();
      };

      script.onerror = (e) => {
        console.error(`Failed to load script: ${filePath}`, e);
        scriptLoaded();
      };

      document.head.appendChild(script);
    }
  });
}

if (appConfig && appConfig.libraries) {
  // Load the specified library files
  loadLibraryScripts(appConfig.libraries, () => {
    console.log('All libraries loaded:', window.libraries);

    // Example usage: Call a function from the loaded libraries
    if (window.libraries.financial && window.libraries.financial.functions.interestIncome) {
      const result = window.libraries.financial.functions.interestIncome.implementation(1000, 0.05);
      console.log('Interest Income Result:', result);
    }
  });
} else {
  console.warn('no libraries defined')
}

window.processModal = function(fileInputs, identifiedPipes, appConfig) {
  const digestData = {};
  const promises = identifiedPipes.sources.map(sourceName => {
    // Show the spinner before starting the promise
    showSpinner();
    return new Promise((resolve, reject) => {
      const input = fileInputs[sourceName];
      if (input.files.length > 0) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
          parseCSV(event.target.result, (data) => {
            digestData[sourceName] = data;
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

  if (identifiedPipes.inputs.length > 0) {
    digestData['input'] = [];
  }
  identifiedPipes.inputs.forEach(inputName => {
    const addInput = {};
    addInput[inputName] = document.getElementById(inputName).value;
    digestData['input'].push(addInput);
  });

  Promise.all(promises)
    .then(() => {
      let analytics = {};
      if (identifiedPipes.sources.length > 0) {  //data sources
        window.analytics = computeAnalytics(digestData);
        console.log('Analytics:', window.analytics);
        document.getElementById('chart-container').style.display = 'block';
      }
      combinedResults = processFormula(identifiedPipes, appConfig.formula, appConfig.groupBy, digestData);
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

// Function to hide the spinner
function hideSpinner() {
  const spinner = document.getElementById('spinner-container');
  if (spinner) {
    spinner.style.display = 'none';
  }
}

function yearToDateFactor(fieldName) {
  let factor = 1; // default to 1
  const lowerStr = fieldName.toLowerCase();
  if (lowerStr.includes("mtd")) {
    factor = 12;
  } else if (lowerStr.includes("day") || lowerStr.includes("daily")) {
    factor = 365
  }
  return factor;
} 

function computeAnalytics(csvData) {
  console.log('csvData @ computeAnalytics', csvData)
  const analytics = {};

  Object.keys(csvData).forEach(sourceName => {
    const sourceData = csvData[sourceName];
    const fieldAnalytics = {};

    // Identify numeric fields by checking if all non-null values in the field are numeric
    const numericFields = Object.keys(sourceData[0]).filter(field => {
      const isDateField = sourceData.some(row => isDate(row[field]));
      const isNumericField = sourceData.every(row => isNumericOrStartsWithNumeric(row[field]));
      console.log(`Field: ${field}, Is Numeric: ${isNumericField}, Is Date: ${isDateField}`);
      return isNumericField && !isDateField;
    });

    numericFields.forEach(field => {
      const validValues = sourceData
        .map(row => convertToNumeric(row[field]))
        .filter(value => value !== null && !isNaN(value)); // Filter out null and NaN values
      if (validValues.length > 0) {
        fieldAnalytics[field] = {
          min: Math.min(...validValues),
          max: Math.max(...validValues),
          mean: mean(validValues),
          median: median(validValues),
          mode: mode(validValues),
          variance: variance(validValues),
          stdDeviation: stdDeviation(validValues),
          twoStdDeviations: twoStdDeviations(validValues),
          threeStdDeviations: threeStdDeviations(validValues),
          sum: sum(validValues),
          count: validValues.length, 
          unique : uniqueValues(validValues)
        };
        fieldAnalytics[field].YTDfactor = yearToDateFactor(field);
        if (fieldAnalytics[field].unique > 4 && fieldAnalytics[field].unique <= 16  && parseInt(fieldAnalytics[field].median) < fieldAnalytics[field].unique-1 ) {
          fieldAnalytics[field].uniqueArray = [...new Set(validValues)];
          fieldAnalytics[field].convexProbability = createProbabilityArray(fieldAnalytics[field].mode, fieldAnalytics[field].unique, fieldAnalytics[field].uniqueArray);
        }
      }
    });
    analytics[sourceName] = fieldAnalytics;
  });

  console.log('Computed Analytics:', analytics);
  return analytics;
}

// Helper function to check if a value is numeric or starts with a numeric
function isNumericOrStartsWithNumeric(value) {
  let testValue = value;
  if (testValue === null || isNaN(testValue)) return true;  // 'null' in a numeric field is acceptable
  if (typeof testValue === 'string') {
    testValue = testValue.trim(); // Trim leading and trailing spaces if it's a string
    if (testValue.toLowerCase() === 'null' || /^[0-9][a-zA-Z]$/.test(testValue)) return true; // Explicitly check for 'NULL' or NumChar after trimming
    testValue = Number(testValue);
  }
  // Return true if the value starts with a digit or is a number
   const isNumericOrStartsIntChar = !isNaN(testValue) || (typeof testValue === 'string' && /^\d/.test(testValue));
   if (!isNumericOrStartsIntChar) {
      console.log('numeric false', value)
   }
   return isNumericOrStartsIntChar
}

// Helper function to convert values like "3W" to a numeric value (e.g., 3.5)
function convertToNumeric(value) {
  if (value === null) return null; // Return null for null values
  if (typeof value === 'string') {
    value = value.trim(); // Trim leading and trailing spaces if it's a string
    if (value.toLowerCase() === 'null') return null; // Return null for 'NULL' strings
    if (/^\d/.test(value)) {
      const numericPart = parseFloat(value.match(/^\d+/)[0]);
      return numericPart + (value.length === 1 ? 0 : 0.5); // Add .5 if the string contains a letter after the digit
    }
  }
  if (!isNaN(value)) return parseFloat(value); // Directly return numeric values
  return null; // Return null for non-numeric values
}

// Helper function to check if a value is a valid date
function isDate(value) {
  return !isNaN(Date.parse(value)) && isNaN(value);
}

// Helper functions for computing statistics (as previously defined)
function mean(values) {
  return sum(values) / values.length;
}

function median(values) {
  values.sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

function mode(values) {
  const frequencyMap = {};
  let maxFreq = 0;
  let mode = [];

  // Create a frequency map
  values.forEach(value => {
    if (frequencyMap[value]) {
      frequencyMap[value]++;
    } else {
      frequencyMap[value] = 1;
    }
    if (frequencyMap[value] > maxFreq) {
      maxFreq = frequencyMap[value];
    }
  });

  // Find the mode(s)
  for (const key in frequencyMap) {
    if (frequencyMap[key] === maxFreq) {
      mode.push(Number(key));
    }
  }

  // If there's a single mode, return it, otherwise return an array of modes
  return mode.length === 1 ? mode[0] : mode;
}

function variance(values) {
  const m = mean(values);
  return mean(values.map(v => (v - m) ** 2));
}

function stdDeviation(values) {
  return Math.sqrt(variance(values));
}

function sum(values) {
  return values.reduce((acc, val) => acc + val, 0);
}

function uniqueValues(values) {
  const uniqueValues = new Set(values);
  return uniqueValues.size
}

// Function to calculate the range for two standard deviations
function twoStdDeviations(values) {
  const m = mean(values);
  const sd = stdDeviation(values);
  return [m - 2 * sd, m + 2 * sd];
}

// Function to calculate the range for three standard deviations
function threeStdDeviations(values) {
  const m = mean(values);
  const sd = stdDeviation(values);
  return [m - 3 * sd, m + 3 * sd];
}

function createProbabilityArray(mode, unique, uniqueArray) {
  //unique is quantity of unique values in a column, and uniqueArray contains all unique values
  /* Convexity in Risk Model applied here refers to the situation where the rate of probability becomes steeper as the value increases. 
  In other words, the relationship between value and probability is convex, 
  meaning that beyond the mode (value that appears most frequently in a data set which is the tipping point) small increases in value can lead to disproportionately large increases in the likelihood of an event (i.e., a loss).
  */
  mode = parseInt(mode);
  // Function to interpolate between two values over a number of steps
  function interpolate(startValue, endValue, steps) {
      const stepValue = (endValue - startValue) / (steps - 1);  
      const values = [];
      for (let i = 0; i < steps; i++) {
          values.push(startValue + i * stepValue);
      }
      return values;
  }
  // Generate arrays with the specified unique size
  let probabilityArray = [];
  // Interpolate between probabilityArray[0] and probabilityArray[median-1]
  const firstSegment = interpolate(0, 1, mode);
  // Interpolate between probabilityArray[median] and probabilityArray[unique-1]
  const secondSegment = interpolate(5, 100, unique - mode);
  console.log(`median: ${mode}, unique: ${unique}, firstSegment: ${firstSegment}, secondSegment : ${secondSegment}`)

  // Assign values to the first probability array
  for (let i = 0; i < firstSegment.length; i++) {
      probabilityArray[`'${uniqueArray[i]}'`] = parseFloat(firstSegment[i].toFixed(2));
  }
  for (let i = 0; i < secondSegment.length; i++) {
      probabilityArray[`'${uniqueArray[mode + i]}'`] = parseFloat(secondSegment[i].toFixed(2));
  }
  return probabilityArray;
}
