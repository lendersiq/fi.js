function aiTableTranslater(tableId) {
    console.log('aiTableTranslater(tableId)', tableId)
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
            updateTableWithMapping(mapping, tableId);
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

function updateTableWithMapping(mapping, tableId) {
    const table = document.getElementById(tableId);
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) { // Start from 1 to skip the header
        const cells = rows[i].getElementsByTagName('td');
        const legendValue = cells[0].textContent.trim();
        
        if (mapping[legendValue]) {
            cells[0].textContent = mapping[legendValue];
        }
    }
}