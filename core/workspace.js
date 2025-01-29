// workspace.js

// Function to display combined results in a table
function displayResultsInTable() {
  console.log('combinedResults', combinedResults);
  
  // Determine column format based on values in each row
  const columnFormat = appConfig.presentation.columns.map(() => ({ isCurrency: false, integerCount: 0, currencyCount: 0, stringCount: 0, isTranslatable: true }));
  const columnSums = Array(appConfig.presentation.columns.length).fill(0);
  let totalCount = 0;
  let resultSum = 0;

  // Step 1: Check if all results are integers
  allResultsAreIntegers = Object.values(combinedResults).every(item => Number.isInteger(Number(item.result)));
  const resultFormat = { isCurrency: !allResultsAreIntegers };
  console.log('All results are integers:', allResultsAreIntegers);
  console.log('Result format:', resultFormat);
 
  // Step 2: If all results are integers, update the average results
  if (allResultsAreIntegers) {
    Object.values(combinedResults).forEach(item => {
      // Update replace result with the average results (result / tally)
      item.result = item.tally === 0 ? 0 : Math.round(item.result / item.tally);
    });
  }

  // sort combined results
  const sortedResults = Object.entries(combinedResults).sort((a, b) => {
    return parseFloat(b[1].result) - parseFloat(a[1].result);
  });

  function parseCommaDelimited(input) {
    // Trim the input string to handle any leading or trailing whitespace
    input = String(input).trim();

    // If there's no comma, return the single value parsed appropriately
    if (!input.includes(',')) {
        return isNaN(input) || input === '' ? [input] : [parseFloat(input)];
    }

    // Split the input string by commas and trim any extra whitespace
    const rawArray = input.split(',').map(item => item.trim());

    // Parse each item into its appropriate type
    const parsedArray = rawArray.map(item => {
        // Check if the item is a valid number (integer or float)
        if (!isNaN(item) && item !== '') {
            return parseFloat(item);
        }
        // Otherwise, keep it as a string
        return item;
    });
    return parsedArray;
  }

  sortedResults.forEach(([_, data]) => {
    appConfig.presentation.columns.forEach((column, index) => {
      const field = column.field.toLowerCase();
      let values = [];
      if (data[field]) {
        values = parseCommaDelimited(data[field]);
      }
      if (Array.isArray(values)) {
        if (values.every(Number.isInteger) && values.every(v => v <= 9999)) {
          columnFormat[index].integerCount += values.length;
        } else if (values.every(item => typeof item !== 'string')) {
          columnFormat[index].currencyCount += values.length;
        } else {
          columnFormat[index].stringCount += values.length;
        }
      }
    });
  });

  columnFormat.forEach((format, index) => {
    format.isCurrency = format.currencyCount > format.integerCount;  //if more currency than integer column is currency
    format.isTranslatable = format.stringCount < format.integerCount + format.currencyCount  &&  !format.isCurrency; 
  });

  const tableContainer = document.createElement('div');
  tableContainer.className = 'table-container';
  const table = document.createElement('table');
  table.className = 'table';
  table.id = 'results-table'
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  // Create a button to handle Group ID mapping
  const groupHeader = document.createElement('th');
  const mashUpButton = document.createElement('button');
  mashUpButton.textContent = appConfig.groupBy;
  mashUpButton.className = 'button';
  mashUpButton.addEventListener('click', handleGroupIdButtonClick);
  groupHeader.appendChild(mashUpButton);
  headerRow.appendChild(groupHeader);

  // Add headers from presentation config
  if (appConfig.presentation && appConfig.presentation.columns) {
    appConfig.presentation.columns.forEach((column, index) => {
      const columnHeader = document.createElement('th');
      if (columnFormat[index].isTranslatable) {
        const aiButton = document.createElement('button');
        aiButton.textContent = column.heading;
        aiButton.className = 'button';
        aiButton.addEventListener('click', () => aiTableTranslator(table.id, column.heading));
        columnHeader.appendChild(aiButton);
        const option = document.createElement('option');
        option.value = column.field;
        option.textContent = column.heading; // Use heading for display
        document.getElementById('field-select').appendChild(option);
      } else {
        columnHeader.textContent = column.heading;
      }
      headerRow.appendChild(columnHeader);
    });
  }

  // Add the Result header
  const headerResult = document.createElement('th');
  headerResult.textContent = 'Result';
  headerRow.appendChild(headerResult);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Second pass to render each row with consistent formatting
  const rows = {};
  sortedResults.forEach(([uniqueId, data]) => {
    if (data.result) {
      const row = document.createElement('tr');
      const uniqueIdCell = document.createElement('td');
      uniqueIdCell.textContent = `${uniqueId.toString()} (${data.tally})`;
      row.appendChild(uniqueIdCell);

      totalCount += data.tally;

      appConfig.presentation.columns.forEach((column, index) => {
        const cell = document.createElement('td');
        const field = column.field.toLowerCase();
        let values = [];

        if (data[field]) {
          values = parseCommaDelimited(data[field]);
        }

        if (Array.isArray(values)) {
          if (!columnFormat[index].isCurrency) {
            const modeValue = calculateMode(values);
            cell.textContent = modeValue;
          } else {
            const sumValue = values.reduce((acc, v) => acc + v, 0);
            cell.textContent = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(sumValue);
            columnSums[index] += sumValue;
          }
        } else if (values.length > 0) {
          cell.textContent = values;
        } else {
          cell.textContent = '';
        }

        row.appendChild(cell);
      });

      const valueCell = document.createElement('td');
      if (resultFormat.isCurrency) {
        valueCell.textContent = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(data.result);
      } else {
        valueCell.textContent =  data.result;
      }

      row.appendChild(valueCell);
      resultSum += data.result;
      table.appendChild(row);
      rows[uniqueId] = uniqueIdCell;
    }
  });

  // Add totals row at the end of the table
  const totalRow = document.createElement('tr');
  const totalLabelCell = document.createElement('td');
  totalLabelCell.textContent = `Total Count: ${totalCount}`;
  totalRow.appendChild(totalLabelCell);

  appConfig.presentation.columns.forEach((_, index) => {
    const totalCell = document.createElement('td');
    if (columnFormat[index].isCurrency) {
      totalCell.textContent = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(columnSums[index]);
    } else {
      totalCell.textContent = ''; // Blank if the column isn't currency
    }
    totalRow.appendChild(totalCell);
  });

  const resultTotalCell = document.createElement('td');
  if (resultFormat.isCurrency) {
    resultTotalCell.textContent = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(resultSum);
  } else {
    resultTotalCell.textContent = ''; // Blank if the column isn't currency
  }
  totalRow.appendChild(resultTotalCell);
  table.appendChild(totalRow);

  tableContainer.appendChild(table);
  const resultsContainer = document.createElement('div');
  resultsContainer.id = 'results-container';
  const resultsTitle = document.createElement('h2');
  resultsTitle.textContent = document.title;
  resultsTitle.style.paddingLeft = '1em';
  resultsContainer.appendChild(resultsTitle);
  if (appConfig.description) {
    const resultsDescription = document.createElement('div');
    resultsDescription.innerHTML = appConfig.description;
    resultsDescription.style.paddingLeft = '2em';
    resultsContainer.appendChild(resultsDescription);
  }
  resultsContainer.appendChild(tableContainer);
  const tableTab = document.querySelector(".tab-content[data-tab='Table']");
  tableTab.appendChild(resultsContainer);
  console.log('Statistics:', window.statistics);
  const accordion = renderAccordion(window.statistics);
  const statisticsTab = newTab('Statistics');
  statisticsTab.appendChild(accordion);

  function renderAccordion(data) {
    const container = document.createElement('div');
    container.classList.add('accordion');

    Object.keys(data).forEach(category => {
        const categoryData = data[category];

        const categoryItem = document.createElement('div');
        categoryItem.classList.add('accordion-item');

        const header = document.createElement('div');
        header.classList.add('accordion-header');

        header.innerHTML = `<h3>${category.toUpperCase()}</h3><span class="caret">&#9660;</span>`;
        categoryItem.appendChild(header);

        const content = document.createElement('div');
        content.classList.add('accordion-content');

        Object.keys(categoryData).forEach(statistic => {
            const statisticItem = document.createElement('div');
            statisticItem.classList.add('accordion-item');
            statisticItem.style.paddingLeft = "1rem";
            const statisticHeader = document.createElement('div');
            statisticHeader.classList.add('accordion-header');
            statisticHeader.innerHTML = `<h3>${statistic}</h3><span class="caret">&#9660;</span>`;
            statisticItem.appendChild(statisticHeader);

            const statisticContent = document.createElement('div');
            statisticContent.classList.add('accordion-content');
            const subList = document.createElement('ul');

            Object.entries(categoryData[statistic]).forEach(([key, value]) => {
                const subListItem = document.createElement('li');
                subListItem.textContent = `${key}: ${Array.isArray(value) ? value.join(', ') : value}`;
                subList.appendChild(subListItem);
            });

            statisticContent.appendChild(subList);
            statisticItem.appendChild(statisticContent);
            content.appendChild(statisticItem);

            statisticHeader.addEventListener('click', () => {
                const isOpen = statisticContent.style.display === 'block';
                statisticContent.style.display = isOpen ? 'none' : 'block';
                statisticHeader.querySelector('.caret').classList.toggle('open', !isOpen);
            });
        });

        categoryItem.appendChild(content);
        container.appendChild(categoryItem);

        header.addEventListener('click', () => {
            const isOpen = content.style.display === 'block';
            document.querySelectorAll('.accordion-content').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.caret').forEach(caret => caret.classList.remove('open'));

            if (!isOpen) {
                content.style.display = 'block';
                header.querySelector('.caret').classList.add('open');
            }
        });
    });
    return container;
}

  // Function to handle unique ID button click
  function handleGroupIdButtonClick() {
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
            const mapping = createUniqueIdMapping(data);
            updateUniqueColumns(mapping);
          });
        };

        reader.readAsText(file);
      }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  // Function to create a mapping of unique IDs from CSV data
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

  // Function to update unique columns using the mapping
  function updateUniqueColumns(mapping) {
    Object.entries(combinedResults).forEach(([uniqueId, _]) => {
      if (mapping[uniqueId] && rows[uniqueId]) {
        rows[uniqueId].textContent = mapping[uniqueId] + ' (' + combinedResults[uniqueId].tally + ')';
      }
    });
  }
}

function setIndicatorState(state, tooltip = null) {
  const LoFiIndicator = document.getElementById('LoFiIndicator');
  LoFiIndicator.className = `light-indicator ${state}`;
  if (tooltip) {
    LoFiIndicator.title = tooltip;
  }
}
  
// Function to show the modal with file inputs and starting button
function showRunModal() {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  const modal = document.createElement('div');
  modal.className = 'modal';
  const modalHeader = document.createElement('div');
  modalHeader.className = 'modal-header';
  // LoFi Indicator
  const lightIndicator = document.createElement('div');
  lightIndicator.className = 'light-indicator online'; // Default to 'waiting' state
  lightIndicator.id = "LoFiIndicator";
  lightIndicator.title = 'Waiting for Signal';
  modalHeader.appendChild(lightIndicator);

  const closeButton = document.createElement('button');
  closeButton.className = 'close-btn';
  closeButton.id = 'close-modal-btn';
  closeButton.setAttribute('aria-label', 'Close Modal');
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', function() {
    modalOverlay.style.display = 'none';
  });
  modalHeader.appendChild(closeButton);
  modal.appendChild(modalHeader);

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  const modalHero = document.createElement('span');
  modalHero.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 200 200">
      <!-- Bottom rotated square -->
      <g transform="rotate(45, 100, 100)">
        <rect x="35" y="35" width="130" height="130" fill="#0b3260" opacity="0.75" />
        <text x="100" y="135" font-family="Arial, sans-serif" font-size="90" fill="#ffffff" text-anchor="middle" >
          JS
        </text>
      </g>
      <!-- Top square -->
      <g>
        <rect x="35" y="35" width="130" height="130" fill="#0b6031" opacity="0.65" />
        <text x="100" y="130" font-family="Arial, sans-serif" font-size="80" fill="#ffffff" text-anchor="middle">
          FI
        </text>
      </g>
    </svg>`;
  modalContent.appendChild(modalHero);
  const instructions = document.createElement('p');
  instructions.textContent = 'Select data from the secure source.';
  modalContent.appendChild(instructions);
  const inputsContainer = document.createElement('div');
  const startButton = document.createElement('button');
  startButton.textContent = 'Run ' + document.title;
  startButton.className = 'btn run-btn';
  startButton.disabled = true; // Disable the run button initially

  // Identify sources and inputs from the formula
  const identifiedPipes = extractPipes(appConfig.formula, appConfig.presentation);
  console.log('identifiedPipes', identifiedPipes)
  // Create file inputs for each identified source
  const fileInputs = {};
  identifiedPipes.sources.forEach(sourceName => {
    const sourceDiv = document.createElement('div');
    sourceDiv.style.marginBottom = "10px";
    const label = document.createElement('label');
    label.htmlFor = `${sourceName}-file`;
    label.className = "custom-file-upload";
    label.innerHTML = `Choose ${sourceName.charAt(0).toUpperCase() + sourceName.slice(1)} Source`;

    const input = document.createElement('input');
    input.type = "file";
    input.accept = ".csv";
    input.id = `${sourceName}-file`;
    input.className = "hidden-file-input";

    // Check if all files are selected to enable the run button
    input.addEventListener('change', () => {
      if (label) {
        const fileName = input.files[0].name;
        label.classList.add('completed');
        label.innerHTML = `${sourceName}: ${fileName}`; 
      }
      const allFilesSelected = identifiedPipes.sources.every(sourceName => fileInputs[sourceName].files.length > 0);
      startButton.disabled = !allFilesSelected;
    });

    sourceDiv.appendChild(label);
    sourceDiv.appendChild(input);
    inputsContainer.appendChild(sourceDiv);
    fileInputs[sourceName] = input;
  });

  identifiedPipes.inputs.forEach(inputName => {
    const inputDiv = document.createElement('div');
    inputDiv.classList.add('form-group');
    inputDiv.style.marginBottom = "10px";
    const label = document.createElement('label');
    label.innerHTML = `${inputName.charAt(0).toUpperCase() + inputName.slice(1)}`;
    const input = document.createElement('input');
    input.type = "text";
    input.id = inputName;

    // Event listener to check if all inputs are filled
    input.addEventListener('input', () => {
      let allFilled = true;

      // Iterate over all inputs to check their values
      identifiedPipes.inputs.forEach(name => {
          const inputElement = document.getElementById(name);
          if (!inputElement.value.trim()) {
              allFilled = false;
          }
      });
      startButton.disabled = !allFilled
    });
    inputDiv.appendChild(label);
    inputDiv.appendChild(input);
    inputsContainer.appendChild(inputDiv);
  });

  // Handle file selection and process formula
  startButton.addEventListener('click', () => {
    const formula = document.getElementById('formula').textContent.trim();
    processModal(fileInputs, identifiedPipes, appConfig, formula);
    if (identifiedPipes.sources.length > 0) {
      document.body.removeChild(modalOverlay);
    }
  });
  const outputContainer = document.createElement('div');
  outputContainer.id = 'outputElement';
  modalContent.appendChild(inputsContainer);
  modalContent.appendChild(outputContainer);
  modalContent.appendChild(startButton);

  const accordionDiv = document.createElement('div');
  accordionDiv.classList.add('accordion');
  const mainHeader = document.createElement('div');
  mainHeader.classList.add('accordion-header');
  mainHeader.id = 'accordion-header';
  mainHeader.textContent = 'Configuration';
  const mainCaret = document.createElement('div');
  mainCaret.classList.add('caret');
  mainCaret.innerHTML = '&#x25BC;';
  mainHeader.appendChild(mainCaret);
  const mainContent = document.createElement('div');
  mainContent.classList.add('accordion-content');
  mainContent.id = 'accordion-content';
  accordionDiv.appendChild(mainHeader);
  accordionDiv.appendChild(mainContent);

  for (const key in appConfig) {
    const accordionItem = createAccordionItem(key, appConfig[key]);
    mainContent.appendChild(accordionItem);
  }

  mainHeader.addEventListener('click', () => {
    const isVisible = mainContent.style.display === 'block';
    mainContent.style.display = isVisible ? 'none' : 'block';
    mainCaret.classList.toggle('open', !isVisible);
  });

  modalContent.appendChild(accordionDiv);
  modal.appendChild(modalContent);
  modalOverlay.appendChild(modal);
  document.body.appendChild(modalOverlay);
}

function createAccordionItem(key, value) {
  const item = document.createElement('div');
  const header = document.createElement('div');
  const content = document.createElement('div');
  const caret = document.createElement('span');
  item.className = 'accordion-item';
  header.className = 'accordion-header';
  header.setAttribute('aria-expanded', 'false');
  content.className = 'accordion-content';
  caret.className = 'caret';
  caret.innerHTML = '&#x25BC;';
  const headerText = document.createElement('h3');
  headerText.textContent = key;
  header.appendChild(headerText);
  header.appendChild(caret);

  if (key === 'formula') {
    content.classList.add('editor-container');
  } else if (Array.isArray(value)) {
    const list = document.createElement('ul');
    value.forEach(item => {
      const listItem = document.createElement('li');
      listItem.textContent = JSON.stringify(item);
      list.appendChild(listItem);
    });
    content.appendChild(list);
  } else if (typeof value === 'object' && value !== null) {
    for (const subKey in value) {
      if (subKey === 'columns') {
        const subItemHeader = document.createElement('div');
        subItemHeader.className = 'accordion-header';
        subItemHeader.style.padding = '0.25em 0';
        subItemHeader.innerHTML = '&#9776; ' + subKey;
        const subItemContent = document.createElement('div');
        subItemContent.className = 'accordion-content';
        const list = document.createElement('ul');
        value[subKey].forEach(column => {
          const listItem = document.createElement('li');
          listItem.textContent = JSON.stringify(column);
          list.appendChild(listItem);
        });
        subItemContent.appendChild(list);

        subItemHeader.addEventListener('click', () => {
          const isVisible = subItemContent.style.display === 'block';
          subItemContent.style.display = isVisible ? 'none' : 'block';
        });

        content.appendChild(subItemHeader);
        content.appendChild(subItemContent);
      } else {
        const subItem = createAccordionItem(subKey, value[subKey]);
        content.appendChild(subItem);
      }
    }
  } else {
    content.innerHTML = value;
  }

  header.addEventListener('click', () => {
    const isVisible = content.style.display === 'block';
    content.style.display = isVisible ? 'none' : 'block';
    caret.classList.toggle('open', !isVisible);
  });

  item.appendChild(header);
  item.appendChild(content);
  return item;
}

function showSpinner() {
  let spinner = document.getElementById('spinner-container');
  if (!spinner) {
      // Create spinner container
      spinner = document.createElement('div');
      spinner.id = 'spinner-container';
      spinner.classList.add('spinner-container');

      // Create the spinner element itself
      const spinnerElement = document.createElement('div');
      spinnerElement.classList.add('spinner');

      // Append the spinner element to the spinner container
      spinner.appendChild(spinnerElement);

      // Append spinner container to body
      document.body.appendChild(spinner);
  }
  // Display the spinner
  spinner.style.display = 'flex';
}

function newTab(label) {
  const tabsContainer = document.getElementById('tabs');
  const mainContentContainer = document.getElementById('tabbed-content');

  // Create a new content container for this tab
  const contentContainer = document.createElement('div');
  contentContainer.className = 'tab-content';
  contentContainer.setAttribute('data-tab', label);
  contentContainer.style.display = 'none'; // Initially hidden
  mainContentContainer.appendChild(contentContainer);

  // Create the tab element
  const tab = document.createElement('div');
  tab.className = 'tab';
  tab.textContent = label;

  // Handle tab click
  tab.addEventListener('click', () => {
      // Deactivate all tabs and hide all content
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => (c.style.display = 'none'));

      // Activate the clicked tab and show its content
      tab.classList.add('active');
      contentContainer.style.display = 'block';
  });

  // Append the tab to the tabs container
  tabsContainer.appendChild(tab);

  // Automatically activate the first tab
  if (tabsContainer.children.length === 1) {
      tab.click();
  }

  // Return the specific content container for this tab
  return contentContainer;
}

function loadUX() {
  const verticalTabs = document.createElement('div');
  verticalTabs.id = 'tabs';
  verticalTabs.className = 'vertical-tabs';
  document.body.appendChild(verticalTabs);
  contentContainer = document.createElement('div');
  contentContainer.id = 'tabbed-content';
  contentContainer.className = 'content-container';
  document.body.appendChild(contentContainer);
  const tableTab = newTab('Table');
  showRunModal(); // Set up the modal on page load
  const editorContainers = document.querySelectorAll('.editor-container');
  const createToolbar = (editor) => {
    // Create toolbar element
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';

    // Create Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'saveBtn';
    saveBtn.textContent = '⎘';

    // Create Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copyBtn';
    copyBtn.textContent = '⧉';

    // Create Clear button
    const clearBtn = document.createElement('button');
    clearBtn.className = 'clearBtn';
    clearBtn.textContent = '✘';

    // Add button event listeners
    saveBtn.addEventListener('click', async () => {
      try {
        if (window.showSaveFilePicker) {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: '{rename} new_single_page_app.html',
            types: [
              {
                description: 'FI.js SPA File',
                accept: {
                  'text/html': ['.html'],
                },
              },
            ],
          }); 
        const filename = fileHandle.name.replace(/\.html$/, '');

            // Base HTML structure
            let appContent = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="img-src 'self' data:; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://bankersiq.com; object-src 'none';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../../styles/base.css">
    <title>${filename}</title>
  </head>
  <body>
    <script>
      // App configuration
      const appConfig = {
        description: '<h3>${filename}</h3>',
        libraries: [`
            // Add libraries
              appConfig.libraries.forEach((lib) => {
                appContent += `
          '${lib}',`;
              });
              appContent += `
        ],`;
              // Add formula
              appContent += `
        formula: '${editor.textContent}',`;
              // Add groupBy
              appContent += `
        groupBy: '${appConfig.groupBy}',`;
              // Add presentation columns
              appContent += `
        presentation: {
          columns: [`;
              appConfig.presentation.columns.forEach((col) => {
                appContent += `
            { heading: '${col.heading}', field: '${col.field}' },`
              });
              appContent += `
          ],
        }
      };
    </script>
    <script src="../../core/fi.js" defer></script>
  </body>
</html>`;
            // Save the file
            const writable = await fileHandle.createWritable();
            await writable.write(appContent);
            await writable.close();
            alert('File saved successfully!');
          } else {
            // Fallback for unsupported browsers
            const blob = new Blob([appContent], { type: 'text/html' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'new_single_page_app.html';
            link.click();
            alert('File saved (using fallback method)!');
          }
      } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Save failed:', err);
            alert('Failed to save the file.');
          }
      }
    });
  
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(editor.textContent).then(() => {
        alert('Code copied to clipboard!');
      });
    });

    clearBtn.addEventListener('click', () => {
      editor.textContent = '';
      applySyntaxHighlighting(editor);
    });

    // Append buttons to the toolbar
    toolbar.appendChild(saveBtn);
    toolbar.appendChild(copyBtn);
    toolbar.appendChild(clearBtn);

    return toolbar;
  };

  const saveCaretPosition = (element) => {
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return null;
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      return preCaretRange.toString().length;
  };

  const restoreCaretPosition = (element, offset) => {
      if (offset === null) return;
      const selection = window.getSelection();
      const range = document.createRange();
      let currentOffset = 0;

      const traverseNodes = (node) => {
          if (node.nodeType === Node.TEXT_NODE) {
              const nextOffset = currentOffset + node.length;
              if (currentOffset <= offset && offset <= nextOffset) {
                  range.setStart(node, offset - currentOffset);
                  range.collapse(true);
                  return true;
              }
              currentOffset = nextOffset;
          } else {
              for (let child of node.childNodes) {
                  if (traverseNodes(child)) return true;
              }
          }
          return false;
      };

      traverseNodes(element);
      selection.removeAllRanges();
      selection.addRange(range);
  };

  const applySyntaxHighlighting = (editor) => {
      const caretOffset = saveCaretPosition(editor);
      const lines = editor.textContent.split('\n');
      const highlightedLines = lines.map((line) => {
          let text = line;

          text = text
              .replace(/\{\{/g, '<span class="highlight-double-curly">{{</span>')
              .replace(/\}\}/g, '<span class="highlight-double-curly">}}</span>')
              .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\.(\b[a-zA-Z_][a-zA-Z0-9_]*\b)/g, (match, source, object) => {
                  return `<span class="highlight-source">${source}</span><span class="highlight-dot">.</span><span class="highlight-object">${object}</span>`;
              })
              .replace(/\bconst\b/g, '<span class="highlight-const">const</span>')
              .replace(/\bappConfig\b/g, '<span class="highlight-appConfig">appConfig</span>')
              .replace(/(?<!\{)\{(?!\{)/g, '<span class="highlight-curly">{</span>')
              .replace(/(?<!\})\}(?!\})/g, '<span class="highlight-curly">}</span>')
              .replace(/\(/g, '<span class="highlight-parentheses">(</span>')
              .replace(/\)/g, '<span class="highlight-parentheses">)</span>')
              .replace(/\[/g, '<span class="highlight-brackets">[</span>')
              .replace(/\]/g, '<span class="highlight-brackets">]</span>')
              .replace(/\b(null)\b/g, '<span class="highlight-null">$1</span>')
              .replace(/(\b[a-zA-Z_][a-zA-Z0-9_]*\b)(?=\s*:)/g, '<span class="highlight-key">$1</span>')
              .replace(/\/\/.*$/gm, '<span class="highlight-comment">$&</span>');

          return text || '<br>';
      });

      editor.innerHTML = highlightedLines.join('\n');
      restoreCaretPosition(editor, caretOffset);
  };

  editorContainers.forEach((container) => {
      //const editor = container.querySelector('.code-editor');

      // Append toolbar dynamically
      const editor= document.createElement('div');
      editor.classList.add('code-editor');
      editor.setAttribute('contenteditable', 'true');
      editor.setAttribute('spellcheck', 'false');
      editor.id = 'formula';
      editor.innerHTML = appConfig.formula;
      container.appendChild(editor);
      const toolbar = createToolbar(editor);
      container.appendChild(toolbar);

      editor.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
              event.preventDefault();
              const caretOffset = saveCaretPosition(editor);
              const text = editor.textContent;
              const beforeCaret = text.slice(0, caretOffset);
              const afterCaret = text.slice(caretOffset);
              editor.textContent = `${beforeCaret}\n${afterCaret}`;
              restoreCaretPosition(editor, caretOffset + 1);
              applySyntaxHighlighting(editor);
          }
      });

      editor.addEventListener('input', () => applySyntaxHighlighting(editor));

      applySyntaxHighlighting(editor);
  });

  renderFavicon();
  
  // Change the title before printing and revert after printing
  const originalTitle = document.title;

  window.addEventListener('beforeprint', function () {
    document.title = originalTitle + ' on FI.js';
  });

  window.addEventListener('afterprint', function () {
    document.title = originalTitle;
  });
};

function renderFavicon() {
  console.log('Rendering the UI...')
  const canvas = document.createElement('canvas'); 
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Define the SVG as a string
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 200 200">
    <!-- Bottom rotated square -->
    <g transform="rotate(45, 100, 100)">
      <rect x="35" y="35" width="130" height="130" fill="none" stroke="#007acc" stroke-width="4"/>
    </g>
    <!-- Top square -->
    <g>
      <rect x="35" y="35" width="130" height="130" fill="#4caf50" opacity="0.8" />
      <text x="100" y="130" font-family="Arial, sans-serif" font-size="100" fill="#ffffff" text-anchor="middle">
        FI
      </text>
    </g>
  </svg>`;

  // Create an image from the SVG
  const img = new Image();
  img.onload = function () {
    // Draw the SVG onto the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Generate the favicon
    const faviconUrl = canvas.toDataURL('image/png');
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = faviconUrl;
  };
  img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
}
