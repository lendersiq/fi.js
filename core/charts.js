// charts.js

function loadCharts() {
  // Create and render the chart container
  const chartContainer = document.createElement('div');
  chartContainer.id = 'chart-container';

  // Create the field select dropdown
  const fieldSelect = document.createElement('select');
  fieldSelect.id = 'field-select';

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
  chartCanvas.style.overflowX = "scroll";

  // Create a legend container
  const legendContainer = document.createElement('div');
  legendContainer.id = 'legend-container';

  // Append all elements to the chart container
  chartContainer.appendChild(fieldSelect);
  chartContainer.appendChild(chartTypeSelect);
  chartContainer.appendChild(plotButton);
  chartContainer.appendChild(chartCanvas);
  chartContainer.appendChild(legendContainer);
  //chartContainer.style.display = 'none';
  // Append the chart container to the charts tab
  const chartsTab = newTab('Charts');
  chartsTab.appendChild(chartContainer);

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
          totals[fieldValue] = allResultsAreIntegers ? (record.result === 0 ? totals[fieldValue] : Math.round((totals[fieldValue] + record.result) / 2)) : totals[fieldValue] + record.result;
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
    const range = maxDataValue - minDataValue || 1; // Avoid division by zero
    const scalingFactor = range < 50 ? 1.1 : 1; // Amplify small ranges

    // Define padding for labels and adjust chart height
    const topPadding = 60; // Padding at the top for labels
    const bottomPadding = 60; // Padding at the bottom for labels
    const legendHeight = 20; // Height for the legend/zero line
    const chartHeight = canvas.height - topPadding - bottomPadding - legendHeight;


    // Define the zero line at the height of the legend
    const zeroLine = canvas.height - legendHeight - bottomPadding;

    // Define dynamic bar properties
    const barWidth = Math.max((canvas.width - (labels.length * 10)) / labels.length, 5);
    const barSpacing = 10;

    labels.forEach((label, index) => {
        const x = index * (barWidth + barSpacing);
        let barHeight = Math.abs(data[index] / (maxDataValue - minDataValue) * chartHeight);
        if (scalingFactor > 1) {
          barHeight = Math.abs(((data[index] - minDataValue) / range) * chartHeight * scalingFactor);
          barHeight = barHeight == 0 ? 15 : barHeight;  //minimum bar height
        }
        //console.log('bar height, range', barHeight, range, scalingFactor)

        const y = data[index] >= 0 ? zeroLine - barHeight : zeroLine;

        // Apply shadow for bars
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Draw bar
        ctx.fillStyle = getRandomColor();
        ctx.fillRect(x, y, barWidth, barHeight);

        // Reset shadow for text rendering
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Add label above the zero line for positive values, below for negative
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';

        if (data[index] >= 0) {
            const topLabel = convertToK(data[index]);
            const labelY = y - 5; // Adjusted to leave space above the bar
            ctx.fillText(
                topLabel,
                x + (barWidth / 2) - (ctx.measureText(topLabel.toString()).width / 2),
                labelY > 0 ? labelY : 10 // Ensure the label stays within canvas bounds
            );
        } else {
            const bottomLabel = convertToK(data[index]);
            // Dynamically adjust spacing for short negative bars
            const extraSpacing = barHeight < 50 ? 20 : 15; // Add extra spacing for short bars
            const labelY = y + barHeight + extraSpacing;
            ctx.fillText(
                bottomLabel,
                x + (barWidth / 2) - (ctx.measureText(bottomLabel.toString()).width / 2),
                labelY < canvas.height ? labelY : canvas.height - 5 // Ensure label is within canvas
            );
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
        ctx.fillText(
            label,
            x + (barWidth / 2) - (ctx.measureText(label).width / 2),
            zeroLine + legendHeight / 2 + 5
        ); // Position the label
    });
}

function plotPieChart(ctx, labels, data, canvas) {
  const validData = data.map(value => Math.max(0, value));
  const total = validData.reduce((sum, value) => sum + value, 0);
  let startAngle = 0;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.height / 2;

  validData.forEach((value, index) => {
    if (value === 0) return;

    const sliceAngle = (value / total) * 2 * Math.PI;

    // Draw slice
    ctx.fillStyle = getRandomColor();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();

    // Calculate mid-angle and label position
    const midAngle = startAngle + sliceAngle / 2;
    const labelRadius = radius * 0.6; // Position labels slightly closer to the center
    const labelX = centerX + labelRadius * Math.cos(midAngle);
    const labelY = centerY + labelRadius * Math.sin(midAngle);

    // Ensure label contrast with the slice color
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Light translucent background
    ctx.strokeStyle = '#000'; // Outline for contrast
    ctx.lineWidth = 2;

    const valueK = convertToK(value);
    const labelText = `${labels[index]}: ${valueK}`;

    // Adjust label rotation and alignment
    ctx.save();
    ctx.translate(labelX, labelY);
    ctx.rotate(midAngle);

    if (midAngle > Math.PI / 2 && midAngle < (3 * Math.PI) / 2) {
        ctx.rotate(Math.PI); // Rotate for readability in lower half
        ctx.textAlign = 'right';
    } else {
        ctx.textAlign = 'left';
    }

    ctx.font = '14px Arial';
    ctx.strokeText(labelText, 0, 0); // Outline the text for contrast
    ctx.fillText(labelText, 0, 0); // Draw the text
    ctx.restore();

    startAngle += sliceAngle;
  });
}

  function createLegend(labels, data, field) {
    //console.log('createLegend', labels, data, field);
    legendContainer.innerHTML = ''; // Clear previous legend
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
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
    aiButton.addEventListener('click', () => aiTableTranslator(table.id));
    headerLegend.appendChild(aiButton);
    headerRow.appendChild(headerLegend);

    const headerResult = document.createElement('th');
    headerResult.textContent = 'Result';
    headerRow.appendChild(headerResult);
    table.appendChild(headerRow);

    // Create legend items
    const allDataAreIntegers = data.every(Number.isInteger);
    labels.forEach((label, index) => {
      const row = document.createElement('tr');
      const legendLabel = document.createElement('td');
      if (!isNaN(label)) {
        legendLabel.textContent = `${label}`;
      }
      row.appendChild(legendLabel);
      const legendValue = document.createElement('td');
      if (allDataAreIntegers) {
        legendValue.textContent = data[index]
      } else {
        legendValue.textContent = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(data[index]);
      }
      row.appendChild(legendValue);
      table.appendChild(row);
    });
    tableContainer.appendChild(table);
    legendContainer.appendChild(tableContainer);
  }

  function getRandomColor() {
    // Generate random RGB values with a minimum brightness threshold to avoid dark colors
    const minBrightness = 128; // Ensure values are bright enough
    const r = Math.floor(Math.random() * (256 - minBrightness) + minBrightness); // Red
    const g = Math.floor(Math.random() * (256 - minBrightness) + minBrightness); // Green
    const b = Math.floor(Math.random() * (256 - minBrightness) + minBrightness); // Blue

    // Convert RGB to hexadecimal format
    const color = `rgba(${r}, ${g}, ${b}, 0.75)`; // Add translucency with alpha value (0.7)
    return color;
  } 

  function convertToK(number) {
    // Check if the input is a number
    if (typeof number !== 'number') {
        return number;
    }
    if (Math.abs(number) < 1000) {
        return Math.round(number).toString(); // Return as is if less than 1000
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
};
