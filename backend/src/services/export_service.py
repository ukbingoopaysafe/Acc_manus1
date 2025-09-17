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

class ExportService:
    def __init__(self):
        pass
    
    def export_sales_to_excel(self, start_date=None, end_date=None):
        """Export sales data to Excel"""
        from app import db
        
        query = Sale.query
        
        if start_date:
            query = query.filter(Sale.sale_date >= start_date)
        if end_date:
            query = query.filter(Sale.sale_date <= end_date)
        
        sales = query.all()
        
        # Prepare data
        data = []
        for sale in sales:
            data.append({
                'رقم المبيعة': sale.id,
                'تاريخ البيع': sale.sale_date.strftime('%Y-%m-%d'),
                'اسم العميل': sale.client_name,
                'هاتف العميل': sale.client_phone or '',
                'عنوان العميل': sale.client_address or '',
                'كود الوحدة': sale.unit.code if sale.unit else '',
                'نوع الوحدة': sale.unit.type if sale.unit else '',
                'سعر الوحدة': float(sale.unit_price),
                'عمولة الشركة': float(sale.company_commission),
                'عمولة السيلز': float(sale.sales_commission),
                'عمولة مدير المبيعات': float(sale.manager_commission),
                'إجمالي الضرائب': float(sale.total_taxes),
                'صافي المبلغ': float(sale.net_amount),
                'اسم السيلز': sale.sales_person_name or '',
                'اسم مدير المبيعات': sale.manager_name or '',
                'ملاحظات': sale.notes or '',
                'المستخدم': sale.user.username if sale.user else '',
                'تاريخ الإنشاء': sale.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Create Excel file
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='المبيعات', index=False)
            
            # Auto-adjust column widths
            worksheet = writer.sheets['المبيعات']
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
    
    def export_expenses_to_excel(self, start_date=None, end_date=None):
        """Export expenses data to Excel"""
        from app import db
        
        query = Expense.query
        
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
        
        expenses = query.all()
        
        # Prepare data
        data = []
        for expense in expenses:
            data.append({
                'رقم المصروف': expense.id,
                'تاريخ المصروف': expense.expense_date.strftime('%Y-%m-%d'),
                'الوصف': expense.description,
                'المبلغ': float(expense.amount),
                'فئة المصروف': expense.category.name if expense.category else '',
                'وصف الفئة': expense.category.description if expense.category else '',
                'ملاحظات': expense.notes or '',
                'المستخدم': expense.user.username if expense.user else '',
                'تاريخ الإنشاء': expense.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Create Excel file
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='المصروفات', index=False)
            
            # Auto-adjust column widths
            worksheet = writer.sheets['المصروفات']
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
    
    def export_rentals_to_excel(self, start_date=None, end_date=None):
        """Export rentals data to Excel"""
        from app import db
        
        query = Rental.query
        
        if start_date:
            query = query.filter(Rental.start_date >= start_date)
        if end_date:
            query = query.filter(Rental.start_date <= end_date)
        
        rentals = query.all()
        
        # Prepare rentals data
        rentals_data = []
        payments_data = []
        
        for rental in rentals:
            rentals_data.append({
                'رقم العقد': rental.id,
                'كود الوحدة': rental.unit.code if rental.unit else '',
                'نوع الوحدة': rental.unit.type if rental.unit else '',
                'اسم المستأجر': rental.tenant_name,
                'هاتف المستأجر': rental.tenant_phone or '',
                'عنوان المستأجر': rental.tenant_address or '',
                'تاريخ البداية': rental.start_date.strftime('%Y-%m-%d'),
                'تاريخ النهاية': rental.end_date.strftime('%Y-%m-%d') if rental.end_date else '',
                'الإيجار الشهري': float(rental.monthly_rent),
                'مبلغ التأمين': float(rental.security_deposit),
                'حالة العقد': rental.status,
                'ملاحظات': rental.notes or '',
                'المستخدم': rental.user.username if rental.user else '',
                'تاريخ الإنشاء': rental.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })
            
            # Add payments for this rental
            for payment in rental.payments:
                if start_date and payment.payment_date < start_date:
                    continue
                if end_date and payment.payment_date > end_date:
                    continue
                    
                payments_data.append({
                    'رقم الدفعة': payment.id,
                    'رقم العقد': rental.id,
                    'كود الوحدة': rental.unit.code if rental.unit else '',
                    'اسم المستأجر': rental.tenant_name,
                    'تاريخ الدفع': payment.payment_date.strftime('%Y-%m-%d'),
                    'المبلغ': float(payment.amount),
                    'طريقة الدفع': payment.payment_method or '',
                    'ملاحظات': payment.notes or '',
                    'المستخدم': payment.user.username if payment.user else '',
                    'تاريخ الإنشاء': payment.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })
        
        # Create DataFrames
        rentals_df = pd.DataFrame(rentals_data)
        payments_df = pd.DataFrame(payments_data)
        
        # Create Excel file
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            rentals_df.to_excel(writer, sheet_name='عقود الإيجار', index=False)
            payments_df.to_excel(writer, sheet_name='مدفوعات الإيجار', index=False)
            
            # Auto-adjust column widths for both sheets
            for sheet_name in ['عقود الإيجار', 'مدفوعات الإيجار']:
                worksheet = writer.sheets[sheet_name]
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
    
    def export_finishing_works_to_excel(self, start_date=None, end_date=None):
        """Export finishing works data to Excel"""
        from app import db
        
        query = FinishingWork.query
        
        if start_date:
            query = query.filter(FinishingWork.start_date >= start_date)
        if end_date:
            query = query.filter(FinishingWork.start_date <= end_date)
        
        works = query.all()
        
        # Prepare works data
        works_data = []
        expenses_data = []
        
        for work in works:
            works_data.append({
                'رقم المشروع': work.id,
                'اسم المشروع': work.project_name,
                'كود الوحدة': work.unit.code if work.unit else '',
                'نوع الوحدة': work.unit.type if work.unit else '',
                'تاريخ البداية': work.start_date.strftime('%Y-%m-%d'),
                'تاريخ النهاية': work.end_date.strftime('%Y-%m-%d') if work.end_date else '',
                'الميزانية': float(work.budget),
                'إجمالي المصروفات': float(work.total_expenses),
                'الحالة': work.status,
                'الوصف': work.description or '',
                'ملاحظات': work.notes or '',
                'المستخدم': work.user.username if work.user else '',
                'تاريخ الإنشاء': work.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })
            
            # Add expenses for this work
            for expense in work.expenses:
                if start_date and expense.expense_date < start_date:
                    continue
                if end_date and expense.expense_date > end_date:
                    continue
                    
                expenses_data.append({
                    'رقم المصروف': expense.id,
                    'رقم المشروع': work.id,
                    'اسم المشروع': work.project_name,
                    'كود الوحدة': work.unit.code if work.unit else '',
                    'تاريخ المصروف': expense.expense_date.strftime('%Y-%m-%d'),
                    'الوصف': expense.description,
                    'المبلغ': float(expense.amount),
                    'ملاحظات': expense.notes or '',
                    'المستخدم': expense.user.username if expense.user else '',
                    'تاريخ الإنشاء': expense.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })
        
        # Create DataFrames
        works_df = pd.DataFrame(works_data)
        expenses_df = pd.DataFrame(expenses_data)
        
        # Create Excel file
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            works_df.to_excel(writer, sheet_name='مشاريع التشطيب', index=False)
            expenses_df.to_excel(writer, sheet_name='مصروفات التشطيب', index=False)
            
            # Auto-adjust column widths for both sheets
            for sheet_name in ['مشاريع التشطيب', 'مصروفات التشطيب']:
                worksheet = writer.sheets[sheet_name]
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
    
    def export_units_to_excel(self):
        """Export units data to Excel"""
        from app import db
        
        units = Unit.query.all()
        
        # Prepare data
        data = []
        for unit in units:
            data.append({
                'رقم الوحدة': unit.id,
                'كود الوحدة': unit.code,
                'نوع الوحدة': unit.type,
                'المساحة': float(unit.area) if unit.area else '',
                'عدد الغرف': unit.bedrooms or '',
                'عدد الحمامات': unit.bathrooms or '',
                'الطابق': unit.floor or '',
                'العنوان': unit.address or '',
                'الوصف': unit.description or '',
                'السعر': float(unit.price) if unit.price else '',
                'الحالة': unit.status,
                'المستخدم': unit.user.username if unit.user else '',
                'تاريخ الإنشاء': unit.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Create Excel file
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='الوحدات', index=False)
            
            # Auto-adjust column widths
            worksheet = writer.sheets['الوحدات']
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
    
    def export_cashier_transactions_to_excel(self, start_date=None, end_date=None):
        """Export cashier transactions to Excel"""
        from app import db
        
        query = CashierTransaction.query
        
        if start_date:
            query = query.filter(CashierTransaction.transaction_date >= start_date)
        if end_date:
            query = query.filter(CashierTransaction.transaction_date <= end_date)
        
        transactions = query.order_by(CashierTransaction.transaction_date.desc()).all()
        
        # Prepare data
        data = []
        for transaction in transactions:
            data.append({
                'رقم المعاملة': transaction.id,
                'التاريخ': transaction.transaction_date.strftime('%Y-%m-%d'),
                'نوع المعاملة': transaction.transaction_type,
                'الوصف': transaction.description,
                'المبلغ': float(transaction.amount),
                'الرصيد قبل المعاملة': float(transaction.balance_before),
                'الرصيد بعد المعاملة': float(transaction.balance_after),
                'المرجع': transaction.reference_type or '',
                'رقم المرجع': transaction.reference_id or '',
                'المستخدم': transaction.user.username if transaction.user else '',
                'تاريخ الإنشاء': transaction.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Create Excel file
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='معاملات الخزنة', index=False)
            
            # Auto-adjust column widths
            worksheet = writer.sheets['معاملات الخزنة']
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
    
    def export_comprehensive_report(self, start_date=None, end_date=None):
        """Export comprehensive report with all data"""
        from app import db
        
        # Create Excel file with multiple sheets
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            
            # Sales data
            sales_buffer = self.export_sales_to_excel(start_date, end_date)
            sales_df = pd.read_excel(sales_buffer, sheet_name='المبيعات')
            sales_df.to_excel(writer, sheet_name='المبيعات', index=False)
            
            # Expenses data
            expenses_buffer = self.export_expenses_to_excel(start_date, end_date)
            expenses_df = pd.read_excel(expenses_buffer, sheet_name='المصروفات')
            expenses_df.to_excel(writer, sheet_name='المصروفات', index=False)
            
            # Rentals data
            rentals_buffer = self.export_rentals_to_excel(start_date, end_date)
            rentals_df = pd.read_excel(rentals_buffer, sheet_name='عقود الإيجار')
            payments_df = pd.read_excel(rentals_buffer, sheet_name='مدفوعات الإيجار')
            rentals_df.to_excel(writer, sheet_name='عقود الإيجار', index=False)
            payments_df.to_excel(writer, sheet_name='مدفوعات الإيجار', index=False)
            
            # Finishing works data
            finishing_buffer = self.export_finishing_works_to_excel(start_date, end_date)
            works_df = pd.read_excel(finishing_buffer, sheet_name='مشاريع التشطيب')
            finishing_expenses_df = pd.read_excel(finishing_buffer, sheet_name='مصروفات التشطيب')
            works_df.to_excel(writer, sheet_name='مشاريع التشطيب', index=False)
            finishing_expenses_df.to_excel(writer, sheet_name='مصروفات التشطيب', index=False)
            
            # Units data
            units_buffer = self.export_units_to_excel()
            units_df = pd.read_excel(units_buffer, sheet_name='الوحدات')
            units_df.to_excel(writer, sheet_name='الوحدات', index=False)
            
            # Cashier transactions
            cashier_buffer = self.export_cashier_transactions_to_excel(start_date, end_date)
            cashier_df = pd.read_excel(cashier_buffer, sheet_name='معاملات الخزنة')
            cashier_df.to_excel(writer, sheet_name='معاملات الخزنة', index=False)
            
            # Auto-adjust column widths for all sheets
            for sheet_name in writer.sheets:
                worksheet = writer.sheets[sheet_name]
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

