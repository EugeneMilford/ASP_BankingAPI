document.addEventListener("DOMContentLoaded", function () {
    const baseUrl = "https://localhost:7256/api/Accounts";
    const userId = 1; // Example user ID, replace with actual user ID

    // Fetch account details
    async function fetchAccountDetails() {
        try {
            const response = await fetch(`${baseUrl}/${userId}`);
            if (response.ok) {
                const account = await response.json();
                document.getElementById("accountNumber").textContent = `Account Number: ${account.accountNumber}`;
                document.getElementById("balance").textContent = `Balance: ${account.balance}`;
                document.getElementById("accountType").textContent = `Account Type: ${account.accountType}`;
                document.getElementById("createdDate").textContent = `Created Date: ${new Date(account.createdDate).toLocaleDateString()}`;
            } else {
                const errorText = await response.text();
                document.getElementById("accountNumber").textContent = `Error: ${errorText}`;
                document.getElementById("balance").textContent = "Error fetching account details";
                document.getElementById("accountType").textContent = "Error fetching account details";
                document.getElementById("createdDate").textContent = "Error fetching account details";
            }
        } catch (error) {
            console.error("Error fetching account details:", error);
            document.getElementById("accountNumber").textContent = "Error fetching account details";
            document.getElementById("balance").textContent = "Error fetching account details";
            document.getElementById("accountType").textContent = "Error fetching account details";
            document.getElementById("createdDate").textContent = "Error fetching account details";
        }
    }

    fetchAccountDetails();

    // Handle update balance form submission
    document.getElementById("update-balance-form").addEventListener("submit", async function (e) {
        e.preventDefault();

        const newBalance = parseFloat(document.getElementById("newBalance").value);

        const updateBalanceRequest = {
            balance: newBalance
        };

        try {
            const response = await fetch(`${baseUrl}/${userId}/update-balance`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updateBalanceRequest)
            });

            if (response.ok) {
                alert("Balance updated successfully!");
                fetchAccountDetails(); // Update account details after balance update
            } else {
                const errorText = await response.text();
                alert(`Failed to update balance: ${errorText}`);
            }
        } catch (error) {
            console.error("Error updating balance:", error);
            alert("Failed to update balance!");
        }
    });

    // Handle add account form submission
    document.getElementById("add-account-form").addEventListener("submit", async function (e) {
        e.preventDefault();

        const accountNumber = document.getElementById("accountNumberInput").value;
        const balance = parseFloat(document.getElementById("balanceInput").value);
        const accountType = document.getElementById("accountTypeInput").value;
        const createdDate = new Date();

        const newAccount = {
            accountNumber: accountNumber,
            balance: balance,
            userId: userId,
            accountType: accountType,
            createdDate: createdDate
        };

        try {
            const response = await fetch(`${baseUrl}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newAccount)
            });

            if (response.ok) {
                alert("Account added successfully!");
                fetchAccountDetails(); // Refresh account details after adding new account
            } else {
                const errorText = await response.text();
                alert(`Failed to add account: ${errorText}`);
            }
        } catch (error) {
            console.error("Error adding account:", error);
            alert("Failed to add account!");
        }
    });
});