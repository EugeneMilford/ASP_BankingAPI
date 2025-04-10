// API URL constants
const TICKETS_API_URL = '/api/tickets';
const ACCOUNTS_API_URL = '/api/accounts';

let currentPage = 1;
const itemsPerPage = 10;
let totalTickets = 0;
let filterSettings = { accountId: null, status: '' };

document.addEventListener('DOMContentLoaded', function () {
    clearNotificationData();
    loadAccountsForDropdowns();
    setupEventListeners();
    loadTickets();
    checkForNewTicket();
});

function setupEventListeners() {
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    document.getElementById('refreshButton').addEventListener('click', () => loadTickets(currentPage));
}

async function loadAccountsForDropdowns() {
    try {
        const response = await fetch(ACCOUNTS_API_URL);
        if (!response.ok) throw new Error('Failed to load accounts');

        const accounts = await response.json();
        const filterAccountSelect = document.getElementById('filterAccount');

        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.accountNumber} (${account.accountType})`;
            filterAccountSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading accounts:', error);
    }
}

function clearNotificationData() {
    sessionStorage.removeItem('newTicket');
    sessionStorage.removeItem('notification');
}

function checkForNewTicket() {
    const newTicket = sessionStorage.getItem('newTicket');
    if (newTicket) {
        const notification = sessionStorage.getItem('notification');
        showNotification(notification || 'Ticket created successfully', 'success');
        prependTicket(JSON.parse(newTicket));
        clearNotificationData();
    }
}

function prependTicket(ticket) {
    const tableBody = document.getElementById('ticketsTableBody');
    if (!tableBody) return;

    const row = document.createElement('tr');
    row.innerHTML = generateTicketRowHtml(ticket);

    if (tableBody.children.length > 0) {
        tableBody.insertBefore(row, tableBody.firstChild);
    } else {
        tableBody.appendChild(row);
    }

    const noTicketsElement = document.getElementById('noTickets');
    if (noTicketsElement) {
        noTicketsElement.style.display = 'none';
    }

    totalTickets++;
    updatePagination(currentPage, Math.ceil(totalTickets / itemsPerPage));
}

function generateTicketRowHtml(ticket) {
    return `
        <td>${ticket.accountNumber || 'N/A'}</td>
        <td>${ticket.issueDescription?.substring(0, 50) || ''}${ticket.issueDescription?.length > 50 ? '...' : ''}</td>
        <td>${new Date(ticket.createdDate).toLocaleString()}</td>
        <td class="status-badge ${ticket.isResolved ? 'bg-success' : 'bg-warning'}">
            ${ticket.isResolved ? 'Resolved' : 'Open'}
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
                    <li><a class="dropdown-item" href="ViewTicket.html?id=${ticket.supportId}"><i class="bi bi-eye"></i> View</a></li>
                    ${!ticket.isResolved ? `
                    <li><a class="dropdown-item" href="#" onclick="showResolveModal(${ticket.supportId})"><i class="bi bi-check-circle"></i> Resolve</a></li>
                    ` : ''}
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="deleteTicket(${ticket.supportId})"><i class="bi bi-trash"></i> Delete</a></li>
                </ul>
            </div>
        </td>
    `;
}

async function loadTickets(page = 1) {
    try {
        showLoadingState(true);
        clearTable();

        let url = `${TICKETS_API_URL}?page=${page}&size=${itemsPerPage}`;
        if (filterSettings.accountId) url += `&accountId=${filterSettings.accountId}`;
        if (filterSettings.status === 'open') url += `&isResolved=false`;
        else if (filterSettings.status === 'resolved') url += `&isResolved=true`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();
        console.log('Tickets data received:', data); // Debug log

        if (!data.items || data.items.length === 0) {
            showEmptyState();
            return;
        }

        totalTickets = data.totalItems;
        renderTickets(data.items);
        updatePagination(page, Math.ceil(totalTickets / itemsPerPage));

    } catch (error) {
        console.error('Error loading tickets:', error);
        showErrorState(error);
    } finally {
        showLoadingState(false);
    }
}

function renderTickets(tickets) {
    const tableBody = document.getElementById('ticketsTableBody');
    if (!tableBody) {
        console.error('Could not find tickets table body element');
        return;
    }

    tableBody.innerHTML = '';

    if (tickets.length === 0) {
        showEmptyState();
        return;
    }

    tickets.forEach(ticket => {
        const row = document.createElement('tr');
        row.innerHTML = generateTicketRowHtml(ticket);
        tableBody.appendChild(row);
    });

    const noTicketsElement = document.getElementById('noTickets');
    if (noTicketsElement) {
        noTicketsElement.style.display = 'none';
    }
}

function showLoadingState(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = show ? 'block' : 'none';
}

function clearTable() {
    const tableBody = document.getElementById('ticketsTableBody');
    if (tableBody) tableBody.innerHTML = '';

    const noTickets = document.getElementById('noTickets');
    if (noTickets) noTickets.style.display = 'none';
}

function showEmptyState() {
    const noTickets = document.getElementById('noTickets');
    if (noTickets) {
        noTickets.style.display = 'block';
        noTickets.innerHTML = `
            <p>No support tickets found.</p>
            <a href="CreateTicket.html" class="btn btn-primary mt-2">Create your first support ticket</a>
        `;
    }

    const pagination = document.getElementById('pagination');
    if (pagination) pagination.innerHTML = '';
}

function showErrorState(error) {
    const noTickets = document.getElementById('noTickets');
    if (noTickets) {
        noTickets.style.display = 'block';
        noTickets.innerHTML = `
            <p class="text-danger">Error loading tickets</p>
            <p>${error.message}</p>
            <button class="btn btn-primary mt-2" onclick="loadTickets()">Try Again</button>
        `;
    }

    const pagination = document.getElementById('pagination');
    if (pagination) pagination.innerHTML = '';
}

function applyFilters() {
    filterSettings = {
        accountId: document.getElementById('filterAccount').value || null,
        status: document.getElementById('filterStatus').value || ''
    };
    currentPage = 1;
    loadTickets();
}

function resetFilters() {
    document.getElementById('filterAccount').value = '';
    document.getElementById('filterStatus').value = '';
    filterSettings = { accountId: null, status: '' };
    currentPage = 1;
    loadTickets();
}

function showNotification(message, type = 'info') {
    const notificationArea = document.getElementById('notificationArea');
    if (!notificationArea) return;

    notificationArea.innerHTML = '';

    const toast = document.createElement('div');
    toast.className = `toast show alert alert-${type}`;
    toast.role = 'alert';
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">Notification</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">${message}</div>
    `;

    notificationArea.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => notificationArea.removeChild(toast), 300);
    }, type === 'danger' ? 10000 : 5000);
}

function viewTicket(id) {
    window.location.href = `ViewTicket.html?id=${id}`;
}

function showResolveModal(id) {
    const resolveModal = document.getElementById('resolveModal');
    if (!resolveModal) return;

    resolveModal.dataset.ticketId = id;
    document.getElementById('resolutionText').value = '';
    new bootstrap.Modal(resolveModal).show();
}

async function resolveTicket() {
    const modal = document.getElementById('resolveModal');
    if (!modal) return;

    const ticketId = modal.dataset.ticketId;
    const resolutionText = document.getElementById('resolutionText').value.trim();

    if (!resolutionText) {
        showNotification('Please enter a resolution before submitting.', 'danger');
        return;
    }

    try {
        const button = document.getElementById('resolveButton');
        if (!button) return;

        button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';
        button.disabled = true;

        const response = await fetch(`${TICKETS_API_URL}/${ticketId}/Resolve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolution: resolutionText })
        });

        if (!response.ok) throw new Error('Failed to resolve ticket');

        showNotification('Ticket resolved successfully', 'success');
        bootstrap.Modal.getInstance(modal).hide();
        loadTickets(currentPage);

    } catch (error) {
        console.error('Error resolving ticket:', error);
        showNotification(`Failed to resolve ticket: ${error.message}`, 'danger');
    } finally {
        const button = document.getElementById('resolveButton');
        if (button) {
            button.innerHTML = 'Resolve Ticket';
            button.disabled = false;
        }
    }
}

async function deleteTicket(id) {
    if (!confirm('Are you sure you want to delete this support ticket?\nThis action cannot be undone.')) return;

    try {
        const button = document.querySelector(`button[onclick="deleteTicket(${id})"]`);
        if (button) {
            button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Deleting...';
            button.disabled = true;
        }

        const response = await fetch(`${TICKETS_API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete ticket');

        showNotification('Ticket deleted successfully', 'success');
        loadTickets(currentPage);

    } catch (error) {
        console.error('Error deleting ticket:', error);
        showNotification(`Delete failed: ${error.message}`, 'danger');
    } finally {
        const buttons = document.querySelectorAll(`button[onclick="deleteTicket(${id})"]`);
        buttons.forEach(button => {
            button.innerHTML = '<i class="bi bi-trash"></i> Delete';
            button.disabled = false;
        });
    }
}

function updatePagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

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
        if (startPage > 2) addEllipsis(pagination);
    }

    for (let i = startPage; i <= endPage; i++) {
        addPageButton(pagination, i, i === currentPage);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) addEllipsis(pagination);
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
    if (page < 1 || page > Math.ceil(totalTickets / itemsPerPage)) return;
    currentPage = page;
    loadTickets(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Make functions available globally
window.changePage = changePage;
window.viewTicket = viewTicket;
window.showResolveModal = showResolveModal;
window.resolveTicket = resolveTicket;
window.deleteTicket = deleteTicket;