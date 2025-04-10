// API Configuration
const BILL_PAYMENTS_API_URL = 'https://localhost:7256/api/billpayments';
const ACCOUNTS_API_URL = 'https://localhost:7256/api/accounts';

// State
let currentPage = 1;
const itemsPerPage = 10;
let totalBillPayments = 0;
let filterSettings = {
    accountId: null,
    biller: '',
    dateFrom: null,
    dateTo: null
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Check if a new bill payment was created
    const billPaymentCreated = sessionStorage.getItem('billPaymentCreated');
    if (billPaymentCreated) {
        const message = sessionStorage.getItem('billPaymentMessage') || 'Bill payment created successfully';
        showNotification(message, 'success');

        // Clear the sessionStorage flag
        sessionStorage.removeItem('billPaymentCreated');
        sessionStorage.removeItem('billPaymentMessage');
    }

    // Load accounts for filter dropdown
    loadAccountsForDropdowns();

    // Setup event listeners
    document.getElementById('refreshButton').addEventListener('click', function () {
        loadBillPayments(currentPage);
    });

    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);

    // Load initial bill payments
    loadBillPayments();
});

// Load accounts for dropdowns
async function loadAccountsForDropdowns() {
    try {
        const response = await fetch(ACCOUNTS_API_URL);
        if (!response.ok) throw new Error('Failed to load accounts');

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
        showNotification(`Failed to load accounts: ${error.message}`, 'danger');
    }
}

// Load bill payments from API
async function loadBillPayments(page = 1) {
    try {
        // Show loading spinner
        document.getElementById('loadingSpinner').style.display = 'block';
        document.getElementById('billPaymentsTableBody').innerHTML = '';
        document.getElementById('noBillPayments').style.display = 'none';

        // Build query string with filters
        let url = `${BILL_PAYMENTS_API_URL}?page=${page}&size=${itemsPerPage}`;

        if (filterSettings.accountId) {
            url += `&accountId=${filterSettings.accountId}`;
        }

        if (filterSettings.biller) {
            url += `&biller=${filterSettings.biller}`;
        }

        if (filterSettings.dateFrom) {
            url += `&dateFrom=${filterSettings.dateFrom}`;
        }

        if (filterSettings.dateTo) {
            url += `&dateTo=${filterSettings.dateTo}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        totalBillPayments = data.totalItems || 0;

        // Hide loading spinner
        document.getElementById('loadingSpinner').style.display = 'none';

        if (totalBillPayments === 0) {
            document.getElementById('noBillPayments').style.display = 'block';
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        // Populate table
        const tableBody = document.getElementById('billPaymentsTableBody');
        const billPayments = data.items || [];

        billPayments.forEach(bill => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${new Date(bill.paymentDate).toLocaleDateString()}</td>
                <td>${bill.accountNumber || 'N/A'}</td>
                <td>${bill.biller || 'N/A'}</td>
                <td>${bill.referenceNumber || 'N/A'}</td>
                <td class="text-danger">-$${bill.amount.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="viewBillPayment(${bill.billId})">
                        <i class="bi bi-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteBillPayment(${bill.billId})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        // Update pagination
        updatePagination(page, Math.ceil(totalBillPayments / itemsPerPage));

    } catch (error) {
        console.error('Error loading bill payments:', error);
        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('noBillPayments').style.display = 'block';
        document.getElementById('noBillPayments').innerHTML = `
                <p>Error loading bill payments: ${error.message}</p>
                <button class="btn btn-primary mt-2" onclick="loadBillPayments()">Try Again</button>
            `;
        document.getElementById('pagination').innerHTML = '';
    }
}

// Update pagination controls
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
        const li = document.createElement('li');
        li.className = 'page-item';
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(1)">1</a>`;
        pagination.appendChild(li);

        if (startPage > 2) {
            const liDots = document.createElement('li');
            liDots.className = 'page-item disabled';
            liDots.innerHTML = `<span class="page-link">...</span>`;
            pagination.appendChild(liDots);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
        pagination.appendChild(li);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const liDots = document.createElement('li');
            liDots.className = 'page-item disabled';
            liDots.innerHTML = `<span class="page-link">...</span>`;
            pagination.appendChild(liDots);
        }

        const li = document.createElement('li');
        li.className = 'page-item';
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${totalPages})">${totalPages}</a>`;
        pagination.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>`;
    pagination.appendChild(nextLi);
}

// Change page
function changePage(page) {
    if (page < 1 || page > Math.ceil(totalBillPayments / itemsPerPage)) return;
    currentPage = page;
    loadBillPayments(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Apply filters
function applyFilters() {
    const accountSelect = document.getElementById('filterAccount');
    const billerInput = document.getElementById('filterBiller');
    const dateFrom = document.getElementById('filterDateFrom');
    const dateTo = document.getElementById('filterDateTo');

    filterSettings = {
        accountId: accountSelect.value ? parseInt(accountSelect.value) : null,
        biller: billerInput.value,
        dateFrom: dateFrom.value || null,
        dateTo: dateTo.value || null
    };

    currentPage = 1;
    loadBillPayments();
}

// Reset filters
function resetFilters() {
    document.getElementById('filterAccount').value = '';
    document.getElementById('filterBiller').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';

    filterSettings = {
        accountId: null,
        biller: '',
        dateFrom: null,
        dateTo: null
    };

    currentPage = 1;
    loadBillPayments();
}

// View bill payment details
function viewBillPayment(id) {
    window.location.href = `../html/Bills/ViewBill.html?id=${id}`;
}

// Delete bill payment
async function deleteBillPayment(id) {
    if (!confirm('Are you sure you want to delete this bill payment? This action cannot be undone.')) {
        return;
    }

    try {
        // Show loading state
        const deleteButton = document.querySelector(`button[onclick="deleteBillPayment(${id})"]`);
        if (deleteButton) {
            deleteButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
            deleteButton.disabled = true;
        }

        const response = await fetch(`${BILL_PAYMENTS_API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || 'Failed to delete bill payment');
        }

        const result = await response.json();

        showNotification(`Bill payment #${id} deleted successfully. New balance: $${result.newBalance.toFixed(2)}`, 'success');

        // Reload bill payments but keep current page and filters
        loadBillPayments(currentPage);

    } catch (error) {
        console.error('Error deleting bill payment:', error);
        showNotification(`Failed to delete bill payment: ${error.message}`, 'danger');
    } finally {
        // Reset button state
        const deleteButton = document.querySelector(`button[onclick="deleteBillPayment(${id})"]`);
        if (deleteButton) {
            deleteButton.innerHTML = '<i class="bi bi-trash"></i> Delete';
            deleteButton.disabled = false;
        }
    }
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

// Make functions available globally
window.changePage = changePage;
window.viewBillPayment = viewBillPayment;
window.deleteBillPayment = deleteBillPayment;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;