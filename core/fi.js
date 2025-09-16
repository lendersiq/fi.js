(() => {
  // 1) Set appConfig to global scope and Validate appConfig
  let chartLegendMap = {};

  const validJSON = (configObject) => {
    const jsonString = JSON.stringify(configObject);
    try {
    const parsed = JSON.parse(jsonString);
    return true;
    } catch(e) {
    alert("appConfig is invalid:\n" + e.message + "\n" + jsonString);
    return false;
    }
  };

  if (!appConfig || typeof appConfig !== 'object' || appConfig === null) {
    console.error("appConfig is not defined or is not a valid object.");
    return;
  }

  if (!validJSON(appConfig)) {
    return;
  }

  const loadScript = (src, callback) => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.onload = callback; // Trigger callback when the script is loaded
    document.head.appendChild(script);
  };

  const asciiFIjs = `
  FFFFFFF  IIIIIII         j    ssss
  F           I            j   s
  FFFFFF      I            j    sss
  F           I     ..  j  j       s
  F        IIIIIII  ..   jjj   ssss
  `;
  console.log(asciiFIjs);

  // Load scripts in the correct order
  loadScript("../../core/ai.js", () => {
    console.log("ai.js loaded");
    loadScript("../../core/fiCharts.js", () => {
      console.log("fiCharts.js loaded");
      loadScript("../../core/ui.js", () => {
        console.log("ui.js loaded");
        loadScript("../../libraries/organization.js", () => {
          console.log("libraries/organization.js loaded");
          loadScript("../../libraries/financial.js", () => {
            console.log("libraries/financial.js loaded");
          // function tests
          console.log('Function Tests')
          if (window.financial && window.financial.functions && window.financial.functions['loanProfit']) {
            console.log ('Function parameter test: ', getFunctionParameters(window.financial.functions['loanProfit'].implementation));
          } else {
            console.log('Financial functions not yet loaded');
          }
          const fn = createFilterFn('>= 730', 'date');
          // Suppose you're around 2025-03-23 when you run this
          console.log( fn('2023-03-24') );  // Expect: ???

          //filter tests
          const filterFn = createFilterFn("> 2024-01-01 && <= 2024-11-03", "date");
          console.log(filterFn("2024-06-15")); // true (between Jan 1 and Nov 3, 2024)
          console.log(filterFn("2023-12-31")); // false (before Jan 1, 2024)
          console.log(filterFn("2024-12-01")); // false (after Nov 3, 2024)

          // More examples
          const filterFn2 = createFilterFn("> 2024-01-01 || < 2023-01-01", "date");
          console.log(filterFn2("2024-06-15")); // true (after Jan 1, 2024)
          console.log(filterFn2("2022-06-15")); // true (before Jan 1, 2023)
          console.log(filterFn2("2023-06-15")); // false (in between)

          const filterFn3 = createFilterFn("!<= 2024-01-01", "date");
          console.log(filterFn3("2024-06-15")); // true (not <= Jan 1, 2024)
          console.log(filterFn3("2023-06-15")); // false (is <= Jan 1, 2024)
          });
        });
      });
    });
  });
  const base64Svg = "data:image/png;base64,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";
  renderFavicon(base64Svg);

  // Make initializeDisplay globally available for ui.js to call
  window.initializeDisplay = initializeDisplay;

  // 2) Identify the unique column config (exactly one assumed) - only for table-based apps
  if (appConfig.table) {
    const uniqueConfig = appConfig.table.find(
      cfg => cfg.column_type === "data" && cfg.data_type === "unique"
    );
    if (!uniqueConfig) {
      console.error("No unique column configuration found (data_type = 'unique').");
      return;
    }
  }
  
  // Only proceed with table-based processing if table exists
  if (!appConfig.table) {
    console.log("Forms-based app detected - skipping table processing");
    return;
  }
  
  const uniqueConfig = appConfig.table.find(
    cfg => cfg.column_type === "data" && cfg.data_type === "unique"
  );
  const uniqueColumn = uniqueConfig.id; // e.g. "Portfolio"

  // 3) Prepare global data structures
  window.rawData = {};
  window.filteredData = {};
  window.cleanData = {};      // filteredData[sourceName] => array of filtered rows
  window.combinedData = {}; // combined object keyed by unique column
  window.paramMap = {}; //The first time we call buildParamValues for "loan", we compute and store the match for each paramName into window.paramMap.loan. After that, we skip the expensive findBestKey AI calls.
  window.logger = true;

  // 4) Gather unique source names
  const uniqueSources = [
    ...new Set(
      appConfig.table
        .map(cfg => cfg.source_name)
        .filter(Boolean)
    )
  ];

  // We'll track how many sources are loaded to know when to combine
  let loadedCount = 0;

  // 5) Build the main modal
  const modalBackdrop = document.createElement("div");
  modalBackdrop.id = "modalBackdrop";
  Object.assign(modalBackdrop.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.4)",
    zIndex: "9999",
  });

  const modal = document.createElement("div");
  Object.assign(modal.style, {
    background: "#fff",
    padding: "0",
    borderRadius: "5px",
    width: "400px",
    maxHeight: "80vh",
    overflowY: "auto",
  });
  const modalHeader = document.createElement("div");
  modalHeader.classList.add("modal-header");
  const closeButton = document.createElement("button");
  closeButton.classList.add("close-button");
  closeButton.ariaLabel = "Close Modal";
  closeButton.innerHTML = "&times;";
  closeButton.addEventListener("click", () => {
    document.body.removeChild(modalBackdrop);
  });

  modalHeader.appendChild(closeButton);
  modal.appendChild(modalHeader);
  const modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");
  const modalHero = document.createElement('div');
  const logoImage = document.createElement("img");
  logoImage.src = base64Svg;
  logoImage.alt = "JS Box Logo";
  logoImage.width = 70;
  logoImage.height = 70;
  modalHero.appendChild(logoImage);
  modalContent.appendChild(modalHero);
  const instructions = document.createElement('p');
  instructions.textContent = 'Select data from the secure source.';
  modalContent.appendChild(instructions);

  const filterCache = {};
  uniqueSources.forEach(sourceName => {
    const filterConfigs = appConfig.table.filter(
      c => c.source_name === sourceName && c.where && c.column_type === "data"
    );
    // Only grab filters that match this sourceName, have a where, and are "data" type
    if (filterConfigs.length) {
      filterCache[sourceName] = filterConfigs.map(cfg => ({
        column: cfg.id,
        fn: createFilterFn(cfg.where, cfg.data_type)
      }));
    }
  });
  console.log('filterCache', filterCache)

  // Use DocumentFragment to batch DOM updates
  const fragment = document.createDocumentFragment();
  // For each source, create a file input
  uniqueSources.forEach(sourceName => {
    const label = document.createElement("label");
    label.textContent = `Choose ${sourceName} source`;
    label.classList.add("custom-file-upload");

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv";
    fileInput.classList.add("hidden-file-input");
    fileInput.addEventListener("change", async evt => {
      const file = evt.target.files[0];
      if (!file) return;

      try {
        // 1. Read and parse from CSV
        const csvContent = await file.text();
        window.rawData[sourceName] = parseCSV(csvContent);
        console.log(`raw data before for ${sourceName}: `, window.rawData[sourceName]);

        // 2. Compute statistics on original data
        window.statistics = window.statistics || {};
        window.statistics[sourceName] = computeStatistics(window.rawData[sourceName]);

        // 3. Apply filters to raw data (this uses original column IDs from the CSV)
        applyFilterstoRawData(sourceName);

        // 4. Apply functions to raw data (this also uses original column IDs)
        applyFunctions(sourceName);

        // 5. REMAP and CLEAN data: Rename columns from `id` to `heading` to make them unique
        const remappedRows = window.rawData[sourceName].map(row => {
            const newRow = {};

            // Find all column configs that could apply to this source's data
            // This includes configs for this specific source_name and global ones (no source_name)
            const applicableConfigs = appConfig.table.filter(cfg =>
                !cfg.source_name || cfg.source_name === sourceName
            );

            applicableConfigs.forEach(cfg => {
                const sourceKey = cfg.id;     // The key in the raw data, e.g., "Average_Balance"
                const destKey = cfg.heading;  // The new, unique key, e.g., "Checking Balance"

                if (row.hasOwnProperty(sourceKey)) {
                    newRow[destKey] = row[sourceKey];
                }
            });
            return newRow;
        });


        // Store the remapped data in cleanData
        window.cleanData[sourceName] = remappedRows;
        console.log(`Cleaned and remapped data for ${sourceName}:`, remappedRows);

        // 6. Increment loadedCount. If all done, combine and render.
        loadedCount++;
        if (loadedCount === uniqueSources.length) {
          const modalBackdrop = document.getElementById("modalBackdrop");
          document.body.removeChild(modalBackdrop);

          console.log('Final Statistics:', window.statistics);
          combineData();
          applyFormulas();
          buildPresentation();
        }
      } catch (error) {
        console.error(`Error processing ${sourceName}:`, error);
      }

      // update source selectors` labels
      label.classList.add('completed');
      label.innerHTML = `${sourceName}: ${file.name}`;
    });

    label.appendChild(document.createElement("br"));
    label.appendChild(fileInput);
    fragment.appendChild(label);
  });
  modalContent.appendChild(fragment);

  // Your existing modal setup code (modalBackdrop, modal, etc.) goes here...

  // Log for debugging
  // Add discover container only if appConfig exists and has a description
  if (appConfig && appConfig.description) {
    const discoverContainer = document.createElement('div');
    discoverContainer.style.cssText = `
      margin-top: 20px;
      text-align: center;
      transition: all 0.3s ease;
    `;

    const discoverButton = document.createElement('button');
    discoverButton.textContent = 'Discover More';
    Object.assign(discoverButton.style, {
      background: 'linear-gradient(135deg, var(--fijs-gradient1), var(--fijs-gradient2))',
      color: '#fff',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '14px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.3s ease'
    });

    discoverButton.addEventListener('mouseover', () => {
      discoverButton.style.transform = 'scale(1.05)';
    });
    discoverButton.addEventListener('mouseout', () => {
      discoverButton.style.transform = 'scale(1)';
    });

    const infoContainer = document.createElement('div');
    Object.assign(infoContainer.style, {
      maxHeight: '0',
      opacity: '0',
      overflow: 'hidden',
      transition: 'all 0.5s ease',
      marginTop: '0',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '5px',
      padding: '0 15px'
    });

    // Use appConfig.description instead of appInfo[0].about
    const aboutText = document.createElement('div'); 
    const aboutFilters = getFriendlyFilterDescriptions(window.appConfig).join('\n');
    aboutText.innerHTML = appConfig.description + '\n' + aboutFilters;
    Object.assign(aboutText.style, {
      margin: '15px 0',
      lineHeight: '1.5',
      color: '#333'
    });
    infoContainer.appendChild(aboutText);

    let isOpen = false;
    discoverButton.addEventListener('click', () => {
      if (!isOpen) {
        infoContainer.style.maxHeight = '200px'; // Adjust based on content length
        infoContainer.style.opacity = '1';
        infoContainer.style.padding = '15px';
        discoverButton.textContent = 'Hide Details';
        discoverButton.style.transform = 'scale(1)';
      } else {
        infoContainer.style.maxHeight = '0';
        infoContainer.style.opacity = '0';
        infoContainer.style.padding = '0 15px';
        discoverButton.textContent = 'Discover More';
      }
      isOpen = !isOpen;
    });

    discoverContainer.appendChild(discoverButton);
    discoverContainer.appendChild(infoContainer);
    modalContent.appendChild(discoverContainer);
  }

  // Append modalContent to modal (this remains regardless of appConfig)
  modal.appendChild(modalContent);
  modalBackdrop.appendChild(modal);
  document.body.appendChild(modalBackdrop);

  // formatValue functions for display
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const floatFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  const percentFormatter = new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  function formatValue(value, dataType) {
    if (value == null || value === "") {
      return "";
    }
    switch (dataType) {
      case "currency": {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? value : currencyFormatter.format(parsed);
      }
      case "integer": {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? value : parsed;
      }
      case "float": {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? value : floatFormatter.format(parsed);
      }
      case "rate": {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? value : percentFormatter.format(parsed);
      }
      default:
        return value;
    }
  }

  // --- Combine data across sources into window.combinedData ---
  function combineData() {
    window.combinedData = {};

    // Gather all sub-rows (which now have unique keys based on headings)
    Object.keys(window.cleanData).forEach(sourceName => {
      const rows = window.cleanData[sourceName];
      console.log('sourceData before combining', rows)
      rows.forEach(row => {
        // The unique key is now the heading of the unique column
        const uniqueValue = row[uniqueConfig.heading];
        if (!uniqueValue) return; // skip if missing the unique ID
        if (!window.combinedData[uniqueValue]) {
          window.combinedData[uniqueValue] = {
            subRows: [],
            totals: {},
          };
        }
        window.combinedData[uniqueValue].subRows.push(row);
      });
    });

    // Aggregate to get "totals" for each uniqueVal
    Object.keys(window.combinedData).forEach(uniqueVal => {
      const entry = window.combinedData[uniqueVal];
      const subRows = entry.subRows;
      entry.totals = computeAggregates(subRows);
    });

    applyFiltersToTotals();
    console.log("Combined data (with subRows):", window.combinedData);
  }

  /**
   * Aggregation logic now works on data with unique `heading` keys.
   */
  function computeAggregates(rows) {
      const totals = {};

      const aggregatableCols = appConfig.table.filter(cfg =>
          ["data", "function", "formula"].includes(cfg.column_type)
      );

      aggregatableCols.forEach(cfg => {
          // The 'heading' is the unique key we now use for aggregation.
          const destKey = cfg.heading;
          const colType = cfg.data_type;

          // Gather all values from the rows for this specific destination key.
          // No need to filter by source name because the keys are already unique.
          const values = rows
              .map(r => (r[destKey] !== undefined ? r[destKey] : ""))
              .filter(v => v !== "");

          if (values.length === 0) {
              totals[destKey] = "";
              return;
          }

          switch (colType) {
              case "unique":
                  totals[destKey] = values[0];
                  break;

              case "currency":
              case "float": {
                  let sum = 0;
                  values.forEach(val => {
                      const parsed = parseFloat(val);
                      if (!isNaN(parsed)) sum += parsed;
                  });
                  totals[destKey] = sum.toString();
                  break;
              }

              case "rate": {
                let sum = 0;
                let count = 0;
                values.forEach(val => {
                    const parsed = parseFloat(val);
                    if (!isNaN(parsed)) {
                        sum += parsed;
                        count++;
                    }
                });
                totals[destKey] = count > 0 ? (sum / count).toString() : "0";
                break;
              }

              case "integer": {
                  const freq = {};
                  values.forEach(v => {
                      const parsed = parseInt(v, 10);
                      if (!isNaN(parsed)) {
                          freq[parsed] = (freq[parsed] || 0) + 1;
                      }
                  });
                  let maxCount = -Infinity;
                  let modeValue = "";
                  Object.keys(freq).forEach(k => {
                      if (freq[k] > maxCount) {
                          modeValue = k;
                          maxCount = freq[k];
                      }
                  });
                  totals[destKey] = modeValue;
                  break;
              }

              case "date": {
                  let earliest = null;
                  values.forEach(dateStr => {
                      const d = new Date(dateStr);
                      if (!isNaN(d.getTime())) { // valid date check
                          if (earliest === null || d < earliest) {
                              earliest = d;
                          }
                      }
                  });
                  totals[destKey] = earliest ? earliest.toISOString().split('T')[0] : "";
                  break;
              }

              default:
                  const distinct = [...new Set(values)];
                  totals[destKey] = distinct.join(", ");
                  break;
          }
      });
      return totals;
  }

  // --- Apply any filters defined in appConfig.table ---
  function applyFilterstoRawData(sourceName) {
    // Get cached filters, if any
    const parsedFilters = filterCache[sourceName];
    if (!parsedFilters || !parsedFilters.length) return;

    // Optimize filtering by combining predicates into a single function
    window.rawData[sourceName] = window.rawData[sourceName].filter(row => {
      // Use every() for early termination
      return parsedFilters.every(filterObj => {
        const value = row[filterObj.column];
        return filterObj.fn(value);
      });
    });
  }

  // --- Apply any filters defined in appConfig.table ---
  // used to apply to totals
  function applyFiltersToTotals() {
    const filterConfigs = appConfig.table.filter(
      c => c.where && c.column_type === "data"
    );
    if (!filterConfigs.length) return;

    const parsedFilters = filterConfigs.map(cfg => {
      return {
        column: cfg.heading, // Filter on the final heading key
        fn: createFilterFn(cfg.where, cfg.data_type)
      };
    });

    Object.keys(window.combinedData).forEach(uniqueVal => {
      const { totals } = window.combinedData[uniqueVal];
      let keep = true;
      for (const filterObj of parsedFilters) {
        const val = totals[filterObj.column];
        if (!filterObj.fn(val)) {
          keep = false;
          break;
        }
      }
      if (!keep) {
        delete window.combinedData[uniqueVal];
      }
    });
  }

  function createFilterFn(filter, dataType) {
    console.log("filter,dataType", filter, dataType);
    filter = (filter || "").trim();

    // Array Membership (Set Inclusion) Operator
    if (/^\[.*\]$/.test(filter)) {
      let arr;
      try {
        const normalizedFilter = filter.replace(/\s*,\s*/g, ',').replace(/\s+/g, '');
        arr = JSON.parse(normalizedFilter);
        if (!Array.isArray(arr)) {
          throw new Error('Parsed result is not an array');
        }
      } catch (e) {
        console.error("Failed to parse array filter:", filter, e);
        return () => true; // fallback: pass all
      }
      return (rawValue) => {
        const actual = convert(rawValue);
        return arr.includes(actual);
      };
    }

    // Parse and evaluate logical expressions with &&, ||, and !
    const comparisonRegex = /^(==|!=|>=|<=|>|<)\s*(.*)$/;

    // Split by || (OR) first, then handle && (AND) and ! (NOT) within each OR clause
    const orConditions = filter.split(/\s*\|\|\s*/).map(orClause => orClause.trim());

    // Build filter functions for each OR clause
    const orFilterFns = orConditions.map(orClause => {
      // Handle NOT operator
      const hasNot = orClause.startsWith('!');
      const cleanClause = hasNot ? orClause.slice(1).trim() : orClause;

      // Split AND conditions within this OR clause
      const andConditions = cleanClause.split(/\s*&&\s*/).map(cond => cond.trim());

      // Create filter functions for each AND condition
      const andFilterFns = andConditions.map(condition => {
        const match = condition.match(comparisonRegex);
        if (!match) {
          console.warn("Invalid condition:", condition);
          return () => true;
        }

        const operator = match[1];
        const rightStr = match[2].trim();

        return (rawValue) => {
          const leftVal = convert(rawValue);
          let rightVal = rightStr;

          if (dataType === "date") {
            rightVal = parseDateOrOffset(rightStr);
          } else if (["integer", "float", "currency", "rate"].includes(dataType)) {
            const parsedNum = parseFloat(rightStr);
            rightVal = isNaN(parsedNum) ? rightStr : parsedNum;
          }

          if (leftVal instanceof Date && rightVal instanceof Date) {
            const leftTime = leftVal.getTime();
            const rightTime = rightVal.getTime();
            switch (operator) {
              case "==": return leftTime === rightTime;
              case "!=": return leftTime !== rightTime;
              case ">":  return leftTime >  rightTime;
              case "<":  return leftTime <  rightTime;
              case ">=": return leftTime >= rightTime;
              case "<=": return leftTime <= rightTime;
              default:   return true;
            }
          }

          switch (operator) {
            case "==": return leftVal == rightVal;
            case "!=": return leftVal != rightVal;
            case ">":  return leftVal >  rightVal;
            case "<":  return leftVal <  rightVal;
            case ">=": return leftVal >= rightVal;
            case "<=": return leftVal <= rightVal;
            default:   return true;
          }
        };
      });

      // Combine AND conditions, applying NOT if present
      return (rawValue) => {
        const andResult = andFilterFns.every(fn => fn(rawValue));
        return hasNot ? !andResult : andResult;
      };
    });

    // Combine OR conditions
    if (orFilterFns.length > 0) {
      return (rawValue) => {
        return orFilterFns.some(fn => fn(rawValue));
      };
    }

    // Single condition fallback (no logical operators)
    const match = filter.match(comparisonRegex);
    if (match) {
      const operator = match[1];
      const rightStr = match[2].trim();

      return (rawValue) => {
        const leftVal = convert(rawValue);
        let rightVal = rightStr;

        if (dataType === "date") {
          rightVal = parseDateOrOffset(rightStr);
        } else if (["integer", "float", "currency", "rate"].includes(dataType)) {
          const parsedNum = parseFloat(rightStr);
          rightVal = isNaN(parsedNum) ? rightStr : parsedNum;
        }

        if (leftVal instanceof Date && rightVal instanceof Date) {
          const leftTime = leftVal.getTime();
          const rightTime = rightVal.getTime();
          switch (operator) {
            case "==": return leftTime === rightTime;
            case "!=": return leftTime !== rightTime;
            case ">":  return leftTime >  rightTime;
            case "<":  return leftTime <  rightTime;
            case ">=": return leftTime >= rightTime;
            case "<=": return leftTime <= rightTime;
            default:   return true;
          }
        }

        switch (operator) {
          case "==": return leftVal == rightVal;
          case "!=": return leftVal != rightVal;
          case ">":  return leftVal >  rightVal;
          case "<":  return leftVal <  rightVal;
          case ">=": return leftVal >= rightVal;
          case "<=": return leftVal <= rightVal;
          default:   return true;
        }
      };
    }

    console.warn("Unrecognized filter:", filter);
    return () => true;

    // Helper: handle row values for non-filter conversions
    function convert(val) {
      if (["integer", "float", "currency", "rate"].includes(dataType)) {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }

      if (dataType === "date") {
        const asDate = new Date(val);
        return isNaN(asDate.getTime()) ? val : asDate;
      }

      return val;
    }

    // Helper: parse the right-hand side of a date filter
    function parseDateOrOffset(str) {
      const offset = parseInt(str, 10);
      if (!isNaN(offset) && /^[+-]?\d+$/.test(str)) {
        const d = new Date();
        d.setDate(d.getDate() - offset);
        return d;
      }

      const d = new Date(str);
      return isNaN(d.getTime()) ? str : d;
    }
  }

  /*************************************************************
   * APPLY FORMULA COLUMNS
   *************************************************************/
  function applyFormulas() {
    let count = 0;
    let uniqueCount = 0;
    const formulaCols  = appConfig.table.filter(c => c.column_type === "formula");

    // For each unique entry in combinedData, apply these columns
    const allKeys = Object.keys(window.combinedData);
    allKeys.forEach(key => {
      const entry = window.combinedData[key];
      if (!entry) return;
      count += entry.subRows.length;
      uniqueCount += 1;

      entry.subRows.forEach(row => {
        applyFormulaCols(row, formulaCols);
      });

      // Re-aggregate so "totals" reflect new columns
      entry.totals = computeAggregates(entry.subRows);

      // cross sourced formula calculations
      applyFormulaCols(entry.totals, formulaCols);

    });

    window.statistics['filtered'] = window.statistics['filtered'] || {};
    window.statistics['filtered'].count = count;
    window.statistics['filtered'].unique = uniqueCount;
    console.log("Applied to formulas:", window.combinedData);
  }

  function applyFormulaCols(row, formulaCols) {
      // Since `row` has keys based on `heading`, we need a map from a formula variable (`id`) to its `heading`
      // to look up values correctly.
      const idToHeading = new Map(
          appConfig.table.map(c => [c.id, c.heading])
      );

      formulaCols.forEach(col => {
          const expr = col.formula || "";
          const destKey = col.heading; // The result is stored under the formula's heading
          let result = null;

          try {
              // Extract variable names from the formula expression (these are `id`s)
              const variables = [...new Set(expr.match(/[a-zA-Z_]\w*/g))] || [];
              const context = {};

              // Build the context for evaluation by mapping formula `id`s to values from the `row`
              variables.forEach(varName => {
                  const headingName = idToHeading.get(varName); // Find the heading for this variable ID
                  let value = row[headingName];                 // Get the value from the row using the heading
                  if (typeof value === 'string') value = value.trim();
                  // Provide the value to the context with the `id` as the key
                  context[varName] = isNaN(Number(value)) || value === '' || value === null || value === undefined ? 0 : Number(value);
              });

              // Pre-check for division by 0
              const divisionMatches = [...expr.matchAll(/\/\s*([a-zA-Z_]\w*)/g)];
              const hasInvalidDenominator = divisionMatches.some(match => {
                  const varName = match[1];
                  return context[varName] === 0;
              });

              if (hasInvalidDenominator) {
                  result = 0;
              } else {
                  // Build and run the safe function
                  const argNames = Object.keys(context);
                  const argValues = Object.values(context);
                  const safeFunction = new Function(...argNames, `return (${expr});`);
                  const computed = safeFunction(...argValues);
                  result = (typeof computed === 'number' && isFinite(computed)) ? computed : 0;
              }

          } catch (err) {
              console.error(`Error evaluating formula "${expr}" for row:`, row, err);
              result = 0;
          }
          // Store the result in the row using the formula's unique heading
          row[destKey] = result;
      });
  }

  // Regex patterns for date detection (YYYY-MM-DD or YYYY/MM/DD)
  const isoDateRegexDash = /^\d{4}-\d{2}-\d{2}$/;
  const isoDateRegexSlash = /^\d{4}\/\d{2}\/\d{2}$/;

  // Helper to convert numeric parts to a YYYY-MM-DD string
  function toDateOnlyString(year, month, day) {
    // month is 1-based from the split, so no need to +1 or -1 here
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  function buildParamValues(paramNames, row, sourceName) {
    // 1) Ensure we have a paramMap object for this source
      // check whether we have cached paramMap for the source to save compute
    if (!window.paramMap[sourceName]) {
      window.paramMap[sourceName] = {};
      window.paramMap[sourceName] = findBestKeysMapping(paramNames, Object.keys(row)) || null;
      console.log ('paramMap', window.paramMap[sourceName])
      /*
      legacy @.@
      // 2) to save compute we examine each paramName, see if we have a cached matched key
      //    If not, we call findBestKey once and store it.
      paramNames.forEach(paramName => {
        if (!window.paramMap[sourceName][paramName]) {

          const matchedKey = findBestKey(paramName, Object.keys(row));
          // Store the result (or null if none)
          window.paramMap[sourceName][paramName] = matchedKey || null;
        }
      });
      */
    }

    // 3) Now build the return array by using the cached mapping
    return paramNames.map(paramName => {
      const matchedKey = window.paramMap[sourceName][paramName];

      // If there's no matched key, return null (or 0, or throw)
      if (!matchedKey) {
        return null;
      }

      const rawValue = row[matchedKey];

      // --- Type Conversion Logic ---

      // (A) Already a valid Date object? Convert to YYYY-MM-DD string
      if (rawValue instanceof Date && !isNaN(rawValue)) {
        const y = rawValue.getFullYear();
        const m = rawValue.getMonth() + 1;  // zero-based month
        const d = rawValue.getDate();
        return toDateOnlyString(y, m, d);
      }

      // (B) If it's a number, return as-is
      if (typeof rawValue === 'number') {
        return rawValue;
      }

      // (C) If it's a string, check if it's an ISO-like date or numeric
      if (typeof rawValue === 'string') {
        const trimmed = rawValue.trim();

        // (C1) ISO date format -> convert to date-only string
        if (isoDateRegexDash.test(trimmed) || isoDateRegexSlash.test(trimmed)) {
          const parts = trimmed.split(/[-/]/).map(Number); // e.g. [2024, 12, 17]
          const [year, month, day] = parts;
          return toDateOnlyString(year, month, day);
        }

        // (C2) If it's numeric -> parse as int or float
        if (!isNaN(trimmed)) {
          const asFloat = parseFloat(trimmed);
          return Number.isInteger(asFloat) ? parseInt(trimmed, 10) : asFloat;
        }

        // (C3) Otherwise, just return the trimmed string
        return trimmed;
      }

      // (D) If it's something else (boolean, null, object, etc.), return as-is
      return rawValue;
    });
  }

  function getFunctionParameters(func) {
    // Convert function to string and extract the parameter portion
    const funcStr = func.toString();
    const paramStr = funcStr.slice(funcStr.indexOf('(') + 1, funcStr.indexOf(')'));

    // Split parameters and process each one
    const params = paramStr.split(',').map(param => param.trim());

    const paramNames = [];
    const paramDefaults = [];
    params.forEach(param => {
        // Split on = to separate name and default value
        const [name, defaultValue] = param.split('=').map(p => p.trim());
        paramNames.push(name);
        // If there's no default value, use empty string
        paramDefaults.push(defaultValue !== undefined ? defaultValue : '');
    });
    return { paramNames, paramDefaults };
  }

  function applyFunctions(sourceName) {
    // Filter function columns where source_name matches the provided sourceName
    const functionCols = appConfig.table.filter(c =>
      c.column_type === "function" && c.source_name === sourceName
    );
    functionCols.forEach(col => {
      const functionName = col.id || "";
      if (
        !window.financial.functions ||
        !window.financial.functions[functionName] ||
        typeof window.financial.functions[functionName].implementation !== "function"
      ) {
        console.warn(`No function implementation found for "${functionName}"`);
        return;
      }

      let paramNames = [];
      if (typeof window.financial.functions[functionName].implementation === 'function') {
        ({ paramNames, paramDefaults } = getFunctionParameters(window.financial.functions[functionName].implementation));
        console.log(`Function "${functionName}" parameter names:`, paramNames);
      }

      window.rawData[sourceName].forEach((row, rowIndex) => {
        const paramValues = buildParamValues(paramNames, row, sourceName);
        console.log('paramValues', paramValues);
        const updatedParamValues = paramValues.map((val, i) => {
        // If the paramNames[i] is exactly "sourceIndex", use the string "sourceIndex" instead of the value
          if (paramNames[i] === 'sourceIndex') {
            return sourceName;
          }
          return val;
        });

        //console.log(`Row #${rowIndex} =>`, paramNames, updatedParamValues);
        const result = window.financial.functions[functionName].implementation(...updatedParamValues);
        row[functionName] = result || 0;
      });

    });
  }

  function buildPresentation() {
    // Create the main container
    const appContainer = document.createElement('div');
    appContainer.className = 'app-container';

    // Create sidebar
    const sidebar = document.createElement('nav');
    sidebar.className = 'sidebar';
    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'sidebar-header';
    logoImage.width = 50;
    logoImage.height = 50;
    sidebarHeader.appendChild(logoImage);

    // Create navigation list
    const navList = document.createElement('ul');
    navList.className = 'nav-list';

    // Create navigation items
    const navItems = [
        { text: 'Table', section: 'table', active: true },
        { text: 'Charts', section: 'charts', active: false },
        { text: 'Statistics', section: 'statistics', active: false },
        { text: 'Export', section: 'export', active: false }
    ];

    // Store section elements for easy access
    const sections = {};

    navItems.forEach(item => {
        const li = document.createElement('li');
        li.className = `nav-item ${item.active ? 'active' : ''}`;
        li.dataset.section = item.section;

        const link = document.createElement('a');
        link.href = `#${item.section}`;
        link.textContent = item.text;

        // Add click event listener
        li.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor behavior

            // Remove active class from all nav items
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });

            // Add active class to clicked item
            li.classList.add('active');

            // Hide all sections
            Object.values(sections).forEach(section => {
                section.style.display = 'none';
            });

            // Show the selected section
            const sectionId = `${item.section}-section`;
            if (sections[sectionId]) {
                sections[sectionId].style.display = 'block';
            }
        });

        li.appendChild(link);
        navList.appendChild(li);
    });

    // Create main content
    const main = document.createElement('main');
    main.className = 'content';

    // Create table container
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    tableContainer.id = 'table-section';
    sections['table-section'] = tableContainer;

    // Create charts section
    const chartsSection = document.createElement('div');
    chartsSection.className = 'section';
    chartsSection.id = 'charts-section';
    chartsSection.style.display = 'none';
    sections['charts-section'] = chartsSection;

    // Create statistics section
    const statsSection = document.createElement('div');
    statsSection.className = 'section';
    statsSection.id = 'statistics-section';
    statsSection.style.display = 'none';
    sections['statistics-section'] = statsSection;

    const exportContainer = document.createElement('div');
    exportContainer.className = 'export-container';
    exportContainer.id = 'export-section';
    sections['export-section'] = exportContainer;

    // Assemble the structure
    sidebar.appendChild(sidebarHeader);
    sidebar.appendChild(navList);
    appContainer.appendChild(sidebar);

    main.appendChild(tableContainer);
    main.appendChild(chartsSection);
    main.appendChild(statsSection);
    main.appendChild(exportContainer);
    appContainer.appendChild(main);

    document.body.appendChild(appContainer);

    // Initial setup calls
    buildTable('table-section');
    buildCharts('charts-section');
    buildStatsList('statistics-section');
    buildExportForm('export-section');
  }

  // 11) Build the final table with aggregated totals + sub-rows
  function buildTable(tableContainerID) {
      const tableContainer = document.createElement("div");
      const table = document.createElement("table");
      table.className = "table";
      table.id = "mainTable";

      // Table header
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");

      // Display columns are defined by the appConfig
      const displayCols = appConfig.table.filter(c =>
          ["data", "function", "formula", "call"].includes(c.column_type)
      );

      displayCols.forEach((col, colIndex) => {
        const th = document.createElement("th");
        if (col.data_type && (col.data_type.toLowerCase() === 'unique' || col.data_type.toLowerCase() === 'integer')) {
          const mashUpButton = document.createElement('button');
          mashUpButton.textContent = col.heading
          mashUpButton.className = 'button';
          mashUpButton.addEventListener('click', () =>handleGroupMashup(colIndex, (mapping) => {
            chartLegendMap[col.heading] = mapping;
            console.log("Mapping has been created:", mapping, col.heading, chartLegendMap);
          }));
          th.appendChild(mashUpButton);
        } else {
          // Use 'Open' as header for call columns, otherwise use the original heading
          th.innerText = col.column_type === 'call' ? 'Open' : col.heading;
        }
        headerRow.appendChild(th);  
      });

      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Table body
      const tbody = document.createElement("tbody");
      let combinedKeys = Object.keys(window.combinedData);

      // Sorting logic based on sort configuration
      const sortConfigs = appConfig.table.filter(col => col.sort);
      if (sortConfigs.length > 0) {
          combinedKeys.sort((a, b) => {
              for (const config of sortConfigs) {
                  const sortKey = config.heading; // Sort by the final heading key
                  const sortDirection = config.sort;
                  const valueA = parseFloat(window.combinedData[a].totals[sortKey]);
                  const valueB = parseFloat(window.combinedData[b].totals[sortKey]);

                  if (valueA !== valueB) {
                      return sortDirection.toLowerCase() === "asc" ? valueA - valueB : valueB - valueA;
                  }
              }
              return 0;
          });
      }

      // Render rows for each unique entry
      combinedKeys.forEach(uniqueVal => {
          const entry = window.combinedData[uniqueVal];
          if (!entry) return;

          const { subRows, totals } = entry;

          // Totals Row
          const totalsRow = document.createElement("tr");
          if (subRows.length > 1) {
              totalsRow.classList.add("groupHeadRow");
              totalsRow.style.cursor = "pointer";
              totalsRow.setAttribute("data-toggle", uniqueVal);
          }

          displayCols.forEach(col => {
              const td = document.createElement("td");
              
              if (col.column_type === 'call') {
                  // Create call link for totals row
                  const link = document.createElement('a');
                  link.href = '#';
                  link.textContent = col.heading || 'Open';
                  link.className = 'call-link';
                  
                  // Build URL with all row data as parameters
                  const baseUrl = col.url || '#';
                  const params = new URLSearchParams();
                  
                  // Add all column values as parameters
                  displayCols.forEach(displayCol => {
                      if (displayCol.id !== col.id && displayCol.column_type !== 'call') {
                          const rawValue = totals[displayCol.heading];
                          if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
                              let paramValue = rawValue;
                              if (typeof paramValue === 'string') {
                                  paramValue = encodeURIComponent(paramValue);
                              } else if (typeof paramValue === 'boolean') {
                                  paramValue = paramValue ? 'true' : 'false';
                              } else if (typeof paramValue === 'number') {
                                  paramValue = paramValue.toString();
                              }
                              params.append(displayCol.id, paramValue);
                          }
                      }
                  });
                  
                  // Construct final URL
                  const finalUrl = baseUrl + (params.toString() ? '?' + params.toString() : '');
                  link.href = finalUrl;
                  
                  // Add click handler for navigation
                  link.addEventListener('click', (e) => {
                      e.preventDefault();
                      if (baseUrl !== '#') {
                          window.open(finalUrl, '_blank');
                      }
                  });
                  
                  td.appendChild(link);
              } else {
                  // Fetch value from totals object using the unique heading key
                  const rawValue = totals[col.heading];
                  td.innerText = formatValue(rawValue, col.data_type);
              }
              
              totalsRow.appendChild(td);
          });
          tbody.appendChild(totalsRow);

          // Sub-Rows (if they exist)
          if (subRows.length > 1) {
              subRows.forEach(sRow => {
                  const subTr = document.createElement("tr");
                  subTr.style.display = "none";
                  subTr.classList.add(`subrow-${uniqueVal}`, "groupRow");
                  displayCols.forEach(col => {
                      const subTd = document.createElement("td");
                      
                      if (col.column_type === 'call') {
                          // Don't show call links in sub-rows
                          subTd.innerText = '';
                      } else {
                          // Fetch value from sub-row object using the unique heading key
                          const rawValue = sRow[col.heading];
                          subTd.innerText = formatValue(rawValue, col.data_type);
                      }
                      
                      subTr.appendChild(subTd);
                  });
                  tbody.appendChild(subTr);
              });
          }
      });

      // Grand Totals Row
      const grandTotalsRow = document.createElement("tr");
      const allTotals = combinedKeys
          .map(uniqueVal => window.combinedData[uniqueVal]?.totals)
          .filter(Boolean);
      const grandTotals = computeAggregates(allTotals);

      displayCols.forEach(col => {
          const td = document.createElement("td");
          
          // Use heading of the unique column to identify it for the label
          if (col.heading === uniqueConfig.heading) {
              td.innerText = "Grand Totals";
          } else if (col.column_type === 'call') {
              // Don't show call links in grand totals row
              td.innerText = '';
          } else {
              // Fetch value from grandTotals object using the unique heading key
              const rawValue = grandTotals[col.heading];
              td.innerText = formatValue(rawValue, col.data_type);
          }
          
          grandTotalsRow.appendChild(td);
      });
      tbody.appendChild(grandTotalsRow);

      table.appendChild(tbody);
      tableContainer.appendChild(table);
      document.getElementById(tableContainerID).appendChild(tableContainer);

      // Event listener for toggling sub-rows
      table.addEventListener("click", e => {
          const tr = e.target.closest("tr[data-toggle]");
          if (!tr) return;
          const key = tr.getAttribute("data-toggle");
          const subs = table.querySelectorAll(`.subrow-${key}`);
          subs.forEach(subTr => {
              subTr.style.display = subTr.style.display === "none" ? "" : "none";
          });
      });
  }


  function buildCharts(chartsContainerID) {
    // Create chart config container
    const chartConfig = document.createElement('div');
    chartConfig.className = 'config-container';

    // Create chart type select
    const chartTypeSelect = document.createElement('select');

    // Create chart type options
    const chartTypes = [
        { value: 'bar', text: 'Bar Chart' },
        { value: 'pie', text: 'Pie Chart' }
    ];

    chartTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.text;
        chartTypeSelect.appendChild(option);
    });

    // Create x-axis select
    const xAxisSelect = document.createElement('select');
    xAxisSelect.id = 'x-axis';

    // Create y-axis select
    const yAxisSelect = document.createElement('select');
    yAxisSelect.id = 'y-axis';

    // Create render button
    const renderButton = document.createElement('button');
    renderButton.id = 'render-chart';
    renderButton.className = 'action-button';
    renderButton.textContent = 'Render Chart';

    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.id = 'chart-container';

    // Create statistics section
    const statsSection = document.createElement('div');
    statsSection.className = 'section';
    statsSection.id = 'statistics-section';
    statsSection.style.display = 'none';

    // Assemble chart config
    chartConfig.appendChild(chartTypeSelect);
    chartConfig.appendChild(xAxisSelect);
    chartConfig.appendChild(yAxisSelect);
    chartConfig.appendChild(renderButton);

    // Assemble charts section
    document.getElementById(chartsContainerID).appendChild(chartConfig);
    document.getElementById(chartsContainerID).appendChild(chartContainer);

    // Populate X-axis and Y-axis options using the unique heading
    appConfig.table.forEach(col => {
      if (col.data_type === 'integer' || col.data_type === 'unique') {
        const option = document.createElement('option');
        option.value = col.heading;
        option.textContent = col.heading;
        xAxisSelect.appendChild(option);
      }
      if (col.data_type === 'currency' || col.data_type === 'float' || col.data_type === 'rate') {
        const option = document.createElement('option');
        option.value = col.heading;
        option.textContent = col.heading;
        yAxisSelect.appendChild(option);
      }
    });

    // Render Chart event listener
    renderButton.addEventListener('click', () => {
      const type = chartTypeSelect.value;
      const xCol = xAxisSelect.value; // This is a heading
      const yCol = yAxisSelect.value; // This is a heading
      const xColName = xAxisSelect.options[xAxisSelect.selectedIndex]?.text;


      // Flatten totals into a single array
      const totalsData = Object.values(window.combinedData).flatMap(group => group.totals);
      // Aggregate data (sum Y by unique X values) using heading keys
      const dataMap = {};
      totalsData.forEach(row => {
        const xValue = row[xCol];
        const yValue = row[yCol] ? parseFloat(row[yCol]) : 0;
        if (!dataMap[xValue]) dataMap[xValue] = 0;
        dataMap[xValue] += yValue;
      });

      const data = Object.entries(dataMap).map(([x, y]) => ({ x, y }));
      chartContainer.innerHTML = ''; // Clear previous chart

      if (type === 'bar') {
        window.fiCharts.renderBarChart(data, chartContainer);
      } else if (type === 'pie') {
        window.fiCharts.renderPieChart(data, chartContainer);
      }

      renderLegendTable(chartLegendMap, xColName, chartContainer);

    });
  }

  function renderLegendTable(chartLegendMap, legend, container) {
    //const container = document.querySelector(containerSelector);
    if (!container) {
      console.error(`Container ${container.id} not found`);
      return;
    }

    // Check if chartLegendMap exists and has data
    if (!chartLegendMap || Object.keys(chartLegendMap).length === 0) {
      const message = document.createElement('p');
      message.textContent = 'No legend data available';
      message.style.marginTop = '20px';
      container.appendChild(message);
      return;
    }

    // Check if specific legend exists
    if (!chartLegendMap[legend]) {
      const message = document.createElement('p');
      message.textContent = `Legend "${legend}" not found`;
      message.style.marginTop = '20px';
      container.appendChild(message);
    }

    const mapping = chartLegendMap[legend];

    // Check if mapping has data
    if (!mapping || Object.keys(mapping).length === 0) {
      const message = document.createElement('p');
      message.textContent = `No data available for legend "${legend}"`;
      message.style.marginTop = '20px';
      container.appendChild(message);
      return;
    }

    const table = document.createElement('table');
    table.id = 'legendTable';
    table.style.marginTop = '20px';
    table.style.display = 'block';
    table.style.maxHeight = 'calc(2em + 6 * 2em)'; // Header + 6 rows, assuming ~2em per row
    table.style.overflowY = 'auto';
    table.style.borderCollapse = 'collapse';

    const thead = document.createElement('thead');
    thead.style.position = 'sticky';
    thead.style.top = '0';
    thead.style.zIndex = '1';
    const headerRow = document.createElement('tr');

    [legend, 'ID'].forEach(headerText => {
      const th = document.createElement('th');
      th.textContent = headerText;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');

    // Iterate through the specific legend mapping
    Object.entries(mapping).forEach(([originalId, mappedValue]) => {
      const row = document.createElement('tr');
      row.style.height = '2em';

      // Original ID cell
      const originalCell = document.createElement('td');
      originalCell.textContent = originalId;

      // Mapped value cell
      const mappedCell = document.createElement('td');
      mappedCell.textContent = mappedValue;

      row.appendChild(originalCell);
      row.appendChild(mappedCell);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    console.log(`Legend table rendered successfully for: ${legend}`);
  }

  // Alternative version that creates a more compact summary table
  function renderLegendSummaryTable(chartLegendMap, containerSelector = '#chartContainer') {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.error(`Container ${containerSelector} not found`);
      return;
    }

    if (!chartLegendMap || Object.keys(chartLegendMap).length === 0) {
      container.innerHTML = '<p>No legend data available</p>';
      return;
    }

    const table = document.createElement('table');
    table.id = 'legendSummaryTable';

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    ['Column', 'Mappings Count', 'Sample Mapping'].forEach(headerText => {
      const th = document.createElement('th');
      th.textContent = headerText;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');

    Object.entries(chartLegendMap).forEach(([columnHeading, mapping]) => {
      if (mapping && Object.keys(mapping).length > 0) {
        const row = document.createElement('tr');

        // Column name
        const columnCell = document.createElement('td');
        columnCell.textContent = columnHeading;

        // Count
        const countCell = document.createElement('td');
        countCell.textContent = Object.keys(mapping).length;

        // Sample mapping
        const sampleCell = document.createElement('td');
        const firstEntry = Object.entries(mapping)[0];
        sampleCell.textContent = `${firstEntry[0]} → ${firstEntry[1]}`;

        row.appendChild(columnCell);
        row.appendChild(countCell);
        row.appendChild(sampleCell);
        tbody.appendChild(row);
      }
    });

    table.appendChild(tbody);
    container.innerHTML = '';
    container.appendChild(table);

    console.log('Legend summary table rendered successfully');
  }

  function buildStatsList(statsContainerID) {
    const statsSection = document.getElementById(statsContainerID);
    if (!statsSection || !window.statistics) return;
    statsSection.innerHTML = '';

    Object.entries(window.statistics).forEach(([categoryName, statsData]) => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'stats-category';

      const header = document.createElement('h2');
      header.className = 'stats-header';

      // Category label
      const labelSpan = document.createElement('span');
      labelSpan.textContent = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

      // Button to generate CSV
      const csvBtn = document.createElement('button');
      csvBtn.className = 'action-button';
      csvBtn.textContent = 'Create synthetic data';
      csvBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don’t toggle the content section
        const linesStr = prompt(`Number of lines to generate for "${categoryName}"?`, "10");
        const lines = parseInt(linesStr, 10) || 10;

        // Generate single-column CSV
        const csv = generateSyntheticCSV(statsData, lines);
        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${categoryName}_synthetic_data.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });

      // Put label and button side-by-side with flex
      header.appendChild(labelSpan);
      header.appendChild(csvBtn);

      // Toggle content on header click
      header.addEventListener('click', () => {
        const content = categoryDiv.querySelector('.stats-content');
        content.style.display = (content.style.display === 'none') ? 'flex' : 'none';
      });

      // Stats content
      const content = document.createElement('div');
      content.className = 'stats-content';
      content.style.display = 'none'; // collapsed by default

      // Now fill in the stats cards, the same logic you had:
      if (typeof statsData === 'object' && statsData !== null && !Array.isArray(statsData)) {
        Object.entries(statsData).forEach(([key, value]) => {
          const card = document.createElement('div');
          card.className = 'stats-card';

          // Card Header
          const cardHeader = document.createElement('h3');
          cardHeader.textContent = key.replace(/_/g, ' ');
          card.appendChild(cardHeader);

          // If nested object
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.entries(value).forEach(([statKey, statValue]) => {
              if (statValue !== null && statValue !== undefined && statKey !== 'convexProbability') {
                const p = document.createElement('p');
                p.innerHTML = `<strong>${statKey.replace(/_/g, ' ')}:</strong> ${formatValue(statValue)}`;
                card.appendChild(p);
              }
            });
          } else {
            const p = document.createElement('p');
            p.innerHTML = `<strong>Value:</strong> ${formatValue(value)}`;
            card.appendChild(p);
          }

          content.appendChild(card);
        });
      }

      categoryDiv.appendChild(header);
      categoryDiv.appendChild(content);
      statsSection.appendChild(categoryDiv);
    });
  }

  function buildExportForm(exportContainerID) {
    const exportSection = document.getElementById(exportContainerID);

    // Get current date for default filename
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`;
    const defaultFileName = `${document.title}_${dateStr}`;

    // Create form with improved design
    const form = document.createElement('form');
    form.id = 'export-form';
    form.className = 'export-form-container';

    // Create form header
    const formHeader = document.createElement('div');
    formHeader.className = 'export-form-header';
    const headerTitle = document.createElement('h3');
    headerTitle.textContent = 'Export Data';
    formHeader.appendChild(headerTitle);

    // Create filename group with better styling
    const fileNameGroup = document.createElement('div');
    fileNameGroup.className = 'export-form-group';

    const fileNameLabel = document.createElement('label');
    fileNameLabel.htmlFor = 'fileName';
    fileNameLabel.textContent = 'File Name';
    fileNameLabel.className = 'export-form-label';

    const fileNameContainer = document.createElement('div');
    fileNameContainer.className = 'export-form-input-container';

    const fileNameInput = document.createElement('input');
    fileNameInput.type = 'text';
    fileNameInput.id = 'fileName';
    fileNameInput.value = defaultFileName;
    fileNameInput.required = true;
    fileNameInput.className = 'export-form-input';

    const fileExtensionSpan = document.createElement('span');
    fileExtensionSpan.id = 'fileExtension';
    fileExtensionSpan.textContent = '.csv';
    fileExtensionSpan.className = 'export-form-extension';

    fileNameContainer.appendChild(fileNameInput);
    fileNameContainer.appendChild(fileExtensionSpan);
    fileNameGroup.appendChild(fileNameLabel);
    fileNameGroup.appendChild(fileNameContainer);

    // Create format group with better styling
    const formatGroup = document.createElement('div');
    formatGroup.className = 'export-form-group';

    const formatLabel = document.createElement('label');
    formatLabel.textContent = 'Export Format';
    formatLabel.className = 'export-form-label';

    const formatSelect = document.createElement('select');
    formatSelect.id = 'exportFormat';
    formatSelect.className = 'export-form-select';

    // Define available formats (added HTML)
    const formats = [
        { value: 'csv', text: 'CSV', ext: '.csv' },
        { value: 'json', text: 'JSON', ext: '.json' },
        { value: 'xlsx', text: 'Excel (XLSX)', ext: '.xlsx' },
        { value: 'html', text: 'HTML', ext: '.html' }
    ];

    // Add format options
    formats.forEach(format => {
        const option = document.createElement('option');
        option.value = format.value;
        option.textContent = format.text;
        formatSelect.appendChild(option);
    });

    formatGroup.appendChild(formatLabel);
    formatGroup.appendChild(formatSelect);

    // Create checkbox group with better styling
    const checkboxGroup = document.createElement('div');
    checkboxGroup.className = 'export-form-group export-form-checkbox-group';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'groupUnique';
    checkbox.checked = true;
    checkbox.className = 'export-form-checkbox';

    const checkboxLabel = document.createElement('label');
    checkboxLabel.htmlFor = 'groupUnique';
    checkboxLabel.textContent = 'Group unique values';
    checkboxLabel.className = 'export-form-checkbox-label';

    checkboxGroup.appendChild(checkbox);
    checkboxGroup.appendChild(checkboxLabel);

    // Create submit button with better styling
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'export-form-submit';
    submitButton.textContent = 'Export Data';

    // Assemble form
    form.appendChild(formHeader);
    form.appendChild(fileNameGroup);
    form.appendChild(formatGroup);
    form.appendChild(checkboxGroup);
    form.appendChild(submitButton);
    exportSection.appendChild(form);

    // Update extension when format changes
    formatSelect.addEventListener('change', () => {
        const selectedFormat = formats.find(f => f.value === formatSelect.value);
        fileExtensionSpan.textContent = selectedFormat.ext;
    });

    // Add form submission handler
    form.addEventListener('submit', handleExport);
  }

  function createXLSX(data, headers, options = {}) {
    console.log('Creating Excel file with data:', data);
    console.log('Using headers:', headers);
    console.log('Options:', options);

    // Validate and prepare headers
    // If headers don't match data properties, we need to handle this
    let actualHeaders = headers;

    // If headers are empty or don't match data structure, extract from data
    if (!headers || !headers.length || !dataMatchesHeaders(data, headers)) {
      console.log('Headers mismatch detected, extracting headers from data');
      actualHeaders = extractHeadersFromData(data);
      console.log('Extracted headers:', actualHeaders);
    }

    // Set default options
    const defaults = {
      worksheetName: 'Sheet1',
      title: '',
      author: '',
      filename: 'download.xls'
    };

    const settings = { ...defaults, ...options };

    // Create HTML table that Excel can interpret as BIFF format
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">\n';
    html += '<head>\n';
    html += '\n';
    html += '<style>\n';
    html += 'table { border-collapse: collapse; width: 100%; }\n';
    html += 'th { background-color: #DDDDDD; font-weight: bold; text-align: left; }\n';
    html += 'td, th { border: 1px solid #DDDDDD; padding: 5px; mso-number-format:"\\@"; }\n';
    html += 'td.number { mso-number-format:"0.00"; text-align: right; }\n';
    html += 'td.date { mso-number-format:"yyyy\\-mm\\-dd"; }\n';
    html += 'td.percent { mso-number-format:"0.00%"; text-align: right; }\n';
    html += '</style>\n';
    html += '</head>\n';
    html += '<body>\n';
    html += '<table>\n';

    // Add headers
    html += '<tr>\n';
    actualHeaders.forEach(header => {
      html += `<th>${escapeHTML(header)}</th>\n`;
    });
    html += '</tr>\n';

    // Add data rows
    data.forEach((row, rowIndex) => {
      html += '<tr>\n';

      actualHeaders.forEach(header => {
        // For safe access, check if property exists in row data
        let value = row[header];

        // If value is undefined (header not in data), check if there's a case-insensitive match
        if (value === undefined) {
          const matchingKey = findCaseInsensitiveKey(row, header);
          if (matchingKey) {
            value = row[matchingKey];
          }
        }

        // Determine the cell type and formatting based on value
        if (value === null || value === undefined) {
          html += '<td></td>\n';
        } else if (value instanceof Date) {
          // Format date for Excel
          const excelDate = convertToExcelDate(value);
          html += `<td class="date" x:num="${excelDate}">${formatDate(value)}</td>\n`;
        } else if (typeof value === 'number') {
          if (isPercentValue(header, value)) {
            html += `<td class="percent" x:num="${value}">${formatPercent(value)}</td>\n`;
          } else {
            if (Number.isInteger(value)) {
              // Format as an integer
              // You could use your own integer-formatting function, or simply convert to string:
              html += `<td class="integer" x:num="${value}">${value.toString()}</td>\n`;
            } else {
              // Format as a float
              html += `<td class="number" x:num="${value}">${formatNumber(value)}</td>\n`;
            }
          }
        } else if (typeof value === 'string' && isDateString(value)) {
          try {
            const dateObj = new Date(value);
            if (!isNaN(dateObj.getTime())) {
              const excelDate = convertToExcelDate(dateObj);
              html += `<td class="date" x:num="${excelDate}">${value}</td>\n`;
            } else {
              html += `<td>${escapeHTML(value)}</td>\n`;
            }
          } catch (e) {
            html += `<td>${escapeHTML(value)}</td>\n`;
          }
        } else {
          html += `<td>${escapeHTML(value)}</td>\n`;
        }
      });

      html += '</tr>\n';
    });

    html += '</table>\n';
    html += '</body>\n';
    html += '</html>';

    return html;
  }

  // Helper function to check if headers match data structure
  function dataMatchesHeaders(data, headers) {
    if (!data || !data.length || !headers || !headers.length) return false;

    // Check if at least some headers exist in the first data item
    const firstItem = data[0];
    let matchCount = 0;

    for (const header of headers) {
      // Check direct property match or case-insensitive match
      if (firstItem.hasOwnProperty(header) || findCaseInsensitiveKey(firstItem, header)) {
        matchCount++;
      }
    }

    // Consider it a match if at least 50% of headers are found
    return matchCount >= headers.length * 0.5;
  }

  // Extract headers from data automatically
  function extractHeadersFromData(data) {
    if (!data || !data.length) return [];

    // Use the first object's keys as headers
    return Object.keys(data[0]);
  }

  // Find a property key in an object case-insensitively
  function findCaseInsensitiveKey(obj, key) {
    const keyLower = key.toLowerCase();
    for (const k of Object.keys(obj)) {
      if (k.toLowerCase() === keyLower) {
        return k;
      }
    }
    return null;
  }

  // Check if value is likely a percentage based on header name or value range
  function isPercentValue(header, value) {
    const percentKeywords = ['percent', 'percentage', 'rate', 'ratio', 'performance'];
    const headerLower = header.toLowerCase();

    // Check header name for percentage indicators
    for (const keyword of percentKeywords) {
      if (headerLower.includes(keyword)) {
        return true;
      }
    }

    // Check if value is between 0 and 1 (exclusive), common for decimal percentages
    return value > 0 && value < 1;
  }

  // Format a number with 2 decimal places
  function formatNumber(num) {
    return Number(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Format a percentage with 2 decimal places
  function formatPercent(num) {
    return (num * 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + '%';
  }

  // Format a date as YYYY-MM-DD
  function formatDate(date) {
    return date.toISOString().slice(0, 10);
  }

  // Convert a JS Date to Excel's numeric date format
  function convertToExcelDate(date) {
    // Excel's date system starts on 1/1/1900
    // And Excel incorrectly thinks 1900 was a leap year
    // So we need to add the number of days since 1/1/1900
    // Plus the Excel epoch offset (25569 days)
    return date.getTime() / 86400000 + 25569;
  }

  // Escape HTML special characters
  function escapeHTML(value) {
    if (value === null || value === undefined) return '';
    if (typeof value !== 'string') value = String(value);

    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Check if a string is likely a date
  function isDateString(str) {
    // Common date formats: YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY
    const dateRegex = /^\d{4}-\d{1,2}-\d{1,2}$|^\d{1,2}\/\d{1,2}\/\d{4}$|^\d{1,2}-\d{1,2}-\d{4}$/;
    return dateRegex.test(str);
  }

  // Helper function to download the file
  function downloadExcel(data, headers, filename = 'download.xls', options = {}) {

    if (filename && !filename.endsWith('.xls')) {
      filename += '.xls';
    }

    const content = createXLSX(data, headers, { ...options, filename });
    const blob = new Blob([content], { type: 'application/vnd.ms-excel' });

    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      // For IE
      window.navigator.msSaveOrOpenBlob(blob, filename);
      return;
    }

    // For other browsers
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  }

  function generateHTMLExport(tableData, headers, fileName) {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    // Get app title and description
    const appTitle = document.title || fileName;
    const appDescription = window.appConfig?.description || 'Data Export Report';
    
    // Get the embedded CSS from the current page
    const embeddedCSS = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
          padding: 20px;
        }
        
        .export-container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .export-header {
          background: linear-gradient(135deg, #00632b, #00ab4b);
          color: white;
          padding: 24px;
          text-align: center;
        }
        
        .export-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .export-subtitle {
          font-size: 1.1rem;
          opacity: 0.9;
        }
        
        .export-meta {
          background: #f8f9fa;
          padding: 16px 24px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .export-info {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }
        
        .export-info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .export-info-label {
          font-size: 0.85rem;
          color: #666;
          font-weight: 500;
        }
        
        .export-info-value {
          font-weight: 600;
          color: #333;
        }
        
        .table-container {
          overflow-x: auto;
          padding: 24px;
        }
        
        .export-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
          background: white;
        }
        
        .export-table th {
          background: linear-gradient(135deg, #00632b, #00ab4b);
          color: white;
          padding: 16px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: none;
        }
        
        .export-table td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
          vertical-align: top;
        }
        
        .export-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        
        .export-table tbody tr:nth-child(even) {
          background-color: #fafafa;
        }
        
        .export-table tbody tr:nth-child(even):hover {
          background-color: #f0f0f0;
        }
        
        .export-table tbody tr:last-child {
          background-color: rgba(0, 171, 75, 0.1);
          font-weight: 600;
          border-top: 2px solid rgba(0, 99, 43, 0.5);
        }
        
        .export-table tbody tr:last-child:hover {
          background-color: rgba(0, 171, 75, 0.15);
        }
        
        .export-footer {
          background: #f8f9fa;
          padding: 16px 24px;
          text-align: center;
          color: #666;
          font-size: 0.85rem;
          border-top: 1px solid #e0e0e0;
        }
        
        .export-footer a {
          color: #00632b;
          text-decoration: none;
          font-weight: 500;
        }
        
        .export-footer a:hover {
          text-decoration: underline;
        }
        
        .export-call-link {
          display: inline-block;
          padding: 4px 8px;
          background: linear-gradient(135deg, #00632b, #00ab4b);
          color: white;
          text-decoration: none;
          border-radius: 3px;
          font-weight: 500;
          font-size: 0.8rem;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .export-call-link:hover {
          background: linear-gradient(135deg, #004d1f, #008a3a);
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          color: white;
          text-decoration: none;
        }
        
        @media (max-width: 768px) {
          body {
            padding: 10px;
          }
          
          .export-header {
            padding: 16px;
          }
          
          .export-title {
            font-size: 1.5rem;
          }
          
          .export-meta {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .export-info {
            flex-direction: column;
            gap: 12px;
          }
          
          .table-container {
            padding: 16px;
          }
          
          .export-table {
            font-size: 0.8rem;
          }
          
          .export-table th,
          .export-table td {
            padding: 8px 6px;
          }
        }
      </style>
    `;
    
    // Get call column configuration from appConfig
    const callColumns = window.appConfig?.table?.filter(col => col.column_type === 'call') || [];
    
    const htmlTableRows = tableData.map((row, rowIndex) => {
      const cells = headers.map(header => {
        const value = row[header];
        let displayValue = value !== undefined && value !== null ? value : '';
        
        // Check if this is a call column and create a link (but not for Grand Totals)
        // If header is "Open", find the call column (there should only be one)
        const callColumn = header === 'Open' ? callColumns[0] : null;
        
        const isGrandTotalsRow = Object.values(row).some(val => 
          val === 'Grand Totals' || val === 'Grand Total' || 
          (typeof val === 'string' && val.includes('Grand Totals'))
        );
        
        if (callColumn && !isGrandTotalsRow) {
          // Build URL with all row data as parameters
          const baseUrl = callColumn.url || '#';
          const params = new URLSearchParams();
          
          // Add all other column values as parameters
          headers.forEach(headerName => {
            if (headerName !== header) {
              const rowValue = row[headerName];
              if (rowValue !== undefined && rowValue !== null && rowValue !== '') {
                let paramValue = rowValue;
                if (typeof paramValue === 'string') {
                  paramValue = encodeURIComponent(paramValue);
                } else if (typeof paramValue === 'boolean') {
                  paramValue = paramValue ? 'true' : 'false';
                } else if (typeof paramValue === 'number') {
                  paramValue = paramValue.toString();
                }
                params.append(headerName, paramValue);
              }
            }
          });
          
          const finalUrl = baseUrl + (params.toString() ? '?' + params.toString() : '');
          displayValue = `<a href="${finalUrl}" class="export-call-link" target="_blank">${callColumn.heading}</a>`;
        }
        
        return `<td>${displayValue}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    
    const htmlTableHeaders = headers.map(header => {
      // Check if this is a call column and use 'Open' as header
      const callColumn = callColumns.find(col => col.heading === header);
      const headerText = callColumn ? 'Open' : header;
      return `<th>${headerText}</th>`;
    }).join('');
    
    // Get favicon from current page
    const favicon = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
    const faviconHtml = favicon ? favicon.outerHTML : '<link rel="icon" type="image/x-icon" href="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\'>📊</text></svg>">';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName} - Export</title>
    ${faviconHtml}
    ${embeddedCSS}
</head>
<body>
    <div class="export-container">
        <div class="export-header">
            <h1 class="export-title">${appTitle}</h1>
            <p class="export-subtitle">${appDescription}</p>
        </div>
        
        <div class="export-meta">
            <div class="export-info">
                <div class="export-info-item">
                    <span class="export-info-label">Export Date</span>
                    <span class="export-info-value">${currentDate}</span>
                </div>
                <div class="export-info-item">
                    <span class="export-info-label">Export Time</span>
                    <span class="export-info-value">${currentTime}</span>
                </div>
                <div class="export-info-item">
                    <span class="export-info-label">Total Records</span>
                    <span class="export-info-value">${tableData.length}</span>
                </div>
                <div class="export-info-item">
                    <span class="export-info-label">Generated By</span>
                    <span class="export-info-value">FI.js Framework</span>
                </div>
            </div>
        </div>
        
        <div class="table-container">
            <table class="export-table">
                <thead>
                    <tr>${htmlTableHeaders}</tr>
                </thead>
                <tbody>
                    ${htmlTableRows}
                </tbody>
            </table>
        </div>
        
        <div class="export-footer">
            <p>Generated by <a href="https://github.com/fijs/fi.js" target="_blank">FI.js Framework</a> | Local-First Data Management</p>
        </div>
    </div>
</body>
</html>`;
  }

  function handleExport(event) {
    event.preventDefault();
    const fileName = document.getElementById('fileName').value;
    const exportFormat = document.getElementById('exportFormat').value;
    
    // Exclude call columns from CSV, JSON, and Excel exports
    const excludeCallColumns = exportFormat !== 'html';
    
    // Extract data from the table
    const tableData = extractTableData(true, excludeCallColumns);

    // Define headers based on the table headers
    const headers = getTableHeaders(excludeCallColumns);

    let blob, fileExtension;

    switch (exportFormat) {
        case 'csv':
            const csvContent = [
                headers.join(','),
                ...tableData.map(row =>
                    headers.map(header => {
                        const value = row[header];
                        // Handle values with commas by adding quotes
                        return typeof value === 'string' && value.includes(',')
                            ? `"${value}"`
                            : value;
                    }).join(',')
                )
            ].join('\n');

            blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            fileExtension = '.csv';
            break;

        case 'json':
            const jsonContent = JSON.stringify(tableData, null, 2);
            blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            fileExtension = '.json';
            break;

        case 'xlsx':
            // Use the improved Excel export function
            fileExtension = '.xls'; // Changed to .xls for better compatibility
            downloadExcel(tableData, headers, `${fileName}${fileExtension}`, {
                worksheetName: fileName || 'Export',
                title: 'Table Export'
            });
            return; // Early return as downloadExcel handles the download

        case 'html':
            // For HTML export, include call columns
            const htmlTableData = extractTableData(true, false);
            const htmlHeaders = getTableHeaders(false);
            const htmlContent = generateHTMLExport(htmlTableData, htmlHeaders, fileName);
            blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
            fileExtension = '.html';
            break;

        default:
            console.error('Unsupported format');
            return;
    }

    // Create and trigger download for non-Excel formats
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `${fileName}${fileExtension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Extract headers from the table
 */
function getTableHeaders(excludeCallColumns = false) {
    const table = document.getElementById('mainTable');
    if (!table) {
        console.error('Table not found');
        return [];
    }

    const headerRow = table.querySelector('thead tr');
    if (!headerRow) {
        console.error('Header row not found');
        return [];
    }

    // Extract header texts, cleaning up button elements
    let headers = Array.from(headerRow.querySelectorAll('th')).map(th => {
        // If header contains a button, use the button text
        const button = th.querySelector('button');
        if (button) {
            return button.textContent.trim();
        }
        return th.textContent.trim();
    });

    // Filter out call columns if requested
    if (excludeCallColumns && window.appConfig?.table) {
        // Find call columns and filter out call column headers
        const callColumns = window.appConfig.table.filter(col => col.column_type === 'call');
        if (callColumns.length > 0) {
            // Filter out any header that matches call column patterns
            headers = headers.filter(header => {
                const isCallColumn = callColumns.some(col => 
                    header === 'Open' || 
                    header === col.heading || 
                    header.includes('Open') ||
                    header.includes('IQ')
                );
                return !isCallColumn;
            });
        }
    }

    return headers;
}

/**
 * Extract data from the table
 * @param {boolean} includeGroupRows - Whether to include grouped/hidden rows
 * @param {boolean} includeTotal - Whether to include the total row
 */
function extractTableData(includeTotal = true, excludeCallColumns = false) {
    const table = document.getElementById('mainTable');
    if (!table) {
        console.error('Table not found');
        return [];
    }

    const headers = getTableHeaders(excludeCallColumns);
    const rows = table.querySelectorAll('tbody tr');
    const data = [];
    const includeGroupRows = document.getElementById('groupUnique').checked;

    rows.forEach(row => {

        // Skip group rows based on groupUnique checkbox
        if (includeGroupRows && row.classList.contains('groupRow')) {
            return;
        }
        if (!includeGroupRows && row.classList.contains('groupHeadRow')) {
          return;
        }

        // Skip total row if not including it
        const isLastRow = row === rows[rows.length - 1];
        if (isLastRow && !includeTotal && row.cells[0].textContent.includes('Grand Totals')) {
            return;
        }

        const rowData = {};
        // Map headers to cell values
        headers.forEach((header, index) => {
            if (index < row.cells.length) {
                let value = row.cells[index].textContent.trim();

                // Clean up formatted values
                if (value.includes('$')) {
                    // Remove dollar signs and commas for numeric processing
                    value = value.replace(/\$/g, '').replace(/,/g, '');
                }

                /* // convert % to float, if neccessary
                if (value.includes('%')) {
                    // Convert percentage to decimal value
                    value = parseFloat(value.replace(/%/g, '')) / 100;
                }*/

                // Try to convert numeric strings to numbers
                if (!isNaN(value) && value !== '') {
                    value = parseFloat(value);
                }

                rowData[header] = value;
            }
        });

        data.push(rowData);
    });

    return data;
}

})();

// -------------------- IndexedDB Helper Functions --------------------

// Open (or create) the database and object store.
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FinancialDB', 1);
    request.onerror = function() {
      reject('IndexedDB error');
    };
    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('apiCache')) {
        db.createObjectStore('apiCache', { keyPath: 'id' });
      }
    };
    request.onsuccess = function(event) {
      resolve(event.target.result);
    };
  });
}

// Retrieve a record from IndexedDB by key.
function getRecordFromIndexedDB(key) {
  return openDatabase().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['apiCache'], 'readonly');
      const store = transaction.objectStore('apiCache');
      const request = store.get(key);
      request.onsuccess = function(event) {
        resolve(event.target.result); // Expected format: { id, data, timestamp }
      };
      request.onerror = function() {
        reject('Error reading from IndexedDB');
      };
    });
  });
}

// Save a record into IndexedDB.
function saveRecordToIndexedDB(key, data) {
  return openDatabase().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['apiCache'], 'readwrite');
      const store = transaction.objectStore('apiCache');
      const record = {
        id: key,
        data: data,
        timestamp: Date.now()
      };
      const request = store.put(record);
      request.onsuccess = function() {
        resolve();
      };
      request.onerror = function() {
        reject('Error saving to IndexedDB');
      };
    });
  });
}

// -------------------- Statistics Helper Functions --------------------
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

function uniqueValues(values) {
  const uniqueSet = new Set(values);
  return uniqueSet.size;
}

function createProbabilityArray(mode, uniqueCount, uniqueArray) {
  //uniqueCount is quantity of unique values in a column, and uniqueArray contains all unique values
  /* Convexity in Risk Model applied here refers to the situation where the rate of probability becomes steeper as the value increases.
  In other words, the relationship between value and probability is convex,
  meaning that beyond the mode (value that appears most frequently in a data set which is the tipping point) small increases in value can lead to disproportionately large increases in the likelihood of an event (i.e., a loss).
  */

  mode = parseInt(mode);
  if (!Number.isInteger(mode) || mode < 0 || mode >= uniqueCount || uniqueArray.length !== unique) {
    throw new Error("Invalid input: mode must be within bounds and uniqueArray must match unique count");
  }

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
  // Interpolate between probabilityArray[median] and probabilityArray[uniqueCount-1]
  const secondSegment = interpolate(5, 100, uniqueCount - mode);
  //console.log(`mode: ${mode}, unique: ${uniqueCount}, firstSegment: ${firstSegment}, secondSegment : ${secondSegment}`)

  // Assign values to the first probability array
  for (let i = 0; i < firstSegment.length; i++) {
      probabilityArray[`'${uniqueArray[i]}'`] = parseFloat(firstSegment[i].toFixed(2));
  }
  for (let i = 0; i < secondSegment.length; i++) {
      probabilityArray[`'${uniqueArray[mode + i]}'`] = parseFloat(secondSegment[i].toFixed(2));
  }
  return probabilityArray;
}

/**
 * Returns true if a string is purely numeric
 * (e.g. "123", "123.45", "-0.5", ".5", but not "54-01")
 */
function isPurelyNumeric(str) {
  // optional sign (+/-), digits, optional decimal, digits
  // examples of valid: 54, 54.2, +54.2, -54.2, .5
  // examples of invalid: 54-01, "", "abc", "  "
  return /^[+\-]?(\d+(\.\d+)?|\.\d+)$/.test(str);
}

/**
 * Returns true if `value` is a valid date string
 * but not purely numeric
 */
function isValidDateString(value) {
  // If it's purely numeric, we do NOT treat it as a date
  if (isPurelyNumeric(value)) return false;

  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Main computeStatistics function
 */
function computeStatistics(data) {
  const numericColumns = {};
  const dateColumns = {};

  data.forEach(item => {
    Object.keys(item).forEach(key => {
      const strValue = item[key];

      // 1) If it is purely numeric, treat it as numeric
      if (isPurelyNumeric(strValue)) {
        const numValue = parseFloat(strValue);
        if (!numericColumns[key]) numericColumns[key] = [];
        numericColumns[key].push(numValue);
      }
      // 2) Otherwise, if it’s a valid date string, treat as date
      else if (isValidDateString(strValue)) {
        if (!dateColumns[key]) dateColumns[key] = [];
        dateColumns[key].push(new Date(strValue));
      }
      // 3) Otherwise, ignore or treat as text...
    });
  });

  const results = {};

  // Compute numeric stats
  for (const col of Object.keys(numericColumns)) {
    const vals = numericColumns[col];
    const count = vals.length;
    const mean = vals.reduce((a, b) => a + b, 0) / count;

    // population variance
    const variance = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
    const stdDeviation = Math.sqrt(variance);

    // median
    vals.sort((a, b) => a - b);
    const mid = Math.floor(count / 2);
    const median = (count % 2 !== 0)
      ? vals[mid]
      : (vals[mid - 1] + vals[mid]) / 2;

    // mode
    const frequency = {};
    vals.forEach(v => { frequency[v] = (frequency[v] || 0) + 1; });
    let mode = null;
    let maxFreq = 0;
    for (const [val, freq] of Object.entries(frequency)) {
      if (freq > maxFreq) {
        mode = parseFloat(val);
        maxFreq = freq;
      }
    }

    const uniqueCount = new Set(vals).size;

    // placeholders for your logic
    function yearToDateFactor() { return 1; }
    function createProbabilityArray() { return []; }

    results[col] = {
      min: Math.min(...vals),
      max: Math.max(...vals),
      mean,
      median,
      mode,
      count,
      variance,
      stdDeviation,
      twoStdDeviations: [mean - 2 * stdDeviation, mean + 2 * stdDeviation],
      threeStdDeviations: [mean - 3 * stdDeviation, mean + 3 * stdDeviation],
      uniqueCount,
      YTDfactor: yearToDateFactor(col)
    };

    // Probability array logic
    if (
      uniqueCount > 2 &&
      uniqueCount <= 100  /* &&
      parseInt(mode) < uniqueCount - 1 @.@ */
    ) {
      results[col].uniqueArray = [...new Set(vals)];
      results[col].convexProbability = createProbabilityArray(mode, uniqueCount, results[col].uniqueArray);
    }
  }

  // Compute date stats
  for (const col of Object.keys(dateColumns)) {
    const dates = dateColumns[col].sort((a, b) => a - b);
    const count = dates.length;
    const minDate = dates[0];
    const maxDate = dates[count - 1];

    // mean (avg) date
    const totalTime = dates.reduce((acc, d) => acc + d.getTime(), 0);
    const meanDate = new Date(totalTime / count);

    // median date
    const mid = Math.floor(count / 2);
    let medianDate;
    if (count % 2 !== 0) {
      medianDate = dates[mid];
    } else {
      const avgTime = (dates[mid - 1].getTime() + dates[mid].getTime()) / 2;
      medianDate = new Date(avgTime);
    }

    const uniqueCount = new Set(dates.map(d => d.getTime())).size;

    results[col] = {
      min: minDate,
      max: maxDate,
      mean: meanDate,
      median: medianDate,
      count,
      uniqueCount
    };
  }

  return results;
}


// Statistics Test: Test with your array of objects
const data = [
  {
    "Portfolio": "2071880",
    "Open_Date": "2025-03-17",
    "Branch_Number": "19",
    "Class_Code": "4",
    "Owner_Code": "99",
    "Statement_Rate": "0.000125",
    "Average_Balance": "261615.14",
    "PMTD_Interest_Earned": "11.44",
    "PMTD_Checks": "71",
    "PMTD_Service_Charge": "10",
    "PMTD_Service_Charge_Waived": "6",
    "PMTD_Other_Charges": "2",
    "PMTD_Other_Charges_Waived": "0",
    "PMTD_Number_of_Deposits": "5",
    "PMTD_Number_of_Items_NSF": "2",
    "checkingProfit": 3832.9013693446
  },
  {
    "Portfolio": "2071880",
    "Open_Date": "1996-12-01",
    "Branch_Number": "6",
    "Class_Code": "4",
    "Owner_Code": "54",
    "Statement_Rate": "0.00025",
    "Average_Balance": "262209.66",
    "PMTD_Interest_Earned": "3.8",
    "PMTD_Checks": "83",
    "PMTD_Service_Charge": "11",
    "PMTD_Service_Charge_Waived": "9",
    "PMTD_Other_Charges": "15",
    "PMTD_Other_Charges_Waived": "0",
    "PMTD_Number_of_Deposits": "2",
    "PMTD_Number_of_Items_NSF": "2",
    "checkingProfit": 3819.8467916524
  },
  {
    "Portfolio": "2056874",
    "Open_Date": "2004-10-10",
    "Branch_Number": "17",
    "Class_Code": "8",
    "Owner_Code": "168",
    "Statement_Rate": "0.0005",
    "Average_Balance": "233847.58",
    "PMTD_Interest_Earned": "2.29",
    "PMTD_Checks": "60",
    "PMTD_Service_Charge": "13",
    "PMTD_Service_Charge_Waived": "6",
    "PMTD_Other_Charges": "39",
    "PMTD_Other_Charges_Waived": "0",
    "PMTD_Number_of_Deposits": "9",
    "PMTD_Number_of_Items_NSF": "0"
  },
  // ... more rows omitted for brevity ...
  {
    "Portfolio": "2097326",
    "Open_Date": "1982-07-21",
    "Branch_Number": "4",
    "Class_Code": "2",
    "Owner_Code": "51",
    "Statement_Rate": "0",
    "Average_Balance": "2690.86",
    "PMTD_Interest_Earned": "7.58",
    "PMTD_Checks": "48",
    "PMTD_Service_Charge": "16",
    "PMTD_Service_Charge_Waived": "16",
    "PMTD_Other_Charges": "52",
    "PMTD_Other_Charges_Waived": "0",
    "PMTD_Number_of_Deposits": "10",
    "PMTD_Number_of_Items_NSF": "3"
  }
];

// Run it and print
console.log("Computed statistics on test data:");
console.log(JSON.stringify(computeStatistics(data), null, 2));

// --- CSV parser ---
function parseCSV(csvString) {
  const lines = csvString
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map(h => h.trim());
  const dataRows = lines.slice(1);

  return dataRows.map(row => {
    const values = row.split(",");
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] ? values[index].trim() : "";
    });
    return obj;
  });
}

function replaceColumnWithMapping(tableId, mapping, colIndex) {
  // Get all table rows from the specified table
  const rows = document.querySelectorAll(`#${tableId} tr`);
  const replacedMapping = {}; // Track only the mappings that were actually used

  rows.forEach(row => {
    // Get all <td> elements in this row
    const cells = row.querySelectorAll('td');
    // Check if the specified column index exists
    if (cells.length <= colIndex || colIndex < 0) return; // Skip if column is out of bounds

    // Get the cell at the specified column index
    const targetCell = cells[colIndex];
    // Get the current value in that cell (e.g., "200106555")
    const currentId = targetCell.textContent.trim();

    // Check if this ID exists in the mapping
    if (mapping[currentId]) {
      // Replace the cell's content with the mapped value
      targetCell.textContent = mapping[currentId];
      // Track this replacement in our return mapping
      replacedMapping[currentId] = mapping[currentId];
    }
  });

  return replacedMapping; // Return only the mappings that were actually used
}

function handleGroupMashup(colIndex, callback) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.csv';
  fileInput.style.display = 'none';

  fileInput.addEventListener("change", evt => {
    const file = evt.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const csvContent = e.target.result;
      const data = parseCSV(csvContent);
      const mapping = createUniqueIdMapping(data);
      // Get only the mappings that were actually replaced
      const replacedMapping = replaceColumnWithMapping('mainTable', mapping, colIndex);
      callback(replacedMapping); // Call the callback with only the replaced mappings
    };
    reader.readAsText(file);
  });

  document.body.appendChild(fileInput);
  fileInput.click();
  document.body.removeChild(fileInput);
}

function createUniqueIdMapping(data) {
  const mapping = {};
  data.forEach(row => {
    const values = Object.values(row);
    if (values) {
      mapping[values[0].toString().replace(/'/g, '')] = values[1].toString().replace(/'/g, '');
    }
  });
  return mapping;
}

// Generate friendly, human-readable descriptions for any filter expression
function getFriendlyFilterDescriptions(appConfig) {
  const operatorMap = {
    "==": "on",
    "!=": "not equal to",
    ">=": "on or after",
    "<=": "on or before",
    ">": "after",
    "<": "before"
  };

  const isoDateRE = /^\d{4}-\d{2}-\d{2}$/;   // quick ISO‑date test

  return appConfig.table
    .filter(col => col.where)
    .map(col => {
      const heading  = col.heading.trim();
      const where   = col.where.trim();
      const dataType = col.data_type;

      /* ---------- Case 1 – list filter like "[A, B, C]" ---------- */
      if (/^\[.*\]$/.test(where)) {
        try {
          const parsed = JSON.parse(
            where.replace(/\s*,\s*/g, ',').replace(/\s+/g, '')
          );
          if (Array.isArray(parsed)) {
            return `${heading}: one of (${parsed.join(', ')})`;
          }
        } catch {
          return `${heading}: invalid list filter`;
        }
      }

      /* ---------- Case 2 – logical filters, e.g. "> X && <= Y" ---------- */
      const orParts = where.split(/\s*\|\|\s*/).map(p => p.trim());

      const friendlyOrs = orParts.map(orClause => {
        let negated = false;
        if (orClause.startsWith('!')) {
          negated  = true;
          orClause = orClause.slice(1).trim();
        }

        const andParts = orClause.split(/\s*&&\s*/).map(cond => {
          const m = cond.match(/^(==|!=|>=|<=|>|<)\s*(.*)$/);
          if (!m) return `(${cond})`;           // fallback

          const [ , op, rawVal ] = m;
          let val = rawVal;

          if (dataType === "date") {
            if (isoDateRE.test(rawVal)) {
              /* Format ISO date to “Month D, YYYY” */
              const [y, mth, d] = rawVal.split('-').map(Number);
              const dateObj = new Date(y, mth - 1, d);
              val = dateObj.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              });
            } else {
              /* Treat a plain number as “days ago” */
              const days = Number(rawVal);
              if (!isNaN(days)) {
                if (op === "<") return `prior to ${days} days ago`;
                if (op === ">") return `within the last ${days} days`;
              }
            }
          }

          return `${operatorMap[op] || op} ${val}`;
        });

        const andText = andParts.join(' and ');
        return negated ? `not (${andText})` : andText;
      });

      return `${heading}: ${friendlyOrs.join(' or ')}`;
    });
}

// Display functionality for forms-based apps
function initializeDisplay() {
  if (!window.appConfig || !window.appConfig.display) return;

  // Create display container (initially hidden)
  const displayContainer = document.createElement('div');
  displayContainer.className = 'display-container';
  displayContainer.id = 'fiDisplayContainer';
  displayContainer.style.display = 'none'; // Hidden until form is complete

  // Add to forms container if it exists, otherwise to body
  const formsContainer = document.querySelector('.forms-container');
  if (formsContainer) {
    // Always append to forms container - CSS grid will handle positioning
    formsContainer.appendChild(displayContainer);
  } else {
    document.body.appendChild(displayContainer);
  }

  // Make processDisplayData globally available
  window.processDisplayData = processDisplayData;

  // Process initial display data
  setTimeout(() => {
    console.log('Calling processDisplayData after display initialization');
    processDisplayData();
  }, 200);
}

function processDisplayData() {
  if (!window.appConfig || !window.appConfig.display) return;

  const displayContainer = document.getElementById('fiDisplayContainer');
  if (!displayContainer) {
    console.log('Display container not found');
    return;
  }

  // Check if form has any valid data (more lenient check)
  const hasValidData = window.appConfig.forms.some(form => {
    if (form.type === 'hidden') return true;
    const value = form.value;
    return value !== null && value !== undefined && value !== '';
  });
  
  if (!hasValidData) {
    displayContainer.style.display = 'none';
    return;
  }

  // Show display container
  displayContainer.style.display = 'block';

  // Create results cards
  displayContainer.innerHTML = '<h2>Calculated Results</h2><div class="results-grid"></div>';
  const resultsGrid = displayContainer.querySelector('.results-grid');

  window.appConfig.display.forEach(col => {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    const label = document.createElement('div');
    label.className = 'result-label';
    label.textContent = col.heading;
    
    const value = document.createElement('div');
    value.className = 'result-value';
    
    if (col.column_type === 'form') {
      // Get value from forms
      const formConfig = window.appConfig.forms.find(f => f.id === col.id);
      if (formConfig) {
        value.textContent = formatValue(formConfig.value, col.data_type);
      } else {
        value.textContent = 'N/A';
      }
    } else if (col.column_type === 'function') {
      // Execute function with form values
      const result = executeFunction(col.function, col.id);
      value.textContent = formatValue(result, col.data_type);
    } else if (col.column_type === 'formula') {
      // Execute formula with form values
      const result = executeFormula(col.formula, col.id);
      value.textContent = formatValue(result, col.data_type);
    }
    
    card.appendChild(label);
    card.appendChild(value);
    resultsGrid.appendChild(card);
  });
}

function checkFormCompletion() {
  if (!window.appConfig || !window.appConfig.forms) return false;
  
  // Check if all required form fields have values
  return window.appConfig.forms.every(form => {
    if (form.type === 'hidden') return true; // Hidden fields are always "complete"
    const value = form.value;
    // More lenient check - just ensure it's not empty string
    return value !== null && value !== undefined && value !== '';
  });
}

// Resolve a function parameter from the display config into a runtime value
function resolveParam(param) {
  if (param === null || param === undefined) return 0;
  const trimmed = String(param).trim();

  // Handle explicit null/undefined/booleans
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Handle quoted strings
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\'') && trimmed.endsWith('\''))) {
    return trimmed.slice(1, -1);
  }

  // Handle numeric literals (including negatives and decimals)
  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    return Number(trimmed);
  }

  // Handle simple JS expressions (e.g., new Date().toISOString().split('T')[0])
  // Designers control appConfig; evaluate in this local context
  try {
    if (/[()\.\+\-*/]|new\s+Date/.test(trimmed)) {
      // eslint-disable-next-line no-eval
      const evaluated = eval(trimmed);
      return evaluated;
    }
  } catch (e) {
    // fall through to function call detection
  }

  // Handle function calls (e.g., calculateMonthlyPayment(principal, rate, term, amort))
  if (trimmed.includes('(') && trimmed.includes(')')) {
    try {
      return executeFunction(trimmed, 'temp');
    } catch (e) {
      console.warn(`Error executing function in parameter: ${trimmed}`, e);
      return 0;
    }
  }

  // Check if this is a reference to another display item by id
  if (window.appConfig && window.appConfig.display) {
    const displayItem = window.appConfig.display.find(item => item.id === trimmed);
    if (displayItem) {
      // This is a reference to another display item, execute it
      if (displayItem.column_type === 'function') {
        return executeFunction(displayItem.function, displayItem.id);
      } else if (displayItem.column_type === 'formula') {
        return executeFormula(displayItem.formula, displayItem.id);
      } else if (displayItem.column_type === 'form') {
        return getFormValue(trimmed);
      }
    }
  }

  // Treat as identifier referencing a form value
  return getFormValue(trimmed);
}

function executeFunction(functionName, resultId) {
  // Parse function name and parameters
  const funcMatch = functionName.match(/^(\w+)\((.*)\)$/);
  if (!funcMatch) {
    return 0;
  }
  
  const funcName = funcMatch[1];
  const params = funcMatch[2].split(',').map(p => p.trim());
  
  // Get parameter values
  const paramValues = params.map(param => resolveParam(param));
  
  // Check if function exists in financial library
  if (window.financial && window.financial.functions && window.financial.functions[funcName]) {
    try {
      return window.financial.functions[funcName].implementation(...paramValues);
    } catch (error) {
      console.error(`Error executing function ${funcName}:`, error);
      return 0;
    }
  }
  
  // Fallback for functions not in library
  console.warn(`Function ${funcName} not found in financial library`);
  return 0;
}

function executeFormula(formula, resultId) {
  // Simple formula execution - replace variable names with values
  let processedFormula = formula;
  
  // Replace form field references with their values
  const formFields = window.appConfig.forms.map(f => f.id);
  formFields.forEach(fieldId => {
    const value = getFormValue(fieldId);
    const regex = new RegExp(`\\b${fieldId}\\b`, 'g');
    processedFormula = processedFormula.replace(regex, value);
  });
  
  try {
    const result = eval(processedFormula);
    return result;
  } catch (error) {
    return 0;
  }
}

function getFormValue(formId) {
  // First try to get the current form data
  if (window.formData && window.formData.hasOwnProperty(formId)) {
    const value = window.formData[formId];
    // Handle different data types appropriately
    if (typeof value === 'string') {
      // Try to parse as number, but return string if it's not a valid number
      const numValue = parseFloat(value);
      return isNaN(numValue) ? value : numValue;
    }
    return value;
  }
  
  // Fallback to form config default value
  if (window.appConfig && window.appConfig.forms) {
    const formConfig = window.appConfig.forms.find(f => f.id === formId);
    if (formConfig) {
      const value = formConfig.value;
      if (typeof value === 'string') {
        const numValue = parseFloat(value);
        return isNaN(numValue) ? value : numValue;
      }
      return value;
    }
  }
  
  return 0;
}

function formatValue(value, dataType) {
  if (value === null || value === undefined) return '';
  
  // Handle arrays (checkbox groups)
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  switch (dataType) {
    case 'currency':
      const numValue = parseFloat(value) || 0;
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(numValue);
    case 'rate':
      const rateValue = parseFloat(value) || 0;
      return `${rateValue.toFixed(2)}%`;
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'integer':
      const intValue = parseInt(value) || 0;
      return intValue.toLocaleString();
    case 'float':
      const floatValue = parseFloat(value) || 0;
      return floatValue.toFixed(2);
    default:
      return String(value);
  }
}

function renderFavicon(base64Svg) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = base64Svg;
  document.head.appendChild(link);
}