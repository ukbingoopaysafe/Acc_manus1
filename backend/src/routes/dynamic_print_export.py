from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from src.services.dynamic_print_service import DynamicPrintService
from src.services.dynamic_export_service import DynamicExportService
from src.models.dynamic_calculations import PrintTemplate, ReportConfiguration
from src.models.sales import Sale
from src.models.base import db
import json

dynamic_print_export_bp = Blueprint('dynamic_print_export', __name__)

@dynamic_print_export_bp.route('/print-templates', methods=['GET'])
@jwt_required()
def get_print_templates():
    """الحصول على جميع قوالب الطباعة"""
    try:
        templates = PrintTemplate.query.filter_by(is_active=True).all()
        
        templates_data = []
        for template in templates:
            templates_data.append({
                'id': template.id,
                'name_ar': template.name_ar,
                'name_en': template.name_en,
                'template_type': template.template_type,
                'is_default': template.is_default,
                'description_ar': template.description_ar,
                'description_en': template.description_en,
                'created_at': template.created_at.isoformat() if template.created_at else None
            })
        
        return jsonify({
            'success': True,
            'data': templates_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ في جلب قوالب الطباعة: {str(e)}'
        }), 500

@dynamic_print_export_bp.route('/print-templates', methods=['POST'])
@jwt_required()
def create_print_template():
    """إنشاء قالب طباعة جديد"""
    try:
        data = request.get_json()
        
        # التحقق من البيانات المطلوبة
        required_fields = ['name_ar', 'template_type', 'template_content']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'الحقل {field} مطلوب'
                }), 400
        
        # إنشاء القالب الجديد
        template = PrintTemplate(
            name_ar=data['name_ar'],
            name_en=data.get('name_en', ''),
            template_type=data['template_type'],
            template_content=json.dumps(data['template_content'], ensure_ascii=False),
            is_default=data.get('is_default', False),
            description_ar=data.get('description_ar', ''),
            description_en=data.get('description_en', '')
        )
        
        # إذا كان هذا القالب افتراضي، قم بإلغاء الافتراضية من القوالب الأخرى من نفس النوع
        if template.is_default:
            PrintTemplate.query.filter_by(
                template_type=template.template_type,
                is_default=True
            ).update({'is_default': False})
        
        template.save()
        
        return jsonify({
            'success': True,
            'message': 'تم إنشاء القالب بنجاح',
            'data': {
                'id': template.id,
                'name_ar': template.name_ar,
                'template_type': template.template_type
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ في إنشاء القالب: {str(e)}'
        }), 500

@dynamic_print_export_bp.route('/print-templates/<int:template_id>', methods=['GET'])
@jwt_required()
def get_print_template(template_id):
    """الحصول على تفاصيل قالب طباعة محدد"""
    try:
        template = PrintTemplate.query.get(template_id)
        if not template:
            return jsonify({
                'success': False,
                'message': 'القالب غير موجود'
            }), 404
        
        return jsonify({
            'success': True,
            'data': {
                'id': template.id,
                'name_ar': template.name_ar,
                'name_en': template.name_en,
                'template_type': template.template_type,
                'template_content': template.get_template_content(),
                'is_default': template.is_default,
                'description_ar': template.description_ar,
                'description_en': template.description_en,
                'created_at': template.created_at.isoformat() if template.created_at else None
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ في جلب القالب: {str(e)}'
        }), 500

@dynamic_print_export_bp.route('/print-templates/<int:template_id>', methods=['PUT'])
@jwt_required()
def update_print_template(template_id):
    """تحديث قالب طباعة"""
    try:
        template = PrintTemplate.query.get(template_id)
        if not template:
            return jsonify({
                'success': False,
                'message': 'القالب غير موجود'
            }), 404
        
        data = request.get_json()
        
        # تحديث البيانات
        if 'name_ar' in data:
            template.name_ar = data['name_ar']
        if 'name_en' in data:
            template.name_en = data['name_en']
        if 'template_content' in data:
            template.template_content = json.dumps(data['template_content'], ensure_ascii=False)
        if 'description_ar' in data:
            template.description_ar = data['description_ar']
        if 'description_en' in data:
            template.description_en = data['description_en']
        
        # التعامل مع الافتراضية
        if 'is_default' in data and data['is_default']:
            PrintTemplate.query.filter_by(
                template_type=template.template_type,
                is_default=True
            ).update({'is_default': False})
            template.is_default = True
        
        template.save()
        
        return jsonify({
            'success': True,
            'message': 'تم تحديث القالب بنجاح'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ في تحديث القالب: {str(e)}'
        }), 500

@dynamic_print_export_bp.route('/print-templates/<int:template_id>', methods=['DELETE'])
@jwt_required()
def delete_print_template(template_id):
    """حذف قالب طباعة"""
    try:
        template = PrintTemplate.query.get(template_id)
        if not template:
            return jsonify({
                'success': False,
                'message': 'القالب غير موجود'
            }), 404
        
        template.is_active = False
        template.save()
        
        return jsonify({
            'success': True,
            'message': 'تم حذف القالب بنجاح'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ في حذف القالب: {str(e)}'
        }), 500

@dynamic_print_export_bp.route('/generate-invoice/<int:sale_id>', methods=['POST'])
@jwt_required()
def generate_invoice(sale_id):
    """إنتاج فاتورة PDF"""
    try:
        data = request.get_json() or {}
        template_id = data.get('template_id')
        
        print_service = DynamicPrintService()
        pdf_buffer = print_service.generate_dynamic_invoice(sale_id, template_id)
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f'invoice_{sale_id}.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ في إنتاج الفاتورة: {str(e)}'
        }), 500

@dynamic_print_export_bp.route('/generate-check', methods=['POST'])
@jwt_required()
def generate_check():
    """إنتاج شيك PDF"""
    try:
        data = request.get_json()
        
        # التحقق من البيانات المطلوبة
        required_fields = ['payee', 'amount', 'date']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'الحقل {field} مطلوب'
                }), 400
        
        template_id = data.get('template_id')
        check_data = {
            'payee': data['payee'],
            'amount': float(data['amount']),
            'date': data['date'],
            'amount_in_words': data.get('amount_in_words', ''),
            'memo': data.get('memo', '')
        }
        
        print_service = DynamicPrintService()
        pdf_buffer = print_service.generate_check_pdf(check_data, template_id)
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f'check_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ في إنتاج الشيك: {str(e)}'
        }), 500

@dynamic_print_export_bp.route('/export-sales', methods=['POST'])
@jwt_required()
def export_sales():
    """تصدير بيانات المبيعات إلى Excel"""
    try:
        data = request.get_json() or {}
        
        start_date = None
        end_date = None
        
        if data.get('start_date'):
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if data.get('end_date'):
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        
        columns_config = data.get('columns_config')
        
        export_service = DynamicExportService()
        excel_buffer = export_service.export_sales_to_excel(start_date, end_date, columns_config)
        
        filename = f'sales_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        
        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ في تصدير المبيعات: {str(e)}'
        }), 500

@dynamic_print_export_bp.route('/export-expenses', methods=['POST'])
@jwt_required()
def export_expenses():
    """تصدير بيانات المصروفات إلى Excel"""
    try:
        data = request.get_json() or {}
        
        start_date = None
        end_date = None
        
        if data.get('start_date'):
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if data.get('end_date'):
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        
        category_id = data.get('category_id')
        
        export_service = DynamicExportService()
        excel_buffer = export_service.export_expenses_to_excel(start_date, end_date, category_id)
        
        filename = f'expenses_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        
        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ في تصدير المصروفات: {str(e)}'
        }), 500

@dynamic_print_export_bp.route('/export-comprehensive', methods=['POST'])
@jwt_required()
def export_comprehensive():
    """تصدير تقرير شامل إلى Excel"""
    try:
        data = request.get_json() or {}
        
        start_date = None
        end_date = None
        
        if data.get('start_date'):
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if data.get('end_date'):
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        
        export_service = DynamicExportService()
        excel_buffer = export_service.export_comprehensive_report(start_date, end_date)
        
        filename = f'comprehensive_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        
        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ في تصدير التقرير الشامل: {str(e)}'
        }), 500

@dynamic_print_export_bp.route('/report-configurations', methods=['GET'])
@jwt_required()
def get_report_configurations():
    """الحصول على تكوينات التقارير المحفوظة"""
    try:
        configs = ReportConfiguration.query.filter_by(is_active=True).all()
        
        configs_data = []
        for config in configs:
            configs_data.append({
                'id': config.id,
                'name_ar': config.name_ar,
                'name_en': config.name_en,
                'report_type': config.report_type,
                'description_ar': config.description_ar,
                'created_at': config.created_at.isoformat() if config.created_at else None
            })
        
        return jsonify({
            'success': True,
            'data': configs_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ في جلب تكوينات التقارير: {str(e)}'
        }), 500

@dynamic_print_export_bp.route('/report-configurations', methods=['POST'])
@jwt_required()
def create_report_configuration():
    """إنشاء تكوين تقرير جديد"""
    try:
        data = request.get_json()
        
        # التحقق من البيانات المطلوبة
        required_fields = ['name_ar', 'report_type', 'columns_config']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'الحقل {field} مطلوب'
                }), 400
        
        # إنشاء التكوين الجديد
        config = ReportConfiguration(
            name_ar=data['name_ar'],
            name_en=data.get('name_en', ''),
            report_type=data['report_type'],
            columns_config=json.dumps(data['columns_config'], ensure_ascii=False),
            filters_config=json.dumps(data.get('filters_config', {}), ensure_ascii=False),
            description_ar=data.get('description_ar', ''),
            description_en=data.get('description_en', '')
        )
        
        config.save()
        
        return jsonify({
            'success': True,
            'message': 'تم إنشاء تكوين التقرير بنجاح',
            'data': {
                'id': config.id,
                'name_ar': config.name_ar,
                'report_type': config.report_type
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ في إنشاء تكوين التقرير: {str(e)}'
        }), 500

@dynamic_print_export_bp.route('/export-custom/<int:config_id>', methods=['POST'])
@jwt_required()
def export_custom_report(config_id):
    """تصدير تقرير مخصص بناءً على التكوين المحفوظ"""
    try:
        data = request.get_json() or {}
        
        start_date = None
        end_date = None
        
        if data.get('start_date'):
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if data.get('end_date'):
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        
        export_service = DynamicExportService()
        excel_buffer = export_service.export_custom_report(config_id, start_date, end_date)
        
        filename = f'custom_report_{config_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        
        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ في تصدير التقرير المخصص: {str(e)}'
        }), 500

@dynamic_print_export_bp.route('/initialize-default-templates', methods=['POST'])
@jwt_required()
def initialize_default_templates():
    """تهيئة القوالب الافتراضية"""
    try:
        print_service = DynamicPrintService()
        default_templates = print_service.create_default_templates()
        
        created_count = 0
        
        for template_type, template_content in default_templates.items():
            # التحقق من وجود قالب افتراضي من هذا النوع
            existing_template = PrintTemplate.query.filter_by(
                template_type=template_type,
                is_default=True,
                is_active=True
            ).first()
            
            if not existing_template:
                template = PrintTemplate(
                    name_ar=template_content['template_name']['ar'],
                    name_en=template_content['template_name']['en'],
                    template_type=template_type,
                    template_content=json.dumps(template_content, ensure_ascii=False),
                    is_default=True,
                    description_ar=f"القالب الافتراضي لـ {template_content['template_name']['ar']}",
                    description_en=f"Default template for {template_content['template_name']['en']}"
                )
                template.save()
                created_count += 1
        
        return jsonify({
            'success': True,
            'message': f'تم إنشاء {created_count} قالب افتراضي'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ في تهيئة القوالب الافتراضية: {str(e)}'
        }), 500
