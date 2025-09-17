import pandas as pd
from io import BytesIO
from datetime import datetime
from sqlalchemy import and_
from src.models.sales import Sale
from src.models.expenses import Expense, ExpenseCategory
from src.models.rentals import Rental, RentalPayment
from src.models.finishing_works import FinishingWork, FinishingWorkExpense
from src.models.units import Unit
from src.models.settings import CashierTransaction
from src.models.dynamic_calculations import ReportConfiguration
import json

class DynamicExportService:
    """خدمة التصدير الديناميكية مع دعم التخصيص"""
    
    def __init__(self):
        pass
    
    def export_sales_to_excel(self, start_date=None, end_date=None, columns_config=None):
        """تصدير بيانات المبيعات إلى Excel مع إمكانية تخصيص الأعمدة"""
        
        query = Sale.query
        
        if start_date:
            query = query.filter(Sale.sale_date >= start_date)
        if end_date:
            query = query.filter(Sale.sale_date <= end_date)
        
        sales = query.all()
        
        # إعداد البيانات
        data = []
        for sale in sales:
            row_data = self._prepare_sale_row(sale, columns_config)
            data.append(row_data)
        
        # إنشاء DataFrame
        df = pd.DataFrame(data)
        
        # إنشاء ملف Excel
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='المبيعات', index=False)
            
            # تنسيق الورقة
            worksheet = writer.sheets['المبيعات']
            
            # تعديل عرض الأعمدة
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        buffer.seek(0)
        return buffer
    
    def _prepare_sale_row(self, sale, columns_config=None):
        """إعداد صف بيانات المبيعة"""
        
        # البيانات الأساسية
        base_data = {
            'رقم المبيعة': sale.id,
            'تاريخ البيع': sale.sale_date.strftime('%Y-%m-%d') if sale.sale_date else '',
            'اسم العميل': sale.client_name or '',
            'كود الوحدة': sale.unit.code if sale.unit else '',
            'نوع الوحدة': sale.unit.type if sale.unit else '',
            'سعر البيع': float(sale.sale_price) if sale.sale_price else 0,
            'عمولة الشركة': float(sale.company_commission) if sale.company_commission else 0,
            'عمولة البائع': float(sale.salesperson_commission) if sale.salesperson_commission else 0,
            'عمولة مدير المبيعات': float(sale.sales_manager_commission) if sale.sales_manager_commission else 0,
            'إجمالي الضرائب': float(sale.total_taxes) if sale.total_taxes else 0,
            'صافي إيرادات الشركة': float(sale.net_company_revenue) if sale.net_company_revenue else 0,
            'اسم البائع': f"{sale.salesperson.first_name} {sale.salesperson.last_name}" if sale.salesperson else '',
            'اسم مدير المبيعات': f"{sale.sales_manager.first_name} {sale.sales_manager.last_name}" if sale.sales_manager else '',
            'ملاحظات': sale.notes or '',
            'تاريخ الإنشاء': sale.created_at.strftime('%Y-%m-%d %H:%M:%S') if sale.created_at else ''
        }
        
        # إضافة تفاصيل الحسابات الديناميكية
        calculation_breakdown = sale.get_calculation_breakdown()
        if calculation_breakdown:
            base_data['نوع الوحدة المحسوب'] = calculation_breakdown.get('unit_type', '')
            base_data['المبلغ الأساسي'] = calculation_breakdown.get('base_amount', 0)
            
            # إضافة تفاصيل القواعد المطبقة
            applied_rules = calculation_breakdown.get('applied_rules', [])
            for i, rule in enumerate(applied_rules):
                base_data[f'قاعدة {i+1} - الاسم'] = rule.get('rule_name_ar', '')
                base_data[f'قاعدة {i+1} - النوع'] = rule.get('rule_type', '')
                base_data[f'قاعدة {i+1} - القيمة'] = rule.get('calculated_amount', 0)
        
        # إضافة الحقول المخصصة
        custom_fields = sale.get_custom_fields_data()
        if custom_fields:
            for field_name, field_value in custom_fields.items():
                base_data[f'حقل مخصص - {field_name}'] = field_value
        
        # تطبيق تكوين الأعمدة إذا كان متوفراً
        if columns_config:
            filtered_data = {}
            for column in columns_config:
                if column.get('visible', True):
                    field_name = column.get('field_name', '')
                    display_name = column.get('display_name', field_name)
                    if field_name in base_data:
                        filtered_data[display_name] = base_data[field_name]
            return filtered_data
        
        return base_data
    
    def export_expenses_to_excel(self, start_date=None, end_date=None, category_id=None):
        """تصدير بيانات المصروفات إلى Excel"""
        
        query = Expense.query
        
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
        if category_id:
            query = query.filter(Expense.category_id == category_id)
        
        expenses = query.all()
        
        # إعداد البيانات
        data = []
        for expense in expenses:
            data.append({
                'رقم المصروف': expense.id,
                'تاريخ المصروف': expense.expense_date.strftime('%Y-%m-%d') if expense.expense_date else '',
                'الوصف': expense.description or '',
                'المبلغ': float(expense.amount) if expense.amount else 0,
                'الفئة': expense.category.name_ar if expense.category else '',
                'طريقة الدفع': expense.payment_method or '',
                'رقم المرجع': expense.reference_number or '',
                'ملاحظات': expense.notes or '',
                'تاريخ الإنشاء': expense.created_at.strftime('%Y-%m-%d %H:%M:%S') if expense.created_at else ''
            })
        
        # إنشاء DataFrame
        df = pd.DataFrame(data)
        
        # إنشاء ملف Excel
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='المصروفات', index=False)
            
            # تنسيق الورقة
            worksheet = writer.sheets['المصروفات']
            self._format_worksheet(worksheet)
        
        buffer.seek(0)
        return buffer
    
    def export_rentals_to_excel(self, start_date=None, end_date=None):
        """تصدير بيانات الإيجارات إلى Excel"""
        
        query = Rental.query
        
        if start_date:
            query = query.filter(Rental.start_date >= start_date)
        if end_date:
            query = query.filter(Rental.end_date <= end_date)
        
        rentals = query.all()
        
        # إعداد البيانات
        data = []
        for rental in rentals:
            data.append({
                'رقم الإيجار': rental.id,
                'اسم المستأجر': rental.tenant_name or '',
                'هاتف المستأجر': rental.tenant_phone or '',
                'كود الوحدة': rental.unit.code if rental.unit else '',
                'نوع الوحدة': rental.unit.type if rental.unit else '',
                'مبلغ الإيجار الشهري': float(rental.monthly_rent) if rental.monthly_rent else 0,
                'تاريخ البداية': rental.start_date.strftime('%Y-%m-%d') if rental.start_date else '',
                'تاريخ النهاية': rental.end_date.strftime('%Y-%m-%d') if rental.end_date else '',
                'مبلغ التأمين': float(rental.security_deposit) if rental.security_deposit else 0,
                'الحالة': rental.status or '',
                'ملاحظات': rental.notes or '',
                'تاريخ الإنشاء': rental.created_at.strftime('%Y-%m-%d %H:%M:%S') if rental.created_at else ''
            })
        
        # إنشاء DataFrame
        df = pd.DataFrame(data)
        
        # إنشاء ملف Excel
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='الإيجارات', index=False)
            
            # تنسيق الورقة
            worksheet = writer.sheets['الإيجارات']
            self._format_worksheet(worksheet)
        
        buffer.seek(0)
        return buffer
    
    def export_finishing_works_to_excel(self, start_date=None, end_date=None):
        """تصدير بيانات التشطيبات إلى Excel"""
        
        query = FinishingWork.query
        
        if start_date:
            query = query.filter(FinishingWork.start_date >= start_date)
        if end_date:
            query = query.filter(FinishingWork.end_date <= end_date)
        
        finishing_works = query.all()
        
        # إعداد البيانات
        data = []
        for work in finishing_works:
            data.append({
                'رقم المشروع': work.id,
                'اسم المشروع': work.project_name or '',
                'كود الوحدة': work.unit.code if work.unit else '',
                'نوع الوحدة': work.unit.type if work.unit else '',
                'الميزانية المخططة': float(work.planned_budget) if work.planned_budget else 0,
                'التكلفة الفعلية': float(work.actual_cost) if work.actual_cost else 0,
                'تاريخ البداية': work.start_date.strftime('%Y-%m-%d') if work.start_date else '',
                'تاريخ النهاية': work.end_date.strftime('%Y-%m-%d') if work.end_date else '',
                'الحالة': work.status or '',
                'اسم المقاول': work.contractor_name or '',
                'هاتف المقاول': work.contractor_phone or '',
                'ملاحظات': work.notes or '',
                'تاريخ الإنشاء': work.created_at.strftime('%Y-%m-%d %H:%M:%S') if work.created_at else ''
            })
        
        # إنشاء DataFrame
        df = pd.DataFrame(data)
        
        # إنشاء ملف Excel
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='التشطيبات', index=False)
            
            # تنسيق الورقة
            worksheet = writer.sheets['التشطيبات']
            self._format_worksheet(worksheet)
        
        buffer.seek(0)
        return buffer
    
    def export_comprehensive_report(self, start_date=None, end_date=None):
        """تصدير تقرير شامل لجميع البيانات"""
        
        buffer = BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            
            # تصدير المبيعات
            sales_data = self._get_sales_data(start_date, end_date)
            if sales_data:
                sales_df = pd.DataFrame(sales_data)
                sales_df.to_excel(writer, sheet_name='المبيعات', index=False)
                self._format_worksheet(writer.sheets['المبيعات'])
            
            # تصدير المصروفات
            expenses_data = self._get_expenses_data(start_date, end_date)
            if expenses_data:
                expenses_df = pd.DataFrame(expenses_data)
                expenses_df.to_excel(writer, sheet_name='المصروفات', index=False)
                self._format_worksheet(writer.sheets['المصروفات'])
            
            # تصدير الإيجارات
            rentals_data = self._get_rentals_data(start_date, end_date)
            if rentals_data:
                rentals_df = pd.DataFrame(rentals_data)
                rentals_df.to_excel(writer, sheet_name='الإيجارات', index=False)
                self._format_worksheet(writer.sheets['الإيجارات'])
            
            # تصدير التشطيبات
            finishing_data = self._get_finishing_works_data(start_date, end_date)
            if finishing_data:
                finishing_df = pd.DataFrame(finishing_data)
                finishing_df.to_excel(writer, sheet_name='التشطيبات', index=False)
                self._format_worksheet(writer.sheets['التشطيبات'])
            
            # تصدير ملخص مالي
            financial_summary = self._get_financial_summary(start_date, end_date)
            if financial_summary:
                summary_df = pd.DataFrame(financial_summary)
                summary_df.to_excel(writer, sheet_name='الملخص المالي', index=False)
                self._format_worksheet(writer.sheets['الملخص المالي'])
        
        buffer.seek(0)
        return buffer
    
    def _get_sales_data(self, start_date=None, end_date=None):
        """الحصول على بيانات المبيعات"""
        query = Sale.query
        
        if start_date:
            query = query.filter(Sale.sale_date >= start_date)
        if end_date:
            query = query.filter(Sale.sale_date <= end_date)
        
        sales = query.all()
        
        data = []
        for sale in sales:
            data.append(self._prepare_sale_row(sale))
        
        return data
    
    def _get_expenses_data(self, start_date=None, end_date=None):
        """الحصول على بيانات المصروفات"""
        query = Expense.query
        
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
        
        expenses = query.all()
        
        data = []
        for expense in expenses:
            data.append({
                'رقم المصروف': expense.id,
                'تاريخ المصروف': expense.expense_date.strftime('%Y-%m-%d') if expense.expense_date else '',
                'الوصف': expense.description or '',
                'المبلغ': float(expense.amount) if expense.amount else 0,
                'الفئة': expense.category.name_ar if expense.category else '',
                'طريقة الدفع': expense.payment_method or '',
                'ملاحظات': expense.notes or ''
            })
        
        return data
    
    def _get_rentals_data(self, start_date=None, end_date=None):
        """الحصول على بيانات الإيجارات"""
        query = Rental.query
        
        if start_date:
            query = query.filter(Rental.start_date >= start_date)
        if end_date:
            query = query.filter(Rental.end_date <= end_date)
        
        rentals = query.all()
        
        data = []
        for rental in rentals:
            data.append({
                'رقم الإيجار': rental.id,
                'اسم المستأجر': rental.tenant_name or '',
                'كود الوحدة': rental.unit.code if rental.unit else '',
                'مبلغ الإيجار الشهري': float(rental.monthly_rent) if rental.monthly_rent else 0,
                'تاريخ البداية': rental.start_date.strftime('%Y-%m-%d') if rental.start_date else '',
                'تاريخ النهاية': rental.end_date.strftime('%Y-%m-%d') if rental.end_date else '',
                'الحالة': rental.status or ''
            })
        
        return data
    
    def _get_finishing_works_data(self, start_date=None, end_date=None):
        """الحصول على بيانات التشطيبات"""
        query = FinishingWork.query
        
        if start_date:
            query = query.filter(FinishingWork.start_date >= start_date)
        if end_date:
            query = query.filter(FinishingWork.end_date <= end_date)
        
        finishing_works = query.all()
        
        data = []
        for work in finishing_works:
            data.append({
                'رقم المشروع': work.id,
                'اسم المشروع': work.project_name or '',
                'كود الوحدة': work.unit.code if work.unit else '',
                'الميزانية المخططة': float(work.planned_budget) if work.planned_budget else 0,
                'التكلفة الفعلية': float(work.actual_cost) if work.actual_cost else 0,
                'الحالة': work.status or ''
            })
        
        return data
    
    def _get_financial_summary(self, start_date=None, end_date=None):
        """الحصول على الملخص المالي"""
        
        # حساب إجمالي المبيعات
        sales_query = Sale.query
        if start_date:
            sales_query = sales_query.filter(Sale.sale_date >= start_date)
        if end_date:
            sales_query = sales_query.filter(Sale.sale_date <= end_date)
        
        sales = sales_query.all()
        total_sales = sum(float(sale.sale_price) for sale in sales if sale.sale_price)
        total_company_revenue = sum(float(sale.net_company_revenue) for sale in sales if sale.net_company_revenue)
        total_commissions = sum(float(sale.company_commission) for sale in sales if sale.company_commission)
        total_taxes = sum(float(sale.total_taxes) for sale in sales if sale.total_taxes)
        
        # حساب إجمالي المصروفات
        expenses_query = Expense.query
        if start_date:
            expenses_query = expenses_query.filter(Expense.expense_date >= start_date)
        if end_date:
            expenses_query = expenses_query.filter(Expense.expense_date <= end_date)
        
        expenses = expenses_query.all()
        total_expenses = sum(float(expense.amount) for expense in expenses if expense.amount)
        
        # حساب إجمالي الإيجارات
        rentals_query = Rental.query
        if start_date:
            rentals_query = rentals_query.filter(Rental.start_date >= start_date)
        if end_date:
            rentals_query = rentals_query.filter(Rental.end_date <= end_date)
        
        rentals = rentals_query.all()
        total_rental_income = sum(float(rental.monthly_rent) for rental in rentals if rental.monthly_rent)
        
        # إعداد البيانات
        summary_data = [
            {'البند': 'إجمالي المبيعات', 'المبلغ': total_sales},
            {'البند': 'إجمالي عمولات الشركة', 'المبلغ': total_commissions},
            {'البند': 'إجمالي الضرائب', 'المبلغ': total_taxes},
            {'البند': 'صافي إيرادات المبيعات', 'المبلغ': total_company_revenue},
            {'البند': 'إجمالي إيرادات الإيجارات', 'المبلغ': total_rental_income},
            {'البند': 'إجمالي المصروفات', 'المبلغ': total_expenses},
            {'البند': 'صافي الربح', 'المبلغ': total_company_revenue + total_rental_income - total_expenses}
        ]
        
        return summary_data
    
    def _format_worksheet(self, worksheet):
        """تنسيق ورقة العمل"""
        
        # تعديل عرض الأعمدة
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width
    
    def export_custom_report(self, report_config_id, start_date=None, end_date=None):
        """تصدير تقرير مخصص بناءً على التكوين المحفوظ"""
        
        config = ReportConfiguration.query.get(report_config_id)
        if not config:
            raise ValueError("Report configuration not found")
        
        columns_config = config.get_columns_config()
        filters_config = config.get_filters_config()
        
        # تطبيق المرشحات
        if filters_config:
            if filters_config.get('start_date'):
                start_date = filters_config['start_date']
            if filters_config.get('end_date'):
                end_date = filters_config['end_date']
        
        # تصدير البيانات بناءً على نوع التقرير
        if config.report_type == 'sales':
            return self.export_sales_to_excel(start_date, end_date, columns_config)
        elif config.report_type == 'expenses':
            return self.export_expenses_to_excel(start_date, end_date)
        elif config.report_type == 'comprehensive':
            return self.export_comprehensive_report(start_date, end_date)
        else:
            raise ValueError("Unsupported report type")
