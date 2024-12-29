// ux.js

// Function to display combined results in a table
function displayResultsInTable() {
  console.log('combinedResults', combinedResults);
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
    appConfig.presentation.columns.forEach(column => {
      const columnHeader = document.createElement('th');
      const aiButton = document.createElement('button');
      aiButton.textContent = column.heading;
      aiButton.className = 'button';
      aiButton.addEventListener('click', () => aiTableTranslater(table.id, column.heading));
      columnHeader.appendChild(aiButton);
      headerRow.appendChild(columnHeader);
    });
  }

  // Add the Result header
  const headerResult = document.createElement('th');
  headerResult.textContent = 'Result';
  headerRow.appendChild(headerResult);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Determine column format based on values in each row
  const columnFormat = appConfig.presentation.columns.map(() => ({ isCurrency: false, integerCount: 0, currencyCount: 0 }));
  const columnSums = Array(appConfig.presentation.columns.length).fill(0);
  let totalCount = 0;
  let resultSum = 0;

  // First pass to determine the dominant format for each column
  const sortedResults = Object.entries(combinedResults).sort((a, b) => {
    return parseFloat(b[1].result) - parseFloat(a[1].result);
  });

  sortedResults.forEach(([_, data]) => {
    appConfig.presentation.columns.forEach((column, index) => {
      const field = column.field.toLowerCase();
      let values = [];

      if (data[field]) {
        if (typeof data[field] === 'string') {
          values = data[field].includes(',') ? values = data[field].split(',').map(v => parseFloat(v.trim())) : data[field];
        } else {
          values = Array.isArray(data[field]) ? data[field] : [parseFloat(data[field])];
        }
      }

      //if (Array.isArray(data[field])) {
      if (Array.isArray(values)) {
        if (values.every(Number.isInteger) && values.every(v => v <= 9999)) {
          columnFormat[index].integerCount += values.length;
        } else if (typeof data[field] !== 'string') {
          columnFormat[index].currencyCount += values.length;
          columnFormat[index].isCurrency = true; // Flag as currency if any value suggests it
        }
      }
    });
  });

  columnFormat.forEach((format, index) => {
    format.isCurrency = format.currencyCount > format.integerCount;  //if more currency than integer column is currency
  });

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
          if (typeof data[field] === 'string') {
            values = data[field].includes(',') ? data[field].split(',').map(v => parseFloat(v.trim())) : data[field];
          } else {
            values = Array.isArray(data[field]) ? data[field] : [parseFloat(data[field])];
          }
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
      valueCell.textContent = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(data.result);
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
  resultTotalCell.textContent = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(resultSum);
  totalRow.appendChild(resultTotalCell);
  table.appendChild(totalRow);

  tableContainer.appendChild(table);
  const resultsContainer = document.createElement('div');
  resultsContainer.id = 'results-container';
  const resultsTitle = document.createElement('h2');
  resultsTitle.textContent = document.title;
  resultsTitle.style.paddingLeft = '1em';
  resultsContainer.appendChild(resultsTitle);
  resultsContainer.appendChild(tableContainer);
  const appContainer = document.getElementById('app-container');
  appContainer.appendChild(resultsContainer);

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
  lightIndicator.className = 'light-indicator waiting'; // Default to 'waiting' state
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
        <rect x="35" y="35" width="130" height="130" fill="#007acc" opacity="0.8" />
        <text x="100" y="135" font-family="Arial, sans-serif" font-size="90" fill="#ffffff" text-anchor="middle" >
          JS
        </text>
      </g>
      <!-- Top square -->
      <g>
        <rect x="35" y="35" width="130" height="130" fill="#4caf50" opacity="0.75" />
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
  if (key === 'formula') {
    content.classList.add('code-container');
    content.setAttribute('contenteditable', 'true');
    content.setAttribute('spellcheck', 'false');
    content.style.padding = '1em 0';
    content.id = 'formula';
  }
  caret.className = 'caret';
  caret.innerHTML = '&#x25BC;';
  const headerText = document.createElement('h3');
  headerText.textContent = key;
  header.appendChild(headerText);
  header.appendChild(caret);

  if (Array.isArray(value)) {
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
        subItemHeader.textContent = subKey;
        subItemHeader.style.textDecoration = "underline";
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
    content.textContent = value;
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

function loadUX() {
  showRunModal(); // Set up the modal on page load
  const appConfigElements = document.querySelectorAll('.code-container');
  appConfigElements.forEach(appConfigElement => {
      let highlightedText = appConfigElement.textContent;
      
      // Highlight double curly braces first to ensure they are not affected by other replacements
      highlightedText = highlightedText
          .replace(/\{\{/g, '<span class="highlight-double-curly">{{</span>')
          .replace(/\}\}/g, '<span class="highlight-double-curly">}}</span>');

      // Use a function to handle highlighting source.object pairs
      const sourceObjectRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\.(\b[a-zA-Z_][a-zA-Z0-9_]*\b)/g;
      highlightedText = highlightedText.replace(sourceObjectRegex, (match, source, object) => {
          //console.log("Match found:", match, "| Source:", source, "| Object:", object);
          return `<span class="highlight-source">${source}</span><span class="highlight-dot">.</span><span class="highlight-object">${object}</span>`;
      });

      // Highlight keywords and specific elements after handling source.object pairs
      highlightedText = highlightedText
          .replace(/\bconst\b/g, '<span class="highlight-const">const</span>')
          .replace(/\bappConfig\b/g, '<span class="highlight-appConfig">appConfig</span>')
          .replace(/(?<!\{)\{(?!\{)/g, '<span class="highlight-curly">{</span>')
          .replace(/(?<!\})\}(?!\})/g, '<span class="highlight-curly">}</span>')
          .replace(/\(/g, '<span class="highlight-parentheses">(</span>')
          .replace(/\)/g, '<span class="highlight-parentheses">)</span>')
          .replace(/\[/g, '<span class="highlight-brackets">[</span>')
          .replace(/\]/g, '<span class="highlight-brackets">]</span>')
          .replace(/\b(null)\b/g, '<span class="highlight-null">$1</span>')
          .replace(/(\b[a-zA-Z_][a-zA-Z0-9_]*\b)(?=\s*:)/g, '<span class="highlight-key">$1</span>');

      // Highlight all text after // to the end of the line in hunter green
      highlightedText = highlightedText.replace(/\/\/.*$/gm, '<span class="highlight-comment">$&</span>');

      // Set the final highlighted text back to the HTML element
      appConfigElement.innerHTML = highlightedText;
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