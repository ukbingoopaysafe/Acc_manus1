
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db, Unit
from src.utils.auth_utils import permission_required

units_bp = Blueprint("units", __name__)

@units_bp.route("/units", methods=["POST"])
@permission_required("manage_units", "create")
def create_unit():
    data = request.get_json()
    code = data.get("code")
    type = data.get("type")
    price = data.get("price")

    if not all([code, type, price]):
        return jsonify({"msg": "Missing required fields: code, type, price"}), 400

    if Unit.query.filter_by(code=code).first():
        return jsonify({"msg": "Unit with this code already exists"}), 409

    new_unit = Unit(
        code=code,
        type=type,
        price=price,
        address=data.get("address"),
        area_sqm=data.get("area_sqm"),
        description_ar=data.get("description_ar"),
        description_en=data.get("description_en"),
        status=data.get("status", "متاحة")
    )
    new_unit.save()
    return jsonify({"msg": "Unit created successfully", "unit": new_unit.to_dict()}), 201

@units_bp.route("/units", methods=["GET"])
@permission_required("manage_units", "view")
def get_units():
    units = Unit.query.all()
    return jsonify([unit.to_dict() for unit in units]), 200

@units_bp.route("/units/<int:unit_id>", methods=["GET"])
@permission_required("manage_units", "view")
def get_unit(unit_id):
    unit = Unit.query.get(unit_id)
    if not unit:
        return jsonify({"msg": "Unit not found"}), 404
    return jsonify(unit.to_dict()), 200

@units_bp.route("/units/<int:unit_id>", methods=["PUT"])
@permission_required("manage_units", "edit")
def update_unit(unit_id):
    unit = Unit.query.get(unit_id)
    if not unit:
        return jsonify({"msg": "Unit not found"}), 404

    data = request.get_json()
    unit.code = data.get("code", unit.code)
    unit.type = data.get("type", unit.type)
    unit.price = data.get("price", unit.price)
    unit.address = data.get("address", unit.address)
    unit.area_sqm = data.get("area_sqm", unit.area_sqm)
    unit.description_ar = data.get("description_ar", unit.description_ar)
    unit.description_en = data.get("description_en", unit.description_en)
    unit.status = data.get("status", unit.status)
    unit.save()
    return jsonify({"msg": "Unit updated successfully", "unit": unit.to_dict()}), 200

@units_bp.route("/units/<int:unit_id>", methods=["DELETE"])
@permission_required("manage_units", "delete")
def delete_unit(unit_id):
    unit = Unit.query.get(unit_id)
    if not unit:
        return jsonify({"msg": "Unit not found"}), 404
    unit.delete()
    return jsonify({"msg": "Unit deleted successfully"}), 200


