
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from src.models import db, User, Role, Permission, RolePermission
from src.utils.auth_utils import admin_required, permission_required

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
@admin_required()
def register_user():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    role_id = data.get("role_id")

    if not all([username, email, password, first_name, last_name, role_id]):
        return jsonify({"msg": "Missing required fields"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "Username already exists"}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email already exists"}), 409
    if not Role.query.get(role_id):
        return jsonify({"msg": "Role not found"}), 404

    new_user = User(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        role_id=role_id
    )
    new_user.set_password(password)
    new_user.save()

    return jsonify({"msg": "User registered successfully", "user": new_user.to_dict()}), 201

@auth_bp.route("/login", methods=["POST"])
def login_user():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not all([username, password]):
        return jsonify({"msg": "Missing username or password"}), 400

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        access_token = create_access_token(identity=user.id)
        return jsonify(access_token=access_token, user=user.to_dict()), 200
    else:
        return jsonify({"msg": "Bad username or password"}), 401

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    return jsonify(user.to_dict()), 200

# --- User Management (Admin Only) ---
@auth_bp.route("/users", methods=["GET"])
@permission_required("manage_users", "view")
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@auth_bp.route("/users/<int:user_id>", methods=["GET"])
@permission_required("manage_users", "view")
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    return jsonify(user.to_dict()), 200

@auth_bp.route("/users/<int:user_id>", methods=["PUT"])
@permission_required("manage_users", "edit")
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    data = request.get_json()
    user.username = data.get("username", user.username)
    user.email = data.get("email", user.email)
    user.first_name = data.get("first_name", user.first_name)
    user.last_name = data.get("last_name", user.last_name)
    user.role_id = data.get("role_id", user.role_id)
    user.is_active = data.get("is_active", user.is_active)
    if "password" in data:
        user.set_password(data["password"])
    user.save()
    return jsonify({"msg": "User updated successfully", "user": user.to_dict()}), 200

@auth_bp.route("/users/<int:user_id>", methods=["DELETE"])
@permission_required("manage_users", "delete")
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    user.delete()
    return jsonify({"msg": "User deleted successfully"}), 200

# --- Role Management (Admin Only) ---
@auth_bp.route("/roles", methods=["GET"])
@permission_required("manage_roles", "view")
def get_roles():
    roles = Role.query.all()
    return jsonify([role.to_dict() for role in roles]), 200

@auth_bp.route("/roles", methods=["POST"])
@permission_required("manage_roles", "create")
def create_role():
    data = request.get_json()
    name = data.get("name")
    description = data.get("description")

    if not name:
        return jsonify({"msg": "Role name is required"}), 400
    if Role.query.filter_by(name=name).first():
        return jsonify({"msg": "Role with this name already exists"}), 409

    new_role = Role(name=name, description=description)
    new_role.save()
    return jsonify({"msg": "Role created successfully", "role": new_role.to_dict()}), 201

@auth_bp.route("/roles/<int:role_id>", methods=["PUT"])
@permission_required("manage_roles", "edit")
def update_role(role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"msg": "Role not found"}), 404

    data = request.get_json()
    role.name = data.get("name", role.name)
    role.description = data.get("description", role.description)
    role.save()
    return jsonify({"msg": "Role updated successfully", "role": role.to_dict()}), 200

@auth_bp.route("/roles/<int:role_id>", methods=["DELETE"])
@permission_required("manage_roles", "delete")
def delete_role(role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"msg": "Role not found"}), 404
    if role.users: # Prevent deleting roles with assigned users
        return jsonify({"msg": "Cannot delete role with assigned users"}), 400
    
    # Delete associated role permissions first
    RolePermission.query.filter_by(role_id=role_id).delete()
    db.session.commit()
    
    role.delete()
    return jsonify({"msg": "Role deleted successfully"}), 200

# --- Permission Management (Admin Only) ---
@auth_bp.route("/permissions", methods=["GET"])
@permission_required("manage_roles", "view") # Assuming manage_roles permission covers viewing permissions
def get_permissions():
    permissions = Permission.query.all()
    return jsonify([p.to_dict() for p in permissions]), 200

@auth_bp.route("/roles/<int:role_id>/permissions", methods=["GET"])
@permission_required("manage_roles", "view")
def get_role_permissions(role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"msg": "Role not found"}), 404
    
    role_permissions = RolePermission.query.filter_by(role_id=role_id).all()
    return jsonify([rp.to_dict() for rp in role_permissions]), 200

@auth_bp.route("/roles/<int:role_id>/permissions", methods=["POST"])
@permission_required("manage_roles", "edit")
def update_role_permissions(role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"msg": "Role not found"}), 404

    data = request.get_json()
    permission_updates = data.get("permissions", []) # List of {permission_id, can_view, can_create, can_edit, can_delete}

    for update in permission_updates:
        permission_id = update.get("permission_id")
        can_view = update.get("can_view", False)
        can_create = update.get("can_create", False)
        can_edit = update.get("can_edit", False)
        can_delete = update.get("can_delete", False)

        role_perm = RolePermission.query.filter_by(role_id=role_id, permission_id=permission_id).first()
        if role_perm:
            role_perm.can_view = can_view
            role_perm.can_create = can_create
            role_perm.can_edit = can_edit
            role_perm.can_delete = can_delete
            role_perm.save()
        else:
            # If permission not assigned, create it
            new_role_perm = RolePermission(
                role_id=role_id,
                permission_id=permission_id,
                can_view=can_view,
                can_create=can_create,
                can_edit=can_edit,
                can_delete=can_delete
            )
            new_role_perm.save()
            
    return jsonify({"msg": "Role permissions updated successfully"}), 200

@auth_bp.route("/permissions/all", methods=["GET"])
@permission_required("manage_roles", "view")
def get_all_permissions():
    permissions = Permission.query.all()
    return jsonify([p.to_dict() for p in permissions]), 200



