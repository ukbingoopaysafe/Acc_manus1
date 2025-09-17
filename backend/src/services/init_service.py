from src.models import (
    db, User, Role, Permission, RolePermission, 
    FinancialSetting, ExpenseCategory, Template
)
from src.services.dynamic_calculation_service import DynamicCalculationService
import json

def initialize_default_data():
    """Initialize default data for the application"""
    
    # Create default permissions
    permissions_data = [
        ('manage_users', 'إدارة المستخدمين'),
        ('manage_roles', 'إدارة الأدوار'),
        ('manage_units', 'إدارة الوحدات'),
        ('manage_sales', 'إدارة المبيعات'),
        ('manage_expenses', 'إدارة المصروفات'),
        ('manage_rentals', 'إدارة الإيجارات'),
        ('manage_finishing_works', 'إدارة التشطيبات'),
        ('manage_settings', 'إدارة الإعدادات'),
        ('view_reports', 'عرض التقارير'),
        ('manage_cashier', 'إدارة الخزنة'),
        ('print_invoices', 'طباعة الفواتير'),
        ('export_data', 'تصدير البيانات')
    ]
    
    for perm_name, perm_desc in permissions_data:
        if not Permission.query.filter_by(name=perm_name).first():
            permission = Permission(name=perm_name, description=perm_desc)
            permission.save()
    
    # Create default roles
    if not Role.query.filter_by(name='Admin').first():
        admin_role = Role(name='Admin', description='مسؤول النظام - صلاحيات كاملة')
        admin_role.save()
        
        # Give admin all permissions
        permissions = Permission.query.all()
        for permission in permissions:
            role_perm = RolePermission(
                role_id=admin_role.id,
                permission_id=permission.id,
                can_view=True,
                can_create=True,
                can_edit=True,
                can_delete=True
            )
            role_perm.save()
    
    if not Role.query.filter_by(name='Accountant').first():
        accountant_role = Role(name='Accountant', description='محاسب - صلاحيات محدودة')
        accountant_role.save()
        
        # Give accountant limited permissions
        accountant_permissions = [
            'manage_sales', 'manage_expenses', 'manage_rentals', 
            'view_reports', 'print_invoices', 'export_data'
        ]
        
        for perm_name in accountant_permissions:
            permission = Permission.query.filter_by(name=perm_name).first()
            if permission:
                role_perm = RolePermission(
                    role_id=accountant_role.id,
                    permission_id=permission.id,
                    can_view=True,
                    can_create=True,
                    can_edit=True,
                    can_delete=False
                )
                role_perm.save()
    
    # Create default admin user
    admin_role = Role.query.filter_by(name='Admin').first()
    if admin_role and not User.query.filter_by(username='admin').first():
        admin_user = User(
            username='admin',
            email='admin@broman.com',
            first_name='مسؤول',
            last_name='النظام',
            role_id=admin_role.id
        )
        admin_user.set_password('admin123')
        admin_user.save()
    
    # Create default financial settings
    default_settings = [
        ('VAT_RATE', '0.14', 'percentage', 'نسبة ضريبة القيمة المضافة', 'VAT Rate'),
        ('SALES_TAX_RATE', '0.05', 'percentage', 'نسبة ضريبة المبيعات', 'Sales Tax Rate'),
        ('ADMIN_DISCOUNT_PERCENTAGE', '0.05', 'percentage', 'نسبة الخصم الإداري', 'Admin Discount Percentage'),
        ('COMPANY_COMMISSION_APARTMENT', '0.02', 'percentage', 'عمولة الشركة على الشقق', 'Company Commission - Apartment'),
        ('COMPANY_COMMISSION_COMMERCIAL', '0.025', 'percentage', 'عمولة الشركة على التجاري', 'Company Commission - Commercial'),
        ('COMPANY_COMMISSION_ADMINISTRATIVE', '0.02', 'percentage', 'عمولة الشركة على الإداري', 'Company Commission - Administrative'),
        ('COMPANY_COMMISSION_MEDICAL', '0.03', 'percentage', 'عمولة الشركة على الطبي', 'Company Commission - Medical'),
        ('SALESPERSON_COMMISSION_APARTMENT', '0.005', 'percentage', 'عمولة السيلز على الشقق', 'Salesperson Commission - Apartment'),
        ('SALESPERSON_COMMISSION_COMMERCIAL', '0.0075', 'percentage', 'عمولة السيلز على التجاري', 'Salesperson Commission - Commercial'),
        ('SALESPERSON_COMMISSION_ADMINISTRATIVE', '0.005', 'percentage', 'عمولة السيلز على الإداري', 'Salesperson Commission - Administrative'),
        ('SALESPERSON_COMMISSION_MEDICAL', '0.01', 'percentage', 'عمولة السيلز على الطبي', 'Salesperson Commission - Medical'),
        ('SALES_MANAGER_COMMISSION', '0.003', 'percentage', 'عمولة مدير المبيعات', 'Sales Manager Commission'),
        ('ANNUAL_TAX_RATE', '0.225', 'percentage', 'نسبة الضريبة السنوية', 'Annual Tax Rate')
    ]
    
    for key, value, type_, desc_ar, desc_en in default_settings:
        if not FinancialSetting.query.filter_by(key=key).first():
            setting = FinancialSetting(
                key=key,
                value=value,
                type=type_,
                description_ar=desc_ar,
                description_en=desc_en
            )
            setting.save()
    
    # Create default expense categories
    default_categories = [
        ('مرتبات', 'Salaries'),
        ('بوفيه', 'Buffet'),
        ('صرفيات', 'Petty Cash'),
        ('مواصلات', 'Transportation'),
        ('إيجار المكتب', 'Office Rent'),
        ('فواتير الكهرباء', 'Electricity Bills'),
        ('فواتير المياه', 'Water Bills'),
        ('فواتير الإنترنت', 'Internet Bills'),
        ('مصروفات تسويق', 'Marketing Expenses'),
        ('مصروفات إدارية', 'Administrative Expenses')
    ]
    
    for name_ar, name_en in default_categories:
        if not ExpenseCategory.query.filter_by(name_ar=name_ar).first():
            category = ExpenseCategory(
                name_ar=name_ar,
                name_en=name_en,
                description_ar=f'فئة {name_ar}',
                description_en=f'{name_en} category'
            )
            category.save()
    
    # Create default invoice template
    if not Template.query.filter_by(name='Sales Invoice').first():
        invoice_template = {
            "template_name": {
                "ar": "فاتورة مبيعات",
                "en": "Sales Invoice"
            },
            "header": [
                {
                    "field": "company_name",
                    "type": "text",
                    "label": {"ar": "اسم الشركة", "en": "Company Name"},
                    "value": "Broman Real Estate",
                    "visible": True,
                    "style": "font-size: 24px; font-weight: bold;"
                },
                {
                    "field": "invoice_number",
                    "type": "data",
                    "label": {"ar": "رقم الفاتورة", "en": "Invoice No."},
                    "source": "sale.id",
                    "visible": True
                },
                {
                    "field": "invoice_date",
                    "type": "data",
                    "label": {"ar": "تاريخ الفاتورة", "en": "Invoice Date"},
                    "source": "sale.sale_date",
                    "visible": True
                }
            ],
            "client_info": [
                {
                    "field": "client_name",
                    "type": "data",
                    "label": {"ar": "اسم العميل", "en": "Client Name"},
                    "source": "sale.client_name",
                    "visible": True
                }
            ],
            "items_table": {
                "visible": True,
                "columns": [
                    {
                        "field": "item_description",
                        "type": "data",
                        "label": {"ar": "الوصف", "en": "Description"},
                        "source": "unit.description_ar",
                        "visible": True
                    },
                    {
                        "field": "unit_price",
                        "type": "data",
                        "label": {"ar": "سعر الوحدة", "en": "Unit Price"},
                        "source": "sale.sale_price",
                        "visible": True
                    },
                    {
                        "field": "quantity",
                        "type": "static",
                        "label": {"ar": "الكمية", "en": "Quantity"},
                        "value": 1,
                        "visible": True
                    }
                ]
            },
            "summary": [
                {
                    "field": "subtotal",
                    "type": "data",
                    "label": {"ar": "المجموع الفرعي", "en": "Subtotal"},
                    "source": "sale.sale_price",
                    "visible": True
                },
                {
                    "field": "total_taxes",
                    "type": "data",
                    "label": {"ar": "إجمالي الضرائب", "en": "Total Taxes"},
                    "source": "sale.total_taxes",
                    "visible": True
                },
                {
                    "field": "net_amount",
                    "type": "data",
                    "label": {"ar": "صافي المبلغ", "en": "Net Amount"},
                    "source": "sale.net_company_revenue",
                    "visible": True
                }
            ]
        }
        
        template = Template(
            name='Sales Invoice',
            type='invoice',
            content=json.dumps(invoice_template, ensure_ascii=False, indent=2)
        )
        template.save()
    
    # Initialize default calculation rules
    DynamicCalculationService.initialize_default_rules()
    
    print("Default data initialized successfully!")

