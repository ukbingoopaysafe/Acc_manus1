
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models import db, Rental, RentalPayment, Unit, CashierBalance, CashierTransaction
from src.services.calculation_service import CalculationService
from src.utils.auth_utils import permission_required
from datetime import datetime

rentals_bp = Blueprint("rentals", __name__)

@rentals_bp.route("/rentals", methods=["POST"])
@permission_required("manage_rentals", "create")
def create_rental():
    data = request.get_json()
    unit_id = data.get("unit_id")
    tenant_name = data.get("tenant_name")
    start_date_str = data.get("start_date")
    end_date_str = data.get("end_date")
    rent_amount = data.get("rent_amount")
    payment_frequency = data.get("payment_frequency")
    notes = data.get("notes")

    if not all([unit_id, tenant_name, start_date_str, end_date_str, rent_amount, payment_frequency]):
        return jsonify({"msg": "Missing required fields"}), 400

    unit = Unit.query.get(unit_id)
    if not unit:
        return jsonify({"msg": "Unit not found"}), 404
    # Optionally, check if unit is already rented
    # if unit.status == "مؤجرة":
    #     return jsonify({"msg": "Unit is already rented"}), 400

    try:
        start_date = datetime.strptime(start_date_str, 
                                       "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_str, 
                                     "%Y-%m-%d").date()
        rent_amount = float(rent_amount)
    except ValueError:
        return jsonify({"msg": "Invalid date or amount format"}), 400

    new_rental = Rental(
        unit_id=unit_id,
        tenant_name=tenant_name,
        start_date=start_date,
        end_date=end_date,
        rent_amount=rent_amount,
        payment_frequency=payment_frequency,
        notes=notes
    )
    new_rental.save()

    # Update unit status
    unit.status = "مؤجرة"
    unit.save()

    return jsonify({"msg": "Rental created successfully", "rental": new_rental.to_dict()}), 201

@rentals_bp.route("/rentals", methods=["GET"])
@permission_required("manage_rentals", "view")
def get_rentals():
    rentals = Rental.query.all()
    return jsonify([rental.to_dict() for rental in rentals]), 200

@rentals_bp.route("/rentals/<int:rental_id>", methods=["GET"])
@permission_required("manage_rentals", "view")
def get_rental(rental_id):
    rental = Rental.query.get(rental_id)
    if not rental:
        return jsonify({"msg": "Rental not found"}), 404
    return jsonify(rental.to_dict()), 200

@rentals_bp.route("/rentals/<int:rental_id>", methods=["PUT"])
@permission_required("manage_rentals", "edit")
def update_rental(rental_id):
    rental = Rental.query.get(rental_id)
    if not rental:
        return jsonify({"msg": "Rental not found"}), 404

    data = request.get_json()
    unit_id = data.get("unit_id", rental.unit_id)
    tenant_name = data.get("tenant_name", rental.tenant_name)
    start_date_str = data.get("start_date", rental.start_date.isoformat() if rental.start_date else None)
    end_date_str = data.get("end_date", rental.end_date.isoformat() if rental.end_date else None)
    rent_amount = data.get("rent_amount", rental.rent_amount)
    payment_frequency = data.get("payment_frequency", rental.payment_frequency)
    notes = data.get("notes", rental.notes)

    unit = Unit.query.get(unit_id)
    if not unit:
        return jsonify({"msg": "Unit not found"}), 404

    try:
        start_date = datetime.strptime(start_date_str, 
                                       "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_str, 
                                     "%Y-%m-%d").date()
        rent_amount = float(rent_amount)
    except ValueError:
        return jsonify({"msg": "Invalid date or amount format"}), 400

    rental.unit_id = unit_id
    rental.tenant_name = tenant_name
    rental.start_date = start_date
    rental.end_date = end_date
    rental.rent_amount = rent_amount
    rental.payment_frequency = payment_frequency
    rental.notes = notes
    rental.save()

    # Update unit status if unit_id changed
    if unit.id != rental.unit_id:
        old_unit = Unit.query.get(rental.unit_id) # Assuming old_unit is still valid
        if old_unit:
            old_unit.status = "متاحة"
            old_unit.save()
        unit.status = "مؤجرة"
        unit.save()

    return jsonify({"msg": "Rental updated successfully", "rental": rental.to_dict()}), 200

@rentals_bp.route("/rentals/<int:rental_id>", methods=["DELETE"])
@permission_required("manage_rentals", "delete")
def delete_rental(rental_id):
    rental = Rental.query.get(rental_id)
    if not rental:
        return jsonify({"msg": "Rental not found"}), 404

    # Delete associated rental payments
    for payment in rental.payments:
        # Revert cashier impact for each payment
        current_balance = CashierBalance.get_current_balance()
        cashier_impact = CalculationService.calculate_cashier_impact(
            "rental_income", payment.amount
        )
        CashierBalance.update_balance(current_balance - cashier_impact)

        # Delete cashier transaction
        cashier_transaction = CashierTransaction.query.filter_by(reference_id=payment.id, transaction_type="rental_income").first()
        if cashier_transaction:
            cashier_transaction.delete()
        payment.delete()

    # Update unit status back to available
    unit = Unit.query.get(rental.unit_id)
    if unit:
        unit.status = "متاحة"
        unit.save()

    rental.delete()
    return jsonify({"msg": "Rental deleted successfully"}), 200

# --- Rental Payments ---
@rentals_bp.route("/rentals/<int:rental_id>/payments", methods=["POST"])
@permission_required("manage_rentals", "create")
def add_rental_payment(rental_id):
    rental = Rental.query.get(rental_id)
    if not rental:
        return jsonify({"msg": "Rental not found"}), 404

    data = request.get_json()
    payment_date_str = data.get("payment_date")
    amount = data.get("amount")
    status = data.get("status", "مدفوعة")
    notes = data.get("notes")

    if not all([payment_date_str, amount]):
        return jsonify({"msg": "Missing required fields: payment_date, amount"}), 400

    try:
        payment_date = datetime.strptime(payment_date_str, 
                                        "%Y-%m-%d").date()
        amount = float(amount)
    except ValueError:
        return jsonify({"msg": "Invalid date or amount format"}), 400

    new_payment = RentalPayment(
        rental_id=rental_id,
        payment_date=payment_date,
        amount=amount,
        status=status,
        notes=notes
    )
    new_payment.save()

    # Update cashier balance and record transaction
    current_balance = CashierBalance.get_current_balance()
    cashier_impact = CalculationService.calculate_cashier_impact(
        "rental_income", new_payment.amount
    )
    new_balance = current_balance + cashier_impact
    CashierBalance.update_balance(new_balance)

    cashier_transaction = CashierTransaction(
        transaction_date=datetime.utcnow(),
        amount=new_payment.amount,
        transaction_type="rental_income",
        reference_id=new_payment.id,
        notes=f"إيراد إيجار الوحدة {rental.unit.code} من {rental.tenant_name}",
        user_id=get_jwt_identity()
    )
    cashier_transaction.save()

    return jsonify({"msg": "Rental payment added successfully", "payment": new_payment.to_dict()}), 201

@rentals_bp.route("/rentals/<int:rental_id>/payments", methods=["GET"])
@permission_required("manage_rentals", "view")
def get_rental_payments(rental_id):
    rental = Rental.query.get(rental_id)
    if not rental:
        return jsonify({"msg": "Rental not found"}), 404
    
    payments = RentalPayment.query.filter_by(rental_id=rental_id).all()
    return jsonify([payment.to_dict() for payment in payments]), 200

@rentals_bp.route("/rental_payments/<int:payment_id>", methods=["PUT"])
@permission_required("manage_rentals", "edit")
def update_rental_payment(payment_id):
    payment = RentalPayment.query.get(payment_id)
    if not payment:
        return jsonify({"msg": "Rental payment not found"}), 404

    data = request.get_json()
    payment_date_str = data.get("payment_date", payment.payment_date.isoformat() if payment.payment_date else None)
    amount = data.get("amount", payment.amount)
    status = data.get("status", payment.status)
    notes = data.get("notes", payment.notes)

    try:
        payment_date = datetime.strptime(payment_date_str, 
                                        "%Y-%m-%d").date()
        amount = float(amount)
    except ValueError:
        return jsonify({"msg": "Invalid date or amount format"}), 400

    # Revert previous cashier impact
    previous_cashier_impact = CalculationService.calculate_cashier_impact(
        "rental_income", payment.amount
    )
    current_balance = CashierBalance.get_current_balance()
    CashierBalance.update_balance(current_balance - previous_cashier_impact)

    payment.payment_date = payment_date
    payment.amount = amount
    payment.status = status
    payment.notes = notes
    payment.save()

    # Apply new cashier impact
    new_cashier_impact = CalculationService.calculate_cashier_impact(
        "rental_income", payment.amount
    )
    current_balance = CashierBalance.get_current_balance()
    CashierBalance.update_balance(current_balance + new_cashier_impact)

    # Update cashier transaction
    cashier_transaction = CashierTransaction.query.filter_by(reference_id=payment.id, transaction_type="rental_income").first()
    if cashier_transaction:
        cashier_transaction.amount = payment.amount
        cashier_transaction.transaction_date = datetime.utcnow()
        cashier_transaction.notes = f"تحديث إيراد إيجار الوحدة {payment.rental.unit.code} من {payment.rental.tenant_name}"
        cashier_transaction.save()

    return jsonify({"msg": "Rental payment updated successfully", "payment": payment.to_dict()}), 200

@rentals_bp.route("/rental_payments/<int:payment_id>", methods=["DELETE"])
@permission_required("manage_rentals", "delete")
def delete_rental_payment(payment_id):
    payment = RentalPayment.query.get(payment_id)
    if not payment:
        return jsonify({"msg": "Rental payment not found"}), 404

    # Revert cashier impact
    current_balance = CashierBalance.get_current_balance()
    cashier_impact = CalculationService.calculate_cashier_impact(
        "rental_income", payment.amount
    )
    CashierBalance.update_balance(current_balance - cashier_impact)

    # Delete cashier transaction
    cashier_transaction = CashierTransaction.query.filter_by(reference_id=payment.id, transaction_type="rental_income").first()
    if cashier_transaction:
        cashier_transaction.delete()

    payment.delete()
    return jsonify({"msg": "Rental payment deleted successfully"}), 200


