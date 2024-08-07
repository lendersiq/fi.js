// Function to display combined results in a table
function displayResultsInTable() {
  console.log('combinedResults', combinedResults);
  const table = document.createElement('table');
  table.className = 'table'; // Apply CSS class

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
  table.appendChild(headerRow);

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

        // Access data fields dynamically
        if (field === appConfig.unique.toLowerCase()) {
          cell.textContent = uniqueId.toString();
        } else if (data[field] !== undefined) {
          // Format numeric values appropriately
          if (typeof data[field] === 'number') {
            // Check if the number is an integer
            if (Number.isInteger(data[field])) {
              // Display as integer
              cell.textContent = data[field];
            } else {
              // Display as currency
              cell.textContent = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(data[field]);
            }
          } else {
            // Display non-numeric data
            cell.textContent = data[field];
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
  });

  const resultsContainer = document.getElementById('results-container');
  resultsContainer.innerHTML = ''; // Clear previous results
  resultsContainer.appendChild(table);

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
      if (mapping[uniqueId]) {
        rows[uniqueId].textContent = mapping[uniqueId];
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
                <img src="../JS_box.png" alt="Logo">
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
      const label = document.createElement('label');
      label.htmlFor = `${sourceName}-file`;
      label.textContent = `Choose ${sourceName.charAt(0).toUpperCase() + sourceName.slice(1)}:`;
  
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.id = `${sourceName}-file`;
      input.style.display = 'block';
  
      // Check if all files are selected to enable the run button
      input.addEventListener('change', () => {
        const allFilesSelected = identifiedSources.every(sourceName => fileInputs[sourceName].files.length > 0);
        runButton.disabled = !allFilesSelected;
      });
  
      fileInputsContainer.appendChild(label);
      fileInputsContainer.appendChild(input);
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
  
  // Set up the modal on page load
  document.addEventListener('DOMContentLoaded', () => {
    showRunModal();
  });
