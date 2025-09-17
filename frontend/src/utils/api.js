const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async logout() {
    this.setToken(null);
  }

  // Users endpoints
  async getUsers() {
    return this.request('/auth/users');
  }

  async createUser(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    return this.request(`/auth/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Roles endpoints
  async getRoles() {
    return this.request('/auth/roles');
  }

  async createRole(roleData) {
    return this.request('/auth/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  async updateRole(roleId, roleData) {
    return this.request(`/auth/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  async deleteRole(roleId) {
    return this.request(`/auth/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  async getPermissions() {
    return this.request('/auth/permissions/all');
  }

  async getRolePermissions(roleId) {
    return this.request(`/auth/roles/${roleId}/permissions`);
  }

  async updateRolePermissions(roleId, permissions) {
    return this.request(`/auth/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissions }),
    });
  }

  // Units endpoints
  async getUnits() {
    return this.request('/units/units');
  }

  async createUnit(unitData) {
    return this.request('/units/units', {
      method: 'POST',
      body: JSON.stringify(unitData),
    });
  }

  async updateUnit(unitId, unitData) {
    return this.request(`/units/units/${unitId}`, {
      method: 'PUT',
      body: JSON.stringify(unitData),
    });
  }

  async deleteUnit(unitId) {
    return this.request(`/units/units/${unitId}`, {
      method: 'DELETE',
    });
  }

  // Sales endpoints
  async getSales() {
    return this.request('/sales/sales');
  }

  async createSale(saleData) {
    return this.request('/sales/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  async updateSale(saleId, saleData) {
    return this.request(`/sales/sales/${saleId}`, {
      method: 'PUT',
      body: JSON.stringify(saleData),
    });
  }

  async deleteSale(saleId) {
    return this.request(`/sales/sales/${saleId}`, {
      method: 'DELETE',
    });
  }

  // Expenses endpoints
  async getExpenseCategories() {
    return this.request('/expenses/expense_categories');
  }

  async createExpenseCategory(categoryData) {
    return this.request('/expenses/expense_categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateExpenseCategory(categoryId, categoryData) {
    return this.request(`/expenses/expense_categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteExpenseCategory(categoryId) {
    return this.request(`/expenses/expense_categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  async getExpenses() {
    return this.request('/expenses/expenses');
  }

  async createExpense(expenseData) {
    return this.request('/expenses/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async updateExpense(expenseId, expenseData) {
    return this.request(`/expenses/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  }

  async deleteExpense(expenseId) {
    return this.request(`/expenses/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  // Rentals endpoints
  async getRentals() {
    return this.request('/rentals/rentals');
  }

  async createRental(rentalData) {
    return this.request('/rentals/rentals', {
      method: 'POST',
      body: JSON.stringify(rentalData),
    });
  }

  async updateRental(rentalId, rentalData) {
    return this.request(`/rentals/rentals/${rentalId}`, {
      method: 'PUT',
      body: JSON.stringify(rentalData),
    });
  }

  async deleteRental(rentalId) {
    return this.request(`/rentals/rentals/${rentalId}`, {
      method: 'DELETE',
    });
  }

  async getRentalPayments(rentalId) {
    return this.request(`/rentals/rentals/${rentalId}/payments`);
  }

  async createRentalPayment(rentalId, paymentData) {
    return this.request(`/rentals/rentals/${rentalId}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async updateRentalPayment(paymentId, paymentData) {
    return this.request(`/rentals/rental_payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  }

  async deleteRentalPayment(paymentId) {
    return this.request(`/rentals/rental_payments/${paymentId}`, {
      method: 'DELETE',
    });
  }

  // Finishing Works endpoints
  async getFinishingWorks() {
    return this.request('/finishing_works/finishing_works');
  }

  async createFinishingWork(finishingWorkData) {
    return this.request('/finishing_works/finishing_works', {
      method: 'POST',
      body: JSON.stringify(finishingWorkData),
    });
  }

  async updateFinishingWork(finishingWorkId, finishingWorkData) {
    return this.request(`/finishing_works/finishing_works/${finishingWorkId}`, {
      method: 'PUT',
      body: JSON.stringify(finishingWorkData),
    });
  }

  async deleteFinishingWork(finishingWorkId) {
    return this.request(`/finishing_works/finishing_works/${finishingWorkId}`, {
      method: 'DELETE',
    });
  }

  async getFinishingWorkExpenses(finishingWorkId) {
    return this.request(`/finishing_works/finishing_works/${finishingWorkId}/expenses`);
  }

  async createFinishingWorkExpense(finishingWorkId, expenseData) {
    return this.request(`/finishing_works/finishing_works/${finishingWorkId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async updateFinishingWorkExpense(expenseId, expenseData) {
    return this.request(`/finishing_works/finishing_work_expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  }

  async deleteFinishingWorkExpense(expenseId) {
    return this.request(`/finishing_works/finishing_work_expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  // Settings endpoints
  async getFinancialSettings() {
    return this.request('/settings/financial_settings');
  }

  async createFinancialSetting(settingData) {
    return this.request('/settings/financial_settings', {
      method: 'POST',
      body: JSON.stringify(settingData),
    });
  }

  async updateFinancialSetting(settingId, settingData) {
    return this.request(`/settings/financial_settings/${settingId}`, {
      method: 'PUT',
      body: JSON.stringify(settingData),
    });
  }

  async deleteFinancialSetting(settingId) {
    return this.request(`/settings/financial_settings/${settingId}`, {
      method: 'DELETE',
    });
  }

  async getTemplates() {
    return this.request('/settings/templates');
  }

  async createTemplate(templateData) {
    return this.request('/settings/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  async updateTemplate(templateId, templateData) {
    return this.request(`/settings/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  }

  async deleteTemplate(templateId) {
    return this.request(`/settings/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  // Reports endpoints
  async getExpensesReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/expenses${queryString ? '?' + queryString : ''}`);
  }

  async getRevenueReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/revenue${queryString ? '?' + queryString : ''}`);
  }

  async getProfitLossReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/profit_loss${queryString ? '?' + queryString : ''}`);
  }

  async getCashierTransactionsReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/cashier_transactions${queryString ? '?' + queryString : ''}`);
  }
}

export default new ApiService();

