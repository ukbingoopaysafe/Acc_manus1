from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from src.services.print_service import PrintService
from src.services.export_service import ExportService
from src.models.settings import Template
from src.models.sales import Sale
from src.models.rentals import RentalPayment
from src.models.finishing_works import FinishingWork
from src.models.expenses import Expense
from src.utils.auth_utils import permission_required

print_export_bp = Blueprint('print_export', __name__)
print_service = PrintService()
export_service = ExportService()

# Print Routes
@print_export_bp.route('/print/invoice/sale/<int:sale_id>', methods=['GET'])
@jwt_required()
@permission_required('view_sales')
def print_sale_invoice(sale_id):
    """Generate and return invoice PDF for a sale"""
    try:
        # Get template if specified
        template_id = request.args.get('template_id')
        template_content = None
        
        if template_id:
            template = Template.query.get(template_id)
            if template and template.type == 'invoice':
                template_content = template.content
        
        # Prepare invoice data
        invoice_data = print_service.prepare_sale_invoice_data(sale_id)
        
        # Generate PDF
        pdf_buffer = print_service.generate_invoice_pdf(invoice_data, template_content)
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f'invoice_sale_{sale_id}.pdf',
            mimetype='application/pdf'
        )
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': 'فشل في إنشاء الفاتورة'}), 500

@print_export_bp.route('/print/receipt/rental/<int:payment_id>', methods=['GET'])
@jwt_required()
@permission_required('view_rentals')
def print_rental_receipt(payment_id):
    """Generate and return receipt PDF for a rental payment"""
    try:
        # Get template if specified
        template_id = request.args.get('template_id')
        template_content = None
        
        if template_id:
            template = InvoiceTemplate.query.get(template_id)
            if template and template.template_type == 'إيصال':
                template_content = template.template_content
        
        # Prepare receipt data
        receipt_data = print_service.prepare_rental_receipt_data(payment_id)
        
        # Generate PDF
        pdf_buffer = print_service.generate_receipt_pdf(receipt_data)
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f'receipt_rental_{payment_id}.pdf',
            mimetype='application/pdf'
        )
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': 'فشل في إنشاء الإيصال'}), 500

@print_export_bp.route('/print/check', methods=['POST'])
@jwt_required()
@permission_required('manage_finances')
def print_check():
    """Generate and return check PDF"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['check_number', 'pay_to', 'amount', 'date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'حقل {field} مطلوب'}), 400
        
        # Get template if specified
        template_id = data.get('template_id')
        template_content = None
        
        if template_id:
            template = InvoiceTemplate.query.get(template_id)
            if template and template.template_type == 'شيك':
                template_content = template.template_content
        
        # Prepare check data
        check_data = {
            'check_number': data['check_number'],
            'date': data['date'],
            'pay_to': data['pay_to'],
            'amount': float(data['amount']),
            'amount_in_words': print_service.number_to_words(float(data['amount'])),
            'bank_name': data.get('bank_name', ''),
            'account_number': data.get('account_number', ''),
            'memo': data.get('memo', '')
        }
        
        # Generate PDF
        pdf_buffer = print_service.generate_check_pdf(check_data, template_content)
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f'check_{data["check_number"]}.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': 'فشل في إنشاء الشيك'}), 500

@print_export_bp.route('/print/custom-invoice', methods=['POST'])
@jwt_required()
@permission_required('manage_finances')
def print_custom_invoice():
    """Generate and return custom invoice PDF"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['client_name', 'items', 'total']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'حقل {field} مطلوب'}), 400
        
        # Get template if specified
        template_id = data.get('template_id')
        template_content = None
        
        if template_id:
            template = Template.query.get(template_id)
            if template and template.type == 'invoice':
                template_content = template.content
        
        # Prepare invoice data
        invoice_data = {
            'invoice_number': data.get('invoice_number', f'CUSTOM-{datetime.now().strftime("%Y%m%d%H%M%S")}'),
            'date': data.get('date', datetime.now().strftime('%Y-%m-%d')),
            'client_name': data['client_name'],
            'client_phone': data.get('client_phone', ''),
            'client_address': data.get('client_address', ''),
            'unit_code': data.get('unit_code', ''),
            'items': data['items'],
            'subtotal': float(data.get('subtotal', data['total'])),
            'tax_amount': float(data.get('tax_amount', 0)),
            'total': float(data['total']),
            'notes': data.get('notes', 'شكراً لتعاملكم معنا')
        }
        
        # Generate PDF
        pdf_buffer = print_service.generate_invoice_pdf(invoice_data, template_content)
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f'invoice_{invoice_data["invoice_number"]}.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': 'فشل في إنشاء الفاتورة'}), 500

# Export Routes
@print_export_bp.route('/export/sales', methods=['GET'])
@jwt_required()
@permission_required('view_sales')
def export_sales():
    """Export sales data to Excel"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Convert string dates to datetime objects
        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else None
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else None
        
        # Generate Excel file
        excel_buffer = export_service.export_sales_to_excel(start_date_obj, end_date_obj)
        
        filename = f'sales_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        
        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        return jsonify({'error': 'فشل في تصدير بيانات المبيعات'}), 500

@print_export_bp.route('/export/expenses', methods=['GET'])
@jwt_required()
@permission_required('view_expenses')
def export_expenses():
    """Export expenses data to Excel"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Convert string dates to datetime objects
        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else None
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else None
        
        # Generate Excel file
        excel_buffer = export_service.export_expenses_to_excel(start_date_obj, end_date_obj)
        
        filename = f'expenses_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        
        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        return jsonify({'error': 'فشل في تصدير بيانات المصروفات'}), 500

@print_export_bp.route('/export/rentals', methods=['GET'])
@jwt_required()
@permission_required('view_rentals')
def export_rentals():
    """Export rentals data to Excel"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Convert string dates to datetime objects
        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else None
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else None
        
        # Generate Excel file
        excel_buffer = export_service.export_rentals_to_excel(start_date_obj, end_date_obj)
        
        filename = f'rentals_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        
        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        return jsonify({'error': 'فشل في تصدير بيانات الإيجارات'}), 500

@print_export_bp.route('/export/finishing-works', methods=['GET'])
@jwt_required()
@permission_required('view_finishing_works')
def export_finishing_works():
    """Export finishing works data to Excel"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Convert string dates to datetime objects
        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else None
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else None
        
        # Generate Excel file
        excel_buffer = export_service.export_finishing_works_to_excel(start_date_obj, end_date_obj)
        
        filename = f'finishing_works_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        
        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        return jsonify({'error': 'فشل في تصدير بيانات التشطيبات'}), 500

@print_export_bp.route('/export/units', methods=['GET'])
@jwt_required()
@permission_required('view_units')
def export_units():
    """Export units data to Excel"""
    try:
        # Generate Excel file
        excel_buffer = export_service.export_units_to_excel()
        
        filename = f'units_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        
        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        return jsonify({'error': 'فشل في تصدير بيانات الوحدات'}), 500

@print_export_bp.route('/export/cashier-transactions', methods=['GET'])
@jwt_required()
@permission_required('view_cashier')
def export_cashier_transactions():
    """Export cashier transactions to Excel"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Convert string dates to datetime objects
        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else None
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else None
        
        # Generate Excel file
        excel_buffer = export_service.export_cashier_transactions_to_excel(start_date_obj, end_date_obj)
        
        filename = f'cashier_transactions_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        
        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        return jsonify({'error': 'فشل في تصدير معاملات الخزنة'}), 500

@print_export_bp.route('/export/comprehensive-report', methods=['GET'])
@jwt_required()
@permission_required('view_reports')
def export_comprehensive_report():
    """Export comprehensive report with all data"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Convert string dates to datetime objects
        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else None
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else None
        
        # Generate Excel file
        excel_buffer = export_service.export_comprehensive_report(start_date_obj, end_date_obj)
        
        filename = f'comprehensive_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        
        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        return jsonify({'error': 'فشل في تصدير التقرير الشامل'}), 500

# Template preview routes
@print_export_bp.route('/print/preview/invoice', methods=['POST'])
@jwt_required()
@permission_required('manage_settings')
def preview_invoice_template():
    """Preview invoice template with sample data"""
    try:
        data = request.get_json()
        template_content = data.get('template_content')
        
        # Sample invoice data for preview
        sample_data = {
            'invoice_number': 'SAMPLE-001',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'client_name': 'عميل تجريبي',
            'client_phone': '01234567890',
            'client_address': 'عنوان تجريبي',
            'unit_code': 'UNIT-001',
            'items': [
                {
                    'description': 'خدمة تجريبية',
                    'quantity': 1,
                    'price': 1000,
                    'total': 1000
                }
            ],
            'subtotal': 1000,
            'tax_amount': 140,
            'total': 1140,
            'notes': 'هذه فاتورة تجريبية'
        }
        
        # Generate PDF
        pdf_buffer = print_service.generate_invoice_pdf(sample_data, template_content)
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name='invoice_preview.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': 'فشل في معاينة القالب'}), 500

@print_export_bp.route('/print/preview/check', methods=['POST'])
@jwt_required()
@permission_required('manage_settings')
def preview_check_template():
    """Preview check template with sample data"""
    try:
        data = request.get_json()
        template_content = data.get('template_content')
        
        # Sample check data for preview
        sample_data = {
            'check_number': 'CHK-001',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'pay_to': 'مستفيد تجريبي',
            'amount': 5000,
            'amount_in_words': 'خمسة آلاف جنيه',
            'bank_name': 'البنك التجريبي',
            'account_number': '1234567890',
            'memo': 'شيك تجريبي'
        }
        
        # Generate PDF
        pdf_buffer = print_service.generate_check_pdf(sample_data, template_content)
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name='check_preview.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': 'فشل في معاينة القالب'}), 500

