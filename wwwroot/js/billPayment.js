const billPaymentApiBaseUrl = 'https://localhost:7256/api/BillPayments';

document.addEventListener('DOMContentLoaded', function () {
    // Load bill payments
    if (document.getElementById('billPaymentsTable')) {
        fetch(billPaymentApiBaseUrl)
            .then(response => response.json())
            .then(data => {
                const tableBody = document.querySelector('#billPaymentsTable tbody');
                data.forEach(billPayment => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${billPayment.id}</td>
                        <td>${billPayment.accountId}</td>
                        <td>${billPayment.amount}</td>
                        <td>${billPayment.date}</td>
                        <td>${billPayment.payee}</td>
                        <td>${billPayment.paymentStatus}</td>
                        <td>
                            <a href="BillPayments/BillPaymentDetails.html?id=${billPayment.id}">Details</a>
                            <a href="BillPayments/EditBillPayment.html?id=${billPayment.id}">Edit</a>
                            <a href="BillPayments/DeleteBillPayment.html?id=${billPayment.id}">Delete</a>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            });
    }

    // Create bill payment
    if (document.getElementById('createBillPaymentForm')) {
        document.getElementById('createBillPaymentForm').addEventListener('submit', function (event) {
            event.preventDefault();
            const billPaymentData = {
                accountId: document.getElementById('accountId').value,
                amount: parseFloat(document.getElementById('amount').value),
                date: document.getElementById('date').value,
                payee: document.getElementById('payee').value,
                paymentStatus: document.getElementById('paymentStatus').value
            };
            fetch(billPaymentApiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(billPaymentData)
            })
                .then(response => response.json())
                .then(() => window.location.href = '../BillPayments.html');
        });
    }

    // Load bill payment details for edit
    if (document.getElementById('editBillPaymentForm')) {
        const billPaymentId = new URLSearchParams(window.location.search).get('id');
        fetch(`${billPaymentApiBaseUrl}/${billPaymentId}`)
            .then(response => response.json())
            .then(billPayment => {
                document.getElementById('billPaymentId').value = billPayment.id;
                document.getElementById('accountId').value = billPayment.accountId;
                document.getElementById('amount').value = billPayment.amount;
                document.getElementById('date').value = billPayment.date;
                document.getElementById('payee').value = billPayment.payee;
                document.getElementById('paymentStatus').value = billPayment.paymentStatus;
            });

        document.getElementById('editBillPaymentForm').addEventListener('submit', function (event) {
            event.preventDefault();
            const billPaymentData = {
                id: document.getElementById('billPaymentId').value,
                accountId: document.getElementById('accountId').value,
                amount: parseFloat(document.getElementById('amount').value),
                date: document.getElementById('date').value,
                payee: document.getElementById('payee').value,
                paymentStatus: document.getElementById('paymentStatus').value
            };
            fetch(`${billPaymentApiBaseUrl}/${billPaymentData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(billPaymentData)
            })
                .then(response => response.json())
                .then(() => window.location.href = '../BillPayments.html');
        });
    }

    // Delete bill payment
    if (document.getElementById('deleteBillPaymentForm')) {
        const billPaymentId = new URLSearchParams(window.location.search).get('id');
        document.getElementById('billPaymentId').value = billPaymentId;

        document.getElementById('deleteBillPaymentForm').addEventListener('submit', function (event) {
            event.preventDefault();
            fetch(`${billPaymentApiBaseUrl}/${billPaymentId}`, {
                method: 'DELETE'
            })
                .then(() => window.location.href = '../BillPayments.html');
        });
    }

    // Load bill payment details for view
    if (document.getElementById('billPaymentDetails')) {
        const billPaymentId = new URLSearchParams(window.location.search).get('id');
        fetch(`${billPaymentApiBaseUrl}/${billPaymentId}`)
            .then(response => response.json())
            .then(billPayment => {
                const detailsDiv = document.getElementById('billPaymentDetails');
                detailsDiv.innerHTML = `
                    <p><strong>Id:</strong> ${billPayment.id}</p>
                    <p><strong>Account Id:</strong> ${billPayment.accountId}</p>
                    <p><strong>Amount:</strong> ${billPayment.amount}</p>
                    <p><strong>Date:</strong> ${billPayment.date}</p>
                    <p><strong>Payee:</strong> ${billPayment.payee}</p>
                    <p><strong>Payment Status:</strong> ${billPayment.paymentStatus}</p>
                `;
                document.getElementById('editLink').href = `EditBillPayment.html?id=${billPayment.id}`;
                document.getElementById('deleteLink').href = `DeleteBillPayment.html?id=${billPayment.id}`;
            });
    }
});