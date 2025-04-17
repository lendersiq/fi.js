const organization = {
    attributes: {
        taxRate: {
            description: "The institution tax rate applied to financial calculations",
            value: 0.27
        },
        capitalTarget: {
            description: "The institution capital to assets ratio target",
            value: 0.10
        }
    },
    dictionaries: {
        taxExempt: {
            loan: {
                description: "Tax exempt loan types",
                values: [4]
            },
            checking: {
                description: "Tax exempt checking types",
                values: [4]
            },
            savings: {
                description: "Tax exempt savings types",
                values: [4]
            },
            certificate: {
                description: "Tax exempt certificate of deposit types",
                values: [4]
            }
        }
    }
};
window.organization = organization;