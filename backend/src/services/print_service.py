from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
import os
from datetime import datetime
from src.models.settings import Template
from src.models.sales import Sale
from src.models.rentals import RentalPayment
from src.models.finishing_works import FinishingWork
from src.models.expenses import Expense

class PrintService:
    def __init__(self):
        self.setup_fonts()
        
    def setup_fonts(self):
        """Setup Arabic fonts for PDF generation"""
        try:
            # Try to register Arabic font (you may need to add font files)
            # For now, we'll use default fonts
            pass
        except:
            pass
    
    def generate_invoice_pdf(self, invoice_data, template_content=None):
        """Generate invoice PDF"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
        )
        
        header_style = ParagraphStyle(
            'CustomHeader',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=12,
            alignment=TA_RIGHT,
        )
        
        # Company header
        elements.append(Paragraph("Broman Real Estate", title_style))
        elements.append(Paragraph("شركة برومان للوساطة العقارية", header_style))
        elements.append(Spacer(1, 12))
        
        # Invoice title
        elements.append(Paragraph(f"فاتورة رقم: {invoice_data.get('invoice_number', 'N/A')}", title_style))
        elements.append(Spacer(1, 12))
        
        # Invoice details table
        invoice_details = [
            ['التاريخ:', invoice_data.get('date', datetime.now().strftime('%Y-%m-%d'))],
            ['العميل:', invoice_data.get('client_name', '')],
            ['رقم الهاتف:', invoice_data.get('client_phone', '')],
            ['العنوان:', invoice_data.get('client_address', '')],
        ]
        
        if invoice_data.get('unit_code'):
            invoice_details.append(['كود الوحدة:', invoice_data.get('unit_code')])
        
        details_table = Table(invoice_details, colWidths=[2*inch, 4*inch])
        details_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        
        elements.append(details_table)
        elements.append(Spacer(1, 20))
        
        # Items table
        items_data = [['البيان', 'الكمية', 'السعر', 'المجموع']]
        
        for item in invoice_data.get('items', []):
            items_data.append([
                item.get('description', ''),
                str(item.get('quantity', 1)),
                f"{item.get('price', 0):,.2f} جنيه",
                f"{item.get('total', 0):,.2f} جنيه"
            ])
        
        # Add totals
        subtotal = invoice_data.get('subtotal', 0)
        tax_amount = invoice_data.get('tax_amount', 0)
        total = invoice_data.get('total', 0)
        
        items_data.extend([
            ['', '', 'المجموع الفرعي:', f"{subtotal:,.2f} جنيه"],
            ['', '', 'الضرائب:', f"{tax_amount:,.2f} جنيه"],
            ['', '', 'الإجمالي:', f"{total:,.2f} جنيه"],
        ])
        
        items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            # Highlight totals
            ('BACKGROUND', (0, -3), (-1, -1), colors.lightgrey),
            ('FONTNAME', (0, -3), (-1, -1), 'Helvetica-Bold'),
        ]))
        
        elements.append(items_table)
        elements.append(Spacer(1, 30))
        
        # Footer
        footer_text = invoice_data.get('notes', 'شكراً لتعاملكم معنا')
        elements.append(Paragraph(footer_text, header_style))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    def generate_check_pdf(self, check_data, template_content=None):
        """Generate check PDF"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        elements = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CheckTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=TA_CENTER,
        )
        
        normal_style = ParagraphStyle(
            'CheckNormal',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=12,
            alignment=TA_RIGHT,
        )
        
        # Check header
        elements.append(Paragraph("شيك", title_style))
        elements.append(Spacer(1, 20))
        
        # Check details
        check_details = [
            ['رقم الشيك:', check_data.get('check_number', '')],
            ['التاريخ:', check_data.get('date', datetime.now().strftime('%Y-%m-%d'))],
            ['ادفعوا لأمر:', check_data.get('pay_to', '')],
            ['مبلغ وقدره:', f"{check_data.get('amount', 0):,.2f} جنيه"],
            ['المبلغ بالحروف:', check_data.get('amount_in_words', '')],
            ['البنك:', check_data.get('bank_name', '')],
            ['رقم الحساب:', check_data.get('account_number', '')],
        ]
        
        for detail in check_details:
            elements.append(Paragraph(f"<b>{detail[0]}</b> {detail[1]}", normal_style))
        
        elements.append(Spacer(1, 30))
        
        # Signature area
        elements.append(Paragraph("التوقيع: ____________________", normal_style))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    def generate_receipt_pdf(self, receipt_data):
        """Generate receipt PDF"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        elements = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'ReceiptTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=TA_CENTER,
        )
        
        normal_style = ParagraphStyle(
            'ReceiptNormal',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=12,
            alignment=TA_RIGHT,
        )
        
        # Receipt header
        elements.append(Paragraph("Broman Real Estate", title_style))
        elements.append(Paragraph("إيصال استلام", title_style))
        elements.append(Spacer(1, 20))
        
        # Receipt details
        receipt_details = [
            ['رقم الإيصال:', receipt_data.get('receipt_number', '')],
            ['التاريخ:', receipt_data.get('date', datetime.now().strftime('%Y-%m-%d'))],
            ['استلمنا من السيد/ة:', receipt_data.get('received_from', '')],
            ['مبلغ وقدره:', f"{receipt_data.get('amount', 0):,.2f} جنيه"],
            ['المبلغ بالحروف:', receipt_data.get('amount_in_words', '')],
            ['وذلك عن:', receipt_data.get('description', '')],
            ['طريقة الدفع:', receipt_data.get('payment_method', 'نقداً')],
        ]
        
        for detail in receipt_details:
            elements.append(Paragraph(f"<b>{detail[0]}</b> {detail[1]}", normal_style))
        
        elements.append(Spacer(1, 30))
        
        # Signature area
        elements.append(Paragraph("المستلم: ____________________", normal_style))
        elements.append(Paragraph("التوقيع: ____________________", normal_style))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    def prepare_sale_invoice_data(self, sale_id):
        """Prepare invoice data for a sale"""
        from app import db
        
        sale = Sale.query.get(sale_id)
        if not sale:
            raise ValueError("Sale not found")
        
        invoice_data = {
            'invoice_number': f"INV-{sale.id:06d}",
            'date': sale.sale_date.strftime('%Y-%m-%d'),
            'client_name': sale.client_name,
            'client_phone': sale.client_phone or '',
            'client_address': sale.client_address or '',
            'unit_code': sale.unit.code if sale.unit else '',
            'items': [
                {
                    'description': f"بيع وحدة {sale.unit.code} - {sale.unit.type}" if sale.unit else 'بيع وحدة',
                    'quantity': 1,
                    'price': float(sale.unit_price),
                    'total': float(sale.unit_price)
                }
            ],
            'subtotal': float(sale.unit_price),
            'tax_amount': float(sale.total_taxes),
            'total': float(sale.net_amount),
            'notes': sale.notes or 'شكراً لتعاملكم معنا'
        }
        
        return invoice_data
    
    def prepare_rental_receipt_data(self, payment_id):
        """Prepare receipt data for a rental payment"""
        from app import db
        
        payment = RentalPayment.query.get(payment_id)
        if not payment:
            raise ValueError("Payment not found")
        
        receipt_data = {
            'receipt_number': f"REC-{payment.id:06d}",
            'date': payment.payment_date.strftime('%Y-%m-%d'),
            'received_from': payment.rental.tenant_name,
            'amount': float(payment.amount),
            'amount_in_words': self.number_to_words(float(payment.amount)),
            'description': f"دفعة إيجار للوحدة {payment.rental.unit.code}" if payment.rental.unit else 'دفعة إيجار',
            'payment_method': payment.payment_method or 'نقداً'
        }
        
        return receipt_data
    
    def number_to_words(self, number):
        """Convert number to Arabic words (simplified version)"""
        # This is a simplified version - you might want to use a proper library
        ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة']
        tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون']
        
        if number == 0:
            return 'صفر'
        
        if number < 10:
            return ones[int(number)]
        elif number < 100:
            return f"{tens[int(number // 10)]} {ones[int(number % 10)]}"
        else:
            # For larger numbers, return the number itself
            return f"{int(number)} جنيه"
    
    def apply_template(self, template_content, data):
        """Apply template variables to content"""
        if not template_content:
            return template_content
        
        # Replace template variables
        for key, value in data.items():
            placeholder = f"{{{key}}}"
            template_content = template_content.replace(placeholder, str(value))
        
        return template_content

