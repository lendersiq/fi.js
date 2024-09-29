document.addEventListener('DOMContentLoaded', () => {
  // Create and render the chart container
  const chartContainer = document.createElement('div');
  chartContainer.id = 'chart-container';

  // Create the field select dropdown
  const fieldSelect = document.createElement('select');
  fieldSelect.id = 'field-select';

  // Populate additional fields from appConfig.presentation.columns
  if (appConfig.presentation && appConfig.presentation.columns) {
    appConfig.presentation.columns.forEach(column => {
      const option = document.createElement('option');
      option.value = column.field;
      option.textContent = column.heading; // Use heading for display
      fieldSelect.appendChild(option);
    });
  }

  // Create the chart type select dropdown
  const chartTypeSelect = document.createElement('select');
  chartTypeSelect.id = 'chart-type-select';

  // Add chart type options
  const barOption = document.createElement('option');
  barOption.value = 'bar';
  barOption.textContent = 'Bar Chart';
  chartTypeSelect.appendChild(barOption);

  const pieOption = document.createElement('option');
  pieOption.value = 'pie';
  pieOption.textContent = 'Pie Chart';
  chartTypeSelect.appendChild(pieOption);

  // Create the plot button
  const plotButton = document.createElement('button');
  plotButton.id = 'plot-button';
  plotButton.textContent = 'View Chart';
  plotButton.className = 'chart-button';

  // Create the canvas for chart rendering
  const chartCanvas = document.createElement('canvas');
  chartCanvas.id = 'chart-canvas';
  chartCanvas.width = 800; // Adjusted to larger width for more data points
  chartCanvas.height = 400; // Adjusted height if needed

  // Create a legend container
  const legendContainer = document.createElement('div');
  legendContainer.id = 'legend-container';

  // Append all elements to the chart container
  chartContainer.appendChild(fieldSelect);
  chartContainer.appendChild(chartTypeSelect);
  chartContainer.appendChild(plotButton);
  chartContainer.appendChild(chartCanvas);
  chartContainer.appendChild(legendContainer);
  chartContainer.style.display = 'none';
  // Append the chart container to the app container
  const appContainer = document.getElementById('app-container');
  appContainer.appendChild(chartContainer);

  // Event listener for the plot button
  plotButton.addEventListener('click', () => {
    if (typeof combinedResults === 'undefined' || Object.keys(combinedResults).length === 0) {
      alert('No data available to plot. Please ensure the data is processed first.');
      return;
    }

    const selectedField = fieldSelect.value;
    const chartType = chartTypeSelect.value;

    // Calculate totals for each unique value in the selected field
    const totals = {};
    Object.entries(combinedResults).forEach(([uniqueId, record]) => {
      if (record.result) {
        if (typeof record[selectedField] === 'string') {  
          values = record[selectedField].split(',').map(v => parseFloat(v.trim()));
        } else {
            // If data[field] is already a number or an array of numbers, use it directly
            values = Array.isArray(record[selectedField]) ? record[selectedField] : [parseFloat(record[selectedField])]; 
        }
        const fieldValue = calculateMode(values);
        if (totals[fieldValue]) {
          totals[fieldValue] += record.result; // Sum the result values
        } else {
          totals[fieldValue] = record.result;
        }
      }
    });

    const labels = Object.keys(totals);
    const data = Object.values(totals);

    // Adjust canvas size if necessary
    adjustCanvasSize(chartCanvas, labels.length);

    // Plot the chart based on selected type
    plotChart(chartType, labels, data, chartCanvas, selectedField);

    // Create and display the legend
    createLegend(labels, data, selectedField);
  });

  function plotChart(type, labels, data, canvas, field) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings

    if (type === 'bar') {
      plotBarChart(ctx, labels, data, field, canvas);
    } else if (type === 'pie') {
      plotPieChart(ctx, labels, data, canvas);
    }
  }

  function plotBarChart(ctx, labels, data, field, canvas) {
    const maxDataValue = Math.max(...data);
    const minDataValue = Math.min(...data);
  
    // Define the height for the legend/zero line with padding
    const legendHeight = 20; // Adjust as needed for font size and padding
    const chartHeight = canvas.height - legendHeight - 40; // Space for bars
  
    // Define the zero line at the height of the legend
    const zeroLine = canvas.height - legendHeight - 20;
  
    // Define dynamic bar properties
    const barWidth = Math.max((canvas.width - (labels.length * 10)) / labels.length, 5);
    const barSpacing = 10;
  
    labels.forEach((label, index) => {
      const x = index * (barWidth + barSpacing);
      const barHeight = Math.abs(data[index] / (maxDataValue - minDataValue) * chartHeight);
      const y = data[index] >= 0 ? zeroLine - barHeight : zeroLine;
  
      ctx.fillStyle = getRandomColor();
      ctx.fillRect(x, y, barWidth, barHeight);
  
      // Add label above the zero line for positive values, below for negative
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
  
      if (data[index] >= 0) {
        const topLabel = convertToK(data[index]);
        ctx.fillText(topLabel, x + (barWidth / 2) - (ctx.measureText(topLabel.toString()).width / 2), y - 5);
      } else {
        const bottomLabel = convertToK(data[index]);
        ctx.fillText(bottomLabel, x + (barWidth / 2) - (ctx.measureText(bottomLabel.toString()).width / 2), y + barHeight + 15);
      }
    });
  
    // Draw the legend/zero line
    ctx.strokeStyle = '#000'; // Legend line color
    ctx.lineWidth = 1; // Legend line width
    ctx.beginPath();
    ctx.moveTo(0, zeroLine);
    ctx.lineTo(canvas.width, zeroLine);
    ctx.stroke();
  
    // Add legend labels at the zero line
    labels.forEach((label, index) => {
      const x = index * (barWidth + barSpacing);
      ctx.fillText(label, x + (barWidth / 2) - (ctx.measureText(label).width / 2), zeroLine + legendHeight / 2 + 5); // Position the label
    });
  }  
  
  function plotPieChart(ctx, labels, data, canvas) {
    const validData = data.map(value => Math.max(0, value));
    const total = validData.reduce((sum, value) => sum + value, 0);
    let startAngle = 0;
  
    validData.forEach((value, index) => {
      if (value === 0) return;
  
      const sliceAngle = (value / total) * 2 * Math.PI;
  
      ctx.fillStyle = getRandomColor();
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height / 2);
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
  
      // Adjusting the label positioning
      const midAngle = startAngle + sliceAngle / 2;
      const labelRadius = canvas.height / 2 * 0.7; // Position labels slightly closer to the center
      const labelX = canvas.width / 2 + labelRadius * Math.cos(midAngle);
      const labelY = canvas.height / 2 + labelRadius * Math.sin(midAngle);
      ctx.fillStyle = '#FFF';
      ctx.font = '14px Arial';
  
      const valueK = convertToK(value);
      const labelText = `${labels[index]}: ${valueK}`;
  
      // Adjust label position based on slice size
      if (sliceAngle < Math.PI / 6) {
        ctx.textAlign = midAngle > Math.PI ? 'right' : 'left';
      } else {
        ctx.textAlign = 'center';
      }
  
      ctx.fillText(labelText, labelX, labelY);
  
      startAngle += sliceAngle;
    });
  }  
  
  function createLegend(labels, data, field) {
    legendContainer.innerHTML = ''; // Clear previous legend
    const table = document.createElement('table');
    table.className = 'table'; 
    table.id = 'chart-legend';
    const headerRow = document.createElement('tr');
  
    //chart.js ai button
    const headerLegend = document.createElement('th');
    headerLegend.textContent = 'Legend ';
    const aiButton = document.createElement('button');
    aiButton.textContent = `${field}`;
    aiButton.className = 'chart-button';
    aiButton.addEventListener('click', () => aiTableTranslater(table.id));
    headerLegend.appendChild(aiButton);
    headerRow.appendChild(headerLegend);

    const headerResult = document.createElement('th');
    headerResult.textContent = 'Result';
    headerRow.appendChild(headerResult);
    table.appendChild(headerRow);

    // Create legend items
    
    labels.forEach((label, index) => {
      const row = document.createElement('tr');
      const legendLabel = document.createElement('td');
      legendLabel.textContent = `${label}`;
      row.appendChild(legendLabel);
      const legendValue = document.createElement('td');
      legendValue.textContent = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(data[index]);
      row.appendChild(legendValue);
      table.appendChild(row);
    });
    legendContainer.appendChild(table);
  }

  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  function convertToK(number) {
    // Check if the input is a number
    if (typeof number !== 'number') {
        return number;
    }
    let convertedNumber = number / 1000;
    return convertedNumber.toFixed(1) + 'k';
  }

  function adjustCanvasSize(canvas, numberOfBars) {
    // Adjust canvas width based on the number of bars and their width
    const minCanvasWidth = 800;
    const newWidth = Math.max(numberOfBars * 50, minCanvasWidth); // 50 is an arbitrary width per bar, adjust as needed
    canvas.width = newWidth;
  }
});
