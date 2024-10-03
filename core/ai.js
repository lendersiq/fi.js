// Synonym library to map common synonyms to their respective headers
const synonymLibrary = {
    'fee': ['charge', 'cost', 'duty', 'collection', 'levy'],
    'open': ['origination', 'start', 'create', 'establish', 'setup'],
    'withdrawal': ['check', 'debit'],
    'deposit': ['credit'],
    'certificate': ['cd', 'cod', 'certificate of deposit']
  };
  
  // AI translation function to map formula fields to CSV headers
  function aiTranslater(headers, field) {
    function stem(word) {
      return word
        .replace(/(ing|ed|ly)$/i, '')  // Remove common suffixes like 'ing', 'ed', 'ly'
        .replace(/(es)$/i, 'e')        // Handle plural forms like 'fees' -> 'fee', and 'boxes' -> 'box'
        .replace(/(s)$/i, '')          // Handle remaining singular forms like 'cats' -> 'cat'
        .replace(/(er|est)$/i, '')     // Remove comparative and superlative endings like 'er', 'est'
        .trim();
    }
    const headersLower = headers.map(header => stem(header.toLowerCase()));
    const stemmedField = stem(field.toLowerCase());
    // First, try to find a direct match
    let matchingHeader = headersLower.find(header => header.includes(stemmedField));
    // If no direct match, check the synonym library
    if (!matchingHeader && synonymLibrary[stemmedField]) {
        const synonyms = synonymLibrary[stemmedField].map(synonym => stem(synonym));
        matchingHeader = headersLower.find(header => 
            synonyms.some(synonym => header.includes(synonym))
        );
    }
  
    return matchingHeader ? headers[headersLower.indexOf(matchingHeader)] : null;
}

function aiTableTranslater(tableId) {
    console.log('aiTableTranslater(tableId)', tableId)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
        parseCSV(event.target.result, (data) => {
            const mapping = createMapping(data);
            updateTableWithMapping(mapping, tableId);
        });
        };
        reader.readAsText(file);
    }
    });
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

function createMapping(data) {
    const mapping = {};

    data.forEach(row => {
        const keys = Object.keys(row);
        const firstKey = keys[0];
        const secondKey = keys[1];

        if (typeof row[firstKey] === 'number') {
            mapping[row[firstKey]] = row[secondKey];
        } else if (typeof row[secondKey] === 'number') {
            mapping[row[secondKey]] = row[firstKey];
        }
    });

    return mapping;
}

function updateTableWithMapping(mapping, tableId) {
    const table = document.getElementById(tableId);
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) { // Start from 1 to skip the header
        const cells = rows[i].getElementsByTagName('td');
        const legendValue = cells[0].textContent.trim();
        
        if (mapping[legendValue]) {
            cells[0].textContent = mapping[legendValue];
        }
    }
}

// Analyze the column data to determine the format
function aiAnalyzeColumnData(data, field) {
    let integerCount = 0;
    let floatCount = 0;

    data.forEach(row => {
        const value = row[field];
        if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            integerCount++;
        } else {
            floatCount++;
        }
        }
    });

    // If most values are floats, return 'currency', otherwise 'integer'
    return floatCount > integerCount ? 'float' : 'integer';
}

function calculateMode(numbers) {
    const frequency = {};
    let maxFreq = 0;
    let mode = numbers[0];

    numbers.forEach(number => {
        frequency[number] = (frequency[number] || 0) + 1;
        if (frequency[number] > maxFreq) {
            maxFreq = frequency[number];
            mode = number;
        }
    });

    return mode;
}

function aiIsBusiness(...args){
    //console.log('...args', args, args.deposits > 6 && args.balance > financial.dictionaries.consumerMaximum.values[args.source]);
    return (args.deposits > 6 && args.balance > financial.dictionaries.consumerMaximum.values[args.source]) 
    //ai  -- can consider standard deviation or median of all balances by source
}