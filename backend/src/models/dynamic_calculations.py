from .base import db, BaseModel
import json

class CalculationRule(BaseModel):
    """نموذج لقواعد الحساب القابلة للتخصيص (عمولات، ضرائب، خصومات)"""
    __tablename__ = 'calculation_rules'
    
    name_ar = db.Column(db.String(200), nullable=False)  # اسم القاعدة بالعربية
    name_en = db.Column(db.String(200), nullable=False)  # اسم القاعدة بالإنجليزية
    rule_type = db.Column(db.String(50), nullable=False)  # commission, tax, discount, fee
    calculation_type = db.Column(db.String(50), nullable=False)  # percentage, fixed_amount
    value = db.Column(db.Numeric(10, 4), nullable=False)  # القيمة (نسبة أو مبلغ ثابت)
    applies_to = db.Column(db.String(100), nullable=False)  # sales, rentals, finishing_works, all
    unit_type_filter = db.Column(db.Text)  # JSON array of unit types this rule applies to
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    order_index = db.Column(db.Integer, default=0)  # ترتيب تطبيق القواعد
    description_ar = db.Column(db.Text)
    description_en = db.Column(db.Text)
    
    def get_unit_type_filter(self):
        """Get unit type filter as list"""
        if self.unit_type_filter:
            try:
                return json.loads(self.unit_type_filter)
            except:
                return []
        return []
    
    def set_unit_type_filter(self, unit_types):
        """Set unit type filter from list"""
        self.unit_type_filter = json.dumps(unit_types, ensure_ascii=False)
    
    def calculate_amount(self, base_amount):
        """حساب المبلغ بناءً على القاعدة"""
        if self.calculation_type == 'percentage':
            return float(base_amount) * (float(self.value) / 100)
        elif self.calculation_type == 'fixed_amount':
            return float(self.value)
        return 0
    
    def to_dict(self):
        """Convert to dictionary"""
        data = super().to_dict()
        
        # Convert Decimal to float
        if data.get('value'):
            data['value'] = float(data['value'])
        
        # Add unit type filter
        data['unit_type_filter'] = self.get_unit_type_filter()
        
        return data

class CustomField(BaseModel):
    """نموذج للحقول المخصصة القابلة للإضافة من قبل المسؤول"""
    __tablename__ = 'custom_fields'
    
    entity_type = db.Column(db.String(50), nullable=False)  # sales, rentals, units, etc.
    field_name = db.Column(db.String(100), nullable=False)
    field_label_ar = db.Column(db.String(200), nullable=False)
    field_label_en = db.Column(db.String(200), nullable=False)
    field_type = db.Column(db.String(50), nullable=False)  # text, number, date, select, boolean
    field_options = db.Column(db.Text)  # JSON for select options
    is_required = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    order_index = db.Column(db.Integer, default=0)
    
    def get_field_options(self):
        """Get field options as list"""
        if self.field_options:
            try:
                return json.loads(self.field_options)
            except:
                return []
        return []
    
    def set_field_options(self, options):
        """Set field options from list"""
        self.field_options = json.dumps(options, ensure_ascii=False)

class CustomFieldValue(BaseModel):
    """نموذج لقيم الحقول المخصصة"""
    __tablename__ = 'custom_field_values'
    
    custom_field_id = db.Column(db.Integer, db.ForeignKey('custom_fields.id'), nullable=False)
    entity_id = db.Column(db.Integer, nullable=False)  # معرف الكيان (مبيعة، إيجار، إلخ)
    field_value = db.Column(db.Text)
    
    # Relationships
    custom_field = db.relationship('CustomField', backref=db.backref('values', lazy=True))

class PrintTemplate(BaseModel):
    """نموذج لقوالب الطباعة القابلة للتخصيص"""
    __tablename__ = 'print_templates'
    
    name_ar = db.Column(db.String(200), nullable=False)
    name_en = db.Column(db.String(200), nullable=False)
    template_type = db.Column(db.String(50), nullable=False)  # invoice, check, receipt
    template_content = db.Column(db.Text, nullable=False)  # JSON structure
    is_default = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    
    def get_template_content(self):
        """Get template content as JSON"""
        try:
            return json.loads(self.template_content)
        except:
            return {}
    
    def set_template_content(self, content):
        """Set template content from dict"""
        self.template_content = json.dumps(content, ensure_ascii=False, indent=2)

class ReportConfiguration(BaseModel):
    """نموذج لتكوين التقارير القابلة للتخصيص"""
    __tablename__ = 'report_configurations'
    
    name_ar = db.Column(db.String(200), nullable=False)
    name_en = db.Column(db.String(200), nullable=False)
    report_type = db.Column(db.String(50), nullable=False)  # financial, sales, expenses, etc.
    columns_config = db.Column(db.Text, nullable=False)  # JSON array of column configurations
    filters_config = db.Column(db.Text)  # JSON object of filter configurations
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    creator = db.relationship('User', backref=db.backref('report_configurations', lazy=True))
    
    def get_columns_config(self):
        """Get columns configuration as list"""
        try:
            return json.loads(self.columns_config)
        except:
            return []
    
    def set_columns_config(self, columns):
        """Set columns configuration from list"""
        self.columns_config = json.dumps(columns, ensure_ascii=False, indent=2)
    
    def get_filters_config(self):
        """Get filters configuration as dict"""
        if self.filters_config:
            try:
                return json.loads(self.filters_config)
            except:
                return {}
        return {}
    
    def set_filters_config(self, filters):
        """Set filters configuration from dict"""
        self.filters_config = json.dumps(filters, ensure_ascii=False, indent=2)
