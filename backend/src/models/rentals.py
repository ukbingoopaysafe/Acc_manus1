from .base import db, BaseModel

class Rental(BaseModel):
    __tablename__ = 'rentals'
    
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    tenant_name = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    rent_amount = db.Column(db.Numeric(15, 2), nullable=False)
    payment_frequency = db.Column(db.String(50), nullable=False)  # شهري، ربع سنوي، سنوي
    notes = db.Column(db.Text)
    
    # Relationships
    payments = db.relationship('RentalPayment', backref='rental', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert to dictionary with proper decimal handling"""
        data = super().to_dict()
        
        # Convert Decimal to float for JSON serialization
        if data.get('rent_amount'):
            data['rent_amount'] = float(data['rent_amount'])
        
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

class RentalPayment(BaseModel):
    __tablename__ = 'rental_payments'
    
    rental_id = db.Column(db.Integer, db.ForeignKey('rentals.id'), nullable=False)
    payment_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    status = db.Column(db.String(50), default='مستحقة', nullable=False)  # مدفوعة، متأخرة، مستحقة
    notes = db.Column(db.Text)
    
    def to_dict(self):
        """Convert to dictionary with proper decimal handling"""
        data = super().to_dict()
        
        # Convert Decimal to float for JSON serialization
        if data.get('amount'):
            data['amount'] = float(data['amount'])
        
        # Convert date to string
        if data.get('payment_date'):
            data['payment_date'] = data['payment_date'].isoformat()
        
        # Add related data
        data['rental_tenant_name'] = self.rental.tenant_name if self.rental else None
        data['rental_unit_code'] = self.rental.unit.code if self.rental and self.rental.unit else None
        
        return data

