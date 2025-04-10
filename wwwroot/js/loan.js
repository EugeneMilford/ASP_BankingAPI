// API Configuration
const LOANS_API_URL = 'https://localhost:7256/api/loans';
const ACCOUNTS_API_URL = 'https://localhost:7256/api/accounts';

// State
let currentPage = 1;
const itemsPerPage = 10;
let totalLoans = 0;
let filterSettings = {
    accountId: null,
    status: ''
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Check if a new loan was created
    checkForNotification();

    // Load accounts for filter dropdown
    loadAccountsForDropdowns();

    // Setup event listeners
    setupEventListeners();

    // Load initial loans
    loadLoans();
});

function checkForNotification() {
    const loanCreated = sessionStorage.getItem('loanCreated');
    if (loanCreated) {
        const message = sessionStorage.getItem('loanMessage') || 'Loan created successfully';
        showNotification(message, 'success');

        // Get the new loan data
        const newLoanData = JSON.parse(sessionStorage.getItem('newLoanData'));

        // Clear the notification data
        sessionStorage.removeItem('loanCreated');
        sessionStorage.removeItem('loanMessage');
        sessionStorage.removeItem('newLoanData');

        // If we have loan data, prepend it to the table
        if (newLoanData) {
            prependNewLoan(newLoanData);
        }
    }
}

function prependNewLoan(loanData) {
    const tableBody = document.getElementById('loansTableBody');
    if (!tableBody) return;

    // Calculate progress
    const remainingPercent = (loanData.remainingAmount / loanData.loanAmount) * 100;
    const progressClass = remainingPercent > 80 ? 'bg-danger' :
        remainingPercent > 50 ? 'bg-warning' : 'bg-success';

    // Create new row
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${loanData.accountNumber || 'N/A'}</td>
        <td>$${formatCurrency(loanData.loanAmount)}</td>
        <td>${loanData.interestRate}%</td>
        <td>$${formatCurrency(loanData.monthlyRepayment)}</td>
        <td>
            $${formatCurrency(loanData.remainingAmount)}
            <div class="progress">
                <div class="progress-bar ${progressClass}"
                     role="progressbar"
                     style="width: ${remainingPercent}%"
                     aria-valuenow="${remainingPercent}"
                     aria-valuemin="0"
                     aria-valuemax="100">
                </div>
            </div>
        </td>
        <td class="paid-status ${loanData.isLoanPaidOff ? 'paid-true' : 'paid-false'}">
            ${loanData.isLoanPaidOff ? 'Paid Off' : 'Active'}
        </td>
        <td>
            <div class="dropdown">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false">
                    Actions
                </button>
                <ul class="dropdown-menu">
                    <li>
                        <a class="dropdown-item" href="#"
                           onclick="viewLoan(${loanData.loanId})">
                            <i class="bi bi-eye"></i> View
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#"
                           onclick="showPaymentModal(${loanData.loanId})">
                            <i class="bi bi-cash"></i> Make Payment
                        </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item text-danger" href="#"
                           onclick="deleteLoan(${loanData.loanId})">
                            <i class="bi bi-trash"></i> Delete
                        </a>
                    </li>
                </ul>
            </div>
        </td>
    `;

    // Prepend to table (or append if empty)
    if (tableBody.children.length > 0) {
        tableBody.insertBefore(row, tableBody.firstChild);
    } else {
        tableBody.appendChild(row);
    }

    // Hide "no loans" message if shown
    document.getElementById('noLoans').style.display = 'none';

    // Update total loans count
    totalLoans++;
}

function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshButton').addEventListener('click', function () {
        loadLoans(currentPage);
    });

    // Filter buttons
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
}

// Load accounts for dropdowns
async function loadAccountsForDropdowns() {
    try {
        const response = await fetch(ACCOUNTS_API_URL);
        if (!response.ok) {
            throw new Error(`Failed to load accounts: ${response.status}`);
        }

        const accounts = await response.json();
        const accountSelect = document.getElementById('filterAccount');

        // Clear existing options except the first one
        accountSelect.innerHTML = '<option value="">All Accounts</option>';

        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.accountNumber} (${account.accountType})`;
            accountSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading accounts:', error);
        showNotification(`Failed to load accounts: ${error.message}`, 'danger');
    }
}

// Load loans from API
async function loadLoans(page = 1) {
    try {
        showLoadingState(true);
        clearTable();

        // Build query string with filters
        let url = `${LOANS_API_URL}?page=${page}&size=${itemsPerPage}`;

        if (filterSettings.accountId) {
            url += `&accountId=${filterSettings.accountId}`;
        }

        if (filterSettings.status === 'active') {
            url += `&isPaidOff=false`;
        } else if (filterSettings.status === 'paid') {
            url += `&isPaidOff=true`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            showEmptyState();
            return;
        }

        totalLoans = data.totalItems || 0;
        renderLoans(data.items);
        updatePagination(page, Math.ceil(totalLoans / itemsPerPage));

    } catch (error) {
        console.error('Error loading loans:', error);
        showErrorState(error);
    } finally {
        showLoadingState(false);
    }
}

function showLoadingState(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
}

function clearTable() {
    document.getElementById('loansTableBody').innerHTML = '';
    document.getElementById('noLoans').style.display = 'none';
}

function renderLoans(loans) {
    const tableBody = document.getElementById('loansTableBody');

    loans.forEach(loan => {
        const remainingPercent = (loan.remainingAmount / loan.loanAmount) * 100;
        const progressClass = remainingPercent > 80 ? 'bg-danger' :
            remainingPercent > 50 ? 'bg-warning' : 'bg-success';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${loan.accountNumber || 'N/A'}</td>
            <td>$${formatCurrency(loan.loanAmount)}</td>
            <td>${loan.interestRate}%</td>
            <td>$${formatCurrency(loan.monthlyRepayment)}</td>
            <td>
                $${formatCurrency(loan.remainingAmount)}
                <div class="progress">
                    <div class="progress-bar ${progressClass}"
                         role="progressbar"
                         style="width: ${remainingPercent}%"
                         aria-valuenow="${remainingPercent}"
                         aria-valuemin="0"
                         aria-valuemax="100">
                    </div>
                </div>
            </td>
            <td class="paid-status ${loan.isLoanPaidOff ? 'paid-true' : 'paid-false'}">
                ${loan.isLoanPaidOff ? 'Paid Off' : 'Active'}
            </td>
            <td>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false">
                        Actions
                    </button>
                    <ul class="dropdown-menu">
                        <li>
                            <a class="dropdown-item" href="#"
                               onclick="viewLoan(${loan.loanId})">
                                <i class="bi bi-eye"></i> View
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item" href="#"
                               onclick="showPaymentModal(${loan.loanId})">
                                <i class="bi bi-cash"></i> Make Payment
                            </a>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li>
                            <a class="dropdown-item text-danger" href="#"
                               onclick="deleteLoan(${loan.loanId})">
                                <i class="bi bi-trash"></i> Delete
                            </a>
                        </li>
                    </ul>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2);
}

function showEmptyState() {
    document.getElementById('noLoans').style.display = 'block';
    document.getElementById('pagination').innerHTML = '';
}

function showErrorState(error) {
    const errorElement = document.getElementById('noLoans');
    errorElement.style.display = 'block';
    errorElement.innerHTML = `
        <p class="text-danger">Error loading loans</p>
        <p>${error.message}</p>
        <button class="btn btn-primary mt-2" onclick="loadLoans()">
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

// Change page
function changePage(page) {
    if (page < 1 || page > Math.ceil(totalLoans / itemsPerPage)) return;
    currentPage = page;
    loadLoans(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Apply filters
function applyFilters() {
    filterSettings = {
        accountId: document.getElementById('filterAccount').value || null,
        status: document.getElementById('filterStatus').value || ''
    };

    currentPage = 1;
    loadLoans();
}

// Reset filters
function resetFilters() {
    document.getElementById('filterAccount').value = '';
    document.getElementById('filterStatus').value = '';

    filterSettings = {
        accountId: null,
        status: ''
    };

    currentPage = 1;
    loadLoans();
}

// Show notification toast
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
    const hideDelay = type === 'danger' ? 10000 : 5000;
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode === notificationArea) {
                notificationArea.removeChild(toast);
            }
        }, 300);
    }, hideDelay);
}

// View loan details
function viewLoan(id) {
    window.location.href = `Loans/LoanDetails.html?id=${id}`;
}

// Show payment modal
function showPaymentModal(id) {
    // Implement payment modal
    alert('Payment functionality will be implemented here for loan: ' + id);
}

// Delete loan
async function deleteLoan(id) {
    if (!confirm('Are you sure you want to delete this loan?\nThis action cannot be undone.')) {
        return;
    }

    try {
        const button = document.querySelector(`button[onclick="deleteLoan(${id})"]`);
        if (button) {
            button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
            button.disabled = true;
        }

        const response = await fetch(`${LOANS_API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete loan');
        }

        showNotification('Loan deleted successfully', 'success');
        loadLoans(currentPage);

    } catch (error) {
        console.error('Error deleting loan:', error);
        showNotification(`Delete failed: ${error.message}`, 'danger');
    } finally {
        const buttons = document.querySelectorAll(`button[onclick="deleteLoan(${id})"]`);
        buttons.forEach(button => {
            button.innerHTML = '<i class="bi bi-trash"></i> Delete';
            button.disabled = false;
        });
    }
}

// Make functions available globally
window.changePage = changePage;
window.viewLoan = viewLoan;
window.showPaymentModal = showPaymentModal;
window.deleteLoan = deleteLoan;