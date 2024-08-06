// Function to display combined results in a table
function displayResultsInTable(combinedResults) {
    console.log('combinedResults', combinedResults)
    const table = document.createElement('table');
    table.className = 'table'; // Apply CSS class
  
    const headerRow = document.createElement('tr');
    // Default headers if no presentation config is provided
    const headerUnique = document.createElement('th');
    const mashUpButton = document.createElement('button');
    mashUpButton.textContent = appConfig.unique; 
    mashUpButton.className = 'button';
    mashUpButton.addEventListener('click', handleUniqueIdButtonClick);
    headerUnique.appendChild(mashUpButton);
    headerRow.appendChild(headerUnique);
    if (appConfig.presentation && appConfig.presentation.columns) {
      appConfig.presentation.columns.forEach(column => {
        const header = document.createElement('th');
        header.textContent = column.heading;
        headerRow.appendChild(header);
      });
    }
    const headerResult = document.createElement('th');
    headerResult.textContent = 'Result';
    headerRow.appendChild(headerResult);
    table.appendChild(headerRow);
  
    const rows = {};
    // Iterate over combined results to construct each row
    Object.entries(combinedResults).forEach(([uniqueId, data]) => {
      const row = document.createElement('tr');
      const uniqueIdCell = document.createElement('td');
      uniqueIdCell.textContent = uniqueId.toString(); // Ensure unique ID is a string
      row.appendChild(uniqueIdCell);
      if (appConfig.presentation && appConfig.presentation.columns) {
        appConfig.presentation.columns.forEach(column => {
          const cell = document.createElement('td');
          const field = column.field.toLowerCase(); // Field instead of key
          // Dynamically access data fields
          if (field === appConfig.unique.toLowerCase()) {
            // Display the unique ID based on appConfig.unique
            cell.textContent = uniqueId.toString();
          } else if (data[field] !== undefined) {
            // Format numeric values appropriately
              if (typeof data[field] === 'number') {
                // Determine if the number is an integer
                if (Number.isInteger(data[field])) {
                    // If it's an integer, set the text content as is
                    cell.textContent = data[field];
                } else {
                  // If it's a floating-point number, format it as currency
                  cell.textContent = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(data[field]);
              }
            } else {
                // If it's not a number, set the text content directly
                cell.textContent = data[field];
            }
          } else {
            cell.textContent = ''; // Provide a default empty string if field is missing
          }
          row.appendChild(cell);
        });
      } 
      const valueCell = document.createElement('td');
      // Access the 'result' property directly
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
  
    function updateUniqueColumns(mapping) {
      Object.entries(combinedResults).forEach(([uniqueId, _]) => {
        if (mapping[uniqueId]) {
          rows[uniqueId].textContent = mapping[uniqueId];
        }
      })
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
