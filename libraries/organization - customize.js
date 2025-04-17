const organization = {
    attributes: {
        taxRate: {
            description: "The institution tax rate applied to financial calculations",
            value: 0.27
        },
        capitalTarget: {
            description: "The institution capital to assets ratio target",
            value: 0.10
        },
        taxExemptLoan: {
            description: "Tax exempt loan types",
            values: [4]
        }
    }
};
window.organization = organization;