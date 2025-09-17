from .base import db, BaseModel

class ExpenseCategory(BaseModel):
    __tablename__ = 'expense_categories'
    
    name_ar = db.Column(db.String(100), unique=True, nullable=False)
    name_en = db.Column(db.String(100), unique=True, nullable=False)
    description_ar = db.Column(db.Text)
    description_en = db.Column(db.Text)
    
    # Relationships
    expenses = db.relationship('Expense', backref='category', lazy=True)

class Expense(BaseModel):
    __tablename__ = 'expenses'
    
    description_ar = db.Column(db.Text, nullable=False)
    description_en = db.Column(db.Text)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    expense_date = db.Column(db.Date, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('expense_categories.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notes = db.Column(db.Text)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('expenses', lazy=True))
    
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
        data['category_name_ar'] = self.category.name_ar if self.category else None
        data['category_name_en'] = self.category.name_en if self.category else None
        data['user_name'] = f"{self.user.first_name} {self.user.last_name}" if self.user else None
        
        return data

