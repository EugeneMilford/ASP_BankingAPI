const creditCardApiBaseUrl = 'https://localhost:7256/api/CreditCards';

document.addEventListener('DOMContentLoaded', function () {
    // Load credit cards
    if (document.getElementById('creditCardsTable')) {
        fetch(creditCardApiBaseUrl)
            .then(response => response.json())
            .then(data => {
                const tableBody = document.querySelector('#creditCardsTable tbody');
                data.forEach(creditCard => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${creditCard.id}</td>
                        <td>${creditCard.cardNumber}</td>
                        <td>${creditCard.creditLimit}</td>
                        <td>${creditCard.currentBalance}</td>
                        <td>${creditCard.expiryDate}</td>
                        <td>${creditCard.cardType}</td>
                        <td>
                            <a href="CreditCards/CreditCardDetails.html?id=${creditCard.id}">Details</a>
                            <a href="CreditCards/EditCreditCard.html?id=${creditCard.id}">Edit</a>
                            <a href="CreditCards/DeleteCreditCard.html?id=${creditCard.id}">Delete</a>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            });
    }

    // Create credit card
    if (document.getElementById('createCreditCardForm')) {
        document.getElementById('createCreditCardForm').addEventListener('submit', function (event) {
            event.preventDefault();
            const creditCardData = {
                cardNumber: document.getElementById('cardNumber').value,
                creditLimit: parseFloat(document.getElementById('creditLimit').value),
                currentBalance: parseFloat(document.getElementById('currentBalance').value),
                expiryDate: document.getElementById('expiryDate').value,
                cardType: document.getElementById('cardType').value
            };
            fetch(creditCardApiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(creditCardData)
            })
                .then(response => response.json())
                .then(() => window.location.href = '../CreditCards.html');
        });
    }

    // Load credit card details for edit
    if (document.getElementById('editCreditCardForm')) {
        const creditCardId = new URLSearchParams(window.location.search).get('id');
        fetch(`${creditCardApiBaseUrl}/${creditCardId}`)
            .then(response => response.json())
            .then(creditCard => {
                document.getElementById('creditCardId').value = creditCard.id;
                document.getElementById('cardNumber').value = creditCard.cardNumber;
                document.getElementById('creditLimit').value = creditCard.creditLimit;
                document.getElementById('currentBalance').value = creditCard.currentBalance;
                document.getElementById('expiryDate').value = creditCard.expiryDate;
                document.getElementById('cardType').value = creditCard.cardType;
            });

        document.getElementById('editCreditCardForm').addEventListener('submit', function (event) {
            event.preventDefault();
            const creditCardData = {
                id: document.getElementById('creditCardId').value,
                cardNumber: document.getElementById('cardNumber').value,
                creditLimit: parseFloat(document.getElementById('creditLimit').value),
                currentBalance: parseFloat(document.getElementById('currentBalance').value),
                expiryDate: document.getElementById('expiryDate').value,
                cardType: document.getElementById('cardType').value
            };
            fetch(`${creditCardApiBaseUrl}/${creditCardData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(creditCardData)
            })
                .then(response => response.json())
                .then(() => window.location.href = '../CreditCards.html');
        });
    }

    // Delete credit card
    if (document.getElementById('deleteCreditCardForm')) {
        const creditCardId = new URLSearchParams(window.location.search).get('id');
        document.getElementById('creditCardId').value = creditCardId;

        document.getElementById('deleteCreditCardForm').addEventListener('submit', function (event) {
            event.preventDefault();
            fetch(`${creditCardApiBaseUrl}/${creditCardId}`, {
                method: 'DELETE'
            })
                .then(() => window.location.href = '../CreditCards.html');
        });
    }

    // Load credit card details for view
    if (document.getElementById('creditCardDetails')) {
        const creditCardId = new URLSearchParams(window.location.search).get('id');
        fetch(`${creditCardApiBaseUrl}/${creditCardId}`)
            .then(response => response.json())
            .then(creditCard => {
                const detailsDiv = document.getElementById('creditCardDetails');
                detailsDiv.innerHTML = `
                    <p><strong>Id:</strong> ${creditCard.id}</p>
                    <p><strong>Card Number:</strong> ${creditCard.cardNumber}</p>
                    <p><strong>Credit Limit:</strong> ${creditCard.creditLimit}</p>
                    <p><strong>Current Balance:</strong> ${creditCard.currentBalance}</p>
                    <p><strong>Expiry Date:</strong> ${creditCard.expiryDate}</p>
                    <p><strong>Card Type:</strong> ${creditCard.cardType}</p>
                `;
                document.getElementById('editLink').href = `EditCreditCard.html?id=${creditCard.id}`;
                document.getElementById('deleteLink').href = `DeleteCreditCard.html?id=${creditCard.id}`;
            });
    }
});