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
import json
from datetime import datetime
from src.models.dynamic_calculations import PrintTemplate
from src.models.sales import Sale
from src.models.rentals import RentalPayment
from src.models.finishing_works import FinishingWork
from src.models.expenses import Expense
from src.models.units import Unit
from src.models.user import User

class DynamicPrintService:
    """خدمة الطباعة الديناميكية مع دعم القوالب القابلة للتخصيص"""
    
    def __init__(self):
        self.setup_fonts()
        
    def setup_fonts(self):
        """إعداد الخطوط العربية لإنتاج PDF"""
        try:
            # يمكن إضافة ملفات الخطوط العربية هنا
            pass
        except:
            pass
    
    def generate_dynamic_invoice(self, sale_id, template_id=None):
        """إنتاج فاتورة باستخدام القالب الديناميكي"""
        
        # الحصول على بيانات المبيعة
        sale = Sale.query.get(sale_id)
        if not sale:
            raise ValueError("Sale not found")
        
        # الحصول على القالب
        if template_id:
            template = PrintTemplate.query.get(template_id)
        else:
            template = PrintTemplate.query.filter_by(
                template_type='invoice',
                is_default=True,
                is_active=True
            ).first()
        
        if not template:
            # استخدام قالب افتراضي بسيط
            return self.generate_simple_invoice(sale)
        
        template_content = template.get_template_content()
        
        # إنشاء PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        elements = []
        styles = getSampleStyleSheet()
        
        # إنشاء الأنماط المخصصة
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
        
        # بناء المحتوى بناءً على القالب
        if 'header' in template_content:
            elements.extend(self._build_header_section(template_content['header'], sale, title_style, header_style))
        
        if 'client_info' in template_content:
            elements.extend(self._build_client_info_section(template_content['client_info'], sale, header_style))
        
        if 'items_table' in template_content and template_content['items_table'].get('visible', True):
            elements.extend(self._build_items_table(template_content['items_table'], sale))
        
        if 'summary' in template_content:
            elements.extend(self._build_summary_section(template_content['summary'], sale, header_style))
        
        # إضافة تذييل
        elements.append(Spacer(1, 0.5*inch))
        footer_text = f"تم إنشاء هذه الفاتورة في {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        elements.append(Paragraph(footer_text, styles['Normal']))
        
        # بناء PDF
        doc.build(elements)
        buffer.seek(0)
        
        return buffer
    
    def _build_header_section(self, header_config, sale, title_style, header_style):
        """بناء قسم الرأس"""
        elements = []
        
        for field in header_config:
            if not field.get('visible', True):
                continue
                
            if field['type'] == 'text':
                text = field.get('value', '')
                style = title_style if 'company_name' in field.get('field', '') else header_style
                elements.append(Paragraph(text, style))
                
            elif field['type'] == 'data':
                value = self._get_field_value(field['source'], sale)
                label = field.get('label', {}).get('ar', field.get('field', ''))
                text = f"{label}: {value}"
                elements.append(Paragraph(text, header_style))
        
        elements.append(Spacer(1, 0.3*inch))
        return elements
    
    def _build_client_info_section(self, client_config, sale, header_style):
        """بناء قسم معلومات العميل"""
        elements = []
        elements.append(Paragraph("معلومات العميل", header_style))
        
        for field in client_config:
            if not field.get('visible', True):
                continue
                
            value = self._get_field_value(field['source'], sale)
            label = field.get('label', {}).get('ar', field.get('field', ''))
            text = f"{label}: {value}"
            elements.append(Paragraph(text, header_style))
        
        elements.append(Spacer(1, 0.2*inch))
        return elements
    
    def _build_items_table(self, table_config, sale):
        """بناء جدول العناصر"""
        elements = []
        
        # إعداد البيانات
        data = []
        
        # رأس الجدول
        headers = []
        for col in table_config.get('columns', []):
            if col.get('visible', True):
                headers.append(col.get('label', {}).get('ar', col.get('field', '')))
        
        if headers:
            data.append(headers)
            
            # صف البيانات
            row = []
            for col in table_config.get('columns', []):
                if col.get('visible', True):
                    if col['type'] == 'data':
                        value = self._get_field_value(col['source'], sale)
                    elif col['type'] == 'static':
                        value = col.get('value', '')
                    else:
                        value = ''
                    row.append(str(value))
            
            if row:
                data.append(row)
        
        if data:
            # إنشاء الجدول
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            elements.append(table)
            elements.append(Spacer(1, 0.3*inch))
        
        return elements
    
    def _build_summary_section(self, summary_config, sale, header_style):
        """بناء قسم الملخص"""
        elements = []
        elements.append(Paragraph("ملخص الفاتورة", header_style))
        
        for field in summary_config:
            if not field.get('visible', True):
                continue
                
            value = self._get_field_value(field['source'], sale)
            label = field.get('label', {}).get('ar', field.get('field', ''))
            
            # تنسيق المبالغ المالية
            if isinstance(value, (int, float)):
                value = f"{value:,.2f} جنيه"
            
            text = f"{label}: {value}"
            elements.append(Paragraph(text, header_style))
        
        return elements
    
    def _get_field_value(self, source, sale):
        """الحصول على قيمة الحقل من المصدر"""
        try:
            if source.startswith('sale.'):
                field_name = source.replace('sale.', '')
                value = getattr(sale, field_name, '')
                
                # تنسيق التواريخ
                if hasattr(value, 'strftime'):
                    return value.strftime('%Y-%m-%d')
                
                return value
                
            elif source.startswith('unit.'):
                field_name = source.replace('unit.', '')
                if hasattr(sale, 'unit') and sale.unit:
                    value = getattr(sale.unit, field_name, '')
                    return value
                
            elif source.startswith('salesperson.'):
                field_name = source.replace('salesperson.', '')
                if hasattr(sale, 'salesperson') and sale.salesperson:
                    value = getattr(sale.salesperson, field_name, '')
                    return value
            
            return ''
            
        except Exception as e:
            print(f"Error getting field value for {source}: {e}")
            return ''
    
    def generate_simple_invoice(self, sale):
        """إنتاج فاتورة بسيطة افتراضية"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        elements = []
        styles = getSampleStyleSheet()
        
        # العنوان
        title = Paragraph("فاتورة مبيعات", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 0.3*inch))
        
        # معلومات الفاتورة
        invoice_info = [
            f"رقم الفاتورة: {sale.id}",
            f"تاريخ الفاتورة: {sale.sale_date}",
            f"اسم العميل: {sale.client_name}",
        ]
        
        for info in invoice_info:
            elements.append(Paragraph(info, styles['Normal']))
        
        elements.append(Spacer(1, 0.3*inch))
        
        # جدول التفاصيل
        data = [
            ['الوصف', 'السعر', 'الكمية', 'المجموع'],
            [f"وحدة رقم {sale.unit.code if sale.unit else 'غير محدد'}", 
             f"{sale.sale_price:,.2f}", '1', f"{sale.sale_price:,.2f}"]
        ]
        
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 0.3*inch))
        
        # الملخص
        summary_data = [
            ['المجموع الفرعي', f"{sale.sale_price:,.2f} جنيه"],
            ['إجمالي الضرائب', f"{sale.total_taxes:,.2f} جنيه"],
            ['صافي المبلغ', f"{sale.net_company_revenue:,.2f} جنيه"]
        ]
        
        for item in summary_data:
            elements.append(Paragraph(f"{item[0]}: {item[1]}", styles['Normal']))
        
        doc.build(elements)
        buffer.seek(0)
        
        return buffer
    
    def generate_check_pdf(self, check_data, template_id=None):
        """إنتاج شيك باستخدام القالب الديناميكي"""
        
        # الحصول على القالب
        if template_id:
            template = PrintTemplate.query.get(template_id)
        else:
            template = PrintTemplate.query.filter_by(
                template_type='check',
                is_default=True,
                is_active=True
            ).first()
        
        if not template:
            return self.generate_simple_check(check_data)
        
        template_content = template.get_template_content()
        
        # إنشاء PDF للشيك
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        elements = []
        styles = getSampleStyleSheet()
        
        # بناء الشيك بناءً على القالب
        check_style = ParagraphStyle(
            'CheckStyle',
            parent=styles['Normal'],
            fontSize=14,
            spaceAfter=20,
            alignment=TA_RIGHT,
        )
        
        # إضافة حقول الشيك
        elements.append(Paragraph("شيك", styles['Title']))
        elements.append(Spacer(1, 0.5*inch))
        
        # التاريخ
        if check_data.get('date'):
            elements.append(Paragraph(f"التاريخ: {check_data['date']}", check_style))
        
        # المستفيد
        if check_data.get('payee'):
            elements.append(Paragraph(f"ادفعوا لأمر: {check_data['payee']}", check_style))
        
        # المبلغ بالأرقام
        if check_data.get('amount'):
            elements.append(Paragraph(f"مبلغ: {check_data['amount']:,.2f} جنيه", check_style))
        
        # المبلغ بالحروف
        if check_data.get('amount_in_words'):
            elements.append(Paragraph(f"فقط: {check_data['amount_in_words']}", check_style))
        
        # الملاحظات
        if check_data.get('memo'):
            elements.append(Paragraph(f"ملاحظات: {check_data['memo']}", check_style))
        
        doc.build(elements)
        buffer.seek(0)
        
        return buffer
    
    def generate_simple_check(self, check_data):
        """إنتاج شيك بسيط افتراضي"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        elements = []
        styles = getSampleStyleSheet()
        
        elements.append(Paragraph("شيك", styles['Title']))
        elements.append(Spacer(1, 0.5*inch))
        
        check_fields = [
            f"التاريخ: {check_data.get('date', '')}",
            f"ادفعوا لأمر: {check_data.get('payee', '')}",
            f"مبلغ: {check_data.get('amount', 0):,.2f} جنيه",
            f"فقط: {check_data.get('amount_in_words', '')}",
            f"ملاحظات: {check_data.get('memo', '')}"
        ]
        
        for field in check_fields:
            elements.append(Paragraph(field, styles['Normal']))
            elements.append(Spacer(1, 0.2*inch))
        
        doc.build(elements)
        buffer.seek(0)
        
        return buffer
    
    def create_default_templates(self):
        """إنشاء القوالب الافتراضية"""
        
        # قالب الفاتورة الافتراضي
        invoice_template = {
            "template_name": {
                "ar": "فاتورة مبيعات افتراضية",
                "en": "Default Sales Invoice"
            },
            "header": [
                {
                    "field": "company_name",
                    "type": "text",
                    "label": {"ar": "اسم الشركة", "en": "Company Name"},
                    "value": "Broman Real Estate",
                    "visible": True
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
                        "source": "unit.code",
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
        
        # قالب الشيك الافتراضي
        check_template = {
            "template_name": {
                "ar": "شيك افتراضي",
                "en": "Default Check"
            },
            "fields": [
                {
                    "field": "date",
                    "label": {"ar": "التاريخ", "en": "Date"},
                    "visible": True,
                    "required": True
                },
                {
                    "field": "payee",
                    "label": {"ar": "المستفيد", "en": "Payee"},
                    "visible": True,
                    "required": True
                },
                {
                    "field": "amount",
                    "label": {"ar": "المبلغ", "en": "Amount"},
                    "visible": True,
                    "required": True
                },
                {
                    "field": "amount_in_words",
                    "label": {"ar": "المبلغ بالحروف", "en": "Amount in Words"},
                    "visible": True,
                    "required": False
                },
                {
                    "field": "memo",
                    "label": {"ar": "ملاحظات", "en": "Memo"},
                    "visible": True,
                    "required": False
                }
            ]
        }
        
        return {
            'invoice': invoice_template,
            'check': check_template
        }
