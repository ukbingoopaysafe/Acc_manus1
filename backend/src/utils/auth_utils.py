from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from src.models import User, RolePermission, Permission

def admin_required():
    """Decorator to restrict access to admin users only"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if user and user.role and user.role.name == 'Admin':
                return fn(*args, **kwargs)
            else:
                return jsonify({"msg": "Admins only!"}), 403
        return decorator
    return wrapper

def permission_required(permission_name, action='view'):
    """Decorator to restrict access based on specific permissions and actions"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)

            if not user:
                return jsonify({"msg": "User not found"}), 404

            if user.role.name == 'Admin': # Admins bypass all permission checks
                return fn(*args, **kwargs)

            permission = Permission.query.filter_by(name=permission_name).first()
            if not permission:
                return jsonify({"msg": f"Permission {permission_name} not found"}), 403

            role_permission = RolePermission.query.filter_by(
                role_id=user.role_id,
                permission_id=permission.id
            ).first()

            if not role_permission:
                return jsonify({"msg": "Permission denied"}), 403

            if action == 'view' and role_permission.can_view:
                return fn(*args, **kwargs)
            elif action == 'create' and role_permission.can_create:
                return fn(*args, **kwargs)
            elif action == 'edit' and role_permission.can_edit:
                return fn(*args, **kwargs)
            elif action == 'delete' and role_permission.can_delete:
                return fn(*args, **kwargs)
            else:
                return jsonify({"msg": "Permission denied for this action"}), 403
        return decorator
    return wrapper


