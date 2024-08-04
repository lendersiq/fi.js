// Function to display combined results in a table
function displayResultsInTable(combinedResults) {
    const table = document.createElement('table');
    table.className = 'table'; // Apply CSS class
  
    const headerRow = document.createElement('tr');
    
    // Create a button for the unique ID header
    const headerUniqueId = document.createElement('th');
    const uniqueIdButton = document.createElement('button');
    uniqueIdButton.textContent = 'Portfolio'; // Display as a button
    uniqueIdButton.className = 'button';
    uniqueIdButton.addEventListener('click', handleUniqueIdButtonClick);
    headerUniqueId.appendChild(uniqueIdButton);
  
    const headerValue = document.createElement('th');
    headerValue.textContent = 'Result';
  
    headerRow.appendChild(headerUniqueId);
    headerRow.appendChild(headerValue);
    table.appendChild(headerRow);
  
    const rows = {};
  
    Object.entries(combinedResults).forEach(([uniqueId, value]) => {
      const row = document.createElement('tr');
  
      const uniqueIdCell = document.createElement('td');
      uniqueIdCell.textContent = uniqueId.toString(); // Ensure unique ID is a string
  
      const valueCell = document.createElement('td');
  
      // Detect the type of value and format accordingly
      if (typeof value === 'number') {
        if (value % 1 !== 0) {
          // Floating point number
          valueCell.textContent = value.toFixed(2);
        } else {
          // Integer
          valueCell.textContent = value.toString();
        }
      } else {
        valueCell.textContent = value;
      }
  
      row.appendChild(uniqueIdCell);
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
              updateUniqueIdColumn(mapping);
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
        if (row.portfolio && row.name) {
          mapping[row.portfolio.toString()] = row.name; // Ensure keys are strings
        }
      });
      return mapping;
    }
  
    function updateUniqueIdColumn(mapping) {
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
