import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم',
    units: 'الوحدات',
    sales: 'المبيعات',
    expenses: 'المصروفات',
    rentals: 'الإيجارات',
    finishing_works: 'التشطيبات',
    reports: 'التقارير',
    settings: 'الإعدادات',
    users: 'المستخدمين',
    logout: 'تسجيل الخروج',
    
    // Common
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    print: 'طباعة',
    loading: 'جاري التحميل...',
    no_data: 'لا توجد بيانات',
    confirm_delete: 'هل أنت متأكد من الحذف؟',
    success: 'تم بنجاح',
    error: 'حدث خطأ',
    
    // Login
    login: 'تسجيل الدخول',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    login_button: 'دخول',
    welcome_back: 'مرحباً بعودتك',
    
    // Dashboard
    total_revenue: 'إجمالي الإيرادات',
    total_expenses: 'إجمالي المصروفات',
    net_profit: 'صافي الربح',
    cashier_balance: 'رصيد الخزنة',
    recent_sales: 'المبيعات الأخيرة',
    recent_expenses: 'المصروفات الأخيرة',
    
    // Units
    unit_code: 'كود الوحدة',
    unit_type: 'نوع الوحدة',
    unit_price: 'سعر الوحدة',
    unit_address: 'عنوان الوحدة',
    unit_area: 'مساحة الوحدة',
    unit_status: 'حالة الوحدة',
    unit_description: 'وصف الوحدة',
    apartment: 'شقة',
    commercial: 'تجاري',
    administrative: 'إداري',
    medical: 'طبي',
    available: 'متاحة',
    sold: 'مباعة',
    rented: 'مؤجرة',
    under_finishing: 'تحت التشطيب',
    
    // Sales
    client_name: 'اسم العميل',
    sale_date: 'تاريخ البيع',
    sale_price: 'سعر البيع',
    salesperson: 'موظف المبيعات',
    sales_manager: 'مدير المبيعات',
    company_commission: 'عمولة الشركة',
    salesperson_commission: 'عمولة الموظف',
    sales_manager_commission: 'عمولة المدير',
    total_taxes: 'إجمالي الضرائب',
    net_company_revenue: 'صافي إيراد الشركة',
    
    // Expenses
    expense_description: 'وصف المصروف',
    expense_amount: 'مبلغ المصروف',
    expense_date: 'تاريخ المصروف',
    expense_category: 'فئة المصروف',
    expense_notes: 'ملاحظات',
    
    // Rentals
    tenant_name: 'اسم المستأجر',
    start_date: 'تاريخ البداية',
    end_date: 'تاريخ النهاية',
    rent_amount: 'مبلغ الإيجار',
    payment_frequency: 'تكرار الدفع',
    monthly: 'شهري',
    quarterly: 'ربع سنوي',
    semi_annual: 'نصف سنوي',
    annual: 'سنوي',
    payment_date: 'تاريخ الدفع',
    payment_status: 'حالة الدفع',
    paid: 'مدفوعة',
    due: 'مستحقة',
    overdue: 'متأخرة',
    
    // Finishing Works
    project_name: 'اسم المشروع',
    project_budget: 'ميزانية المشروع',
    actual_cost: 'التكلفة الفعلية',
    project_status: 'حالة المشروع',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتملة',
    paused: 'متوقفة',
    
    // Settings
    financial_settings: 'الإعدادات المالية',
    templates: 'القوالب',
    setting_key: 'مفتاح الإعداد',
    setting_value: 'قيمة الإعداد',
    setting_type: 'نوع الإعداد',
    percentage: 'نسبة مئوية',
    fixed_amount: 'مبلغ ثابت',
    text: 'نص',
    json: 'JSON',
    
    // Reports
    expenses_report: 'تقرير المصروفات',
    revenue_report: 'تقرير الإيرادات',
    profit_loss_report: 'تقرير الأرباح والخسائر',
    cashier_transactions_report: 'تقرير معاملات الخزنة',
    from_date: 'من تاريخ',
    to_date: 'إلى تاريخ',
    
    // Users & Roles
    first_name: 'الاسم الأول',
    last_name: 'الاسم الأخير',
    email: 'البريد الإلكتروني',
    role: 'الدور',
    is_active: 'نشط',
    permissions: 'الصلاحيات',
    can_view: 'يمكن العرض',
    can_create: 'يمكن الإنشاء',
    can_edit: 'يمكن التعديل',
    can_delete: 'يمكن الحذف',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    units: 'Units',
    sales: 'Sales',
    expenses: 'Expenses',
    rentals: 'Rentals',
    finishing_works: 'Finishing Works',
    reports: 'Reports',
    settings: 'Settings',
    users: 'Users',
    logout: 'Logout',
    
    // Common
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    print: 'Print',
    loading: 'Loading...',
    no_data: 'No data available',
    confirm_delete: 'Are you sure you want to delete?',
    success: 'Success',
    error: 'Error',
    
    // Login
    login: 'Login',
    username: 'Username',
    password: 'Password',
    login_button: 'Sign In',
    welcome_back: 'Welcome Back',
    
    // Dashboard
    total_revenue: 'Total Revenue',
    total_expenses: 'Total Expenses',
    net_profit: 'Net Profit',
    cashier_balance: 'Cashier Balance',
    recent_sales: 'Recent Sales',
    recent_expenses: 'Recent Expenses',
    
    // Units
    unit_code: 'Unit Code',
    unit_type: 'Unit Type',
    unit_price: 'Unit Price',
    unit_address: 'Unit Address',
    unit_area: 'Unit Area',
    unit_status: 'Unit Status',
    unit_description: 'Unit Description',
    apartment: 'Apartment',
    commercial: 'Commercial',
    administrative: 'Administrative',
    medical: 'Medical',
    available: 'Available',
    sold: 'Sold',
    rented: 'Rented',
    under_finishing: 'Under Finishing',
    
    // Sales
    client_name: 'Client Name',
    sale_date: 'Sale Date',
    sale_price: 'Sale Price',
    salesperson: 'Salesperson',
    sales_manager: 'Sales Manager',
    company_commission: 'Company Commission',
    salesperson_commission: 'Salesperson Commission',
    sales_manager_commission: 'Sales Manager Commission',
    total_taxes: 'Total Taxes',
    net_company_revenue: 'Net Company Revenue',
    
    // Expenses
    expense_description: 'Expense Description',
    expense_amount: 'Expense Amount',
    expense_date: 'Expense Date',
    expense_category: 'Expense Category',
    expense_notes: 'Notes',
    
    // Rentals
    tenant_name: 'Tenant Name',
    start_date: 'Start Date',
    end_date: 'End Date',
    rent_amount: 'Rent Amount',
    payment_frequency: 'Payment Frequency',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semi_annual: 'Semi-Annual',
    annual: 'Annual',
    payment_date: 'Payment Date',
    payment_status: 'Payment Status',
    paid: 'Paid',
    due: 'Due',
    overdue: 'Overdue',
    
    // Finishing Works
    project_name: 'Project Name',
    project_budget: 'Project Budget',
    actual_cost: 'Actual Cost',
    project_status: 'Project Status',
    in_progress: 'In Progress',
    completed: 'Completed',
    paused: 'Paused',
    
    // Settings
    financial_settings: 'Financial Settings',
    templates: 'Templates',
    setting_key: 'Setting Key',
    setting_value: 'Setting Value',
    setting_type: 'Setting Type',
    percentage: 'Percentage',
    fixed_amount: 'Fixed Amount',
    text: 'Text',
    json: 'JSON',
    
    // Reports
    expenses_report: 'Expenses Report',
    revenue_report: 'Revenue Report',
    profit_loss_report: 'Profit & Loss Report',
    cashier_transactions_report: 'Cashier Transactions Report',
    from_date: 'From Date',
    to_date: 'To Date',
    
    // Users & Roles
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    role: 'Role',
    is_active: 'Active',
    permissions: 'Permissions',
    can_view: 'Can View',
    can_create: 'Can Create',
    can_edit: 'Can Edit',
    can_delete: 'Can Delete',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isRTL: language === 'ar',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

