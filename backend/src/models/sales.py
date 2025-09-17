from .base import db, BaseModel
import json

class Sale(BaseModel):
    __tablename__ = 'sales'
    
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    client_name = db.Column(db.String(100), nullable=False)
    sale_date = db.Column(db.Date, nullable=False)
    sale_price = db.Column(db.Numeric(15, 2), nullable=False)
    salesperson_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sales_manager_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Calculated fields - will be computed based on dynamic calculation rules
    company_commission = db.Column(db.Numeric(15, 2), default=0)
    salesperson_commission = db.Column(db.Numeric(15, 2), default=0)
    sales_manager_commission = db.Column(db.Numeric(15, 2), default=0)
    total_taxes = db.Column(db.Numeric(15, 2), default=0)
    net_company_revenue = db.Column(db.Numeric(15, 2), default=0)
    
    # Store detailed calculation breakdown as JSON
    calculation_breakdown = db.Column(db.Text)  # JSON object with detailed calculations
    custom_fields_data = db.Column(db.Text)  # JSON object for custom field values
    
    notes = db.Column(db.Text)
    
    # Relationships
    salesperson = db.relationship('User', foreign_keys=[salesperson_id], 
                                 backref=db.backref('sales_as_salesperson', lazy=True))
    sales_manager = db.relationship('User', foreign_keys=[sales_manager_id], 
                                   backref=db.backref('sales_as_manager', lazy=True))
    
    def get_calculation_breakdown(self):
        """Get calculation breakdown as JSON object"""
        if self.calculation_breakdown:
            try:
                return json.loads(self.calculation_breakdown)
            except:
                return {}
        return {}
    
    def set_calculation_breakdown(self, breakdown):
        """Set calculation breakdown from dictionary"""
        self.calculation_breakdown = json.dumps(breakdown, ensure_ascii=False, indent=2)
    
    def get_custom_fields_data(self):
        """Get custom fields data as JSON object"""
        if self.custom_fields_data:
            try:
                return json.loads(self.custom_fields_data)
            except:
                return {}
        return {}
    
    def set_custom_fields_data(self, data):
        """Set custom fields data from dictionary"""
        self.custom_fields_data = json.dumps(data, ensure_ascii=False, indent=2)

    def to_dict(self):
        """Convert to dictionary with proper decimal handling"""
        data = super().to_dict()
        
        # Convert Decimal fields to float for JSON serialization
        decimal_fields = ['sale_price', 'company_commission', 'salesperson_commission', 
                         'sales_manager_commission', 'total_taxes', 'net_company_revenue']
        
        for field in decimal_fields:
            if data.get(field):
                data[field] = float(data[field])
        
        # Convert date to string
        if data.get('sale_date'):
            data['sale_date'] = data['sale_date'].isoformat()
        
        # Add related data
        data['unit_code'] = self.unit.code if self.unit else None
        data['unit_type'] = self.unit.type if self.unit else None
        data['salesperson_name'] = f"{self.salesperson.first_name} {self.salesperson.last_name}" if self.salesperson else None
        data['sales_manager_name'] = f"{self.sales_manager.first_name} {self.sales_manager.last_name}" if self.sales_manager else None
        
        # Add calculation breakdown and custom fields
        data['calculation_breakdown'] = self.get_calculation_breakdown()
        data['custom_fields_data'] = self.get_custom_fields_data()
        
        return data

