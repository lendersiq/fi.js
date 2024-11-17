// Synonym library to map common synonyms to their respective headers
const synonymLibrary = {
    'fee': ['charge', 'cost', 'duty', 'collection', 'levy'],
    'open': ['origination', 'start', 'create', 'establish', 'setup'],
    'checking': ['dda', 'demand deposit'], 
    'withdrawal': ['check', 'draft', 'debit'],
    'deposit': ['credit'],
    'certificate': ['cd', 'cod', 'certificate of deposit'],
    'own': ['responsibility'],
    'typ': ['classification', 'class']
};

function stem(word) {
    word = word.toLowerCase();
    // Handle irregular forms
    const irregulars = {
      'running': 'run',
      'ran': 'run',
      'swimming': 'swim',
      'swam': 'swim',
      'taking': 'take',
      'took': 'take',
      'gone': 'go',
      'went': 'go',
      'being': 'be',
      'was': 'be',
      'were': 'be',
      'having': 'have',
      'had': 'have',
      'fees': 'fee',
      'responsibility' : 'resp'
    };
  
    if (irregulars[word]) {
      return irregulars[word];
    }
  
    // Remove common suffixes
    const suffixes = [
      'ational', 'tional', 'enci', 'anci', 'izer', 'bli', 'alli',
      'entli', 'eli', 'ousli', 'ization', 'ation', 'ator', 'alism',
      'iveness', 'fulness', 'ousness', 'aliti', 'iviti', 'biliti',
      'logi', 'ing', 'ed', 'ly', 'es', 's', 'er', 'est', 'ment', 'ness'
    ];
  
    for (const suffix of suffixes) {
      if (word.endsWith(suffix)) {
        word = word.slice(0, -suffix.length);
        break;
      }
    }
  
    // Handle double consonants (e.g., "hopping" -> "hop")
    word = word.replace(/(.)\1$/, '$1');
  
    // Remove trailing 'e' when word is less than 3 characters
    if (word.endsWith('e') && word.length > 3) {
      word = word.slice(0, -1);
    }
  
    return word;
}

function aiSynonymKey(word) {
    const stemmedWord = stem(word);
  
    for (const [key, synonyms] of Object.entries(synonymLibrary)) {
      const stemmedKey = stem(key);
  
      // Check if the stemmed word matches the stemmed key
      if (stemmedWord === stemmedKey) {
        return key; //{ key, index: -1 }; // -1 indicates the word matches the key itself
      }
  
      // Use findIndex to find the index of the matching stemmed synonym
      const index = synonyms.findIndex(synonym => stem(synonym) === stemmedWord);
      if (index !== -1) {
        return key; //{ key, index };
      }
    }
  
    return word; // Return word if no match is found
}

// AI translation function to map formula fields to CSV headers
function aiTranslater(headers, field) {
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

function aiIsBusiness(...args) {  
    // Extract the params object from args
    const params = args[0][0];

    // Initialize isBusiness to false
    let isBusiness = false;

    // Validation: Check if relevant parameters exist and have valid values
    if (typeof params.balance !== 'number' || typeof params.consumerMaximum !== 'number' || typeof params.annualDeposits !== 'number') {
        throw new Error("Invalid or missing parameters. Ensure 'balance', 'consumerMaximum', and 'deposits' are provided as numbers.");
    }
    const threeStandardDeviations = window.analytics[params.sourceIndex][aiTranslater(Object.keys(window.analytics[params.sourceIndex]), 'balance')].threeStdDeviations[1];
    const twoStandardDeviations = window.analytics[params.sourceIndex][aiTranslater(Object.keys(window.analytics[params.sourceIndex]), 'balance')].twoStdDeviations[1];
    
    const highThreshold = threeStandardDeviations > params.consumerMaximum * 1.2  ?  threeStandardDeviations : params.consumerMaximum * 1.2; // 20% over the consumer threshold
    const lowThreshold = twoStandardDeviations > params.consumerMaximum * .8  ?  twoStandardDeviations : params.consumerMaximum * .8; // 20% under the consumer threshold
    // Proceed with the logic if parameters are valid
    if (params.balance > highThreshold) {  
        isBusiness = true;
    } else if (params.annualDeposits > 72 && params.balance > lowThreshold) {  
        isBusiness = true;
    }

    return isBusiness;
    //ai  -- can consider standard deviation or median of all balances by source
}
