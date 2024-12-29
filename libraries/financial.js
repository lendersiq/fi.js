const financial = {
    functions: {
        interestIncome: {
            description: "Calculates the interest income based on principal and annual rate",
            implementation: function(principal, rate) {
                console.log('interestIncome', principal, rate);
                return principal * rate;
            }
        },
        untilMaturity: {
            description: "Calculates the number of months and years to maturity of a financial instrument",
            implementation: function(maturity = null) {
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
        daysSinceOpen: {
            description: "Calculates the number of days from the open date of a financial instrument",
            implementation: function(open = null) {
                if (open) {
                    const openDate = new Date(open);
                    const currentDate = new Date();
        
                    // Calculate the number of days from openDate to currentDate
                    const timeDifference = currentDate.getTime() - openDate.getTime(); // Difference in milliseconds
                    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
                    return daysDifference;
                } else {
                    console.warn('Open date not provided to daysSinceOpen');
                    return null;
                }
            }
        },
        sinceOpen: {
            description: "Calculates the number of months and years from the open date of a financial instrument",
            implementation: function(open = null) {
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
            implementation: function(term = null, open = null, maturity = null) {
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
        averageBalance: {
            description: "Calculates the average balance of a loan over its term",
            implementation: function(principal, payment, rate, maturity) {
                // Determine months until maturity using either maturity date or term
                const {monthsUntilMaturity, yearsUntilMaturity} = financial.functions.untilMaturity.implementation(maturity);
                const monthlyRate = rate < 1 ? parseFloat(rate) / 12 : parseFloat(rate / 100) / 12;
                console.log('payment, monthly rate, monthsUntilMaturity', payment, monthlyRate, monthsUntilMaturity)
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
                const averageBalance = cummulativePrincipal / monthsUntilMaturity;
                return averageBalance.toFixed(2);
            }
        },
        /*
         * @param {number} expectedLifeMonths - Expected life of the deposit in months.
         * @param {string} depositType - Type of deposit ('checking', 'savings', 'certificates').
         * @returns {number} FTP rate as a decimal.
         */
        calculateFtpRate: {
            description: "Calculates the funds transfer pricing credit using the discountFTP dictionary and Treasury rates from an external API.",
            implementation: function(expectedLifeMonths, depositType) {
                // Step 1: Retrieve the Treasury rate from the external API
                const treasuryRates = window.libraries.api.trates.values; // Assuming this is an object with rates keyed by months
                const treasuryRate = treasuryRates[expectedLifeMonths];
                
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
        /*
         * @param {source} valid sources are checking, savings, certificate
         */
        depositProfit: {
            description: "Calculates the profit of deposit accounts",
            implementation: function(portfolio, balance, interest=null, rate=null, charges=null, waived=null, open, source, deposits=null, withdrawals=null) {
                const sourceIndex = aiSynonymKey(source);
                 console.log('sourceIndex', sourceIndex);
                const creditRate = financial.functions.calculateFtpRate.implementation(12, sourceIndex);
                //const creditRate = window.libraries.api.trates.values[12] * 0.627; // operational risk, regulatory risk, deposit acquisition factor, interest rate risk, and liquidity discount.
                const creditForFunding = sourceIndex === 'checking' ? creditRate * balance * (1 - financial.attributes.ddaReserveRequired.value) : creditRate * balance;
                var operatingExpense = 100;  //default
                var fraudLoss = 0;
                var interestExpense = 0;

                // calculate deposit volume
                var annualDeposits = 0;
                if (deposits) {
                    if (window.analytics[sourceIndex][aiTranslater(Object.keys(window.analytics[sourceIndex]), 'deposits')].YTDfactor === 1) { //if YTDFactor === 1 then divide volume by life in years else multiply YTD factor by volume 
                        const { monthsSinceOpen, yearsSinceOpen } = financial.functions.sinceOpen.implementation(open);
                        annualDeposits = deposits / yearsSinceOpen;
                    } else {
                        annualDeposits = deposits * window.analytics[sourceIndex][aiTranslater(Object.keys(window.analytics[sourceIndex]), 'deposits')].YTDfactor;
                    }
                }

                //calculate withdrawals volume
                var annualWithdrawals = 0;
                if (withdrawals) {
                    if (window.analytics[sourceIndex][aiTranslater(Object.keys(window.analytics[sourceIndex]), 'withdrawals')].YTDfactor === 1) { //if YTDFactor === 1 then divide volume by life in years else multiply YTD factor by volume 
                        const { monthsSinceOpen, yearsSinceOpen } = financial.functions.sinceOpen.implementation(open);
                        annualWithdrawals = withdrawals / yearsSinceOpen;
                    } else {
                        annualWithdrawals = withdrawals *  window.analytics[sourceIndex][aiTranslater(Object.keys(window.analytics[sourceIndex]), 'withdrawals')].YTDfactor;
                    }
                }

                if (sourceIndex === 'certificate') {
                    rate = rate < 1 ? parseFloat(rate) : parseFloat(rate / 100); 
                    interestExpense = balance * rate;
                    if (financial.dictionaries.annualOperatingExpense[sourceIndex].value) {
                        operatingExpense = financial.dictionaries.annualOperatingExpense[sourceIndex].value;
                    } 
                } else {  //checking and savings
		    		//aiIdConsumerSmallBiz  
					const consumerMaximum = financial.dictionaries.consumerMaximum.values[sourceIndex];
					const params = {balance, interest, sourceIndex, annualDeposits, annualWithdrawals, consumerMaximum};
					const isBusiness = aiIsBusiness([params]);  // @ai.js
					let accountType = "Consumer";
					if (isBusiness) {
					    accountType = "Business";
					}
					console.log(`account type: ${accountType} ${sourceIndex}`);
                    interestExpense = interest * window.analytics[sourceIndex][aiTranslater(Object.keys(window.analytics[sourceIndex]), 'interest')].YTDfactor;
                    if (financial.dictionaries.annualOperatingExpense[sourceIndex].values[accountType]) {
                        operatingExpense = financial.dictionaries.annualOperatingExpense[sourceIndex].values[accountType];
                    }
                    fraudLoss = organization.attributes.capitalTarget.value * financial.attributes.fraudLossFactor.value * balance;
                }
                
                let feeIncome = 0;
                if (charges) {
                    const netCharges = waived ? (charges - waived) : charges;
                    feeIncome = netCharges * window.analytics[sourceIndex][aiTranslater(Object.keys(window.analytics[sourceIndex]), 'charges')].YTDfactor;
                }

                const depositsExpense = deposits * financial.attributes.depositUnitExpense.value;            
                const withdrawalsExpense =  withdrawals * financial.attributes.withdrawalUnitExpense.value;
                const pretaxIncome = creditForFunding + feeIncome;
                const pretaxExpense = interestExpense + depositsExpense + withdrawalsExpense + operatingExpense + fraudLoss; 
                const pretaxProfit = pretaxIncome - pretaxExpense;
                const profit = pretaxProfit * (1 - window.libraries.organization.attributes.taxRate.value);
                console.log(`portfolio: ${portfolio}, balance: ${balance}, creditRate: ${creditRate}, creditForFunding: ${creditForFunding}, rate: ${rate} interestExpense: ${interestExpense}, charges: ${charges}, waived: ${waived}, deposits: ${deposits}, deposits expense: ${depositsExpense}, withdrawals expense: ${withdrawalsExpense}, operatingExpense: ${operatingExpense}, fraudLoss: ${fraudLoss}, pretax: ${pretaxProfit}, taxAdj: ${1 - window.libraries.organization.attributes.taxRate.value}, depositProfit: ${profit}`);
                return profit;
            }
        },
        calculateFundingRate: {
            description: "Calculates the adjusted funding rate of loan",
            implementation: function(months) {
                if (!financial.attributes || !window.libraries.api.trates.values[months]) {
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
                const correspondingTreasuryRate = window.libraries.api.trates.values[months];
                return correspondingTreasuryRate * (1 - X);
            }
        },
        profit: {
            description: "Calculates the profit of a loan",
            implementation: function(portfolio, principal, rate, risk, open, payment = null, fees = null, maturity = null, term = null) {
                if (principal === 0) return 0; // zero principal implies closed loan, so return 0 profit
                const {monthsUntilMaturity, yearsUntilMaturity} = financial.functions.untilMaturity.implementation(maturity);
                const monthlyRate = rate < 1 ? parseFloat(rate) / 12 : parseFloat(rate / 100) / 12;
                const monthlyPayment = (principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -monthsUntilMaturity)))).toFixed(2);
                const lifetimeInterest = monthlyPayment * monthsUntilMaturity - principal;
                const AveragePrincipal = lifetimeInterest / (monthlyRate * monthsUntilMaturity);
                const {termInMonths, termInYears} = financial.functions.getTerm.implementation(term, open, maturity);
                const interestIncome = AveragePrincipal * rate;
                const fundingRate = financial.functions.calculateFundingRate.implementation(monthsUntilMaturity); // adjust for liquidity, convenience, and loyalty premiums
                const fundingExpense = AveragePrincipal * fundingRate;

				let smallLoanMaximum = financial.attributes.smallLoanMaximum.value;  //default
				const principalObject = window.analytics.loan[aiTranslater(Object.keys(window.analytics.loan), 'principal')];
				if (principalObject && Object.hasOwn(principalObject, "median")) {
					smallLoanMaximum = principalObject.median > smallLoanMaximum ? principalObject.median : smallLoanMaximum;  // the median of each loan principal in the entire portfolio (50th percentile)
				}

                let isConsumerSmallBusiness = false;
                if (payment) { //if loan payment is a valid argument test original
                    const originalPrincipal = monthlyPayment * termInMonths - lifetimeInterest;
                    isConsumerSmallBusiness = originalPrincipal < smallLoanMaximum; 
                } else{
				    isConsumerSmallBusiness = termInYears <= 5 && principal < smallLoanMaximum; 
                }
				let complexityFactor = 1;
                if (isConsumerSmallBusiness) {
                    complexityFactor = 0.5
				}
                const originationExpense = (financial.attributes.fixedOriginationExpense.value + Math.min(principal, financial.attributes.principalCostMaximum.value) * financial.attributes.variableOriginationFactor.value * complexityFactor) / Math.min(termInYears, 10);
                const servicingExpense = (financial.attributes.fixedServicingExpense.value + principal * financial.attributes.loanServicingFactor.value / yearsUntilMaturity) * complexityFactor;

                //console.log('risk key:', aiTranslater(Object.keys(window.analytics.loan), 'risk'));
                const riskObject = window.analytics.loan[aiTranslater(Object.keys(window.analytics.loan), 'risk')];
                console.log('risk data:', riskObject, Object.hasOwn(riskObject, "convexProbability"), riskObject.convexProbability);
                let probabilityOfDefault = 0;
                if (risk && risk !== 'NULL') {
                    if (riskObject && Object.hasOwn(riskObject, "convexProbability")) { // risk data reached statistical signifigance
                        if (typeof risk === "string") {
                            const match = risk.match(/^(\d+)([a-zA-Z])$/);
                            if (match) {
                                // Extract the number part and convert it to a number
                                risk = parseInt(match[1], 10) + 0.5;
                            }
                        }
                        if (Object.hasOwn(riskObject.convexProbability, `'${risk}'`)) {
                            probabilityOfDefault = riskObject.convexProbability[`'${risk}'`] * .01;
                        } else {
                            console.warn('cannot find key in convexProbability:', risk);
                        }
                    } else {
                        probabilityOfDefault = .02;
                    }
                }
                const lossProvision =  AveragePrincipal / financial.attributes.minimumLoanToValue.value * (1 - financial.attributes.expectedRecoveryRate.value) * probabilityOfDefault;                
                const expectedLossProvision = lossProvision / yearsUntilMaturity;  // spread lossProvision cost over yearsUntilMaturity
                
                const nonInterestIncome = fees !== null ? fees / termInYears : 0;
            
                //const expectedLossProvision = probabilityOfDefault * (principal - (principal / financial.attributes.minimumLoanToValue.value * (1 - financial.attributes.expectedRecoveryRate.value))) / yearsUntilMaturity; 
                const pretax = (interestIncome - fundingExpense - originationExpense - servicingExpense + nonInterestIncome) * (1 - window.libraries.organization.attributes.taxRate.value); 
                const profit = pretax - expectedLossProvision;
                console.log(`portfolio: ${portfolio}, principal: ${principal}, average: ${AveragePrincipal}, risk: ${risk}, fees: ${fees}, years until maturity: ${yearsUntilMaturity}, term in years: ${termInYears}, rate: ${rate}, interest: ${interestIncome}, funding rate: ${fundingRate}, funding expense: ${fundingExpense}, origination expense: ${originationExpense}, servicing expense: ${servicingExpense}, non interest income: ${nonInterestIncome}, probability of default: ${probabilityOfDefault}, pretax: ${pretax}, expected loss: ${expectedLossProvision}, profit: ${profit.toFixed(2)}`);
                return profit;
            }
        }
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
        }
    },
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
window.financial = financial; // Make it globally accessible
