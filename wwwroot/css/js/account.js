async function loadAccountsTable() {
    try {
        const accounts = await AccountService.getAllAccounts();
        const tableBody = document.getElementById('accountsTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        accounts.forEach(account => {
            const row = `
                <tr data-account-id="${account.id}">
                    <td>${account.accountNumber}</td>
                    <td class="account-balance">$${account.balance.toFixed(2)}</td>
                    <td>${account.accountType}</td>
                    <td>${new Date(account.createdDate).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-primary btn-sm me-2" onclick="handleEditAccount(${account.id})">
                            Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="handleDeleteAccount(${account.id})">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

        // Update total balance after loading accounts
        updateTotalBalance();
    } catch (error) {
        showError('Failed to load accounts');
    }
}

// Calculate and update total balance
async function updateTotalBalance() {
    try {
        const accounts = await AccountService.getAllAccounts();
        const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

        // Update the total balance display
        const totalBalanceElement = document.getElementById('totalBalance');
        if (totalBalanceElement) {
            totalBalanceElement.textContent = `$${totalBalance.toFixed(2)}`;
        }

        // Update last updated timestamp
        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            const now = new Date();
            lastUpdatedElement.textContent = now.toLocaleTimeString();
        }

        return totalBalance;
    } catch (error) {
        console.error('Error updating total balance:', error);
        showError('Failed to update balance');
        return 0;
    }
}

// Manual refresh function for the refresh button
function refreshBalances() {
    loadAccountsTable();
}

// Handle account creation
async function handleCreateAccount(event) {
    event.preventDefault();

    const accountData = {
        accountNumber: document.getElementById('accountNumber').value,
        balance: parseFloat(document.getElementById('balance').value),
        accountType: document.getElementById('accountType').value,
        createdDate: new Date().toISOString()
    };

    try {
        await AccountService.createAccount(accountData);
        document.getElementById('accountForm').reset();
        showSuccess('Account created successfully');
        loadAccountsTable();
    } catch (error) {
        showError('Failed to create account');
    }
}

// Handle account editing
async function handleEditAccount(id) {
    try {
        const account = await AccountService.getAccount(id);

        // Populate edit modal
        document.getElementById('editAccountId').value = account.id;
        document.getElementById('editAccountNumber').value = account.accountNumber;
        document.getElementById('editBalance').value = account.balance;
        document.getElementById('editAccountType').value = account.accountType;

        // Show modal
        const editModal = new bootstrap.Modal(document.getElementById('editAccountModal'));
        editModal.show();

        // Set up save button handler
        document.getElementById('saveEditButton').onclick = async () => {
            await saveEditedAccount(account.id);
            editModal.hide();
        };
    } catch (error) {
        showError('Failed to load account details');
    }
}

// Save edited account
async function saveEditedAccount(id) {
    const accountData = {
        id: id,
        accountNumber: document.getElementById('editAccountNumber').value,
        balance: parseFloat(document.getElementById('editBalance').value),
        accountType: document.getElementById('editAccountType').value
    };

    try {
        await AccountService.updateAccount(id, accountData);
        showSuccess('Account updated successfully');
        loadAccountsTable();
        updateTotalBalance();
    } catch (error) {
        showError('Failed to update account');
    }
}

// Handle account deletion
async function handleDeleteAccount(id) {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
        await AccountService.deleteAccount(id);
        showSuccess('Account deleted successfully');
        loadAccountsTable();
        updateTotalBalance();
    } catch (error) {
        showError('Failed to delete account');
    }
}

// Update a single account's balance in the UI
function updateAccountBalanceInUI(accountId, newBalance) {
    const row = document.querySelector(`tr[data-account-id="${accountId}"]`);
    if (row) {
        const balanceCell = row.querySelector('.account-balance');
        if (balanceCell) {
            balanceCell.textContent = `$${newBalance.toFixed(2)}`;
        }
    }
}

// Utility functions for showing notifications
function showSuccess(message) {
    alert(message); // You can replace this with a better notification system
}

function showError(message) {
    alert(message); // You can replace this with a better notification system
}