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

      if (Array.isArray(data[field])) {
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
      uniqueIdCell.textContent = `${uniqueId.toString()} (${data.count})`;
      row.appendChild(uniqueIdCell);

      totalCount += data.count;

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
        rows[uniqueId].textContent = mapping[uniqueId] + ' (' + combinedResults[uniqueId].count + ')';
      }
    });
  }
}
  
  // Function to show the modal with file inputs and run button
  function showRunModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'run-modal'; 
  
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    // Render modal content
    const modalHeading = `
            <div class="modal-header">
                <div class="logo-container">
                  <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" width="25%" height="25%">
                        <!-- Define filters for shadows -->
                        <defs>
                            <filter id="textShadow">
                                <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0, 0, 0, 0.5)" />
                            </filter>
                        </defs>
                        <!-- Blue 'U' -->
                        <text x="0" y="150" font-size="120" font-family="Arial, sans-serif" font-weight="normal" fill="rgba(0, 123, 255, 0.8)" filter="url(#textShadow)">U</text>
                        <!-- Green 'U' -->
                        <text x="28" y="160" font-size="120" font-family="Arial, sans-serif" font-weight="normal" fill="rgba(40, 167, 69, 0.8)" filter="url(#textShadow)">U</text>
                    </svg>
                </div>
                <h2 id="modalTitle"></h2>
            </div>
    `;
    modalContent.innerHTML = modalHeading;
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
  
    const inputsContainer = document.createElement('div');
    const runButton = document.createElement('button');
    runButton.textContent = 'Run';
    runButton.className = 'button';
    runButton.disabled = true; // Disable the run button initially
  
    // Identify sources and inputs from the formula
    const identifiedPipes = extractPipes(appConfig.formula);
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
        runButton.disabled = !allFilesSelected;
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
        runButton.disabled = !allFilled
      });
      inputDiv.appendChild(label);
      inputDiv.appendChild(input);
      inputsContainer.appendChild(inputDiv);
    });
  
    // Handle file selection and process formula
    runButton.addEventListener('click', () => {
      processModal(fileInputs, identifiedPipes, appConfig);
      if (identifiedPipes.sources.length > 0) {
        document.body.removeChild(modal);
      }
    });
    const outputContainer = document.createElement('div');
    outputContainer.id = 'outputElement';

    modalBody.appendChild(inputsContainer);
    modalBody.appendChild(outputContainer);
    modalBody.appendChild(runButton);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    // Get the title content from the <title> tag
    const titleContent = document.title;

    // Set the title content into the <h2> element with id 'modalTitle'
    document.getElementById('modalTitle').textContent = titleContent;
  }

  function showSpinner() {
    let spinner = document.getElementById('spinner-container');
    if (!spinner) {
      // Create spinner container
      spinner = document.createElement('div');
      spinner.id = 'spinner-container';
      spinner.classList.add('spinner-container');

      // Create logo container (spinner itself)
      const logoContainer = document.createElement('div');
      logoContainer.classList.add('logo-container');
      logoContainer.style.setProperty('--logo-size', '80px'); // Set size of the spinner
      logoContainer.style.backgroundColor = '#fff'; 
      logoContainer.style.animation = 'spin 3s linear infinite'; 
      
      // Create square elements
      const square = document.createElement('div');
      square.classList.add('square');
      const innerSquare = document.createElement('div');
      innerSquare.classList.add('inner-square');
      const innermostSquare = document.createElement('div');
      innermostSquare.classList.add('innermost-square');
      const topSquare = document.createElement('div');
      topSquare.classList.add('top-square');

      // Append squares to logo container
      logoContainer.appendChild(square);
      logoContainer.appendChild(innerSquare);
      logoContainer.appendChild(innermostSquare);
      logoContainer.appendChild(topSquare);

      // Append logo container to spinner container
      spinner.appendChild(logoContainer);

      // Append spinner container to body
      document.body.appendChild(spinner);
    }
    spinner.style.display = 'flex';
  }
  
  // Set up the modal on page load
  document.addEventListener('DOMContentLoaded', () => {
    showRunModal();
    //placeholder for charts
  });
