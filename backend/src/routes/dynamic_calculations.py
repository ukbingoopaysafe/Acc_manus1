from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.dynamic_calculations import CalculationRule, CustomField, PrintTemplate, ReportConfiguration
from src.models.user import User
from src.services.dynamic_calculation_service import DynamicCalculationService

dynamic_calculations_bp = Blueprint('dynamic_calculations', __name__)

# ==================== Calculation Rules ====================

@dynamic_calculations_bp.route('/calculation-rules', methods=['GET'])
@jwt_required()
def get_calculation_rules():
    """الحصول على جميع قواعد الحساب"""
    try:
        rules = CalculationRule.query.order_by(CalculationRule.order_index).all()
        return jsonify({
            'success': True,
            'data': [rule.to_dict() for rule in rules]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@dynamic_calculations_bp.route('/calculation-rules', methods=['POST'])
@jwt_required()
def create_calculation_rule():
    """إنشاء قاعدة حساب جديدة"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if user.role != 'admin':
            return jsonify({'success': False, 'message': 'Access denied. Admin role required.'}), 403
        
        data = request.get_json()
        
        # التحقق من البيانات المطلوبة
        required_fields = ['name_ar', 'name_en', 'rule_type', 'calculation_type', 'value', 'applies_to']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
        
        rule = CalculationRule(
            name_ar=data['name_ar'],
            name_en=data['name_en'],
            rule_type=data['rule_type'],
            calculation_type=data['calculation_type'],
            value=data['value'],
            applies_to=data['applies_to'],
            order_index=data.get('order_index', 0),
            description_ar=data.get('description_ar', ''),
            description_en=data.get('description_en', ''),
            is_active=data.get('is_active', True)
        )
        
        if 'unit_type_filter' in data:
            rule.set_unit_type_filter(data['unit_type_filter'])
        
        rule.save()
        
        return jsonify({
            'success': True,
            'message': 'Calculation rule created successfully',
            'data': rule.to_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@dynamic_calculations_bp.route('/calculation-rules/<int:rule_id>', methods=['PUT'])
@jwt_required()
def update_calculation_rule(rule_id):
    """تحديث قاعدة حساب"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if user.role != 'admin':
            return jsonify({'success': False, 'message': 'Access denied. Admin role required.'}), 403
        
        rule = CalculationRule.query.get_or_404(rule_id)
        data = request.get_json()
        
        # تحديث الحقول
        updateable_fields = ['name_ar', 'name_en', 'rule_type', 'calculation_type', 'value', 
                           'applies_to', 'order_index', 'description_ar', 'description_en', 'is_active']
        
        for field in updateable_fields:
            if field in data:
                setattr(rule, field, data[field])
        
        if 'unit_type_filter' in data:
            rule.set_unit_type_filter(data['unit_type_filter'])
        
        rule.save()
        
        return jsonify({
            'success': True,
            'message': 'Calculation rule updated successfully',
            'data': rule.to_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@dynamic_calculations_bp.route('/calculation-rules/<int:rule_id>', methods=['DELETE'])
@jwt_required()
def delete_calculation_rule(rule_id):
    """حذف قاعدة حساب"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if user.role != 'admin':
            return jsonify({'success': False, 'message': 'Access denied. Admin role required.'}), 403
        
        rule = CalculationRule.query.get_or_404(rule_id)
        rule.delete()
        
        return jsonify({
            'success': True,
            'message': 'Calculation rule deleted successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== Custom Fields ====================

@dynamic_calculations_bp.route('/custom-fields/<entity_type>', methods=['GET'])
@jwt_required()
def get_custom_fields(entity_type):
    """الحصول على الحقول المخصصة لكيان معين"""
    try:
        fields = CustomField.query.filter_by(
            entity_type=entity_type,
            is_active=True
        ).order_by(CustomField.order_index).all()
        
        return jsonify({
            'success': True,
            'data': [field.to_dict() for field in fields]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@dynamic_calculations_bp.route('/custom-fields', methods=['POST'])
@jwt_required()
def create_custom_field():
    """إنشاء حقل مخصص جديد"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if user.role != 'admin':
            return jsonify({'success': False, 'message': 'Access denied. Admin role required.'}), 403
        
        data = request.get_json()
        
        required_fields = ['entity_type', 'field_name', 'field_label_ar', 'field_label_en', 'field_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
        
        custom_field = CustomField(
            entity_type=data['entity_type'],
            field_name=data['field_name'],
            field_label_ar=data['field_label_ar'],
            field_label_en=data['field_label_en'],
            field_type=data['field_type'],
            is_required=data.get('is_required', False),
            order_index=data.get('order_index', 0)
        )
        
        if 'field_options' in data:
            custom_field.set_field_options(data['field_options'])
        
        custom_field.save()
        
        return jsonify({
            'success': True,
            'message': 'Custom field created successfully',
            'data': custom_field.to_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== Print Templates ====================

@dynamic_calculations_bp.route('/print-templates/<template_type>', methods=['GET'])
@jwt_required()
def get_print_templates(template_type):
    """الحصول على قوالب الطباعة لنوع معين"""
    try:
        templates = PrintTemplate.query.filter_by(
            template_type=template_type,
            is_active=True
        ).all()
        
        return jsonify({
            'success': True,
            'data': [template.to_dict() for template in templates]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@dynamic_calculations_bp.route('/print-templates', methods=['POST'])
@jwt_required()
def create_print_template():
    """إنشاء قالب طباعة جديد"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if user.role != 'admin':
            return jsonify({'success': False, 'message': 'Access denied. Admin role required.'}), 403
        
        data = request.get_json()
        
        required_fields = ['name_ar', 'name_en', 'template_type', 'template_content']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
        
        template = PrintTemplate(
            name_ar=data['name_ar'],
            name_en=data['name_en'],
            template_type=data['template_type'],
            is_default=data.get('is_default', False)
        )
        
        template.set_template_content(data['template_content'])
        template.save()
        
        return jsonify({
            'success': True,
            'message': 'Print template created successfully',
            'data': template.to_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== Calculation Preview ====================

@dynamic_calculations_bp.route('/calculate-preview', methods=['POST'])
@jwt_required()
def calculate_preview():
    """معاينة الحسابات بناءً على القواعد الحالية"""
    try:
        data = request.get_json()
        
        required_fields = ['sale_price', 'unit_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
        
        calculations = DynamicCalculationService.calculate_sale_amounts(
            sale_price=data['sale_price'],
            unit_id=data['unit_id'],
            salesperson_id=data.get('salesperson_id'),
            sales_manager_id=data.get('sales_manager_id')
        )
        
        return jsonify({
            'success': True,
            'data': calculations
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== Initialize Default Rules ====================

@dynamic_calculations_bp.route('/initialize-defaults', methods=['POST'])
@jwt_required()
def initialize_default_rules():
    """تهيئة القواعد الافتراضية"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if user.role != 'admin':
            return jsonify({'success': False, 'message': 'Access denied. Admin role required.'}), 403
        
        initialized = DynamicCalculationService.initialize_default_rules()
        
        if initialized:
            return jsonify({
                'success': True,
                'message': 'Default calculation rules initialized successfully'
            })
        else:
            return jsonify({
                'success': True,
                'message': 'Default rules already exist'
            })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
