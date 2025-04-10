// API Configuration
const INVESTMENTS_API_URL = 'https://localhost:7256/api/investments';
const ACCOUNTS_API_URL = 'https://localhost:7256/api/accounts';

// State
let currentPage = 1;
const itemsPerPage = 10;
let totalInvestments = 0;
let filterSettings = {
    accountId: null,
    investmentType: '',
    dateFrom: null,
    dateTo: null
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Initializing investments page');

    // Check for new investment notification
    checkForNotification();

    // Load accounts for filter dropdown
    loadAccountsForDropdowns();

    // Set up event listeners
    setupEventListeners();

    // Load initial investments
    loadInvestments();
});

function checkForNotification() {
    const investmentCreated = sessionStorage.getItem('investmentCreated');
    if (investmentCreated) {
        const message = sessionStorage.getItem('investmentMessage') || 'Investment created successfully';
        showNotification(message, 'success');

        // Clear the notification
        sessionStorage.removeItem('investmentCreated');
        sessionStorage.removeItem('investmentMessage');
    }
}

async function loadAccountsForDropdowns() {
    try {
        console.log('Loading accounts for dropdown');
        const response = await fetch(ACCOUNTS_API_URL);

        if (!response.ok) {
            throw new Error(`Failed to load accounts: ${response.status}`);
        }

        const accounts = await response.json();
        const accountSelect = document.getElementById('filterAccount');

        // Clear existing options
        accountSelect.innerHTML = '<option value="">All Accounts</option>';

        // Add new options
        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.accountNumber} (${account.accountType})`;
            accountSelect.appendChild(option);
        });

        console.log('Accounts loaded successfully');
    } catch (error) {
        console.error('Error loading accounts:', error);
        showNotification('Failed to load accounts', 'danger');
    }
}

function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshButton').addEventListener('click', function () {
        console.log('Refresh button clicked');
        loadInvestments(currentPage);
    });

    // Filter buttons
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
}

async function loadInvestments(page = 1) {
    try {
        console.log(`Loading investments page ${page}`);
        showLoadingState(true);
        clearTable();

        // Build API URL with filters
        let url = `${INVESTMENTS_API_URL}?page=${page}&size=${itemsPerPage}`;

        if (filterSettings.accountId) {
            url += `&accountId=${filterSettings.accountId}`;
        }

        if (filterSettings.investmentType) {
            url += `&investmentType=${encodeURIComponent(filterSettings.investmentType)}`;
        }

        if (filterSettings.dateFrom) {
            url += `&dateFrom=${filterSettings.dateFrom}`;
        }

        if (filterSettings.dateTo) {
            url += `&dateTo=${filterSettings.dateTo}`;
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

        totalInvestments = data.totalItems || 0;
        renderInvestments(data.items);
        updatePagination(page, Math.ceil(totalInvestments / itemsPerPage));

    } catch (error) {
        console.error('Error loading investments:', error);
        showErrorState(error);
    } finally {
        showLoadingState(false);
    }
}

function showLoadingState(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
}

function clearTable() {
    document.getElementById('investmentsTableBody').innerHTML = '';
    document.getElementById('noInvestments').style.display = 'none';
}

function renderInvestments(investments) {
    const tableBody = document.getElementById('investmentsTableBody');

    investments.forEach(investment => {
        const row = document.createElement('tr');

        // Calculate returns
        const returns = investment.currentValue - investment.investmentAmount;
        const returnsClass = returns >= 0 ? 'positive-return' : 'negative-return';
        const returnsSign = returns >= 0 ? '+' : '';

        // Format dates
        const investmentDate = formatDate(investment.investmentDate);

        row.innerHTML = `
            <td>${investment.investmentId}</td>
            <td>${investment.accountNumber || 'N/A'}</td>
            <td><span class="badge bg-secondary type-badge">${investment.investmentType}</span></td>
            <td>$${formatCurrency(investment.investmentAmount)}</td>
            <td>$${formatCurrency(investment.currentValue)}</td>
            <td class="${returnsClass}">${returnsSign}$${formatCurrency(Math.abs(returns))}</td>
            <td>${investmentDate}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2" 
                    onclick="viewInvestment(${investment.investmentId})">
                    <i class="bi bi-eye"></i> View
                </button>
                <button class="btn btn-sm btn-outline-danger" 
                    onclick="deleteInvestment(${investment.investmentId})">
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
    document.getElementById('noInvestments').style.display = 'block';
    document.getElementById('pagination').innerHTML = '';
}

function showErrorState(error) {
    const errorElement = document.getElementById('noInvestments');
    errorElement.style.display = 'block';
    errorElement.innerHTML = `
        <p class="text-danger">Error loading investments</p>
        <p>${error.message}</p>
        <button class="btn btn-primary mt-2" onclick="loadInvestments()">
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
    if (page < 1 || page > Math.ceil(totalInvestments / itemsPerPage)) return;
    currentPage = page;
    loadInvestments(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyFilters() {
    console.log('Applying filters');

    filterSettings = {
        accountId: document.getElementById('filterAccount').value || null,
        investmentType: document.getElementById('filterType').value || '',
        dateFrom: document.getElementById('filterDateFrom').value || null,
        dateTo: document.getElementById('filterDateTo').value || null
    };

    currentPage = 1;
    loadInvestments();
}

function resetFilters() {
    console.log('Resetting filters');

    document.getElementById('filterAccount').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';

    filterSettings = {
        accountId: null,
        investmentType: '',
        dateFrom: null,
        dateTo: null
    };

    currentPage = 1;
    loadInvestments();
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
window.viewInvestment = function (id) {
    console.log('Viewing investment:', id);
    window.location.href = `../html/Investments/ViewInvestment.html?id=${id}`;
};

window.deleteInvestment = async function (id) {
    if (!confirm('Are you sure you want to delete this investment?\nThis action cannot be undone.')) {
        return;
    }

    try {
        console.log('Deleting investment:', id);
        const button = document.querySelector(`button[onclick="deleteInvestment(${id})"]`);

        if (button) {
            button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
            button.disabled = true;
        }

        const response = await fetch(`${INVESTMENTS_API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete investment');
        }

        const result = await response.json();
        showNotification(`Investment deleted successfully.`, 'success');

        // Re-load current page
        loadInvestments(currentPage);

    } catch (error) {
        console.error('Error deleting investment:', error);
        showNotification(`Delete failed: ${error.message}`, 'danger');
    } finally {
        const buttons = document.querySelectorAll(`button[onclick="deleteInvestment(${id})"]`);
        buttons.forEach(button => {
            button.innerHTML = '<i class="bi bi-trash"></i> Delete';
            button.disabled = false;
        });
    }
};