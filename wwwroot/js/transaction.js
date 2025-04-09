const transactionApiBaseUrl = 'https://localhost:7256/api/Transactions';

document.addEventListener('DOMContentLoaded', function () {
    // Load transactions
    if (document.getElementById('transactionsTable')) {
        fetch(transactionApiBaseUrl)
            .then(response => response.json())
            .then(data => {
                const tableBody = document.querySelector('#transactionsTable tbody');
                data.forEach(transaction => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${transaction.id}</td>
                        <td>${transaction.accountId}</td>
                        <td>${transaction.amount}</td>
                        <td>${transaction.date}</td>
                        <td>${transaction.type}</td>
                        <td>${transaction.description}</td>
                        <td>
                            <a href="Transactions/TransactionDetails.html?id=${transaction.id}">Details</a>
                            <a href="Transactions/EditTransaction.html?id=${transaction.id}">Edit</a>
                            <a href="Transactions/DeleteTransaction.html?id=${transaction.id}">Delete</a>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            })
            .catch(error => console.error('Error loading transactions:', error));
    }

    // Create transaction
    if (document.getElementById('createTransactionForm')) {
        document.getElementById('createTransactionForm').addEventListener('submit', function (event) {
            event.preventDefault();
            const transactionData = {
                accountId: parseInt(document.getElementById('accountId').value),
                amount: parseFloat(document.getElementById('amount').value),
                date: document.getElementById('date').value,
                type: document.getElementById('type').value,
                description: document.getElementById('description').value
            };
            fetch(transactionApiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transactionData)
            })
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(text => { throw new Error(text); });
                    }
                    return response.json();
                })
                .then(() => window.location.href = '../Transactions.html')
                .catch(error => console.error('Error creating transaction:', error));
        });
    }

    // Load transaction details for edit
    if (document.getElementById('editTransactionForm')) {
        const transactionId = new URLSearchParams(window.location.search).get('id');
        fetch(`${transactionApiBaseUrl}/${transactionId}`)
            .then(response => response.json())
            .then(transaction => {
                document.getElementById('transactionId').value = transaction.id;
                document.getElementById('accountId').value = transaction.accountId;
                document.getElementById('amount').value = transaction.amount;
                document.getElementById('date').value = transaction.date;
                document.getElementById('type').value = transaction.type;
                document.getElementById('description').value = transaction.description;
            })
            .catch(error => console.error('Error loading transaction details:', error));

        document.getElementById('editTransactionForm').addEventListener('submit', function (event) {
            event.preventDefault();
            const transactionData = {
                id: document.getElementById('transactionId').value,
                accountId: parseInt(document.getElementById('accountId').value),
                amount: parseFloat(document.getElementById('amount').value),
                date: document.getElementById('date').value,
                type: document.getElementById('type').value,
                description: document.getElementById('description').value
            };
            fetch(`${transactionApiBaseUrl}/${transactionData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transactionData)
            })
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(text => { throw new Error(text); });
                    }
                    return response.json();
                })
                .then(() => window.location.href = '../Transactions.html')
                .catch(error => console.error('Error updating transaction:', error));
        });
    }

    // Delete transaction
    if (document.getElementById('deleteTransactionForm')) {
        const transactionId = new URLSearchParams(window.location.search).get('id');
        document.getElementById('transactionId').value = transactionId;

        document.getElementById('deleteTransactionForm').addEventListener('submit', function (event) {
            event.preventDefault();
            fetch(`${transactionApiBaseUrl}/${transactionId}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(text => { throw new Error(text); });
                    }
                    return window.location.href = '../Transactions.html';
                })
                .catch(error => console.error('Error deleting transaction:', error));
        });
    }

    // Load transaction details for view
    if (document.getElementById('transactionDetails')) {
        const transactionId = new URLSearchParams(window.location.search).get('id');
        fetch(`${transactionApiBaseUrl}/${transactionId}`)
            .then(response => response.json())
            .then(transaction => {
                const detailsDiv = document.getElementById('transactionDetails');
                detailsDiv.innerHTML = `
                    <p><strong>Id:</strong> ${transaction.id}</p>
                    <p><strong>Account ID:</strong> ${transaction.accountId}</p>
                    <p><strong>Amount:</strong> ${transaction.amount}</p>
                    <p><strong>Date:</strong> ${transaction.date}</p>
                    <p><strong>Type:</strong> ${transaction.type}</p>
                    <p><strong>Description:</strong> ${transaction.description}</p>
                `;
                document.getElementById('editLink').href = `EditTransaction.html?id=${transaction.id}`;
                document.getElementById('deleteLink').href = `DeleteTransaction.html?id=${transaction.id}`;
            })
            .catch(error => console.error('Error loading transaction details:', error));
    }
});