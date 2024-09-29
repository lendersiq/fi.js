// Function to display combined results in a table
function displayResultsInTable() {
  console.log('combinedResults', combinedResults);
  const tableContainer = document.createElement('div');
  tableContainer.className = 'table-container'; 
  const table = document.createElement('table');
  table.className = 'table'; 
  const thead = document.createElement('thead');
  
  const headerRow = document.createElement('tr');

  // Create a button to handle unique ID mapping
  const headerUnique = document.createElement('th');
  const mashUpButton = document.createElement('button');
  mashUpButton.textContent = appConfig.unique;
  mashUpButton.className = 'button';
  mashUpButton.addEventListener('click', handleUniqueIdButtonClick);
  headerUnique.appendChild(mashUpButton);
  headerRow.appendChild(headerUnique);

  // Add headers from presentation config
  if (appConfig.presentation && appConfig.presentation.columns) {
    appConfig.presentation.columns.forEach(column => {
      const header = document.createElement('th');
      header.textContent = column.heading;
      headerRow.appendChild(header);
    });
  }

  // Add the Result header
  const headerResult = document.createElement('th');
  headerResult.textContent = 'Result';
  headerRow.appendChild(headerResult);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Sort combinedResults by 'result' in descending order
  const sortedResults = Object.entries(combinedResults).sort((a, b) => {
    return parseFloat(b[1].result) - parseFloat(a[1].result);
  });

  // Sort combinedResults by 'result' in ascending order
  /*const sortedResults = Object.entries(combinedResults).sort((a, b) => {
    return parseFloat(a[1].result) - parseFloat(b[1].result);
  });*/

  const rows = {};

  // Iterate over sorted combined results to construct each row
  sortedResults.forEach(([uniqueId, data]) => {
    if (data.result) {
      const row = document.createElement('tr');

      // Create the cell for the unique ID
      const uniqueIdCell = document.createElement('td');
      uniqueIdCell.textContent = `${uniqueId.toString()}  (${data.count})`; // Ensure unique ID is a string
      row.appendChild(uniqueIdCell);

      // Add cells based on presentation config
      if (appConfig.presentation && appConfig.presentation.columns) {
        appConfig.presentation.columns.forEach(column => {
          const cell = document.createElement('td');
          const field = column.field.toLowerCase(); // Use field for data access

          let values;
          if (data[field]) {
              // Ensure data[field] is a string before using split
              if (typeof data[field] === 'string') {
                  values = data[field].split(',').map(v => parseFloat(v.trim()));
              } else {
                  // If data[field] is already a number or an array of numbers, use it directly
                  values = Array.isArray(data[field]) ? data[field] : [parseFloat(data[field])];
              }
          } else {
              values = [];
          }

          // Determine the content of the cell based on the values
          if (field === appConfig.unique.toLowerCase()) {
              cell.textContent = uniqueId.toString();
          } else if (values.length > 0) {
              if (values.every(Number.isInteger) && values.every(v => v <= 9999)) {
                  // If all values are integers and none are greater than 9999 (beyond typical attribute or classifcation systems), calculate and display the mode
                  const modeValue = calculateMode(values);
                  cell.textContent = modeValue;
              } else {
                  const sumValue = values.reduce((acc, v) => acc + v, 0);
                  cell.textContent = new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                  }).format(sumValue);
              }
          } else {
              cell.textContent = ''; // Default empty string if field is missing
          }

          row.appendChild(cell);
      });
    }
    
      // Create the cell for the result
      const valueCell = document.createElement('td');
      valueCell.textContent = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(data.result);
      row.appendChild(valueCell);

      table.appendChild(row);
      rows[uniqueId] = uniqueIdCell; // Store reference for updating

    }
  });
  tableContainer.appendChild(table);
  const resultsContainer = document.createElement('div');
  resultsContainer.id = 'results-container';
  resultsContainer.appendChild(tableContainer);
  const appContainer = document.getElementById('app-container');
  appContainer.appendChild(resultsContainer);

  // Function to handle unique ID button click
  function handleUniqueIdButtonClick() {
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
      if (mapping[uniqueId] && rows[uniqueId]) {  // mapping (mapping[uniqueId]) is present and table row (rows[uniqueId]) has been rendered
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
                 <div class="logo-container" style="--logo-size: 60px;">
                      <div class="square"></div>
                      <div class="inner-square"></div>
                      <div class="innermost-square"></div>
                      <div class="top-square"></div> 
                      <div class="logo-text">JS</div>
                  </div>
                  <h2 id="modalTitle"></h2>
            </div>
    `;
    modalContent.innerHTML = modalHeading;
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
  
    const fileInputsContainer = document.createElement('div');
    const runButton = document.createElement('button');
    runButton.textContent = 'Run';
    runButton.className = 'button';
    runButton.disabled = true; // Disable the run button initially
  
    // Identify sources from the formula
    const identifiedSources = extractSources(appConfig.formula);
  
    // Create file inputs for each identified source
    const fileInputs = {};
    identifiedSources.forEach(sourceName => {
      const step = document.createElement('div');
      step.style.marginBottom = "10px";
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
        const allFilesSelected = identifiedSources.every(sourceName => fileInputs[sourceName].files.length > 0);
        runButton.disabled = !allFilesSelected;
      });
  
      step.appendChild(label);
      step.appendChild(input);
      fileInputsContainer.appendChild(step);
      fileInputs[sourceName] = input;
    });
  
    // Handle file selection and process formula
    runButton.addEventListener('click', () => {
      readFilesAndProcess(fileInputs, identifiedSources, appConfig);
      document.body.removeChild(modal);
    });
  
    modalBody.appendChild(fileInputsContainer);
    modalBody.appendChild(runButton);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
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
