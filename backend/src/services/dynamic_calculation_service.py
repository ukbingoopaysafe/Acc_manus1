from src.models.dynamic_calculations import CalculationRule
from src.models.units import Unit
from decimal import Decimal

class DynamicCalculationService:
    """خدمة الحسابات الديناميكية للعمولات والضرائب"""
    
    @staticmethod
    def calculate_sale_amounts(sale_price, unit_id, salesperson_id=None, sales_manager_id=None):
        """
        حساب جميع المبالغ المتعلقة بالمبيعة بناءً على القواعد الديناميكية
        
        Args:
            sale_price: سعر البيع
            unit_id: معرف الوحدة
            salesperson_id: معرف البائع
            sales_manager_id: معرف مدير المبيعات
            
        Returns:
            dict: قاموس يحتوي على جميع الحسابات المفصلة
        """
        
        # الحصول على معلومات الوحدة
        unit = Unit.query.get(unit_id)
        if not unit:
            raise ValueError("Unit not found")
        
        unit_type = unit.type
        base_amount = Decimal(str(sale_price))
        
        # الحصول على جميع القواعد النشطة للمبيعات
        rules = CalculationRule.query.filter_by(
            applies_to='sales',
            is_active=True
        ).order_by(CalculationRule.order_index).all()
        
        # تصفية القواعد حسب نوع الوحدة
        applicable_rules = []
        for rule in rules:
            unit_type_filter = rule.get_unit_type_filter()
            if not unit_type_filter or unit_type in unit_type_filter:
                applicable_rules.append(rule)
        
        # تنفيذ الحسابات
        calculations = {
            'base_amount': float(base_amount),
            'unit_type': unit_type,
            'applied_rules': [],
            'totals': {
                'company_commission': 0,
                'salesperson_commission': 0,
                'sales_manager_commission': 0,
                'total_taxes': 0,
                'total_fees': 0,
                'total_discounts': 0,
                'net_company_revenue': 0
            }
        }
        
        current_amount = base_amount
        
        for rule in applicable_rules:
            calculated_amount = Decimal(str(rule.calculate_amount(current_amount)))
            
            rule_calculation = {
                'rule_id': rule.id,
                'rule_name_ar': rule.name_ar,
                'rule_name_en': rule.name_en,
                'rule_type': rule.rule_type,
                'calculation_type': rule.calculation_type,
                'value': float(rule.value),
                'calculated_amount': float(calculated_amount),
                'base_amount': float(current_amount)
            }
            
            calculations['applied_rules'].append(rule_calculation)
            
            # تجميع المبالغ حسب نوع القاعدة
            if rule.rule_type == 'commission':
                # تحديد نوع العمولة بناءً على اسم القاعدة
                if 'شركة' in rule.name_ar or 'company' in rule.name_en.lower():
                    calculations['totals']['company_commission'] += float(calculated_amount)
                elif 'بائع' in rule.name_ar or 'salesperson' in rule.name_en.lower():
                    calculations['totals']['salesperson_commission'] += float(calculated_amount)
                elif 'مدير' in rule.name_ar or 'manager' in rule.name_en.lower():
                    calculations['totals']['sales_manager_commission'] += float(calculated_amount)
                else:
                    calculations['totals']['company_commission'] += float(calculated_amount)
            
            elif rule.rule_type == 'tax':
                calculations['totals']['total_taxes'] += float(calculated_amount)
            
            elif rule.rule_type == 'fee':
                calculations['totals']['total_fees'] += float(calculated_amount)
            
            elif rule.rule_type == 'discount':
                calculations['totals']['total_discounts'] += float(calculated_amount)
        
        # حساب صافي إيرادات الشركة
        calculations['totals']['net_company_revenue'] = (
            calculations['totals']['company_commission'] - 
            calculations['totals']['total_taxes'] - 
            calculations['totals']['total_fees'] + 
            calculations['totals']['total_discounts']
        )
        
        return calculations
    
    @staticmethod
    def get_default_calculation_rules():
        """إنشاء القواعد الافتراضية للحسابات"""
        default_rules = [
            {
                'name_ar': 'عمولة الشركة',
                'name_en': 'Company Commission',
                'rule_type': 'commission',
                'calculation_type': 'percentage',
                'value': 3.0,  # 3%
                'applies_to': 'sales',
                'order_index': 1,
                'description_ar': 'عمولة الشركة من المبيعات',
                'description_en': 'Company commission from sales'
            },
            {
                'name_ar': 'عمولة البائع',
                'name_en': 'Salesperson Commission',
                'rule_type': 'commission',
                'calculation_type': 'percentage',
                'value': 1.0,  # 1%
                'applies_to': 'sales',
                'order_index': 2,
                'description_ar': 'عمولة البائع من المبيعات',
                'description_en': 'Salesperson commission from sales'
            },
            {
                'name_ar': 'عمولة مدير المبيعات',
                'name_en': 'Sales Manager Commission',
                'rule_type': 'commission',
                'calculation_type': 'percentage',
                'value': 0.5,  # 0.5%
                'applies_to': 'sales',
                'order_index': 3,
                'description_ar': 'عمولة مدير المبيعات من المبيعات',
                'description_en': 'Sales manager commission from sales'
            },
            {
                'name_ar': 'ضريبة القيمة المضافة',
                'name_en': 'VAT Tax',
                'rule_type': 'tax',
                'calculation_type': 'percentage',
                'value': 14.0,  # 14%
                'applies_to': 'sales',
                'order_index': 4,
                'description_ar': 'ضريبة القيمة المضافة 14%',
                'description_en': 'Value Added Tax 14%'
            },
            {
                'name_ar': 'ضريبة المبيعات',
                'name_en': 'Sales Tax',
                'rule_type': 'tax',
                'calculation_type': 'percentage',
                'value': 5.0,  # 5%
                'applies_to': 'sales',
                'order_index': 5,
                'description_ar': 'ضريبة المبيعات 5%',
                'description_en': 'Sales Tax 5%'
            }
        ]
        
        return default_rules
    
    @staticmethod
    def initialize_default_rules():
        """تهيئة القواعد الافتراضية في قاعدة البيانات"""
        existing_rules = CalculationRule.query.count()
        
        if existing_rules == 0:
            default_rules = DynamicCalculationService.get_default_calculation_rules()
            
            for rule_data in default_rules:
                rule = CalculationRule(**rule_data)
                rule.save()
            
            return True
        
        return False
