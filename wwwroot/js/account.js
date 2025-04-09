const apiBaseUrl = 'https://localhost:7256/api/Accounts';

document.addEventListener('DOMContentLoaded', function () {
    // Load accounts
    if (document.getElementById('accountsTable')) {
        fetch(apiBaseUrl)
            .then(response => response.json())
            .then(data => {
                const tableBody = document.querySelector('#accountsTable tbody');
                data.forEach(account => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${account.id}</td>
                        <td>${account.accountNumber}</td>
                        <td>${account.balance}</td>
                        <td>${account.accountType}</td>
                        <td>
                            <a href="Accounts/AccountDetails.html?id=${account.id}">Details</a>
                            <a href="Accounts/EditAccount.html?id=${account.id}">Edit</a>
                            <a href="Accounts/DeleteAccount.html?id=${account.id}">Delete</a>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            });
    }

    // Create account
    if (document.getElementById('createAccountForm')) {
        document.getElementById('createAccountForm').addEventListener('submit', function (event) {
            event.preventDefault();
            const accountData = {
                accountNumber: document.getElementById('accountNumber').value,
                balance: parseFloat(document.getElementById('balance').value),
                accountType: document.getElementById('accountType').value
            };
            fetch(apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(accountData)
            })
                .then(response => response.json())
                .then(() => window.location.href = '../Accounts.html');
        });
    }

    // Load account details for edit
    if (document.getElementById('editAccountForm')) {
        const accountId = new URLSearchParams(window.location.search).get('id');
        fetch(`${apiBaseUrl}/${accountId}`)
            .then(response => response.json())
            .then(account => {
                document.getElementById('accountId').value = account.id;
                document.getElementById('accountNumber').value = account.accountNumber;
                document.getElementById('balance').value = account.balance;
                document.getElementById('accountType').value = account.accountType;
            });

        document.getElementById('editAccountForm').addEventListener('submit', function (event) {
            event.preventDefault();
            const accountData = {
                id: document.getElementById('accountId').value,
                accountNumber: document.getElementById('accountNumber').value,
                balance: parseFloat(document.getElementById('balance').value),
                accountType: document.getElementById('accountType').value
            };
            fetch(`${apiBaseUrl}/${accountData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(accountData)
            })
                .then(response => response.json())
                .then(() => window.location.href = '../Accounts.html');
        });
    }

    // Delete account
    if (document.getElementById('deleteAccountForm')) {
        const accountId = new URLSearchParams(window.location.search).get('id');
        document.getElementById('accountId').value = accountId;

        document.getElementById('deleteAccountForm').addEventListener('submit', function (event) {
            event.preventDefault();
            fetch(`${apiBaseUrl}/${accountId}`, {
                method: 'DELETE'
            })
                .then(() => window.location.href = '../Accounts.html');
        });
    }

    // Load account details for view
    if (document.getElementById('accountDetails')) {
        const accountId = new URLSearchParams(window.location.search).get('id');
        fetch(`${apiBaseUrl}/${accountId}`)
            .then(response => response.json())
            .then(account => {
                const detailsDiv = document.getElementById('accountDetails');
                detailsDiv.innerHTML = `
                    <p><strong>Id:</strong> ${account.id}</p>
                    <p><strong>Account Number:</strong> ${account.accountNumber}</p>
                    <p><strong>Balance:</strong> ${account.balance}</p>
                    <p><strong>Account Type:</strong> ${account.accountType}</p>
                `;
                document.getElementById('editLink').href = `EditAccount.html?id=${account.id}`;
                document.getElementById('deleteLink').href = `DeleteAccount.html?id=${account.id}`;
            });
    }
});