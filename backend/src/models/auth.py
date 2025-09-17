from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from .base import db, BaseModel

# Association table for many-to-many relationship between roles and permissions
role_permissions = db.Table('role_permissions',
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True),
    db.Column('permission_id', db.Integer, db.ForeignKey('permissions.id'), primary_key=True),
    db.Column('can_view', db.Boolean, default=True),
    db.Column('can_create', db.Boolean, default=False),
    db.Column('can_edit', db.Boolean, default=False),
    db.Column('can_delete', db.Boolean, default=False)
)

class User(BaseModel):
    __tablename__ = 'users'
    
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Relationships
    role = db.relationship('Role', backref=db.backref('users', lazy=True))
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def generate_token(self):
        """Generate JWT access token"""
        return create_access_token(identity=self.id)
    
    def has_permission(self, permission_name, action='view'):
        """Check if user has specific permission for an action"""
        if not self.role:
            return False
        
        for role_perm in self.role.role_permissions:
            if role_perm.permission.name == permission_name:
                if action == 'view' and role_perm.can_view:
                    return True
                elif action == 'create' and role_perm.can_create:
                    return True
                elif action == 'edit' and role_perm.can_edit:
                    return True
                elif action == 'delete' and role_perm.can_delete:
                    return True
        return False
    
    def to_dict(self):
        """Convert to dictionary, excluding password hash"""
        data = super().to_dict()
        data.pop('password_hash', None)
        data['role_name'] = self.role.name if self.role else None
        return data

class Role(BaseModel):
    __tablename__ = 'roles'
    
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    
    # Many-to-many relationship with permissions
    permissions = db.relationship('Permission', secondary=role_permissions, 
                                 back_populates='roles')

class Permission(BaseModel):
    __tablename__ = 'permissions'
    
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    
    # Many-to-many relationship with roles
    roles = db.relationship('Role', secondary=role_permissions, 
                           back_populates='permissions')

class RolePermission(BaseModel):
    __tablename__ = 'role_permissions_detail'
    
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    permission_id = db.Column(db.Integer, db.ForeignKey('permissions.id'), nullable=False)
    can_view = db.Column(db.Boolean, default=True)
    can_create = db.Column(db.Boolean, default=False)
    can_edit = db.Column(db.Boolean, default=False)
    can_delete = db.Column(db.Boolean, default=False)
    
    # Relationships
    role = db.relationship('Role', backref=db.backref('role_permissions', lazy=True))
    permission = db.relationship('Permission', backref=db.backref('permission_roles', lazy=True))
    
    __table_args__ = (db.UniqueConstraint('role_id', 'permission_id'),)

