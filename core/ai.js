// ai.js
// Framing for more advanced AI

// Synonym library to map common synonym goups
// vocabulary set for banking-related Natural Language Processing
const synonymsDataset = [
  // Expanded existing entries
  ['fee', 'charge', 'cost', 'duty', 'collection', 'levy', 'assessment', 'imposition', 'surcharge', 'service fee', 'commission', 'toll', 'premium', 'tariff'],
  ['open', 'term', 'origination', 'start', 'create', 'establish', 'setup', 'initiate', 'commence', 'activate', 'launch', 'inception', 'beginning', 'provenance'],
  ['checking', 'dda', 'demand deposit', 'share', 'current account', 'transaction account', 'share draft'],
  ['savings', 'money market', 'thrift', 'deposit account', 'share savings'],
  ['withdrawal', 'check', 'draft', 'debit', 'payout', 'disbursement', 'deduction', 'cash out'],
  ['deposit', 'credit', 'payment', 'fund', 'lodge', 'add funds', 'contribution'],
  ['certificate', 'cd', 'cod', 'certificate of deposit', 'time deposit', 'term deposit', 'fixed deposit'],
  ['owner', 'responsibility', 'officer', 'holder', 'proprietor', 'account holder', 'signatory'],
  ['type', 'classification', 'class', 'category', 'kind', 'variety'],
  ['location', 'branch', 'office', 'site', 'outlet', 'region'],
  ['principal', 'balance', 'outstanding', 'capital', 'remaining amount', 'unpaid portion'],
  ['balance', 'funds on deposit', 'available funds', 'funds'],

  // New groups
  ['interest', 'finance charge', 'rate', 'accrued interest', 'return', 'yield'],
  ['loan', 'credit facility', 'mortgage', 'financing', 'advance', 'lending'],
  ['account', 'bank account', 'ledger', 'record', 'customer account'],
  ['statement', 'bank statement', 'account statement', 'summary', 'transaction record'],
  ['overdraft', 'negative balance', 'overdrawn account', 'shortfall', 'deficit'],
  ['wire transfer', 'electronic funds transfer', 'EFT', 'bank wire', 'remittance', 'telegraphic transfer', 'wires']
];


function stem(word) {
  // Convert to lowercase
  word = word.toLowerCase();
  
  // ---- (A) Check irregulars / lemma overrides ----
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
    'responsibility': 'resp'
  };

  if (irregulars[word]) {
    return irregulars[word];
  }
  
  // ---- (B) Measure function ----
  // If you need more precise 'y' handling, consider
  // a more thorough approach. This is a simplified version.
  function measure(st) {
    return (st
      .replace(/[^aeiouy]+/g, 'C')
      .replace(/[aeiouy]+/g, 'V')
      .match(/VC/g) || []).length;
  }
  
  // Check if a string has a vowel
  function hasVowel(st) {
    return /[aeiouy]/.test(st);
  }

  // ---- (C) Early Exit for very short words ----
  if (word.length <= 2) {
    return word; // Stemming very short words often doesn't help
  }
  
  // ---- Step 1a: Plural S endings ----
  //  (i)  sses -> ss
  //  (ii) ies  -> i   (but some versions turn to "y" if measure>0)
  //  (iii) ss   -> ss (do nothing)
  //  (iv) s    -> (remove if there's a vowel before it)
  if (word.endsWith('sses')) {
    word = word.slice(0, -2); // "sses" -> "ss"
  } else if (word.endsWith('ies')) {
    word = word.slice(0, -3) + 'i'; // "ponies" -> "poni", "ties" -> "ti"
  } else if (word.endsWith('ss')) {
    // do nothing, "ss" stays
  } else if (word.endsWith('s')) {
    // remove the final 's' if there's a vowel somewhere before it
    let stem = word.slice(0, -1);
    if (hasVowel(stem)) {
      word = stem;
    }
  }

  // ---- Step 1b: Past tense / Gerund: -ed / -ing ----
  // Only remove if there's a vowel in the stem
  if (word.endsWith('ed')) {
    let stem = word.slice(0, -2);
    if (hasVowel(stem)) {
      word = stem;
      // After removing, handle some special endings:
      // e.g., "at"->"ate", "bl"->"ble", "iz"->"ize", or double consonant reduction
      if (word.endsWith('at') || word.endsWith('bl') || word.endsWith('iz')) {
        word += 'e';
      } else if (/(.)\1$/.test(word)) {
        // e.g. "hop" + "pp" -> "hopp" -> "hop"
        word = word.slice(0, -1);
      } else if (measure(word) === 1 && /^.*[^aeiou][aeiouy][^aeiouy]$/.test(word)) {
        // cvc where second c is not w,x,y => add "e"
        word += 'e';
      }
    }
  } else if (word.endsWith('ing')) {
    let stem = word.slice(0, -3);
    if (hasVowel(stem)) {
      word = stem;
      // same post-processing
      if (word.endsWith('at') || word.endsWith('bl') || word.endsWith('iz')) {
        word += 'e';
      } else if (/(.)\1$/.test(word)) {
        word = word.slice(0, -1);
      } else if (measure(word) === 1 && /^.*[^aeiou][aeiouy][^aeiouy]$/.test(word)) {
        word += 'e';
      }
    }
  }

  // ---- Step 1c: Turn final "y" -> "i" if there's a vowel in the stem
  if (word.endsWith('y')) {
    let stem = word.slice(0, -1);
    if (hasVowel(stem)) {
      word = stem + 'i';
    }
  }

  // ---- Step 2: Larger suffix replacements (measure(stem) > 0) ----
  //   Some examples from standard Porter:
  const step2Replacements = {
    'ational': 'ate',
    'tional': 'tion',
    'enci': 'ence',
    'anci': 'ance',
    'izer': 'ize',
    'bli': 'ble',
    'alli': 'al',
    'entli': 'ent',
    'eli': 'e',
    'ousli': 'ous',
    'ization': 'ize',
    'ation': 'ate',
    'ator': 'ate',
    'alism': 'al',
    'iveness': 'ive',
    'fulness': 'ful',
    'ousness': 'ous',
    'aliti': 'al',
    'iviti': 'ive',
    'biliti': 'ble',
    'logi': 'log'
  };

  for (let [suffix, replacement] of Object.entries(step2Replacements)) {
    if (word.endsWith(suffix)) {
      let stem = word.slice(0, -suffix.length);
      if (measure(stem) > 0) {
        word = stem + replacement;
      }
      break;
    }
  }

  // ---- Step 3: Some further suffixes (measure(stem) > 0) ----
  //  e.g., "icate" -> "ic", "ative" -> "", "alize" -> "al", etc.
  const step3Replacements = {
    'icate': 'ic',
    'ative': '',
    'alize': 'al',
    'iciti': 'ic',
    'ical': 'ic',
    'ful': '',
    'ness': ''
  };
  for (let [suffix, replacement] of Object.entries(step3Replacements)) {
    if (word.endsWith(suffix)) {
      let stem = word.slice(0, -suffix.length);
      if (measure(stem) > 0) {
        word = stem + replacement;
      }
      break;
    }
  }

  // ---- Step 4: Even more suffix chopping if measure(stem) > 1 ----
  //  E.g., "al", "ance", "ence", "er", "ic", "able", "ible", "ant", ...
  //  For brevity, let’s just do a few
  const step4Suffixes = [
    'al', 'ance', 'ence', 'er', 'ic', 'able', 'ible', 'ant',
    'ement', 'ment', 'ent', 'ou', 'ism', 'ate', 'iti', 'ous', 'ive', 'ize'
  ];
  for (let suffix of step4Suffixes) {
    if (word.endsWith(suffix)) {
      let stem = word.slice(0, -suffix.length);
      if (measure(stem) > 1) {
        word = stem;
      }
      break;
    }
  }

  // ---- Step 5: Final tidy ups ----
  // Remove a trailing "e" if measure(stem) > 1,
  // or if measure(stem) = 1 but NOT cvc
  if (word.endsWith('e')) {
    let stem = word.slice(0, -1);
    let m = measure(stem);
    if (m > 1 || (m === 1 && !/^.*[^aeiou][aeiouy][^aeiouy]$/.test(stem))) {
      word = stem;
    }
  }

  // If measure(word) > 1 and it ends with "ll", remove one "l"
  if (measure(word) > 1 && word.endsWith('ll')) {
      word = word.slice(0, -1);
  }
  return word;
}  

// Checks if two words (key and word) belong to the same synonyms group after stemming. 
// --avoiding use of explicit in user-made functions and code 
// synonyms for checking could be demand deposit, share, dda, etc.
// function attempts to match these to the Word provided returns true or false
function aiSynonymKey(key, word) {
  const stemmedKey = stem(key.toLowerCase());
  const stemmedWord = stem(word.toLowerCase());

  // Loop over each synonyms group
  for (const group of synonymsDataset) {
    // Stem every item in the current group
    const stemmedGroup = group.map(item => stem(item));

    // Check if both stemmedKey and stemmedWord appear in the same group
    if (stemmedGroup.includes(stemmedKey) && stemmedGroup.includes(stemmedWord)) {
      return true;
    }
  }

  // If we exhaust all groups without a match, return false
  return false;
}

function aiTranslator(headers, field, strict=false) {
  let cleanField;
  // Check if the field contains a dot, indicating it's in the '{source}.{function or object}' format
  if (field.includes('.')) {
    // Extract everything after the dot
    cleanField = field.split('.')[1];
  } else {
    // Otherwise, keep the field as it is
    cleanField = field;
  }

  // Remove any special characters and trim whitespace
  cleanField = cleanField.replace(/[^a-zA-Z0-9]/g, '').trim();

  const headersLower = headers.map(h => h.toLowerCase());
  const stemmedField = stem(cleanField.toLowerCase());

  // 1) Try to find a direct match (substring) in headers
  let matchIndex = headersLower.findIndex(header => header.includes(stemmedField));
  if (matchIndex !== -1) {
    return headers[matchIndex];
  }

  if (!strict) {
    // 2) If no direct match and not strict, check the synonym library
    // Use a for-of loop (or .some() ) so we can break out early once we find a match
    for (const dataset of synonymsDataset) {
      // Optionally, this mapping could be precomputed if synonymsDataset is large
      const synonyms = dataset.map(synonym => stem(synonym));
      // Only check synonyms that match the field
      if (synonyms.includes(stemmedField)) {
        // Now find a header that includes ANY of those synonyms
        matchIndex = headersLower.findIndex(headerLower =>
          synonyms.some(synonym => headerLower.includes(synonym))
        );
        if (matchIndex !== -1) {
          return headers[matchIndex];
        }
      }
    } 
  }

  // 3) If we exhaust synonymsDataset with no match, return null
  return null;
}

function aiTableTranslator(tableId, header = null) {
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
          updateTableWithMapping(mapping, tableId, header);
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

function updateTableWithMapping(mapping, tableId, header = null) {  
  const table = document.getElementById(tableId);
  const rows = table.getElementsByTagName('tr');
  let column = 0; // Default column index to 0

  // If header is provided, find the matching column index
  if (header) {
    const headerCells = rows[0].getElementsByTagName('th');
    for (let j = 0; j < headerCells.length; j++) {
      if (headerCells[j].innerHTML.includes(header)) {
        column = j;
        break;
      }
    }
  }

  // Update the table based on the mapping and column index
  for (let i = 1; i < rows.length; i++) { // Start from 1 to skip the header row
    const cells = rows[i].getElementsByTagName('td');
    let legendValue = cells[column].textContent.trim();

    // Normalize the legendValue to match the format in the mapping
    // Extract the first 5 digits if it's in ZIP+4 format
    const zipCodeMatch = legendValue.match(/^\d{5}/);
    if (zipCodeMatch) {
      legendValue = zipCodeMatch[0];
    }

    // Remove leading zeros to match the mapping key format
    legendValue = legendValue.replace(/^0+/, '');

    // Remove quotes if they exist
    legendValue = legendValue.replace(/['"]/g, '');

    // Ensure legendValue is properly converted to a number if numeric
    if (!isNaN(legendValue) && legendValue !== "") {
      legendValue = Number(legendValue);
    }

    //if (logger) console.log('legendValue', legendValue)
    // Check if the normalized legendValue exists in the mapping
    if (mapping[legendValue]) {
      cells[column].textContent = `${mapping[legendValue]} (${legendValue})`;
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
  const threeStandardDeviations = window.statistics[params.sourceIndex][aiTranslator(Object.keys(window.statistics[params.sourceIndex]), 'balance')].threeStdDeviations[1];
  const twoStandardDeviations = window.statistics[params.sourceIndex][aiTranslator(Object.keys(window.statistics[params.sourceIndex]), 'balance')].twoStdDeviations[1];
  
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