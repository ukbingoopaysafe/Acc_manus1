
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db, FinancialSetting, Template
from src.utils.auth_utils import permission_required
import json

settings_bp = Blueprint("settings", __name__)

# --- Financial Settings ---
@settings_bp.route("/financial_settings", methods=["POST"])
@permission_required("manage_settings", "create")
def create_financial_setting():
    data = request.get_json()
    key = data.get("key")
    value = data.get("value")
    type = data.get("type")
    description_ar = data.get("description_ar")
    description_en = data.get("description_en")

    if not all([key, value, type]):
        return jsonify({"msg": "Missing required fields: key, value, type"}), 400

    if FinancialSetting.query.filter_by(key=key).first():
        return jsonify({"msg": "Setting with this key already exists"}), 409

    new_setting = FinancialSetting(
        key=key,
        value=str(value),
        type=type,
        description_ar=description_ar,
        description_en=description_en
    )
    new_setting.save()
    return jsonify({"msg": "Financial setting created successfully", "setting": new_setting.to_dict()}), 201

@settings_bp.route("/financial_settings", methods=["GET"])
@permission_required("manage_settings", "view")
def get_financial_settings():
    settings = FinancialSetting.query.all()
    return jsonify([setting.to_dict() for setting in settings]), 200

@settings_bp.route("/financial_settings/<int:setting_id>", methods=["GET"])
@permission_required("manage_settings", "view")
def get_financial_setting(setting_id):
    setting = FinancialSetting.query.get(setting_id)
    if not setting:
        return jsonify({"msg": "Financial setting not found"}), 404
    return jsonify(setting.to_dict()), 200

@settings_bp.route("/financial_settings/<int:setting_id>", methods=["PUT"])
@permission_required("manage_settings", "edit")
def update_financial_setting(setting_id):
    setting = FinancialSetting.query.get(setting_id)
    if not setting:
        return jsonify({"msg": "Financial setting not found"}), 404

    data = request.get_json()
    setting.key = data.get("key", setting.key)
    setting.value = str(data.get("value", setting.value))
    setting.type = data.get("type", setting.type)
    setting.description_ar = data.get("description_ar", setting.description_ar)
    setting.description_en = data.get("description_en", setting.description_en)
    setting.is_active = data.get("is_active", setting.is_active)
    setting.save()
    return jsonify({"msg": "Financial setting updated successfully", "setting": setting.to_dict()}), 200

@settings_bp.route("/financial_settings/<int:setting_id>", methods=["DELETE"])
@permission_required("manage_settings", "delete")
def delete_financial_setting(setting_id):
    setting = FinancialSetting.query.get(setting_id)
    if not setting:
        return jsonify({"msg": "Financial setting not found"}), 404
    setting.delete()
    return jsonify({"msg": "Financial setting deleted successfully"}), 200

# --- Templates (Invoice/Check) ---
@settings_bp.route("/templates", methods=["POST"])
@permission_required("manage_settings", "create")
def create_template():
    data = request.get_json()
    name = data.get("name")
    type = data.get("type")
    content = data.get("content")

    if not all([name, type, content]):
        return jsonify({"msg": "Missing required fields: name, type, content"}), 400

    if Template.query.filter_by(name=name).first():
        return jsonify({"msg": "Template with this name already exists"}), 409

    try:
        json.loads(content) # Validate if content is valid JSON
    except json.JSONDecodeError:
        return jsonify({"msg": "Template content must be valid JSON"}), 400

    new_template = Template(
        name=name,
        type=type,
        content=content
    )
    new_template.save()
    return jsonify({"msg": "Template created successfully", "template": new_template.to_dict()}), 201

@settings_bp.route("/templates", methods=["GET"])
@permission_required("manage_settings", "view")
def get_templates():
    templates = Template.query.all()
    return jsonify([template.to_dict() for template in templates]), 200

@settings_bp.route("/templates/<int:template_id>", methods=["GET"])
@permission_required("manage_settings", "view")
def get_template(template_id):
    template = Template.query.get(template_id)
    if not template:
        return jsonify({"msg": "Template not found"}), 404
    return jsonify(template.to_dict()), 200

@settings_bp.route("/templates/<int:template_id>", methods=["PUT"])
@permission_required("manage_settings", "edit")
def update_template(template_id):
    template = Template.query.get(template_id)
    if not template:
        return jsonify({"msg": "Template not found"}), 404

    data = request.get_json()
    template.name = data.get("name", template.name)
    template.type = data.get("type", template.type)
    template.is_active = data.get("is_active", template.is_active)
    
    if "content" in data:
        try:
            json.loads(data["content"]) # Validate if content is valid JSON
            template.content = data["content"]
        except json.JSONDecodeError:
            return jsonify({"msg": "Template content must be valid JSON"}), 400

    template.save()
    return jsonify({"msg": "Template updated successfully", "template": template.to_dict()}), 200

@settings_bp.route("/templates/<int:template_id>", methods=["DELETE"])
@permission_required("manage_settings", "delete")
def delete_template(template_id):
    template = Template.query.get(template_id)
    if not template:
        return jsonify({"msg": "Template not found"}), 404
    template.delete()
    return jsonify({"msg": "Template deleted successfully"}), 200


