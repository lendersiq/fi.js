// libraries/financial.js
window.financial = {
  functions: {
    interestIncome: {
      description: "Calculates the interest income based on principal and annual rate",
      implementation: function (principal, rate) {
        //console.log('interestIncome', principal, rate)
        return principal * rate;
      }
    },
    costofFunds: {
      description: "Calculates the cost of funds",
      implementation: function (principal, rate) {
        // Access the cached treasury curve data.
        if (!window.financial.api._cache) {
          console.warn('Treasury data not yet loaded. Returning default value.');
          return 0;
        }
        // Example: multiply principal with the second value from the treasury curve.
        return principal * window.financial.api._cache.treasuryCurve.values[1];
      }
    },
    averagePrincipal: {
      description: "Calculates the average balance of a loan over its term",
      implementation: function (principal, payment, rate, maturity, sourceIndex) {
        if (principal <= 0) return 0;
        // Determine months until maturity using either maturity date or term
        const { monthsUntilMaturity, yearsUntilMaturity } = financial.functions.untilMaturity.implementation(maturity);
        const monthlyRate = rate < 1 ? parseFloat(rate) / 12 : parseFloat(rate / 100) / 12;
        //console.log('payment, monthly rate, monthsUntilMaturity', payment, monthlyRate, monthsUntilMaturity)
        // Calculate the total principal over the loan period
        let cummulativePrincipal = 0;
        let tempPrincipal = principal;
        var month = 0;
        while (month < monthsUntilMaturity && tempPrincipal > 0) {
          cummulativePrincipal += tempPrincipal;
          tempPrincipal -= payment - tempPrincipal * monthlyRate;
          month++;
        }
        // Calculate average balance
        const averagePrincipal = cummulativePrincipal / monthsUntilMaturity;
        //console.log('principal, payment, rate, maturity, average', principal, payment, rate, maturity, averagePrincipal)
        return averagePrincipal.toFixed(2);
      }
    },
    untilMaturity: {
      description: "Calculates the number of months and years to maturity of a financial instrument",
      implementation: function (maturity = null) {
        let monthsUntilMaturity, yearsUntilMaturity;

        if (maturity) {
          const maturityDate = new Date(maturity);
          const currentDate = new Date();

          // Calculate the number of months from currentDate to maturityDate
          const yearsDifference = maturityDate.getFullYear() - currentDate.getFullYear();
          const monthsDifference = maturityDate.getMonth() - currentDate.getMonth();

          // Total months until maturity
          monthsUntilMaturity = yearsDifference * 12 + monthsDifference;

          // Adjust if days in the current month are fewer than the day of the maturity date
          if (currentDate.getDate() > maturityDate.getDate()) {
            monthsUntilMaturity -= 1;
          }

          // Ensure monthsUntilMaturity is at least 1
          monthsUntilMaturity = Math.max(1, monthsUntilMaturity);

          // Calculate yearsUntilMaturity as the integer part of monthsUntilMaturity divided by 12
          yearsUntilMaturity = monthsUntilMaturity / 12;

          // Ensure yearsUntilMaturity is at least 1
          yearsUntilMaturity = Math.max(1, yearsUntilMaturity);

        } else {
          console.warn('Maturity date not provided, defaulting to 12 months and 1 year');
          monthsUntilMaturity = 12; // Default to 12 months if no maturity date is provided
          yearsUntilMaturity = 1;    // Default to 1 year
        }

        return { monthsUntilMaturity, yearsUntilMaturity };
      }
    },
    sinceOpen: {
      description: "Calculates the number of months and years from the open date of a financial instrument",
      implementation: function (open = null) {
        let monthsSinceOpen, yearsSinceOpen;
        if (open) {
          const openDate = new Date(open);
          const currentDate = new Date();

          // Calculate the number of months from openDate to currentDate
          const yearsDifference = currentDate.getFullYear() - openDate.getFullYear();
          const monthsDifference = currentDate.getMonth() - openDate.getMonth();

          // Total months since openDate
          monthsSinceOpen = yearsDifference * 12 + monthsDifference;

          // Adjust if days in the current month are fewer than the day of the open date
          if (currentDate.getDate() < openDate.getDate()) {
            monthsSinceOpen -= 1;
          }

          // Ensure monthsSinceOpen is at least 1
          monthsSinceOpen = Math.max(1, monthsSinceOpen);

          // Calculate yearsSinceOpen as the integer part of monthsSinceOpen divided by 12
          yearsSinceOpen = monthsSinceOpen / 12;

          // Ensure yearsSinceOpen is at least 1
          yearsSinceOpen = Math.max(1, yearsSinceOpen);

        } else {
          console.warn('Open date not provided, defaulting to 12 months and 1 year');
          monthsSinceOpen = 12; // Default to 12 months if no open date is provided
          yearsSinceOpen = 1;    // Default to 1 year
        }

        return { monthsSinceOpen, yearsSinceOpen };
      }
    },

    getTerm: {
      description: "Calculates the term in months and years based on the given term, open date, or maturity date",
      implementation: function (term = null, open = null, maturity = null) {
        let termInMonths, termInYears;

        if (term) {
          // If term is provided, use it as termInMonths
          termInMonths = term;
        } else if (open && maturity) {
          const openDate = new Date(open);
          const maturityDate = new Date(maturity);

          // Calculate the number of months from openDate to maturityDate
          const yearsDifference = maturityDate.getFullYear() - openDate.getFullYear();
          const monthsDifference = maturityDate.getMonth() - openDate.getMonth();

          // Total months in term
          termInMonths = yearsDifference * 12 + monthsDifference;

          // Adjust if days in the open month are fewer than the day of the maturity date
          if (openDate.getDate() > maturityDate.getDate()) {
            termInMonths -= 1;
          }

          // Ensure termInMonths is at least 1
          termInMonths = Math.max(1, termInMonths);
        } else {
          console.warn('Insufficient data provided, defaulting to 12 months and 1 year');
          termInMonths = 12; // Default to 12 months if neither term nor both dates are provided
        }

        // Calculate termInYears as the integer part of termInMonths divided by 12
        termInYears = termInMonths / 12;

        // Ensure termInYears is at least 1
        termInYears = Math.max(1, termInYears);

        return { termInMonths, termInYears };
      }
    },
    depositRisk: {
      description: "Scores the risk of a checking account",
      implementation: function (balance, checks, deposits, nsf, sourceIndex) {
        if (balance === 0 || sourceIndex === null) return 0

        const balanceObject = getStatistic(sourceIndex, 'balance', 'threeStdDeviations');
        let balanceRisk = 1;
        if (balance > getStatistic(sourceIndex, 'balance', 'threeStdDeviations')[1]) {
          balanceRisk = 5;
        } else if (balance > getStatistic(sourceIndex, 'balance', 'mean')) {
          balanceRisk = 3;
        }


        // issuing checks for payroll, vendor payments, or refunds during specific times of the year may have a greater risk.
        let checksRisk = 1;
        if (checks > getStatistic(sourceIndex, 'checks', 'threeStdDeviations')[1]) {
          checksRisk = 5;
        } else if (checks > getStatistic(sourceIndex, 'checks', 'twoStdDeviations')[1]) {
          checksRisk = 4;
        } else if (checks > getStatistic(sourceIndex, 'checks', 'mean')) {
          checksRisk = 2;
        }

        // Regular deposits (e.g., payroll or vendor payments) indicate frequency of activity--higher active accounts may indicate risk.
        let depositsRisk = 1;
        if (deposits > getStatistic(sourceIndex, 'deposits', 'threeStdDeviations')[1]) {
          depositsRisk = 5;
        } else if (deposits > getStatistic(sourceIndex, 'deposits', 'twoStdDeviations')[1]) {
          depositsRisk = 2;
        }

        // High overdraft activity could signal poor account management.
        let NSFsRisk = 1;
        if (nsf > getStatistic(sourceIndex, 'nsf', 'threeStdDeviations')[1]) {
          NSFsRisk = 5;
        }

        const risk = balanceRisk * financial.dictionaries.depositRiskWeights["balance"] +
          checksRisk * financial.dictionaries.depositRiskWeights["checks"] +
          depositsRisk * financial.dictionaries.depositRiskWeights["deposits"] +
          NSFsRisk * financial.dictionaries.depositRiskWeights["nsf"];

        //console.log(`balance: ${balance}, checks: ${checks}, deposits: ${deposits}, nsf: ${nsf}, sourceIndex: ${sourceIndex}, risk: ${risk}`);
        return risk;
      }
    },

    /*
    * @param {number} expectedLifeMonths - Expected life of the deposit in months.
    * @param {string} depositType - Type of deposit ('checking', 'savings', 'certificates').
    * @returns {number} FTP rate as a decimal.
    */
    calculateFtpRate: {
      description: "Calculates the funds transfer pricing credit using the discountFTP dictionary and Treasury rates from an external API.",
      implementation: function (expectedLifeMonths, depositType) {
        // Step 1: Retrieve the Treasury rate from the external API
        //console.log('financial.api', financial.api._cache)
        const treasuryRate = financial.api._cache.treasuryCurve.values[expectedLifeMonths];

        if (treasuryRate === undefined) {
          throw new Error(`Treasury rate not found for ${expectedLifeMonths} months.`);
        }
        // Initialize total adjustments
        let totalAdjustments = 0;
        // Helper function to get adjustment value
        function getAdjustmentFactor(adjustmentType) {
          const adjustment = financial.dictionaries.discountFTP[adjustmentType];
          if (!adjustment) return 0;

          if (depositType === 'certificate') {
            // Determine term based on expectedLifeMonths
            const term = expectedLifeMonths <= 12 ? 'shortTerm' : 'longTerm';
            return adjustment.certificates.values[term] || 0;
          } else {
            return adjustment[depositType]?.value || 0;
          }
        }

        // Step 2: Calculate Adjustments using the dictionary
        const interestRateRiskAdjustment = parseFloat(getAdjustmentFactor('interestRateRisk') * treasuryRate);
        const liquidityAdjustment = parseFloat(getAdjustmentFactor('liquidity') * treasuryRate);
        const operationalRiskAdjustment = parseFloat(getAdjustmentFactor('operationalRisk') * treasuryRate);
        const depositAcquisitionCost = parseFloat(getAdjustmentFactor('depositAcquisitionCost') * treasuryRate);
        const regulatoryRiskAdjustment = financial.dictionaries.discountFTP.regulatoryRisk.value * treasuryRate || 0; // Same for all

        // Step 3: Sum all adjustments
        totalAdjustments = interestRateRiskAdjustment
          - liquidityAdjustment
          + operationalRiskAdjustment
          + regulatoryRiskAdjustment
          + depositAcquisitionCost;

        // Step 4: Calculate FTP Rate
        const ftpRate = treasuryRate - totalAdjustments;
        //console.log('FTP log', treasuryRate, interestRateRiskAdjustment.toFixed(4), liquidityAdjustment, operationalRiskAdjustment, depositAcquisitionCost, regulatoryRiskAdjustment, ftpRate);
        return ftpRate;
      }
    },

    calculateFundingRate: {
      description: "Calculates the loan funding rate of loan adjusted for liquidity, convenience, and loyalty premiums",
      implementation: function (months) {
        if (!financial.attributes || !financial.api._cache.treasuryCurve.values[months]) {
          throw new Error("Required api or library data is missing for funding rate calculation.");
        }
        const adjustmentCoefficient = financial.attributes.adjustmentCoefficient.value;
        if (adjustmentCoefficient < 0 || adjustmentCoefficient > 1) {
          throw new Error("Adjustment Coefficient must be between 0 and 1.");
        }
        const XL = adjustmentCoefficient * financial.attributes.liquidityWeight.value;
        const XC = adjustmentCoefficient * financial.attributes.convenienceWeight.value;
        const XB = adjustmentCoefficient * financial.attributes.loyaltyWeight.value;
        const X = XL + XC + XB;
        const correspondingTreasuryRate = financial.api._cache.treasuryCurve.values[months];
        return correspondingTreasuryRate * (1 - X);
      }
    },

    checkingProfit: {
      description: "Calculates the profit of checking accounts",
      implementation: function (portfolio, balance, interest = null, rate = null, charges = null, waived = null, deposits = null, withdrawals = null, nsf = null, sourceIndex) {
        if (!balance || balance === 0) return 0;
        //const sourceIndex = 'checking';
        const creditRate = financial.functions.calculateFtpRate.implementation(12, sourceIndex);
        const creditForFunding = creditRate * balance * (1 - financial.attributes.ddaReserveRequired.value);
        //const { monthsSinceOpen, yearsSinceOpen } = financial.functions.sinceOpen.implementation(open); can be used to address aquisition costs
        // i.e annualAquisitionExpense = aquistionExpense / yearsSinceOpen

        const annualDeposits = deposits ? deposits * getStatistic(sourceIndex, 'deposits', 'YTDfactor') : 0;
        const depositsExpense = annualDeposits * financial.attributes.depositUnitExpense.value;
        const annualWithdrawals = withdrawals ? withdrawals * getStatistic(sourceIndex, 'withdrawals', 'YTDfactor') : 0;
        const withdrawalsExpense = annualWithdrawals * financial.attributes.withdrawalUnitExpense.value;

        //aiIdConsumerSmallBiz  
        const consumerMaximum = financial.dictionaries.consumerMaximum.values[sourceIndex];
        const params = { balance, interest, sourceIndex, annualDeposits, annualWithdrawals, consumerMaximum };
        const isBusiness = aiIsBusiness([params]);  // @ai.js
        let accountType = "Consumer";
        if (isBusiness) {
          accountType = "Business";
        }

        const interestByExpense = interest ? interest * getStatistic(sourceIndex, 'interest', 'YTDfactor') : 0;
        const interestByRate = rate ? (rate < 1 ? parseFloat(rate) : parseFloat(rate / 100)) * getStatistic(sourceIndex, 'rate', 'YTDfactor') * balance : 0;
        const interestExpense = Math.max(interestByExpense, interestByRate);

        const chargesIncome = charges ? charges : 0;
        const waiveIncome = waived ? waived : 0;
        const feeIncome = (chargesIncome - waiveIncome) * getStatistic(sourceIndex, 'charges', 'YTDfactor');
        const nsfIncome = nsf ? nsf * getStatistic(sourceIndex, 'nsf', 'YTDfactor') : 0;

        var operatingExpense = 100;  //default
        if (financial.dictionaries.annualOperatingExpense[sourceIndex].values[accountType]) {
          operatingExpense = financial.dictionaries.annualOperatingExpense[sourceIndex].values[accountType];
        }
        const fraudLoss = financial.attributes.capitalTarget.value * financial.attributes.fraudLossFactor.value * balance;

        const pretaxIncome = creditForFunding + feeIncome + nsfIncome;
        const pretaxExpense = interestExpense + depositsExpense + withdrawalsExpense + operatingExpense + fraudLoss;
        const pretaxProfit = pretaxIncome - pretaxExpense;

        let profit = pretaxProfit;
        if (!organization.dictionaries.taxExempt.checking.values.includes(type)) {
          profit = pretax * taxFactor;
        }

        if (window.logger) console.log(`portfolio: ${portfolio}, balance: ${balance}, interest: ${interestExpense}, rate: ${rate}, credit rate: ${creditRate}, credit for funding: ${creditForFunding}, charges: ${charges}, waived: ${waived}, deposits: ${deposits}, withdrawals: ${withdrawals}, nsf: ${nsf}, operating expense: ${operatingExpense}, fraud loss: ${fraudLoss}, pretax income: ${pretaxIncome}, pretax expense: ${pretaxExpense}, profit: ${profit.toFixed(2)}`);
        return profit;
      }
    },

    savingsProfit: {
      description: "Calculates the profit of savings accounts",
      implementation: function (portfolio, balance, interest = null, rate = null, term = null, term_code = null, charges = null, waived = null, deposits = null, withdrawals = null, sourceIndex) {
        if (!balance || balance === 0) return 0;
        const months = term ? term * (term_code ? (term_code.toLowerCase() !== 'm' ? term / 12 : 1) : 1) : 12;  //default term to 12
        const creditRate = financial.functions.calculateFtpRate.implementation(months, sourceIndex);
        const creditForFunding = creditRate * balance;

        const annualDeposits = deposits ? deposits * getStatistic(sourceIndex, 'deposits', 'YTDfactor') : 0;
        const depositsExpense = annualDeposits * financial.attributes.depositUnitExpense.value;
        const annualWithdrawals = withdrawals ? withdrawals * getStatistic(sourceIndex, 'withdrawals', 'YTDfactor') : 0;
        const withdrawalsExpense = annualWithdrawals * financial.attributes.withdrawalUnitExpense.value;

        //aiIdConsumerSmallBiz  
        const consumerMaximum = financial.dictionaries.consumerMaximum.values[sourceIndex];
        const params = { balance, interest, sourceIndex, annualDeposits, annualWithdrawals, consumerMaximum };
        const isBusiness = aiIsBusiness([params]);  // @ai.js
        let accountType = "Consumer";
        if (isBusiness) {
          accountType = "Business";
        }

        const interestByExpense = interest ? interest * getStatistic(sourceIndex, 'interest', 'YTDfactor') : 0;
        const interestByRate = rate ? (rate < 1 ? parseFloat(rate) : parseFloat(rate / 100)) * getStatistic(sourceIndex, 'rate', 'YTDfactor') * balance : 0;
        const interestExpense = Math.max(interestByExpense, interestByRate);

        const chargesIncome = charges ? charges : 0;
        const waiveIncome = waived ? waived : 0;
        const feeIncome = (chargesIncome - waiveIncome) * getStatistic(sourceIndex, 'charges', 'YTDfactor');

        var operatingExpense = 50;  //default
        if (financial.dictionaries.annualOperatingExpense[sourceIndex].values[accountType]) {
          operatingExpense = financial.dictionaries.annualOperatingExpense[sourceIndex].values[accountType];
        }
        const fraudLoss = financial.attributes.capitalTarget.value * financial.attributes.fraudLossFactor.value * balance;

        const pretaxIncome = creditForFunding + feeIncome;
        const pretaxExpense = interestExpense + depositsExpense + withdrawalsExpense + operatingExpense + fraudLoss;
        const pretaxProfit = pretaxIncome - pretaxExpense;
        
        let profit = pretaxProfit;
        if (!organization.dictionaries.taxExempt.savings.values.includes(type)) {
          profit = pretax * taxFactor;
        }
        if (window.logger) console.log(`portfolio: ${portfolio}, balance: ${balance}, interest: ${interestExpense}, rate: ${rate}, credit rate: ${creditRate}, credit for funding: ${creditForFunding}, charges: ${charges}, waived: ${waived}, deposits: ${deposits}, withdrawals: ${withdrawals}, operating expense: ${operatingExpense}, fraud loss: ${fraudLoss}, pretax income: ${pretaxIncome}, pretax expense: ${pretaxExpense}, profit: ${profit.toFixed(2)}`);
        return profit;
      }
    },

    CDProfit: {
      description: "Calculates the profit of certificate of deposits",
      implementation: function (portfolio, balance, interest = null, rate = null, term = null, term_id = null, deposits = null, sourceIndex) {
        if (!balance || balance === 0) return 0;
        console.log('term_id', term_id)
        const months = term ? term * (term_id ? (term_id.toLowerCase() !== 'm' ? term / 12 : 1) : 1) : 12;  //default term to 12
        const creditRate = financial.functions.calculateFtpRate.implementation(months, sourceIndex);
        const creditForFunding = creditRate * balance;

        const annualDeposits = deposits ? deposits * getStatistic(sourceIndex, 'deposits', 'YTDfactor') : 0;
        const depositsExpense = annualDeposits * financial.attributes.depositUnitExpense.value;

        const interestByExpense = interest ? interest * getStatistic(sourceIndex, 'interest', 'YTDfactor') : 0;
        const interestByRate = rate ? (rate < 1 ? parseFloat(rate) : parseFloat(rate / 100)) * getStatistic(sourceIndex, 'rate', 'YTDfactor') * balance : 0;
        const interestExpense = Math.max(interestByExpense, interestByRate);

        var operatingExpense = 100;  //default
        if (financial.dictionaries.annualOperatingExpense[sourceIndex].value) {
          operatingExpense = financial.dictionaries.annualOperatingExpense[sourceIndex].value;
        }

        const pretaxExpense = interestExpense + depositsExpense + operatingExpense;
        const pretaxProfit = creditForFunding - pretaxExpense;
        const taxFactor = 1 - organization.attributes.taxRate.value;
        let profit = pretaxProfit;
        if (!organization.dictionaries.taxExempt.certificate.values.includes(type)) {
          profit = pretax * taxFactor;
        }
        if (window.logger) console.log(`portfolio: ${portfolio}, balance: ${balance}, interest: ${interestExpense}, rate: ${rate}, credit rate: ${creditRate}, credit for funding: ${creditForFunding}, deposits: ${deposits}, operating expense: ${operatingExpense}, pretax expense: ${pretaxExpense}, profit: ${profit.toFixed(2)}`);
        return profit;
      }
    },


    loanProfit: {
      description: "Calculates the profit of a variety of loans",
      implementation: function (portfolio, principal, rate, risk, open, type, payment = null, fees = null, maturity = null, term = null, sourceIndex) {
        if (!principal || principal === 0) return 0; // zero principal implies closed loan, so return 0 profit
        const { monthsUntilMaturity, yearsUntilMaturity } = financial.functions.untilMaturity.implementation(maturity);
        const monthlyRate = rate < 1 ? parseFloat(rate) / 12 : parseFloat(rate / 100) / 12;
        const monthlyPayment = (principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -monthsUntilMaturity)))).toFixed(2);
        const lifetimeInterest = monthlyPayment * monthsUntilMaturity - principal;
        const AveragePrincipal = lifetimeInterest / (monthlyRate * monthsUntilMaturity);
        const { termInMonths, termInYears } = financial.functions.getTerm.implementation(term, open, maturity);
        const interestIncome = AveragePrincipal * rate;
        const fundingRate = financial.functions.calculateFundingRate.implementation(monthsUntilMaturity);
        const fundingExpense = AveragePrincipal * fundingRate;
        let smallLoanMaximum = financial.attributes.smallLoanMaximum.value;  //default
        const principalMedian = getStatistic(sourceIndex, 'principal', 'median');
        if (principalMedian) {
          smallLoanMaximum = principalMedian > smallLoanMaximum ? principalMedian : smallLoanMaximum;  // the median of each loan principal in the entire portfolio (50th percentile)
        }

        let isConsumerSmallBusiness = false;
        if (payment) { //if loan payment is a valid argument test original
          const originalPrincipal = monthlyPayment * termInMonths - lifetimeInterest;
          isConsumerSmallBusiness = originalPrincipal < smallLoanMaximum;
        } else {
          isConsumerSmallBusiness = termInYears <= 5 && principal < smallLoanMaximum;
        }
        let complexityFactor = 1;
        if (isConsumerSmallBusiness) {
          complexityFactor = 0.5
        }
        const originationExpense = (financial.attributes.fixedOriginationExpense.value + Math.min(principal, financial.attributes.principalCostMaximum.value) * financial.attributes.variableOriginationFactor.value * complexityFactor) / Math.min(termInYears, 10);
        const servicingExpense = (financial.attributes.fixedServicingExpense.value + principal * financial.attributes.loanServicingFactor.value / yearsUntilMaturity) * complexityFactor;

        let probabilityOfDefault = 0;
        if (risk && risk !== 'NULL') {
          const riskObject = getStatistic(sourceIndex, 'risk', 'convexProbability');
          if (riskObject) { // risk data reached statistical signifigance
            if (typeof risk === "string") {
              const match = risk.match(/^(\d+)([a-zA-Z])$/);
              if (match) {
                // Extract the number part and convert it to a number
                risk = parseInt(match[1], 10) + 0.5;
              }
            }
            probabilityOfDefault = riskObject * .01;
          } else {
            //console.warn('cannot find key in convexProbability:', risk);
          }
        } else {
          probabilityOfDefault = .02;
        }
        const lossProvision = AveragePrincipal / financial.attributes.minimumLoanToValue.value * (1 - financial.attributes.expectedRecoveryRate.value) * probabilityOfDefault;
        const expectedLossProvision = lossProvision / yearsUntilMaturity;  // spread lossProvision cost over yearsUntilMaturity
        const nonInterestIncome = fees !== null ? fees / termInYears : 0;
        const pretax = (interestIncome - fundingExpense - originationExpense - servicingExpense + nonInterestIncome);
        const taxFactor = 1 - organization.attributes.taxRate.value;
        let taxAdjusted = pretax;
        if (!organization.dictionaries.taxExempt.loan.values.includes(type)) {
          taxAdjusted = pretax * taxFactor;
        }
        const profit = taxAdjusted - expectedLossProvision;
        if (window.logger) console.log(`portfolio: ${portfolio}, principal: ${principal}, payment: ${payment}, average: ${AveragePrincipal}, risk: ${risk}, fees: ${fees}, years until maturity: ${yearsUntilMaturity}, term in years: ${termInYears}, rate: ${rate}, interest: ${interestIncome}, funding rate: ${fundingRate}, funding expense: ${fundingExpense}, origination expense: ${originationExpense}, servicing expense: ${servicingExpense}, non interest income: ${nonInterestIncome}, probability of default: ${probabilityOfDefault}, pretax: ${pretax}, expected loss: ${expectedLossProvision}, profit: ${profit.toFixed(2)}`);
        return profit;
      }
    },
  },

  api: {
    // In-memory cache for each API endpoint.
    _cache: {},
    // Cache promises to avoid duplicate concurrent calls.
    _cachePromises: {},
    // Define maximum age for cached data (1 week).
    oneWeek: 7 * 24 * 60 * 60 * 1000,

    /**
     * Generic function that retrieves API data using a local-first strategy.
     * @param {string} key - Unique key for the API endpoint.
     * @param {string} url - URL to fetch the API data.
     * @returns {Promise<any>} - Resolves with the API data.
     */
    localFirstApiCall: async function (key, url) {
      // Return in-memory cache if available.
      if (this._cache[key]) {
        return this._cache[key];
      }
      // Return a pending promise if already in progress.
      if (this._cachePromises[key]) {
        return this._cachePromises[key];
      }

      this._cachePromises[key] = (async () => {
        try {
          // Check for a stored record in IndexedDB.
          const dbRecord = await getRecordFromIndexedDB(key);
          const now = Date.now();
          if (dbRecord && (now - dbRecord.timestamp) < this.oneWeek) {
            // Use the locally stored data if it’s fresh.
            this._cache[key] = dbRecord.data;
            console.log(`Using cached data for ${key} from IndexedDB:`, this._cache[key]);
            return this._cache[key];
          }

          // Otherwise, fetch fresh data from the API.
          const response = await fetch(url);
          const data = await response.json();
          if (data.error) {
            console.error(`API error for ${key}:`, data.error);
            throw new Error(data.error);
          }

          // Cache the data in memory.
          this._cache[key] = data;
          console.log(`Fetched fresh data for ${key} from API:`, data);
          // Save the data to IndexedDB.
          await saveRecordToIndexedDB(key, data);
          return data;
        } catch (error) {
          console.error(`Error in localFirstApiCall for ${key}:`, error);
          // Reset the promise on error so future calls can retry.
          this._cachePromises[key] = null;
          throw error;
        }
      })();

      return this._cachePromises[key];
    },

    // Treasury curve API call uses the generic local-first function.
    treasuryCurve: async function () {
      return await this.localFirstApiCall('treasuryCurve', 'https://bankersiq.com/api/trates/');
    }

    // Additional API calls can use localFirstApiCall with their own key and URL.
  },
  attributes: {
    adjustmentCoefficient: {
      description: "Represents the base percentage adjustment applied to the Treasury rate.",
      value: 0.05
    },
    liquidityWeight: {
      description: "Represents an adjustment which refelects that banks offer higher liquidity than treasury securities.",
      value: 0.9
    },
    convenienceWeight: {
      description: "Represents an adjustment which refelects that banks provide convenient methods to transact business",
      value: 0.85
    },
    loyaltyWeight: {
      description: "Represents an adjustment which reflects that a long-term depositor relationships reduce the need for the highest rates",
      value: 0.8
    },
    smallLoanMaximum: {
      description: "The dollar threshold that can distinguish a small business micrcoloan or a personal loan from other loan types",
      value: 100000
    },
    loanServicingFactor: {
      description: "The factor used to calculate loan servicing expenses",
      value: 0.0025
    },
    variableOriginationFactor: {
      description: "The factor used to calculate loan origination expenses",
      value: 0.01
    },
    principalCostMaximum: {
      description: "Maximum principal loan origination costs scale with loan size",
      value: 1500000
    },
    fixedOriginationExpense: {
      description: "Constant across all loans, covering administration, system, and processing costs.",
      value: 500
    },
    fixedServicingExpense: {
      description: "Constant administrative, payment processing, systems, and regulatory expenses that apply to all loans, regardless of size or complexity.",
      value: 500
    },
    minimumLoanToValue: {
      description: "Typical Loan-to-Value (LTV) Ratio minimum. LTV expresses the loan amount as a percentage of the loan collateral's current value.",
      value: 0.80
    },
    expectedRecoveryRate: {
      description: "This represents the percentage of the exposure that a lender expects to recover if the borrower defaults expressed as a percentage (.01 to 1)",
      value: 0.60
    },
    minimumOperatingRisk: {
      description: "The minimum operating risk percentage",
      value: 0.0015
    },
    depositUnitExpense: {
      description: "The unit cost for deposits",
      value: 2
    },
    withdrawalUnitExpense: {
      description: "The unit cost for withdrawals",
      value: 0.11
    },
    ddaReserveRequired: {
      description: "The required fed reserve for checking accounts / demand deposit accounts(DDA)",
      value: 0.10
    },
    savingsAnnualExpense: {
      description: "The savings account annual operating costs",
      value: 28
    },
    fraudLossFactor: {
      description: "ratio of fraud losses to institution total deposits",
      value: 0.005,
    },
    capitalTarget: {
      description: "The institution capital to assets ratio target",
      value: 0.10
    }
  },

  // supporting dictionaries
  dictionaries: {
    consumerMaximum: {
      description: "The dollar threshold that can distinguish a consumer from a business account",
      values: {
        "checking": 250000,
        "savings": 250000
      }
    },
    annualOperatingExpense: {
      checking: {
        description: "The checking account annual operating costs",
        values: {
          "Consumer": 112,
          "Business": 145
        }
      },
      savings: {
        description: "The savings account annual operating costs",
        values: {
          "Consumer": 28,
          "Business": 56
        }
      },
      certificate: {
        description: "certificate account annual operating costs",
        value: 82.5
      }
    },
    depositRiskWeights: {
      description: "The weights for each deposit account risk criteria",
      "checks": 5,
      "balance": 5,
      "deposits": 3,
      "nsf": 1
    },
    discountFTP: {
      interestRateRisk: {
        description: "Adjustments reflecting the interest rate risk of deposits compared to market instruments.",
        checking: {
          value: 0 // 0%
        },
        savings: {
          value: 0.05 // 5%
        },
        certificates: {
          values: {
            shortTerm: 0.10, // 10%
            longTerm: 0.25   // 25%
          }
        }
      },
      liquidity: {
        description: "Adjustments reflecting the liquidity benefits of deposits to the bank.",
        checking: {
          value: 0.1 // 10%
        },
        savings: {
          value: 0.05 // 5%
        },
        certificates: {
          values: {
            shortTerm: 0.025, // 2.5%
            longTerm: 0.015   // 1.5%
          }
        }
      },
      operationalRisk: {
        description: "Adjustments for operational risks and costs associated with different deposit types.",
        checking: {
          value: 0.15 // 15%
        },
        savings: {
          value: 0.075 // 7.5%
        },
        certificates: {
          values: {
            shortTerm: 0.02, // 2%
            longTerm: 0.01   // 1%
          }
        }
      },
      regulatoryRisk: {
        description: "Adjustments for regulatory costs such as deposit insurance premiums",
        value: 0.1 // 10% (same for all deposit types)
      },
      depositAcquisitionCost: {
        description: "Adjustments for costs related to acquiring deposits.",
        checking: {
          value: 0.25 // 25%
        },
        savings: {
          value: 0.1 // 10%
        },
        certificates: {
          values: {
            shortTerm: 0.05, // 5%
            longTerm: 0.05   // 5%
          }
        }
      }
    }
  }
};

window.financial.api.treasuryCurve()
  .then(treasuryData => {
    console.log('Treasury data:', treasuryData);
  })
  .catch(error => {
    console.error('Preloading treasury curve data failed:', error);
  });