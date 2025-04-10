// API Configuration
const FINANCE_TOOLS_API_URL = 'https://localhost:7256/api/personalfinancetools';
const ACCOUNTS_API_URL = 'https://localhost:7256/api/accounts';

// State
let currentPage = 1;
const itemsPerPage = 10;
let totalFinanceTools = 0;
let filterSettings = {
    accountId: null,
    status: ''
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Initializing finance tools page');

    // Check for new tool notification
    checkForNotification();

    // Load accounts for filter dropdown
    loadAccountsForDropdowns();

    // Set up event listeners
    setupEventListeners();

    // Load initial finance tools
    loadFinanceTools();
});

function checkForNotification() {
    const financeToolCreated = sessionStorage.getItem('financeToolCreated');
    if (financeToolCreated) {
        const message = sessionStorage.getItem('financeToolMessage') || 'Budget tool created successfully';
        showNotification(message, 'success');

        // Clear the notification
        sessionStorage.removeItem('financeToolCreated');
        sessionStorage.removeItem('financeToolMessage');
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
        loadFinanceTools(currentPage);
    });

    // Filter buttons
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
}

async function loadFinanceTools(page = 1) {
    try {
        console.log(`Loading finance tools page ${page}`);
        showLoadingState(true);
        clearTable();

        // Build API URL with filters
        let url = `${FINANCE_TOOLS_API_URL}?page=${page}&size=${itemsPerPage}`;

        if (filterSettings.accountId) {
            url += `&accountId=${filterSettings.accountId}`;
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

        totalFinanceTools = data.totalItems || 0;

        // Apply status filter client-side if needed
        let filteredItems = data.items;
        if (filterSettings.status) {
            filteredItems = data.items.filter(item => {
                const remaining = item.budget - item.expenses;
                if (filterSettings.status === 'positive') {
                    return remaining >= 0;
                } else {
                    return remaining < 0;
                }
            });

            if (filteredItems.length === 0) {
                showEmptyState();
                return;
            }
        }

        renderFinanceTools(filteredItems);
        updatePagination(page, Math.ceil(totalFinanceTools / itemsPerPage));

    } catch (error) {
        console.error('Error loading finance tools:', error);
        showErrorState(error);
    } finally {
        showLoadingState(false);
    }
}

function showLoadingState(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
}

function clearTable() {
    document.getElementById('financeToolsTableBody').innerHTML = '';
    document.getElementById('noFinanceTools').style.display = 'none';
}

function renderFinanceTools(tools) {
    const tableBody = document.getElementById('financeToolsTableBody');

    tools.forEach(tool => {
        const row = document.createElement('tr');

        // Calculate remaining budget
        const remaining = tool.budget - tool.expenses;
        const remainingClass = remaining >= 0 ? 'positive-budget' : 'negative-budget';
        const remainingSign = remaining >= 0 ? '' : '-';

        // Calculate progress percentage
        const progressPercentage = Math.min(100, (tool.expenses / tool.budget) * 100);
        const progressClass = progressPercentage >= 100 ? 'bg-danger' :
            progressPercentage >= 75 ? 'bg-warning' : 'bg-success';

        row.innerHTML = `
            <td>${tool.accountNumber || 'N/A'}</td>
            <td>$${formatCurrency(tool.budget)}</td>
            <td>$${formatCurrency(tool.expenses)}</td>
            <td class="${remainingClass}">${remainingSign}$${formatCurrency(Math.abs(remaining))}</td>
            <td>
                <div class="progress">
                    <div class="progress-bar ${progressClass}" 
                        role="progressbar" 
                        style="width: ${progressPercentage}%" 
                        aria-valuenow="${progressPercentage}" 
                        aria-valuemin="0" 
                        aria-valuemax="100">
                        ${Math.round(progressPercentage)}%
                    </div>
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2" 
                    onclick="viewFinanceTool(${tool.personalId})">
                    <i class="bi bi-eye"></i> View
                </button>
                <button class="btn btn-sm btn-outline-danger" 
                    onclick="deleteFinanceTool(${tool.personalId})">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2);
}

function showEmptyState() {
    document.getElementById('noFinanceTools').style.display = 'block';
    document.getElementById('pagination').innerHTML = '';
}

function showErrorState(error) {
    const errorElement = document.getElementById('noFinanceTools');
    errorElement.style.display = 'block';
    errorElement.innerHTML = `
        <p class="text-danger">Error loading budget tools</p>
        <p>${error.message}</p>
        <button class="btn btn-primary mt-2" onclick="loadFinanceTools()">
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
    if (page < 1 || page > Math.ceil(totalFinanceTools / itemsPerPage)) return;
    currentPage = page;
    loadFinanceTools(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyFilters() {
    console.log('Applying filters');

    filterSettings = {
        accountId: document.getElementById('filterAccount').value || null,
        status: document.getElementById('filterStatus').value || ''
    };

    currentPage = 1;
    loadFinanceTools();
}

function resetFilters() {
    console.log('Resetting filters');

    document.getElementById('filterAccount').value = '';
    document.getElementById('filterStatus').value = '';

    filterSettings = {
        accountId: null,
        status: ''
    };

    currentPage = 1;
    loadFinanceTools();
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
window.viewFinanceTool = function (id) {
    console.log('Viewing finance tool:', id);
    window.location.href = `../html/PersonalFinanceTools/ViewFinanceTool.html?id=${id}`;
};

window.deleteFinanceTool = async function (id) {
    if (!confirm('Are you sure you want to delete this budget tool?\nThis action cannot be undone.')) {
        return;
    }

    try {
        console.log('Deleting finance tool:', id);
        const button = document.querySelector(`button[onclick="deleteFinanceTool(${id})"]`);

        if (button) {
            button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
            button.disabled = true;
        }

        const response = await fetch(`${FINANCE_TOOLS_API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete budget tool');
        }

        const result = await response.json();
        showNotification(`Budget tool deleted successfully.`, 'success');

        // Re-load current page
        loadFinanceTools(currentPage);

    } catch (error) {
        console.error('Error deleting budget tool:', error);
        showNotification(`Delete failed: ${error.message}`, 'danger');
    } finally {
        const buttons = document.querySelectorAll(`button[onclick="deleteFinanceTool(${id})"]`);
        buttons.forEach(button => {
            button.innerHTML = '<i class="bi bi-trash"></i> Delete';
            button.disabled = false;
        });
    }
};

// Make functions available globally
window.changePage = changePage;
window.viewFinanceTool = viewFinanceTool;
window.deleteFinanceTool = deleteFinanceTool;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;