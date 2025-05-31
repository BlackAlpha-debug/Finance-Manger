// Personal Finance Manager - JavaScript
// Enhanced functionality with responsive design

class FinanceManager {
    constructor() {
        this.apiBase = window.location.origin + '/api';
        this.init();
    }

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.setupResponsiveNavigation();
        this.setupSearchTabs();
        this.setDefaultDates();
        this.loadDashboard();
        this.loadTransactions();
    }

    // Set default dates to today
    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('incomeDate').value = today;
        document.getElementById('expenseDate').value = today;
        document.getElementById('searchDate').value = today;
    }

    // Setup event listeners
    setupEventListeners() {
        // Form submissions
        document.getElementById('incomeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addIncome();
        });

        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Navigation clicks
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e.target);
            });
        });

        // Window resize for responsiveness
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Initial resize check
        this.handleResize();
    }

    // Setup responsive navigation
    setupResponsiveNavigation() {
        const navToggle = document.getElementById('navToggle');
        const navList = document.querySelector('.nav-list');

        if (navToggle) {
            navToggle.addEventListener('click', () => {
                navList.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-menu')) {
                navList?.classList.remove('active');
                navToggle?.classList.remove('active');
            }
        });
    }

    // Setup search tabs
    setupSearchTabs() {
        document.querySelectorAll('.search-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchSearchTab(tab.dataset.tab);
            });
        });
    }

    // Handle responsive behavior
    handleResize() {
        const width = window.innerWidth;
        
        // Adjust table for mobile
        if (width <= 768) {
            this.makeTableResponsive();
        } else {
            this.restoreTable();
        }

        // Adjust form layout
        if (width <= 480) {
            this.adjustForMobile();
        } else {
            this.restoreDesktop();
        }
    }

    // Make table responsive for mobile
    makeTableResponsive() {
        const table = document.querySelector('.transactions-table');
        if (table && !table.classList.contains('mobile-responsive')) {
            table.classList.add('mobile-responsive');
            
            // Add mobile-friendly styling
            const style = document.createElement('style');
            style.textContent = `
                .mobile-responsive {
                    font-size: 0.75rem;
                }
                .mobile-responsive th,
                .mobile-responsive td {
                    padding: 0.5rem 0.75rem;
                }
                .mobile-responsive .transaction-actions {
                    flex-direction: column;
                    gap: 0.25rem;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Restore table for desktop
    restoreTable() {
        const table = document.querySelector('.transactions-table');
        if (table) {
            table.classList.remove('mobile-responsive');
        }
    }

    // Adjust interface for mobile
    adjustForMobile() {
        // Stack form elements
        document.querySelectorAll('.form-row').forEach(row => {
            row.style.gridTemplateColumns = '1fr';
        });

        // Adjust button sizes
        document.querySelectorAll('.btn').forEach(btn => {
            btn.style.fontSize = '0.8rem';
            btn.style.padding = '0.6rem 1.2rem';
        });
    }

    // Restore desktop layout
    restoreDesktop() {
        document.querySelectorAll('.form-row').forEach(row => {
            row.style.gridTemplateColumns = '1fr 1fr';
        });

        document.querySelectorAll('.btn').forEach(btn => {
            btn.style.fontSize = '';
            btn.style.padding = '';
        });
    }

    // Handle navigation
    handleNavigation(element) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to clicked link
        element.classList.add('active');

        // Smooth scroll to section
        const target = element.getAttribute('href');
        if (target.startsWith('#')) {
            const section = document.querySelector(target);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    // Switch search tabs
    switchSearchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.search-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update panels
        document.querySelectorAll('.search-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}Search`).classList.add('active');

        // Clear previous results
        document.getElementById('searchResults').innerHTML = '';
    }

    // Show loading
    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    }

    // Hide loading
    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }

    // Show notification
    showNotification(message, type = 'info', title = '') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
            </div>
            <div class="notification-content">
                ${title ? `<div class="notification-title">${title}</div>` : ''}
                <div class="notification-message">${message}</div>
            </div>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                container.removeChild(notification);
            }, 300);
        }, 5000);

        // Add slideOut animation
        if (!document.querySelector('style[data-notifications]')) {
            const style = document.createElement('style');
            style.setAttribute('data-notifications', 'true');
            style.textContent = `
                @keyframes slideOut {
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Get notification icon
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // API call helper
    async apiCall(endpoint, options = {}) {
        try {
            this.showLoading();
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            const data = await response.json();
            this.hideLoading();
            return data;
        } catch (error) {
            this.hideLoading();
            this.showNotification('Network error occurred', 'error', 'Connection Error');
            console.error('API Error:', error);
            return { status: 'error', message: error.message };
        }
    }

    // Add income transaction
    async addIncome() {
        const formData = {
            iban: document.getElementById('incomeIban').value.trim(),
            amount: parseFloat(document.getElementById('incomeAmount').value),
            date: document.getElementById('incomeDate').value,
            description: document.getElementById('incomeDescription').value.trim(),
            category: document.getElementById('incomeCategory').value
        };

        // Validation
        if (!formData.iban || !formData.amount || !formData.date) {
            this.showNotification('Please fill in all required fields', 'warning', 'Validation Error');
            return;
        }

        if (formData.amount <= 0) {
            this.showNotification('Amount must be greater than zero', 'warning', 'Invalid Amount');
            return;
        }

        const result = await this.apiCall('/add_income', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (result.status === 'success') {
            this.showNotification(result.message, 'success', 'Income Added');
            document.getElementById('incomeForm').reset();
            this.setDefaultDates();
            this.loadDashboard();
            this.loadTransactions();
        } else {
            this.showNotification(result.message, 'error', 'Error');
        }
    }

    // Add expense transaction
    async addExpense() {
        const formData = {
            iban: document.getElementById('expenseIban').value.trim(),
            amount: parseFloat(document.getElementById('expenseAmount').value),
            date: document.getElementById('expenseDate').value,
            description: document.getElementById('expenseDescription').value.trim(),
            category: document.getElementById('expenseCategory').value
        };

        // Validation
        if (!formData.iban || !formData.amount || !formData.date) {
            this.showNotification('Please fill in all required fields', 'warning', 'Validation Error');
            return;
        }

        if (formData.amount <= 0) {
            this.showNotification('Amount must be greater than zero', 'warning', 'Invalid Amount');
            return;
        }

        const result = await this.apiCall('/add_expense', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (result.status === 'success') {
            this.showNotification(result.message, 'success', 'Expense Added');
            document.getElementById('expenseForm').reset();
            this.setDefaultDates();
            this.loadDashboard();
            this.loadTransactions();
        } else if (result.status === 'warning') {
            this.showNotification(result.message, 'warning', 'Budget Warning');
            // Still reload data as transaction might have been added
            this.loadDashboard();
            this.loadTransactions();
        } else {
            this.showNotification(result.message, 'error', 'Error');
        }
    }

    // Load dashboard summary
    async loadDashboard() {
        const result = await this.apiCall('/summary');
        
        if (result) {
            this.updateDashboardStats(result);
        }
    }

    // Update dashboard statistics
    updateDashboardStats(data) {
        // Update hero stats
        document.getElementById('heroBalance').textContent = this.formatCurrency(data.total_balance);
        document.getElementById('heroTransactions').textContent = data.total_transactions;
        document.getElementById('heroAccounts').textContent = data.accounts_count;

        // Update detailed stats
        document.getElementById('totalIncome').textContent = this.formatCurrency(data.total_income);
        document.getElementById('totalExpenses').textContent = this.formatCurrency(data.total_expenses);
        document.getElementById('netBalance').textContent = this.formatCurrency(data.total_balance);
        document.getElementById('totalAccounts').textContent = data.accounts_count;
    }

    // Load all transactions
    async loadTransactions() {
        const result = await this.apiCall('/transactions');
        
        if (result.status === 'success') {
            this.displayTransactions(result.transactions);
        } else {
            this.displayNoTransactions();
        }
    }

    // Display transactions in table
    displayTransactions(transactions) {
        const tbody = document.getElementById('transactionsList');
        
        if (!transactions || transactions.length === 0) {
            this.displayNoTransactions();
            return;
        }

        tbody.innerHTML = transactions.map(transaction => `
            <tr>
                <td>${this.formatDate(transaction.date)}</td>
                <td class="transaction-iban">${this.maskIban(transaction.iban)}</td>
                <td>
                    <span class="transaction-type ${transaction.type}">
                        <i class="fas ${transaction.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                        ${transaction.type}
                    </span>
                </td>
                <td>${transaction.category}</td>
                <td class="transaction-amount ${transaction.type === 'income' ? 'positive' : 'negative'}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </td>
                <td class="transaction-description">${transaction.description || '-'}</td>
                <td class="transaction-actions">
                    <button class="btn-icon btn-delete" onclick="financeManager.removeTransaction('${transaction.iban}', '${transaction.tid}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Display no transactions message
    displayNoTransactions() {
        const tbody = document.getElementById('transactionsList');
        tbody.innerHTML = `
            <tr class="no-data">
                <td colspan="7">
                    <div class="no-data-content">
                        <i class="fas fa-inbox"></i>
                        <p>No transactions yet. Add your first transaction above!</p>
                    </div>
                </td>
            </tr>
        `;
    }

    // Remove transaction
    async removeTransaction(iban, tid) {
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return;
        }

        const result = await this.apiCall('/remove_transaction', {
            method: 'DELETE',
            body: JSON.stringify({ iban, tid })
        });

        if (result.status === 'success') {
            this.showNotification(result.message, 'success', 'Transaction Deleted');
            this.loadDashboard();
            this.loadTransactions();
        } else {
            this.showNotification(result.message, 'error', 'Error');
        }
    }

    // Search by date
    async searchByDate() {
        const date = document.getElementById('searchDate').value;
        if (!date) {
            this.showNotification('Please select a date', 'warning', 'Search Error');
            return;
        }

        const result = await this.apiCall(`/search/date/${date}`);
        this.displaySearchResults(result, 'Date Search Results');
    }

    // Search by IBAN
    async searchByIban() {
        const iban = document.getElementById('searchIban').value.trim();
        if (!iban) {
            this.showNotification('Please enter an IBAN', 'warning', 'Search Error');
            return;
        }

        const result = await this.apiCall(`/search/iban/${encodeURIComponent(iban)}`);
        this.displaySearchResults(result, 'IBAN Search Results');
    }

    // Search by category
    async searchByCategory() {
        const category = document.getElementById('searchCategory').value;
        if (!category) {
            this.showNotification('Please select a category', 'warning', 'Search Error');
            return;
        }

        const result = await this.apiCall(`/search/category/${encodeURIComponent(category)}`);
        this.displaySearchResults(result, 'Category Search Results');
    }

    // Display search results
    displaySearchResults(result, title) {
        const container = document.getElementById('searchResults');
        
        if (result.status === 'success' && result.results) {
            container.innerHTML = `
                <h4>${title} (${result.count} found)</h4>
                <div class="search-results-table">
                    <table class="transactions-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Account</th>
                                <th>Type</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${result.results.map(transaction => `
                                <tr>
                                    <td>${this.formatDate(transaction.date)}</td>
                                    <td>${this.maskIban(transaction.iban)}</td>
                                    <td>
                                        <span class="transaction-type ${transaction.type}">
                                            <i class="fas ${transaction.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                                            ${transaction.type}
                                        </span>
                                    </td>
                                    <td>${transaction.category}</td>
                                    <td class="transaction-amount ${transaction.type === 'income' ? 'positive' : 'negative'}">
                                        ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                                    </td>
                                    <td>${transaction.description || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${result.balance !== undefined ? `<p><strong>Account Balance: ${this.formatCurrency(result.balance)}</strong></p>` : ''}
            `;
        } else {
            container.innerHTML = `
                <h4>${title}</h4>
                <div class="no-data-content">
                    <i class="fas fa-search"></i>
                    <p>${result.message || 'No results found'}</p>
                </div>
            `;
        }
    }

    // Export data
    async exportData() {
        const result = await this.apiCall('/export');
        
        if (result) {
            const dataStr = JSON.stringify(result, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `finance_data_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showNotification('Data exported successfully', 'success', 'Export Complete');
        }
    }

    // Clear all data
    clearAllData() {
        if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            return;
        }

        // Since there's no clear endpoint in the API, we'll just refresh
        location.reload();
    }

    // Refresh dashboard
    refreshDashboard() {
        this.loadDashboard();
        this.loadTransactions();
        this.showNotification('Dashboard refreshed', 'success', 'Refresh Complete');
    }

    // Utility functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    maskIban(iban) {
        if (!iban || iban.length < 8) return iban;
        return iban.slice(0, 4) + '****' + iban.slice(-4);
    }
}

// Global functions for HTML onclick events
let financeManager;

function searchByDate() {
    financeManager.searchByDate();
}

function searchByIban() {
    financeManager.searchByIban();
}

function searchByCategory() {
    financeManager.searchByCategory();
}

function exportData() {
    financeManager.exportData();
}

function clearAllData() {
    financeManager.clearAllData();
}

function refreshDashboard() {
    financeManager.refreshDashboard();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    financeManager = new FinanceManager();
    
    // Add smooth scrolling for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add touch support for mobile
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }

    // Add keyboard navigation support
    document.addEventListener('keydown', (e) => {
        // ESC key closes mobile menu
        if (e.key === 'Escape') {
            document.querySelector('.nav-list')?.classList.remove('active');
            document.getElementById('navToggle')?.classList.remove('active');
        }
    });

    console.log('🚀 Finance Manager JavaScript loaded successfully!');
});

const toggle = document.getElementById('theme-toggle');
toggle.addEventListener('click', () => {
document.body.classList.toggle('dark-mode');
toggle.textContent = document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
});

