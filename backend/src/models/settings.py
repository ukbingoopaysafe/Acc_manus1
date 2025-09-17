from .base import db, BaseModel
import json

class FinancialSetting(BaseModel):
    __tablename__ = 'financial_settings'
    
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False)  # percentage, fixed_amount, text, json
    description_ar = db.Column(db.Text)
    description_en = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    @classmethod
    def get_value(cls, key, default=None):
        """Get setting value by key"""
        setting = cls.query.filter_by(key=key, is_active=True).first()
        if not setting:
            return default
        
        if setting.type == 'percentage':
            return float(setting.value)
        elif setting.type == 'fixed_amount':
            return float(setting.value)
        elif setting.type == 'json':
            try:
                return json.loads(setting.value)
            except:
                return default
        else:
            return setting.value
    
    @classmethod
    def set_value(cls, key, value, type='text', description_ar='', description_en=''):
        """Set or update setting value"""
        setting = cls.query.filter_by(key=key).first()
        
        if setting:
            setting.value = str(value)
            setting.type = type
            setting.description_ar = description_ar
            setting.description_en = description_en
        else:
            setting = cls(
                key=key,
                value=str(value),
                type=type,
                description_ar=description_ar,
                description_en=description_en
            )
        
        setting.save()
        return setting

class Template(BaseModel):
    __tablename__ = 'templates'
    
    name = db.Column(db.String(100), unique=True, nullable=False)
    type = db.Column(db.String(50), nullable=False)  # invoice, check
    content = db.Column(db.Text, nullable=False)  # JSON structure
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    def get_content_json(self):
        """Get template content as JSON object"""
        try:
            return json.loads(self.content)
        except:
            return {}
    
    def set_content_json(self, content_dict):
        """Set template content from dictionary"""
        self.content = json.dumps(content_dict, ensure_ascii=False, indent=2)

class CashierBalance(BaseModel):
    __tablename__ = 'cashier_balance'
    
    balance = db.Column(db.Numeric(18, 2), default=0, nullable=False)
    last_updated_at = db.Column(db.DateTime, nullable=False)
    
    @classmethod
    def get_current_balance(cls):
        """Get current cashier balance"""
        balance_record = cls.query.first()
        if balance_record:
            return float(balance_record.balance)
        return 0.0
    
    @classmethod
    def update_balance(cls, new_balance):
        """Update cashier balance"""
        from datetime import datetime
        
        balance_record = cls.query.first()
        if balance_record:
            balance_record.balance = new_balance
            balance_record.last_updated_at = datetime.utcnow()
        else:
            balance_record = cls(
                balance=new_balance,
                last_updated_at=datetime.utcnow()
            )
        
        balance_record.save()
        return balance_record
    
    def to_dict(self):
        """Convert to dictionary with proper decimal handling"""
        data = super().to_dict()
        
        # Convert Decimal to float for JSON serialization
        if data.get('balance'):
            data['balance'] = float(data['balance'])
        
        return data

class CashierTransaction(BaseModel):
    __tablename__ = 'cashier_transactions'
    
    transaction_date = db.Column(db.DateTime, nullable=False)
    amount = db.Column(db.Numeric(15, 2), nullable=False)  # موجب للإيداع، سالب للسحب
    transaction_type = db.Column(db.String(50), nullable=False)  # sale_revenue, expense_payment, rental_income, etc.
    reference_id = db.Column(db.Integer)  # معرف الكيان المرتبط
    notes = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('cashier_transactions', lazy=True))
    
    def to_dict(self):
        """Convert to dictionary with proper decimal handling"""
        data = super().to_dict()
        
        # Convert Decimal to float for JSON serialization
        if data.get('amount'):
            data['amount'] = float(data['amount'])
        
        # Convert datetime to string
        if data.get('transaction_date'):
            data['transaction_date'] = data['transaction_date'].isoformat()
        
        # Add related data
        data['user_name'] = f"{self.user.first_name} {self.user.last_name}" if self.user else None
        
        return data

