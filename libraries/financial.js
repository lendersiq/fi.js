const financial = {
    interestIncome: {
        description: "Calculates the interest income based on principal and annual rate",
        implementation: function(principal, rate) {
            console.log('interstIncome', principal, rate);
            return principal * rate;
        }
    }
}
window.financial = financial; // Make it globally accessible