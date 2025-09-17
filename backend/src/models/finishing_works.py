from .base import db, BaseModel

class FinishingWork(BaseModel):
    __tablename__ = 'finishing_works'
    
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    project_name_ar = db.Column(db.String(100), nullable=False)
    project_name_en = db.Column(db.String(100))
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    budget = db.Column(db.Numeric(15, 2), nullable=False)
    actual_cost = db.Column(db.Numeric(15, 2), default=0)
    status = db.Column(db.String(50), default='قيد التنفيذ', nullable=False)  # قيد التنفيذ، مكتمل، متوقف
    notes = db.Column(db.Text)
    
    # Relationships
    expenses = db.relationship('FinishingWorkExpense', backref='finishing_work', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert to dictionary with proper decimal handling"""
        data = super().to_dict()
        
        # Convert Decimal fields to float for JSON serialization
        decimal_fields = ['budget', 'actual_cost']
        for field in decimal_fields:
            if data.get(field):
                data[field] = float(data[field])
        
        # Convert dates to strings
        if data.get('start_date'):
            data['start_date'] = data['start_date'].isoformat()
        if data.get('end_date'):
            data['end_date'] = data['end_date'].isoformat()
        
        # Add related data
        data['unit_code'] = self.unit.code if self.unit else None
        data['unit_type'] = self.unit.type if self.unit else None
        data['unit_address'] = self.unit.address if self.unit else None
        
        return data

class FinishingWorkExpense(BaseModel):
    __tablename__ = 'finishing_work_expenses'
    
    finishing_work_id = db.Column(db.Integer, db.ForeignKey('finishing_works.id'), nullable=False)
    description_ar = db.Column(db.Text, nullable=False)
    description_en = db.Column(db.Text)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    expense_date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)
    
    def to_dict(self):
        """Convert to dictionary with proper decimal handling"""
        data = super().to_dict()
        
        # Convert Decimal to float for JSON serialization
        if data.get('amount'):
            data['amount'] = float(data['amount'])
        
        # Convert date to string
        if data.get('expense_date'):
            data['expense_date'] = data['expense_date'].isoformat()
        
        # Add related data
        data['project_name_ar'] = self.finishing_work.project_name_ar if self.finishing_work else None
        data['project_name_en'] = self.finishing_work.project_name_en if self.finishing_work else None
        data['unit_code'] = self.finishing_work.unit.code if self.finishing_work and self.finishing_work.unit else None
        
        return data

