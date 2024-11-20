const equities = {
    functions: {
        intrinsicValue: {
            description: "Intrinsic value is an estimate of a company's true worth based on its financial performance and future cash flow projections.",
            
            // Main function to be called by processFormula
            implementation: function(symbol) {
                if (!symbol) {
                    displayError('Please enter a stock symbol.');
                    return 0; // Return 0 if no symbol provided
                }

                // Return cached data if available, otherwise start polling
                if (equities.functions.intrinsicValue.cachedData?.symbol === symbol) {
                    return equities.functions.intrinsicValue.cachedData.price || 0;
                } else {
                    // Trigger async fetch if data is not cached
                    equities.functions.getStockData(symbol);
                    equities.functions.pollForData(symbol);
                    return 0; // Placeholder return for processFormula
                }
            },
            
            cachedData: null // To store the cached data
        },

        // Asynchronous data fetch
        getStockData: async function(symbol) {
            try {
                const response = await fetch(`https://bankersiq.com/api/equities?symbol=${symbol}`);
                const data = await response.json();
                
                if (data.error) {
                    equities.functions.displayError(data.error);
                } else {
                    // Cache the result with symbol and price
                    equities.functions.intrinsicValue.cachedData = { symbol: symbol, price: data.currentPrice, cashflow: data.cashFlow, APIdata: data };
                }
            } catch (error) {
                console.error('An error occurred while fetching data:', error);
                equities.functions.displayError('An error occurred while fetching data.');
            }
        },

        // Polling function to wait for data to be available
        pollForData: function(symbol) {
            const interval = setInterval(() => {
                // Check if data is cached for the symbol
                if (equities.functions.intrinsicValue.cachedData?.symbol === symbol) {
                    console.log('Data is now available for:', symbol);
                    equities.functions.calculateIntrinsicValue(equities.functions.intrinsicValue.cachedData.APIdata, equities.functions.intrinsicValue.cachedData.symbol, 8, 2)
                    clearInterval(interval); // Stop polling
                }
            }, 100); // Check every 100 milliseconds
        },
        // Function to calculate the intrinsic value
        calculateIntrinsicValue: function(data, symbol, discount, growth) {
            // Check if the elements exist
            if (!discount|| !growth) {
                equities.functions.displayError('Discount rate or perpetual growth rate inputs are missing.');
                return;
            }

            const discountRateInput = parseFloat(discount) / 100;
            const perpetualGrowthRateInput = parseFloat(growth) / 100;
            const discountRate = isNaN(discountRateInput) ? 0.08 : discountRateInput; // Default to 8% if invalid
            const perpetualGrowthRate = isNaN(perpetualGrowthRateInput) ? 0.02 : perpetualGrowthRateInput; // Default to 2% if invalid
            const years = 5;

             // Use the provided Free Cash Flow (FCF) data
            const historicalFCF = data.freeCashFlow;
            // Calculate historical Free Cash Flow (FCF)
            //const historicalFCF = equities.functions.calculateHistoricalFCF(data.cashFlow);

            // Check if historical FCF data is sufficient
            if (historicalFCF.length < 2) {
                equities.functions.displayError('Insufficient cash flow data to perform calculation.');
                return;
            }

            // Estimate average growth rate
            const averageGrowthRate = equities.functions.calculateAverageGrowthRate(historicalFCF);

            // Handle cases where growth rate cannot be calculated
            if (isNaN(averageGrowthRate) || !isFinite(averageGrowthRate)) {
                equities.functions.displayError('Unable to calculate growth rate from historical data.');
                return;
            }

            // Estimate future FCF
            const lastFCF = historicalFCF[0]; // Most recent FCF
            const futureFCF = equities.functions.estimateFutureFCF(lastFCF, averageGrowthRate, years);

            // Calculate present value of future FCF
            const presentValueFCF = equities.functions.calculatePresentValue(futureFCF, discountRate);

            // Calculate terminal value (before discounting)
            const terminalValue = equities.functions.calculateTerminalValueRaw(
                futureFCF[futureFCF.length - 1],
                perpetualGrowthRate,
                discountRate
            );

            // Present value of terminal value
            const presentValueTerminal = terminalValue / Math.pow(1 + discountRate, years);

            // Total intrinsic value
            const intrinsicValueTotal = presentValueFCF + presentValueTerminal;

            // Get outstanding shares from data
            const outstandingShares = data.outstandingShares;

            if (!outstandingShares || outstandingShares <= 0) {
                equities.functions.displayError('Invalid number of outstanding shares.');
                return;
            }

            // Calculate intrinsic value per share
            const intrinsicValuePerShareDCF = intrinsicValueTotal / outstandingShares;

            // Get current stock price from data
            const currentPrice = data.currentPrice;

            if (!currentPrice || currentPrice <= 0) {
                equities.functions.displayError('Invalid current stock price.');
                return;
            }

            // Determine if the stock is undervalued or overvalued
            const undervaluedDCF = intrinsicValuePerShareDCF > currentPrice;
            
            // Perform P/E Ratio Valuation
            const comps = data.averageMultiples;
            console.log('comps', comps)
            let intrinsicValuePerSharePE = null;
            if (comps.peRatio) {
                // Extract the latest EPS from income statements
                const latestEPS = equities.functions.getLatestEPS(data.incomeStatement);
                if (latestEPS !== null && latestEPS !== 0) {
                    intrinsicValuePerSharePE = (comps.peRatio * latestEPS).toFixed(2);
                } else {
                    equities.functions.displayError('Invalid or missing Earnings Per Share (EPS) data.');
                    return;
                }
            }

            // Determine if the stock is undervalued or overvalued based on P/E Ratio
            let undervaluedPE = null;
            if (intrinsicValuePerSharePE !== null) {
                undervaluedPE = parseFloat(intrinsicValuePerSharePE) > currentPrice;
            }

            // Pass all relevant data to the display function
            equities.functions.displayResult({
                symbol: symbol,
                intrinsicValueDCF: intrinsicValuePerShareDCF.toFixed(2),
                intrinsicValuePE: intrinsicValuePerSharePE,
                currentPrice: currentPrice.toFixed(2),
                undervaluedDCF: undervaluedDCF,
                undervaluedPE: undervaluedPE,
                historicalFCF: historicalFCF,
                averageGrowthRate: (averageGrowthRate * 100).toFixed(2), // Convert to percentage
                discountRate: (discountRate * 100).toFixed(2), // Convert to percentage
                terminalValue: terminalValue.toFixed(2)
            });
        },

        // Function to get the latest Earnings Per Share (EPS) from income statements
        getLatestEPS: function(incomeStatements) {
            if (incomeStatements.length === 0) return null;
            const latest = incomeStatements[0];
            return latest.eps !== undefined ? latest.eps : null; // Adjust the key based on API response
        },

        // Function to calculate historical Free Cash Flow (FCF)
        calculateHistoricalFCF: function(cashFlowStatements) {
            console.log('FCF', cashFlowStatements);
            const fcfArray = cashFlowStatements.map(statement => {
                const operatingCashFlow = statement.netCashProvidedByOperatingActivities;
                const capitalExpenditure = statement.capitalExpenditure;

                // Handle potential missing data
                if (operatingCashFlow === null || capitalExpenditure === null) {
                    return null;
                }

                return operatingCashFlow - capitalExpenditure;
            }).filter(fcf => fcf !== null); // Filter out null values

            return fcfArray;
        },

        // Function to calculate the average growth rate of FCF
        calculateAverageGrowthRate: function(historicalFCF) {
            const growthRates = [];
            for (let i = 1; i < historicalFCF.length; i++) {
                const previousFCF = historicalFCF[i - 1];
                const currentFCF = historicalFCF[i];

                if (currentFCF === 0) continue; // Avoid division by zero
                const growthRate = (previousFCF - currentFCF) / Math.abs(currentFCF);
                growthRates.push(growthRate);
            }
            const averageGrowthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
            return averageGrowthRate;
        },

        // Function to estimate future FCF
        estimateFutureFCF: function(lastFCF, growthRate, years) {
            const futureFCF = [];
            let projectedFCF = lastFCF;
            for (let i = 1; i <= years; i++) {
                projectedFCF *= (1 + growthRate);
                futureFCF.push(projectedFCF);
            }
            return futureFCF;
        },

        // Function to calculate the present value of future FCF
        calculatePresentValue: function(futureFCF, discountRate) {
            let presentValue = 0;
            futureFCF.forEach((fcf, i) => {
                presentValue += fcf / Math.pow(1 + discountRate, i + 1);
            });
            return presentValue;
        },

        // Function to calculate the terminal value (before discounting)
        calculateTerminalValueRaw: function(lastFCF, perpetualGrowthRate, discountRate) {
            return (lastFCF * (1 + perpetualGrowthRate)) / (discountRate - perpetualGrowthRate);
        },

        // Function to display the results
        displayResult: function(data) {
            // Format numbers with commas and two decimal places
            const formatNumber = (num) => Number(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
            // Determine valuation statuses
            const valuationDCF = data.undervaluedDCF ? 'Undervalued' : 'Overvalued';
            const valuationPE = data.undervaluedPE ? 'Undervalued' : 'Overvalued';
        
            // Create HTML content
            let content = `
                <h2>${data.symbol}</h2>
                <h3>Intrinsic Value Calculations:</h3>
                <table border="1" cellpadding="8" cellspacing="0">
                    <tr>
                        <th>Method</th>
                        <th>Intrinsic Value per Share ($)</th>
                        <th>Current Stock Price ($)</th>
                        <th>Valuation Status</th>
                    </tr>
                    <tr>
                        <td>Discounted Cash Flow (DCF)</td>
                        <td>${formatNumber(data.intrinsicValueDCF)}</td>
                        <td>${formatNumber(data.currentPrice)}</td>
                        <td style="color:${data.undervaluedDCF ? 'green' : 'red'};">${valuationDCF}</td>
                    </tr>
                    <tr>
                        <td>Price-to-Earnings (P/E) Ratio</td>
                        <td>${formatNumber(data.intrinsicValuePE)}</td>
                        <td>${formatNumber(data.currentPrice)}</td>
                        <td style="color:${data.undervaluedPE ? 'green' : 'red'};">${valuationPE}</td>
                    </tr>
                </table>
        
                <h3>Calculation Details:</h3>
                <p><strong>Discount Rate (WACC):</strong> ${data.discountRate}%</p>
                <p><strong>Average FCF Growth Rate:</strong> ${data.averageGrowthRate}%</p>
                <p><strong>Terminal Value:</strong> $${formatNumber(data.terminalValue)}</p>
        
                <h3>Historical Free Cash Flow (FCF):</h3>
                <ul>
                    ${data.historicalFCF.map((fcf, index) => `<li>Year ${index + 1}: $${formatNumber(fcf)}</li>`).join('')}
                </ul>
            `;

            document.getElementById('outputElement').innerHTML = content;
        },

        // Function to display error messages
        displayError: function(message) {
            const resultDiv = document.getElementById('result');
            document.getElementById('outputElement').textContent  = `<p style="color:red;">${message}</p>`;
        }
    }
};

window.equities = equities; // Make it globally accessible
