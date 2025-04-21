// API Configuration
const ACCOUNTS_API_URL = 'https://localhost:7256/api/accounts';

// State
let currentPage = 1;
const itemsPerPage = 10;
let totalAccounts = 0;
let filterSettings = {
    accountType: '',
    balanceMin: null,
    balanceMax: null
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Initializing accounts page');

    // Check for new account notification
    checkForNotification();

    // Set up event listeners
    setupEventListeners();

    // Load initial accounts
    loadAccounts();
});

function checkForNotification() {
    const accountCreated = sessionStorage.getItem('accountCreated');
    if (accountCreated) {
        const message = sessionStorage.getItem('accountMessage') || 'Account created successfully';
        showNotification(message, 'success');

        // Clear the notification
        sessionStorage.removeItem('accountCreated');
        sessionStorage.removeItem('accountMessage');
    }
}

function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshButton').addEventListener('click', function () {
        console.log('Refresh button clicked');
        loadAccounts(currentPage);
    });

    // Filter buttons
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
}

async function loadAccounts(page = 1) {
    try {
        console.log(`Loading accounts page ${page}`);
        showLoadingState(true);
        clearTable();

        // Build API URL with filters
        let url = `${ACCOUNTS_API_URL}?page=${page}&size=${itemsPerPage}`;

        if (filterSettings.accountType) {
            url += `&accountType=${encodeURIComponent(filterSettings.accountType)}`;
        }

        if (filterSettings.balanceMin !== null) {
            url += `&balanceMin=${filterSettings.balanceMin}`;
        }

        if (filterSettings.balanceMax !== null) {
            url += `&balanceMax=${filterSettings.balanceMax}`;
        }

        console.log('API Request URL:', url);

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (!data.items || data.items.length === 0) {
            showEmptyState();
            return;
        }

        totalAccounts = data.totalItems || 0;
        renderAccounts(data.items);
        updatePagination(page, Math.ceil(totalAccounts / itemsPerPage));

    } catch (error) {
        console.error('Error loading accounts:', error);
        showErrorState(error);
    } finally {
        showLoadingState(false);
    }
}

function showLoadingState(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
}

function clearTable() {
    document.getElementById('accountsTableBody').innerHTML = '';
    document.getElementById('noAccounts').style.display = 'none';
}

function renderAccounts(accounts) {
    const tableBody = document.getElementById('accountsTableBody');

    accounts.forEach(account => {
        const row = document.createElement('tr');
        const balanceClass = account.balance >= 0 ? 'positive-balance' : 'negative-balance';
        const createdDate = formatDate(account.createdDate);

        row.innerHTML = `
            <td>${account.accountNumber}</td>
            <td><span class="badge bg-secondary type-badge">${account.accountType}</span></td>
            <td class="${balanceClass}">$${formatCurrency(account.balance)}</td>
            <td>${createdDate}</td>
            <td>${account.transactions?.length || 0}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2"
                    onclick="viewAccount(${account.id})">
                    <i class="bi bi-eye"></i> View
                </button>
                <button class="btn btn-sm btn-outline-danger"
                    onclick="deleteAccount(${account.id})">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        console.warn('Error formatting date:', dateString, e);
        return dateString;
    }
}

function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2);
}

function showEmptyState() {
    document.getElementById('noAccounts').style.display = 'block';
    document.getElementById('pagination').innerHTML = '';
}

function showErrorState(error) {
    const errorElement = document.getElementById('noAccounts');
    errorElement.style.display = 'block';
    errorElement.innerHTML = `
        <p class="text-danger">Error loading accounts</p>
        <p>${error.message}</p>
        <button class="btn btn-primary mt-2" onclick="loadAccounts()">
            Try Again
        </button>
    `;
    document.getElementById('pagination').innerHTML = '';
}

function updatePagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>`;
    pagination.appendChild(prevLi);

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        addPageButton(pagination, 1);
        if (startPage > 2) {
            addEllipsis(pagination);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        addPageButton(pagination, i, i === currentPage);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            addEllipsis(pagination);
        }
        addPageButton(pagination, totalPages);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>`;
    pagination.appendChild(nextLi);
}

function addPageButton(pagination, pageNumber, isActive = false) {
    const li = document.createElement('li');
    li.className = `page-item ${isActive ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${pageNumber})">${pageNumber}</a>`;
    pagination.appendChild(li);
}

function addEllipsis(pagination) {
    const li = document.createElement('li');
    li.className = 'page-item disabled';
    li.innerHTML = `<span class="page-link">...</span>`;
    pagination.appendChild(li);
}

function changePage(page) {
    if (page < 1 || page > Math.ceil(totalAccounts / itemsPerPage)) return;
    currentPage = page;
    loadAccounts(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyFilters() {
    console.log('Applying filters');

    filterSettings = {
        accountType: document.getElementById('filterType').value || '',
        balanceMin: document.getElementById('filterBalanceMin').value ?
            parseFloat(document.getElementById('filterBalanceMin').value) : null,
        balanceMax: document.getElementById('filterBalanceMax').value ?
            parseFloat(document.getElementById('filterBalanceMax').value) : null
    };

    currentPage = 1;
    loadAccounts();
}

function resetFilters() {
    console.log('Resetting filters');

    document.getElementById('filterType').value = '';
    document.getElementById('filterBalanceMin').value = '';
    document.getElementById('filterBalanceMax').value = '';

    filterSettings = {
        accountType: '',
        balanceMin: null,
        balanceMax: null
    };

    currentPage = 1;
    loadAccounts();
}

function showNotification(message, type = 'info') {
    const notificationArea = document.getElementById('notificationArea');

    // Clear any existing notifications
    notificationArea.innerHTML = '';

    const toast = document.createElement('div');
    toast.className = `toast show alert alert-${type}`;
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';

    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    notificationArea.appendChild(toast);

    // Auto-hide after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode === notificationArea) {
                notificationArea.removeChild(toast);
            }
        }, 300);
    }, type === 'danger' ? 10000 : 5000);
}

// Global functions
window.viewAccount = function (id) {
    console.log('Viewing account:', id);
    window.location.href = `../html/AccountDetails.html?id=${id}`;
};

window.deleteAccount = async function (id) {
    if (!confirm('Are you sure you want to delete this account?\nAll associated transactions and data will be permanently lost.')) {
        return;
    }

    try {
        console.log('Attempting to delete account:', id);
        const button = document.querySelector(`button[onclick="deleteAccount(${id})"]`);

        if (button) {
            button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
            button.disabled = true;
        }

        const response = await fetch(`${ACCOUNTS_API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                // Include authorization header if needed
                // 'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        const responseData = await response.json().catch(() => null);

        if (!response.ok) {
            console.error('Delete failed with status:', response.status);
            console.error('Response data:', responseData);

            let errorMessage = 'Failed to delete account';
            if (responseData?.message) {
                errorMessage += `: ${responseData.message}`;
            } else if (response.status === 404) {
                errorMessage = 'Account not found';
            } else if (response.status === 403) {
                errorMessage = 'You are not authorized to delete this account';
            } else if (response.status === 400) {
                errorMessage = 'Account cannot be deleted (may have existing transactions)';
            }

            throw new Error(errorMessage);
        }

        showNotification('Account deleted successfully', 'success');

        // Refresh the accounts list after a short delay
        setTimeout(() => {
            loadAccounts(currentPage);
        }, 1000);

    } catch (error) {
        console.error('Error deleting account:', error);

        let userMessage = error.message;
        if (error.message.includes('Failed to fetch')) {
            userMessage = 'Network error - could not connect to server';
        }

        showNotification(`Delete failed: ${userMessage}`, 'danger');
    } finally {
        const buttons = document.querySelectorAll(`button[onclick="deleteAccount(${id})"]`);
        buttons.forEach(button => {
            button.innerHTML = '<i class="bi bi-trash"></i> Delete';
            button.disabled = false;
        });
    }
};