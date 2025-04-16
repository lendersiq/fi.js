// core/ai.js

window.synonyms = [
  ["amount", "principal"],
  ["withdrawal", "check", "debit"],
  ["deposit", "credit"],
  ["id", "code", "identifier"],
  ["service", "charge", "fee"]
];

function aiIsBusiness(...args) {  
  // Extract the params object from args
  const params = args[0][0];

  // Initialize isBusiness to false
  let isBusiness = false;

  // Validation: Check if relevant parameters exist and have valid values
  if (typeof params.balance !== 'number' || typeof params.consumerMaximum !== 'number' || typeof params.annualDeposits !== 'number') {
    throw new Error("Invalid or missing parameters. Ensure 'balance', 'consumerMaximum', and 'deposits' are provided as numbers.");
  }
  const threeStandardDeviations = getStatistic(params.sourceIndex, 'balance', 'threeStdDeviations')[1];
  const twoStandardDeviations = getStatistic(params.sourceIndex, 'balance', 'twoStdDeviations')[1];

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

/**********************************************************
 * A minimal "naive" stemmer:
 *    - Lowercase
 *    - Trim
 *    - Remove trailing "s", "ed", "ing"
 **********************************************************/
function naiveStem(str) {
  let s = str.toLowerCase().trim();
  s = s.replace(/s$/, '');
  s = s.replace(/ed$/, '');
  s = s.replace(/ing$/, '');
  return s;
}

/**********************************************************
 * findSynonymGroup(paramName):
 *    - Stem the paramName
 *    - Return the sub-array in window.synonyms if found
 **********************************************************/
function findSynonymGroup(paramName) {
  const lowerParam = paramName.toLowerCase();
  for (const group of window.synonyms) {
    for (const word of group) {
      if (lowerParam.includes(naiveStem(word))) {
        return group;
      }
    }
  }
  return null;
}

/**********************************************************
 * isSubstringMatch(stemA, stemB):
 *    - Return true if stemA is in stemB OR stemB is in stemA
 **********************************************************/
function isSubstringMatch(stemA, stemB) {
  return stemA.includes(stemB) || stemB.includes(stemA);
}

/**********************************************************
 * findMatchInKeys(word, keys):
 *    - Stem the 'word'
 *    - Loop over row keys, stem them
 *    - If substring matches, return that key
 **********************************************************/
function findMatchInKeys(word, paramName, keys) {
  const wordStem = naiveStem(word);
  for (const key of keys) {
    if (key.toLowerCase() === word.toLowerCase()) {
      return key;
    }
  }
  let bestMatch = null;
  let bestScore = -1;
  for (const key of keys) {
    const keyStem = naiveStem(key);
    if (keyStem.includes(wordStem)) {
      const score = keyStem.includes(naiveStem(paramName)) ? 2 : 1;
      if (score > bestScore || (score === bestScore && key.length < bestMatch?.length)) {
        bestMatch = key;
        bestScore = score;
      }
    }
  }
  //console.log(`findMatchInKeys parameters and best match=> word: ${word}, parameter name: ${paramName}, keys: ${keys}, best match: ${bestMatch}`);
  return bestMatch;
}

/*************************************************************
 * findBestKey(paramName, keys):
 *  - 1) Try a direct substring match on the paramName
 *  - 2) If not found, see if paramName belongs to any
 *        synonym group. If so, try each synonym in that group.
 *   - Return the first match or null if none is found.
 **************************************************************/
function findBestKey(paramName, keys) {
  let match = findMatchInKeys(paramName, paramName, keys);
  if (match) {
    //console.log(`[findBestKey] Direct match for "${paramName}" =>`, match);
    return match;
  }
  const group = findSynonymGroup(paramName);
  if (group) {
    const paramStem = naiveStem(paramName);
    for (const synonym of group) {
      if (naiveStem(synonym) === paramStem) continue;
      if (synonym.includes(paramName) && synonym !== paramName) continue;
      match = findMatchInKeys(synonym, paramName, keys);
      if (match) {
        //console.log(`[findBestKey] Synonym "${synonym}" for "${paramName}" =>`, match);
        return match;
      }
    }
  }
  return null;
}

/**
 * Splits a string by common word connectors (space, hyphen, underscore)
 * @param {string} str - The string to split
 * @returns {string[]} - Array of parts
 */
function splitByConnectors(str) {
  // Replace all connectors with a standard one, then split
  return str.replace(/[-_\s]+/g, ' ').trim().split(' ').filter(Boolean);
}

/**
 * Checks if a term appears at a word boundary in a string
 * Considers various word connectors (space, hyphen, underscore)
 */
function isAtWordBoundary(term, str) {
  const escTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const boundaryRegex = new RegExp(`(?:^|[-_\\s])${escTerm}(?:$|[-_\\s])`, 'i');
  return boundaryRegex.test(str);
}

/**
 * Calculate a match score between a parameter name and a key.
 * Higher score means better match.
 */
function calculateMatchScore(paramName, key, allSynonyms) {
  const originalParamName = paramName;
  paramName = paramName.toLowerCase();
  key = key.toLowerCase();

  // Direct match gets highest score
  if (key === paramName) return 100;

  // Calculate base score for substring matches
  let score = 0;

  // Normalize for comparison
  const normalizedParam = naiveStem(paramName);

  // Split the key by all common connectors
  const keyParts = splitByConnectors(key);
  const normalizedKeyParts = keyParts.map(part => naiveStem(part));

  // Also split the param by connectors
  const paramParts = splitByConnectors(paramName);
  const normalizedParamParts = paramParts.map(part => naiveStem(part));

  // Check for exact matches with normalized parts
  const exactPartMatches = normalizedKeyParts.filter(part =>
    normalizedParamParts.includes(part)
  ).length;

  if (exactPartMatches > 0) {
    score += 60 + (5 * exactPartMatches);
  }

  // Check if key contains param or vice versa
  if (key.includes(paramName)) {
    score += 70;
    // Bonus if it's at a word boundary
    if (isAtWordBoundary(paramName, key)) {
      score += 15;
    }
  } else if (normalizedKeyParts.some(part => part === normalizedParam)) {
    // Handle cases where normalized versions match
    score += 65;
  } else if (paramName.includes(key)) {
    score += 60;
  }

  // Find which synonym group the parameter belongs to, if any
  let paramSynonymGroup = null;
  for (const group of allSynonyms) {
    if (
      group.some(syn => {
        const normSyn = naiveStem(syn.toLowerCase());
        return (
          normSyn === normalizedParam ||
          normalizedParamParts.some(part => naiveStem(part) === normSyn)
        );
      })
    ) {
      paramSynonymGroup = group;
      break;
    }
  }

  // Keep track of which key parts we've matched, so we can penalize leftover unmatched ones
  const matchedKeyParts = new Set();

  // If param belongs to a synonym group, check for semantic relationships
  if (paramSynonymGroup) {
    let synonymsFoundInKey = new Set();
    let synonymRelationshipScore = 0;

    // Check how many different synonyms from this group appear in the key
    for (const synonym of paramSynonymGroup) {
      const normalizedSynonym = naiveStem(synonym.toLowerCase());
      const synonymParts = splitByConnectors(synonym).map(part =>
        naiveStem(part)
      );

      // Check each key part for synonym matches
      for (let i = 0; i < keyParts.length; i++) {
        const normKeyPart = normalizedKeyParts[i];

        // Direct synonym match
        if (normKeyPart === normalizedSynonym) {
          synonymsFoundInKey.add(synonym);
          matchedKeyParts.add(normKeyPart);
          // Give extra points if this isn't the original param
          synonymRelationshipScore +=
            normalizedSynonym !== normalizedParam ? 35 : 25;
        }
        // Check if any synonym part matches this key part
        else if (synonymParts.includes(normKeyPart)) {
          synonymsFoundInKey.add(synonym);
          matchedKeyParts.add(normKeyPart);
          synonymRelationshipScore +=
            normalizedSynonym !== normalizedParam ? 30 : 20;
        }
        // Partial synonym match
        else if (
          normKeyPart.includes(normalizedSynonym) ||
          normalizedSynonym.includes(normKeyPart)
        ) {
          synonymsFoundInKey.add(synonym);
          matchedKeyParts.add(normKeyPart);
          synonymRelationshipScore +=
            normalizedSynonym !== normalizedParam ? 25 : 15;
        }
      }
    }

    // When multiple synonyms from same group appear in the key, strong semantic match
    if (synonymsFoundInKey.size > 1) {
      synonymRelationshipScore += 30 * (synonymsFoundInKey.size - 1);
    }

    score += synonymRelationshipScore;
  }

  // Check for partial word matches
  let matchingParts = 0;
  for (let i = 0; i < paramParts.length; i++) {
    const paramPart = paramParts[i];
    if (paramPart.length < 3) continue; // Skip very short parts

    for (let j = 0; j < keyParts.length; j++) {
      const keyPart = keyParts[j];
      if (keyPart.includes(paramPart) || paramPart.includes(keyPart)) {
        matchingParts++;
        matchedKeyParts.add(normalizedKeyParts[j]);
      }
    }
  }

  if (matchingParts > 0) {
    score += 10 * matchingParts;
  }

  // ----------------------------------------------------
  // PENALTY FOR EXTRA UNMATCHED KEY PARTS
  // ----------------------------------------------------
  // If the key contains parts that don't match the param or any synonyms,
  // deduct some points for them, so we don't tie with simpler matches.
  const unmatchedKeyParts = normalizedKeyParts.filter(
    kp => !matchedKeyParts.has(kp)
  );

  // For each unmatched part, apply a deduction
  const penaltyPerUnmatched = 10;
  score -= penaltyPerUnmatched * unmatchedKeyParts.length;

  // ----------------------------------------------------
  // Tie-breaker bonus pass to address any close calls
  // ----------------------------------------------------
  // Flatten all synonyms into a set of naive-stemmed terms
  const allSynonymsSet = new Set();
  for (const group of allSynonyms) {
    for (const syn of group) {
      allSynonymsSet.add(naiveStem(syn.toLowerCase()));
    }
  }
  
  // Count how many recognized synonyms appear in this key
  let recognizedSynCount = 0;
  for (const kp of normalizedKeyParts) {
    if (allSynonymsSet.has(kp)) {
      recognizedSynCount++;
    }
  }
  
  // Add +5 for each recognized industry synonym in the key
  score += recognizedSynCount * 5;
  
  return score;
}


/**
 * Enhanced function to map an array of parameter names to keys
 * @param {Array} paramNames - Array of parameter names to find matches for
 * @param {Array} keys - Array of available keys to match against
 * @returns {Object} - Mapping of parameter names to matched keys
 */
function findBestKeysMapping(paramNames, keys) {
  const paramMap = {};
  const availableKeys = [...keys]; // Create a copy to track available keys
  
  // First pass: Calculate all possible matches with scores
  const allMatches = [];
  
  for (const paramName of paramNames) {
    // Direct and synonym matches with comprehensive scoring
    for (const key of availableKeys) {
      let score = calculateMatchScore(paramName, key, window.synonyms);
      // appConfig match bonus - when key explicitly matches Appconfig.table.id
		  const table = window.appConfig.table;
		  const isKeyInAppconfig = table.some(column => column.column_type  === "data" && column.id.includes(key));
		  if (isKeyInAppconfig) {
			  score += 25;
		  }

      if (score > 0) {
        allMatches.push({
          paramName,
          key,
          score,
          type: 'scored'
        });
      }
    }
  }

  // Sort matches by score (highest first)
  allMatches.sort((a, b) => b.score - a.score);
  
  // For debugging  
  console.log("All potential matches, sorted by score:");
  allMatches.forEach(match => {
    console.log(`${match.paramName} → ${match.key} (Score: ${match.score})`);
  });

  
  // Second pass: Assign keys to parameters, ensuring exclusivity
  while (allMatches.length > 0 && availableKeys.length > 0) {
    const match = allMatches.shift();
    
    // Skip if param already has a match or key is already taken
    if (paramMap[match.paramName] || !availableKeys.includes(match.key)) {
      continue;
    }
    
    // Assign this match
    paramMap[match.paramName] = match.key;
    
    // Remove this key from available keys
    const keyIndex = availableKeys.indexOf(match.key);
    if (keyIndex !== -1) {
      availableKeys.splice(keyIndex, 1);
    }
    
    // Remove all other potential matches for this parameter
    for (let i = allMatches.length - 1; i >= 0; i--) {
      if (allMatches[i].paramName === match.paramName) {
        allMatches.splice(i, 1);
      }
    }
  }
  
  // Return the final mapping
  return paramMap;
}

function getStatistic(sourceIndex, paramName, statistic) {
  const statistics = window.statistics[sourceIndex];
  const keys = Object.keys(statistics)
  const statIndex =  findBestKey(paramName, keys); 
  const designatedStat = statistics[statIndex];  
  if (designatedStat && Object.hasOwn(designatedStat, statistic)) {
    return designatedStat[statistic];
  } else {
    if (window.logger) { console.warn (`${statistic} statistic not found`) } 
  }
}

/********************************************************
 * Helper: Normal distribution for numeric columns
 * Box-Muller formula: z = sqrt(-2 * ln(u)) * cos(2πv)
 ********************************************************/
function randomNormal(mean, stdDev) {
  if (!stdDev) return mean;
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
}

/********************************************************
 * Helper: Clamp numeric
 ********************************************************/
function clamp(num, minVal, maxVal) {
  return Math.min(Math.max(num, minVal), maxVal);
}

/********************************************************
 * Helper: Detect date-like (string or Date object)
 ********************************************************/
function isDateLike(val) {
  if (val instanceof Date && !isNaN(val.getTime())) return true;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return !isNaN(parsed);
  }
  return false;
}

/********************************************************
 * Helper: Determine domain ('date', 'integer', 'decimal')
 ********************************************************/
function guessDomainType(colStats) {
  const { min, max, median, mode } = colStats;

  // If both min & max are date-like => treat column as a date
  if (isDateLike(min) && isDateLike(max)) return 'date';

  // Otherwise check numeric
  const numericVals = [min, max, median, mode].filter(
    (v) => typeof v === 'number' && !Number.isNaN(v)
  );
  if (
    numericVals.length > 0 &&
    numericVals.every((v) => Number.isInteger(v))
  ) {
    return 'integer';
  }
  return 'decimal';
}

/********************************************************
 * Helper: detect decimal precision among numeric stats
 ********************************************************/
function detectDecimalPrecision(...values) {
  let maxDecimals = 0;
  for (const val of values) {
    if (typeof val === 'number' && !Number.isInteger(val)) {
      const parts = val.toString().split('.');
      const decimals = parts[1]?.length || 0;
      if (decimals > maxDecimals) maxDecimals = decimals;
    }
  }
  return maxDecimals;
}

/********************************************************
 * Helper: Uniform random date in [minDate, maxDate]
 ********************************************************/
function randomDate(minDate, maxDate) {
  const minMs = minDate.getTime();
  const maxMs = maxDate.getTime();
  const randMs = minMs + Math.random() * (maxMs - minMs);
  return new Date(randMs);
}

/********************************************************
 * Helper: Add N months to a date
 ********************************************************/
function addMonths(baseDate, monthsToAdd) {
  const d = new Date(baseDate.getTime());
  d.setMonth(d.getMonth() + monthsToAdd);
  return d;
}

/********************************************************
 * Generate a random numeric value from stats
 ********************************************************/
function generateNumeric(colStats) {
  const { min, max, mean, stdDeviation, median, mode } = colStats;
  const domain = guessDomainType(colStats);

  let finalMean = (typeof mean === 'number') ? mean : 0;
  if (domain === 'integer') {
    finalMean = Math.round(finalMean);
  }

  let val = randomNormal(finalMean, stdDeviation || 0);
  if (typeof min === 'number' && typeof max === 'number') {
    val = clamp(val, min, max);
  }

  if (domain === 'integer') {
    return Math.round(val);
  } else {
    const prec = detectDecimalPrecision(min, max, mode);
    if (typeof val !== 'number' || isNaN(val)) val = 0;
    return parseFloat(val.toFixed(prec));
  }
}

/********************************************************
 * 1) Identify date columns, sorted by earliest min date
 * 2) Generate date columns in ascending chain
 * 3) Generate numeric columns
 ********************************************************/
function generateSingleRow(stats) {
  const allCols = Object.keys(stats);

  // Split date vs numeric columns
  const dateCols = [];
  const numericCols = [];
  for (const colName of allCols) {
    const domain = guessDomainType(stats[colName]);
    if (domain === 'date') {
      dateCols.push(colName);
    } else {
      numericCols.push(colName);
    }
  }

  // Sort date columns by earliest min date
  dateCols.sort((a, b) => {
    const A = stats[a];
    const B = stats[b];
    const minA = (A.min instanceof Date) ? A.min : new Date(A.min);
    const minB = (B.min instanceof Date) ? B.min : new Date(B.min);
    return minA - minB;
  });

  // Generate date columns in ascending chain
  const dateValues = {};
  let prevDate = null;
  for (let i = 0; i < dateCols.length; i++) {
    const colName = dateCols[i];
    const colStats = stats[colName];
    const domain = guessDomainType(colStats); // should be 'date'

    // Convert min & max to Date objects
    let colMinDate = (colStats.min instanceof Date) ? colStats.min : new Date(colStats.min);
    let colMaxDate = (colStats.max instanceof Date) ? colStats.max : new Date(colStats.max);

    // If it's the first date column, pick random in [colMinDate, colMaxDate]
    if (i === 0) {
      dateValues[colName] = randomDate(colMinDate, colMaxDate);
      prevDate = dateValues[colName];
    } else {
      // Next date must be 6..360 months after prevDate, then also clamped to [colMinDate, colMaxDate]
      // 1) Generate random years offset (1 to 60) semi-annual periods then multiply by 6 for better correlation with previous date
      const offsetMonths = (Math.floor(Math.random() * 60) + 1) * 6; 
      dateValues[colName] = addMonths(prevDate, offsetMonths);
      prevDate = dateValues[colName];
    }
  }

  // Generate numeric columns
  const numericValues = {};
  for (const colName of numericCols) {
    const colStats = stats[colName];
    // If there's a uniqueArray, pick from it
    if (Array.isArray(colStats.uniqueArray) && colStats.uniqueArray.length > 0) {
      const arr = colStats.uniqueArray;
      numericValues[colName] = arr[Math.floor(Math.random() * arr.length)];
    } else {
      numericValues[colName] = generateNumeric(colStats);
    }
  }

  // Combine
  return { ...dateValues, ...numericValues };
}

/********************************************************
 * Finally: generate N rows, then build CSV
 ********************************************************/
function generateSyntheticCSV(stats, lines) {
  const columns = Object.keys(stats);
  const csvRows = [];
  // CSV header
  csvRows.push(columns.join(","));

  for (let i = 0; i < lines; i++) {
    const rowObj = generateSingleRow(stats);
    const rowData = columns.map((col) => {
      const val = rowObj[col];
      // If a Date => format
      if (val instanceof Date) {
        // format as "YYYY-MM-DD"
        return val.toISOString().slice(0, 10);
      }
      // Otherwise numeric or string
      return val;
    });
    csvRows.push(rowData.join(","));
  }
  return csvRows.join("\n");
}

/**********************************************************
 * Testing
 **********************************************************/
// Suppose these are the row keys we have
const rowKeys = [
  "Portfolio",
  "Open_Date",
  "Branch_Number",
  "Class_Code",
  "Owner_Code",
  "Statement_Rate",
  "Average_Balance",
  "PMTD_Interest_Earned",
  "PMTD_Checks",
  "PMTD_Service_Charge",
  "PMTD_Service_Charge_Waived",
  "PMTD_Other_Charges",
  "PMTD_Other_Charges_Waived",
  "PMTD_Number_of_Deposits",
  "PMTD_Number_of_Items_NSF",
  "Risk_Rating",
  "Maturity_Date",
  "Term_Code"
];

console.log('AI Tests')
// 7A) "withdrawals" => stems to "withdrawal"
//     direct match fails
//     findSynonymGroup => ["withdrawal", "check", "debit"]
//     tries "withdrawal", then "check", then "debit"
//     "check" => match "PMTD_Checks" 
console.log(`'withdrawals' match test "check" => match "PMTD_Checks": `, findBestKey("withdrawals", rowKeys));

// 7B) "sourceIndex" => 
//     no direct match, not in any synonym group => null
console.log(`'sourceIndex' match test (null): `, findBestKey("sourceIndex", rowKeys));

// 7C) "checks" => 
//     direct match fails
//     findSynonymGroup => ["withdrawal", "check", "debit"] 
//         because "checks" => "check"
//     tries synonyms => "withdrawal", "check", "debit"
//     "check" => match "PMTD_Checks"
console.log(`'checks' match test "check" => match "PMTD_Checks": `, findBestKey("checks", rowKeys));

// 7D) "amount" => 
//     direct match fails
//     synonym group => ["amount", "principal"]
//     tries "principal", might or might not match something 
//     in rowKeys. If there's no overlap, returns null
console.log(`'amount' match test (null): `, findBestKey("amount", rowKeys));
console.log(`'risk' match test "risk" => match "Risk_Rating": `, findBestKey("risk", rowKeys));
console.log(`'maturity' match test "maturity" => match "Maturity_Date": `, findBestKey("maturity", rowKeys));
console.log(`'term_code' should match test "term_code" => match "TERM_CODE": `, findBestKey("term_code", rowKeys));
