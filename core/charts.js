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
  plotButton.textContent = 'Plot Chart';

  // Create the canvas for chart rendering
  const chartCanvas = document.createElement('canvas');
  chartCanvas.id = 'chart-canvas';
  chartCanvas.width = 400;
  chartCanvas.height = 400;

  // Create a legend container
  const legendContainer = document.createElement('div');
  legendContainer.id = 'legend-container';

  // Append all elements to the chart container
  chartContainer.appendChild(fieldSelect);
  chartContainer.appendChild(chartTypeSelect);
  chartContainer.appendChild(plotButton);
  chartContainer.appendChild(chartCanvas);
  chartContainer.appendChild(legendContainer);

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
      const fieldValue = record[selectedField];
      if (totals[fieldValue]) {
        totals[fieldValue] += record.result; // Sum the result values
      } else {
        totals[fieldValue] = record.result;
      }
    });

    const labels = Object.keys(totals);
    const data = Object.values(totals);

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

    // Define bar properties
    const barWidth = 40;
    const barSpacing = 10;
    const chartHeight = canvas.height - 40; // Leave space for labels and value text

    labels.forEach((label, index) => {
      const x = index * (barWidth + barSpacing);
      const barHeight = (data[index] / maxDataValue) * chartHeight;
      const y = canvas.height - barHeight - 20; // Adjust to start drawing bar

      ctx.fillStyle = getRandomColor(); 
      ctx.fillRect(x, y, barWidth, barHeight);

      // Add label below the bar
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.fillText(label, x + (barWidth / 2) - (ctx.measureText(label).width / 2), canvas.height - 5);

      // Add total value on top of the bar
      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      ctx.fillText(data[index], x + (barWidth / 2) - (ctx.measureText(data[index].toString()).width / 2), y - 5);
    });
  }

  function plotPieChart(ctx, labels, data, canvas) {
    const total = data.reduce((sum, value) => sum + value, 0);
    let startAngle = 0;

    data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;

      ctx.fillStyle = getRandomColor(); // Different color for each slice
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height / 2);
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      startAngle += sliceAngle;

      // Add label with value in white font
      const midAngle = startAngle - sliceAngle / 2;
      const labelX = canvas.width / 2 + (canvas.height / 2 / 2) * Math.cos(midAngle);
      const labelY = canvas.height / 2 + (canvas.height / 2 / 2) * Math.sin(midAngle);
      ctx.fillStyle = '#FFF'; // White font for better contrast
      ctx.font = '14px Arial';
      ctx.fillText(`${labels[index]}: ${value}`, labelX, labelY);
    });
  }

  function createLegend(labels, data, field) {
    legendContainer.innerHTML = ''; // Clear previous legend

    // Create legend title
    const legendTitle = document.createElement('h4');
    legendTitle.textContent = `Legend: ${field}`;
    legendContainer.appendChild(legendTitle);

    // Create legend items
    labels.forEach((label, index) => {
      const legendItem = document.createElement('div');
      legendItem.textContent = `${label}: ${data[index]}`;
      legendContainer.appendChild(legendItem);
    });
  }

  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
});
