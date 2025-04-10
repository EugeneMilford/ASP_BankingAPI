// Base API URLs
const ACCOUNTS_API_URL = 'https://localhost:7256/api/accounts';
const TRANSACTIONS_API_URL = 'https://localhost:7256/api/transactions';

// Pagination and filtering state
let currentPage = 1;
const pageSize = 10;
let filterSettings = {
    accountId: null,
    type: '',
    dateFrom: null,
    dateTo: null
};

// Transaction Service class to handle all transaction-related API calls
class TransactionService {
    // Get all transactions (with optional filters)
    static async getTransactions(page = 1, size = pageSize, filters = {}) {
        try {
            let url = `${TRANSACTIONS_API_URL}?page=${page}&size=${size}`;

            // Add filters to URL if they exist
            if (filters.accountId) url += `&accountId=${filters.accountId}`;
            if (filters.type) url += `&type=${filters.type}`;
            if (filters.dateFrom) url += `&dateFrom=${filters.dateFrom}`;
            if (filters.dateTo) url += `&dateTo=${filters.dateTo}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }
    }

    // Get transaction by ID
    static async getTransaction(id) {
        try {
            const response = await fetch(`${TRANSACTIONS_API_URL}/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch transaction');
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching transaction ${id}:`, error);
            throw error;
        }
    }

    // Create new transaction
    static async createTransaction(transactionData) {
        try {
            const response = await fetch(TRANSACTIONS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData)
            });
            if (!response.ok) {
                throw new Error('Failed to create transaction');
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }
    }

    // Update existing transaction
    static async updateTransaction(id, transactionData) {
        try {
            const response = await fetch(`${TRANSACTIONS_API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData)
            });
            if (!response.ok) {
                throw new Error('Failed to update transaction');
            }
            return true;
        } catch (error) {
            console.error(`Error updating transaction ${id}:`, error);
            throw error;
        }
    }

    // Delete transaction
    static async deleteTransaction(id) {
        try {
            const response = await fetch(`${TRANSACTIONS_API_URL}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('Failed to delete transaction');
            }
            return true;
        } catch (error) {
            console.error(`Error deleting transaction ${id}:`, error);
            throw error;
        }
    }

    // Get transactions for a specific account
    static async getAccountTransactions(accountId) {
        try {
            const response = await fetch(`${ACCOUNTS_API_URL}/${accountId}/transactions`);
            if (!response.ok) {
                throw new Error('Failed to fetch account transactions');
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching transactions for account ${accountId}:`, error);
            throw error;
        }
    }
}

// UI Handlers
document.addEventListener('DOMContentLoaded', function () {
    // Set default date for transaction form to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;

    // Load account data for dropdowns
    loadAccountsForDropdowns();

    // Load initial transactions
    loadTransactions();

    // Set up event listeners
    setupEventListeners();
});

// Load accounts for all dropdown selectors
async function loadAccountsForDropdowns() {
    try {
        const accounts = await AccountService.getAllAccounts();

        // Populate account selector dropdown
        const accountSelector = document.getElementById('accountSelector');
        const transactionAccount = document.getElementById('transactionAccount');
        const editTransactionAccount = document.getElementById('editTransactionAccount');

        // Clear existing options except the first one
        accountSelector.innerHTML = '<option value="">All Accounts</option>';
        transactionAccount.innerHTML = '';
        editTransactionAccount.innerHTML = '';

        accounts.forEach(account => {
            // Add option to account selector
            const option1 = document.createElement('option');
            option1.value = account.id;
            option1.textContent = `${account.accountNumber} (${account.accountType})`;
            accountSelector.appendChild(option1);

            // Add option to transaction form
            const option2 = document.createElement('option');
            option2.value = account.id;
            option2.textContent = `${account.accountNumber} (${account.accountType})`;
            transactionAccount.appendChild(option2);

            // Add option to edit form
            const option3 = document.createElement('option');
            option3.value = account.id;
            option3.textContent = `${account.accountNumber} (${account.accountType})`;
            editTransactionAccount.appendChild(option3);
        });

        // Set up change event for account selector
        accountSelector.addEventListener('change', function () {
            filterSettings.accountId = this.value ? parseInt(this.value) : null;
            currentPage = 1; // Reset to first page when changing account
            loadTransactions();
            updateAccountSummary();
        });

        // Initial account summary update
        updateAccountSummary();

    } catch (error) {
        showError('Failed to load accounts');
    }
}

// Update account summary information
async function updateAccountSummary() {
    const accountId = document.getElementById('accountSelector').value;

    if (!accountId) {
        // Show summary for all accounts
        try {
            const accounts = await AccountService.getAllAccounts();
            const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

            document.getElementById('currentBalance').textContent = `$${totalBalance.toFixed(2)}`;

            // Count total transactions
            const transactions = await TransactionService.getTransactions(1, 1000); // Get all transactions
            document.getElementById('transactionCount').textContent = transactions.totalItems || transactions.length || 0;
        } catch (error) {
            console.error('Error updating account summary:', error);
        }
    } else {
        // Show summary for selected account
        try {
            const account = await AccountService.getAccount(accountId);
            document.getElementById('currentBalance').textContent = `$${account.balance.toFixed(2)}`;

            // Count transactions for this account
            const transactions = await TransactionService.getAccountTransactions(accountId);
            document.getElementById('transactionCount').textContent = transactions.length || 0;
        } catch (error) {
            console.error('Error updating account summary:', error);
        }
    }
}

// Load and display transactions
async function loadTransactions() {
    try {
        const transactionsResponse = await TransactionService.getTransactions(currentPage, pageSize, filterSettings);
        const transactions = Array.isArray(transactionsResponse)
            ? transactionsResponse
            : transactionsResponse.items || [];

        const totalItems = Array.isArray(transactionsResponse)
            ? transactions.length
            : transactionsResponse.totalItems || 0;

        const tableBody = document.getElementById('transactionsTableBody');
        const noTransactionsEl = document.getElementById('noTransactions');

        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (transactions.length === 0) {
            noTransactionsEl.classList.remove('d-none');
            document.getElementById('transactionStartRange').textContent = '0';
            document.getElementById('transactionEndRange').textContent = '0';
            document.getElementById('totalTransactions').textContent = '0';
            return;
        }

        noTransactionsEl.classList.add('d-none');

        // Update the accounts cache
        const accounts = await AccountService.getAllAccounts();
        const accountsMap = {};
        accounts.forEach(account => {
            accountsMap[account.id] = account;
        });

        // Populate table
        transactions.forEach(transaction => {
            const account = accountsMap[transaction.accountId] || { accountNumber: 'Unknown' };
            const row = `
                <tr data-transaction-id="${transaction.transactionId}">
                    <td>${new Date(transaction.date).toLocaleDateString()}</td>
                    <td>${account.accountNumber}</td>
                    <td>
                        <span class="badge ${transaction.type === 'Credit' ? 'bg-success' : 'bg-danger'}">${transaction.type}</span>
                    </td>
                    <td>${transaction.description}</td>
                    <td class="${transaction.type === 'Credit' ? 'text-success' : 'text-danger'}">
                        ${transaction.type === 'Credit' ? '+' : '-'}$${Math.abs(transaction.amount).toFixed(2)}
                    </td>
                    <td>
                        <button class="btn btn-primary btn-sm me-1" onclick="handleEditTransaction(${transaction.transactionId})">
                            Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="handleDeleteTransaction(${transaction.transactionId})">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

        // Update pagination info
        const startItem = (currentPage - 1) * pageSize + 1;
        const endItem = Math.min(startItem + transactions.length - 1, totalItems);

        document.getElementById('transactionStartRange').textContent = totalItems > 0 ? startItem : '0';
        document.getElementById('transactionEndRange').textContent = endItem;
        document.getElementById('totalTransactions').textContent = totalItems;

        // Update pagination buttons
        document.getElementById('prevPage').disabled = currentPage <= 1;
        document.getElementById('nextPage').disabled = endItem >= totalItems;

        // Update account summary after loading transactions
        updateAccountSummary();

    } catch (error) {
        showError('Failed to load transactions');
    }
}

// Set up event listeners
function setupEventListeners() {
    // Transaction form submission
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleCreateTransaction);
    }

    // Filter buttons
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    document.getElementById('refreshTransactions').addEventListener('click', loadTransactions);

    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadTransactions();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        currentPage++;
        loadTransactions();
    });

    // Save transaction edit button
    document.getElementById('saveEditTransactionButton').addEventListener('click', () => {
        const transactionId = document.getElementById('editTransactionId').value;
        saveEditedTransaction(transactionId);
    });
}

// Handle transaction creation
async function handleCreateTransaction(event) {
    event.preventDefault();

    const transactionData = {
        accountId: parseInt(document.getElementById('transactionAccount').value),
        amount: parseFloat(document.getElementById('transactionAmount').value),
        date: document.getElementById('transactionDate').value,
        type: document.getElementById('transactionType').value,
        description: document.getElementById('transactionDescription').value
    };

    try {
        await TransactionService.createTransaction(transactionData);
        document.getElementById('transactionForm').reset();

        // Set default date to today
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];

        showSuccess('Transaction created successfully');
        loadTransactions();

        // Update account balance in the UI
        updateAccountSummary();
    } catch (error) {
        showError('Failed to create transaction');
    }
}

// Apply filters to transactions
function applyFilters() {
    filterSettings.accountId = document.getElementById('accountSelector').value
        ? parseInt(document.getElementById('accountSelector').value)
        : null;
    filterSettings.type = document.getElementById('filterType').value;
    filterSettings.dateFrom = document.getElementById('filterDateFrom').value || null;
    filterSettings.dateTo = document.getElementById('filterDateTo').value || null;

    currentPage = 1; // Reset to first page when applying filters
    loadTransactions();
}

// Reset all filters
function resetFilters() {
    document.getElementById('accountSelector').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';

    filterSettings = {
        accountId: null,
        type: '',
        dateFrom: null,
        dateTo: null
    };

    currentPage = 1;
    loadTransactions();
}

// Handle transaction editing
async function handleEditTransaction(id) {
    try {
        const transaction = await TransactionService.getTransaction(id);

        // Populate edit modal
        document.getElementById('editTransactionId').value = transaction.transactionId;
        document.getElementById('editTransactionAccount').value = transaction.accountId;
        document.getElementById('editTransactionAmount').value = Math.abs(transaction.amount);
        document.getElementById('editTransactionType').value = transaction.type;
        document.getElementById('editTransactionDescription').value = transaction.description;

        // Format date for input (YYYY-MM-DD)
        const date = new Date(transaction.date);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById('editTransactionDate').value = formattedDate;

        // Show modal
        const editModal = new bootstrap.Modal(document.getElementById('editTransactionModal'));
        editModal.show();
    } catch (error) {
        showError('Failed to load transaction details');
    }
}

// Save edited transaction
async function saveEditedTransaction(id) {
    const transactionData = {
        transactionId: parseInt(id),
        accountId: parseInt(document.getElementById('editTransactionAccount').value),
        amount: parseFloat(document.getElementById('editTransactionAmount').value),
        type: document.getElementById('editTransactionType').value,
        date: document.getElementById('editTransactionDate').value,
        description: document.getElementById('editTransactionDescription').value
    };

    try {
        await TransactionService.updateTransaction(id, transactionData);

        // Close the modal
        const editModal = bootstrap.Modal.getInstance(document.getElementById('editTransactionModal'));
        editModal.hide();

        showSuccess('Transaction updated successfully');
        loadTransactions();

        // Update account balance
        updateAccountSummary();
    } catch (error) {
        showError('Failed to update transaction');
    }
}

// Handle transaction deletion
async function handleDeleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
        await TransactionService.deleteTransaction(id);
        showSuccess('Transaction deleted successfully');
        loadTransactions();

        // Update account balance
        updateAccountSummary();
    } catch (error) {
        showError('Failed to delete transaction');
    }
}

// Utility functions for showing notifications
function showSuccess(message) {
    alert(message); // You can replace this with a better notification system
}

function showError(message) {
    alert(message); // You can replace this with a better notification system
}