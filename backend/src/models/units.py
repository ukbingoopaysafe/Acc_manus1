from .base import db, BaseModel

class Unit(BaseModel):
    __tablename__ = 'units'
    
    code = db.Column(db.String(50), unique=True, nullable=False)
    type = db.Column(db.String(50), nullable=False)  # شقة، تجاري، إداري، طبي
    address = db.Column(db.Text)
    area_sqm = db.Column(db.Numeric(10, 2))
    price = db.Column(db.Numeric(15, 2), nullable=False)
    description_ar = db.Column(db.Text)
    description_en = db.Column(db.Text)
    status = db.Column(db.String(50), default='متاحة', nullable=False)  # متاحة، مباعة، مؤجرة
    
    # Relationships
    sales = db.relationship('Sale', backref='unit', lazy=True)
    rentals = db.relationship('Rental', backref='unit', lazy=True)
    finishing_works = db.relationship('FinishingWork', backref='unit', lazy=True)
    
    def to_dict(self):
        """Convert to dictionary with localized fields"""
        data = super().to_dict()
        # Convert Decimal to float for JSON serialization
        if data.get('area_sqm'):
            data['area_sqm'] = float(data['area_sqm'])
        if data.get('price'):
            data['price'] = float(data['price'])
        return data

