// fiCharts.js

window.fiCharts = (function () {
  // Generate random, distinct HSL color
  function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 30) + 70; // 70-100%
    const lightness = Math.floor(Math.random() * 20) + 40; // 40-60%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  // Abbreviate numbers (e.g. 1100 -> 1.1k, 1,000,000 -> 1.0M)
  function abbreviateNumber(value) {
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000) {
      return (value / 1_000_000).toFixed(1) + 'M';
    } else if (absValue >= 1_000) {
      return (value / 1_000).toFixed(1) + 'k';
    } else {
      return value.toFixed(1);
    }
  }

  // Generate tick values (ensure 0 if in [minVal, maxVal])
  function getTickValues(minVal, maxVal, steps = 5) {
    const range = maxVal - minVal;
    if (range === 0) {
      return [minVal];
    }
    const step = range / steps;
    const ticks = [];
    for (let i = 0; i <= steps; i++) {
      ticks.push(minVal + step * i);
    }
    if (minVal < 0 && maxVal > 0 && !ticks.some((v) => Math.abs(v) < 1e-9)) {
      ticks.push(0);
    }
    ticks.sort((a, b) => a - b);
    return ticks;
  }

  /**
   * A linear mapping [minVal -> maxVal] => [0 -> 100].
   * This ensures all bars are within the 0–100% vertical space.
   */
  function scale(value, minVal, maxVal) {
    const range = maxVal - minVal || 1;
    // Convert value from [minVal, maxVal] to [0, 100].
    return ((value - minVal) / range) * 100;
  }

  /**
   * Renders a bar chart with negative values below zero, positive above zero,
   * no vertical overflow, and horizontal spacing for multiple bars.
   */
  function renderBarChart(data, container) {
    console.log('chart data', data)
    container.innerHTML = '';
  
    // Basic stats
    const minVal = Math.min(...data.map((d) => d.y));
    const maxVal = Math.max(...data.map((d) => d.y));
  
    // Create the main chart wrapper
    const chartWrap = document.createElement('div');
    chartWrap.className = 'bar-chart-wrap';

    const innerWrap = document.createElement('div');
    innerWrap.className = 'bar-chart-inner-wrap';
    chartWrap.appendChild(innerWrap);
  
    // Create the axis container
    const axisContainer = document.createElement('div');
    axisContainer.className = 'bar-chart-axis-container';
    innerWrap.appendChild(axisContainer);
  
    // Create the bars container
    const barsContainer = document.createElement('div');
    barsContainer.className = 'bar-chart-container';
    innerWrap.appendChild(barsContainer);
  
    // Shared tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'bar-tooltip';
    tooltip.style.display = 'none';
    barsContainer.appendChild(tooltip);
  
    // Generate evenly spaced ticks (ensuring 0 if range crosses zero)
    const tickValues = getTickValues(minVal, maxVal, 6);
  
    // We'll skip any tick that is fewer than 2 percentage points 
    // away from the previous one (you can tweak 2.0).
    let lastTickPct = -Infinity;
    const minSeparation = 2.0;
  
    tickValues.forEach((tickVal) => {
      const bottomPct = scale(tickVal, minVal, maxVal); // 0..100
    
      // Only proceed if this tick is far enough from the last one
      if (Math.abs(bottomPct - lastTickPct) >= minSeparation) {
        // Create the line
        const axisLine = document.createElement('div');
        axisLine.className = 'bar-chart-axis-line';
        axisLine.style.bottom = bottomPct + '%';
    
        // Create the label
        const axisLabel = document.createElement('span');
        axisLabel.className = 'bar-chart-axis-label';
        axisLabel.textContent = abbreviateNumber(tickVal);
    
        // If it's very close to 100%, shift label down to avoid clipping.
        if (bottomPct > 95) {
          axisLabel.style.top = '-25px'; // push it further inside the container
        }
    
        axisLine.appendChild(axisLabel);
        axisContainer.appendChild(axisLine);
    
        // Update the last drawn position
        lastTickPct = bottomPct;
      }
    });
  
    // Decide bar size & gap
    const barWidth = 40;
    const barGap = 10;
    // The total needed width for all bars
    const chartWidth = data.length * (barWidth + barGap) - barGap;
    barsContainer.style.width = chartWidth + 'px';

    // Set the innerWrap's width so axis + bars scroll together ***
    const leftOffset = 50;   // from .bar-chart-container { left: 50px; }
    const rightOffset = 20;  // from .bar-chart-container { right: 20px; }
    const totalWidth = chartWidth + leftOffset + rightOffset;
    innerWrap.style.width = totalWidth + 'px'; 
    
    // Build each bar
    data.forEach((item, index) => {
      const bar = document.createElement('div');
      bar.className = 'bar';
  
      // Add corner rounding class
      if (item.y >= 0) {
        bar.classList.add('positive-bar');
      } else {
        bar.classList.add('negative-bar');
      }
  
      // Scale item.y -> [0..100%]
      const valuePct = scale(item.y, minVal, maxVal);
      const zeroPct = scale(0, minVal, maxVal);
      const bottomPct = Math.min(valuePct, zeroPct);
      const topPct = Math.max(valuePct, zeroPct);
      const heightPct = topPct - bottomPct;
  
      // Vertical positioning
      bar.style.bottom = bottomPct + '%';
      bar.style.height = heightPct + '%';
  
      // Horizontal positioning
      bar.style.left = (index * (barWidth + barGap)) + 'px';
      bar.style.width = barWidth + 'px';
      bar.style.backgroundColor = getRandomColor();
  
      // Bar label
      const barLabel = document.createElement('span');
      barLabel.className = 'bar-label';
      barLabel.textContent = item.x;
      bar.appendChild(barLabel);
  
      // Tooltip events
      bar.addEventListener('mouseenter', () => {
        tooltip.textContent = `${item.x}: ${abbreviateNumber(item.y)}`;
        tooltip.style.display = 'block';
      });

      bar.addEventListener('mousemove', (e) => {
        // Get container’s bounding box in the browser’s viewport
        const containerRect = barsContainer.getBoundingClientRect();
      
        // The mouse's X position inside the barsContainer:
        const relativeX = e.clientX - containerRect.left;
      
        // Adjust for a small offset so tooltip isn’t directly under the cursor
        tooltip.style.left = (relativeX + 15) + 'px';
      
        // For vertical placement, you’re already computing a midPct:
        const midPct = bottomPct + (heightPct / 2);
        tooltip.style.bottom = midPct + '%';
      });
      

      bar.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
  
      barsContainer.appendChild(bar);
    });
  
    container.appendChild(chartWrap);
  }
  

  /**
   * Renders a pie chart using conic-gradient, with optional legend.
   * Accepts data (array of { x, y }) and a container DOM element.
   * Negative values are ignored in the total but can appear in the legend (optional).
   */
  function renderPieChart(data, container, { showLegend = true } = {}) {
    // Clear container
    container.innerHTML = '';

    // Calculate total from positive values only
    const total = data.reduce((sum, item) => sum + Math.max(0, item.y), 0) || 1;

    // Build an array of color segments for both the conic gradient and the legend
    let startAngle = 0;
    const colorSegments = data.map((item) => {
      const validValue = Math.max(0, item.y);
      const sliceAngle = (validValue / total) * 360;
      const color = getRandomColor();
      // Segment for conic-gradient
      const segmentCSS = `${color} ${startAngle}deg ${startAngle + sliceAngle}deg`;
      startAngle += sliceAngle;
      return { x: item.x, y: item.y, color, sliceAngle, segmentCSS };
    });

    // Create the pie chart element
    const pieChartEl = document.createElement('div');
    pieChartEl.className = 'pie-chart';

    // Construct the conic-gradient background
    const gradientString = colorSegments.map((seg) => seg.segmentCSS).join(', ');
    pieChartEl.style.background = `conic-gradient(${gradientString})`;

    // Re-run the angle loop for labeling, matching the same 0 -> 360 progression
    startAngle = 0;
    colorSegments.forEach((seg) => {
      // Midpoint angle of this slice (CSS orientation: 0° = top, moves clockwise)
      const midAngle = startAngle + seg.sliceAngle / 2;
      startAngle += seg.sliceAngle;

      // Convert CSS conic angle (top-based, clockwise) to typical math angle (right-based, CCW)
      // By subtracting 90°, we ensure 0° = top becomes 0° = right in math terms.
      const rad = (midAngle - 90) * (Math.PI / 180);

      // For a 600×600 pie chart, center is at (300, 300).
      // Adjust radius to leave margin for labels.
      const center = 300;
      const radius = 280; 
      const x = center + radius * 0.65 * Math.cos(rad);
      const y = center + radius * 0.65 * Math.sin(rad);

      // Create label
      const label = document.createElement('span');
      label.className = 'pie-label';
      label.textContent = `${seg.x} (${abbreviateNumber(seg.y)})`;
      label.style.left = `${x}px`;
      label.style.top = `${y}px`;

      pieChartEl.appendChild(label);
    });

    container.appendChild(pieChartEl);

    // Optional legend
    if (showLegend) {
      const legendContainer = document.createElement('div');
      legendContainer.className = 'pie-legend';

      colorSegments.forEach((seg) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'pie-legend-item';

        const colorBox = document.createElement('span');
        colorBox.className = 'pie-legend-color-box';
        colorBox.style.backgroundColor = seg.color;

        const labelSpan = document.createElement('span');
        labelSpan.textContent = `${seg.x} (${abbreviateNumber(seg.y)})`;

        legendItem.appendChild(colorBox);
        legendItem.appendChild(labelSpan);
        legendContainer.appendChild(legendItem);
      });

      container.appendChild(legendContainer);
    }
  }


  return {
    renderBarChart,
    renderPieChart,
  };
})();