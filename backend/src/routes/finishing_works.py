
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models import db, FinishingWork, FinishingWorkExpense, Unit, CashierBalance, CashierTransaction
from src.services.calculation_service import CalculationService
from src.utils.auth_utils import permission_required
from datetime import datetime

finishing_works_bp = Blueprint("finishing_works", __name__)

@finishing_works_bp.route("/finishing_works", methods=["POST"])
@permission_required("manage_finishing_works", "create")
def create_finishing_work():
    data = request.get_json()
    unit_id = data.get("unit_id")
    project_name_ar = data.get("project_name_ar")
    project_name_en = data.get("project_name_en")
    start_date_str = data.get("start_date")
    end_date_str = data.get("end_date")
    budget = data.get("budget")
    status = data.get("status", "قيد التنفيذ")
    notes = data.get("notes")

    if not all([unit_id, project_name_ar, start_date_str, budget]):
        return jsonify({"msg": "Missing required fields: unit_id, project_name_ar, start_date, budget"}), 400

    unit = Unit.query.get(unit_id)
    if not unit:
        return jsonify({"msg": "Unit not found"}), 404

    try:
        start_date = datetime.strptime(start_date_str, 
                                       "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_str, 
                                     "%Y-%m-%d").date() if end_date_str else None
        budget = float(budget)
    except ValueError:
        return jsonify({"msg": "Invalid date or budget format"}), 400

    new_finishing_work = FinishingWork(
        unit_id=unit_id,
        project_name_ar=project_name_ar,
        project_name_en=project_name_en,
        start_date=start_date,
        end_date=end_date,
        budget=budget,
        status=status,
        notes=notes
    )
    new_finishing_work.save()

    return jsonify({"msg": "Finishing work project created successfully", "project": new_finishing_work.to_dict()}), 201

@finishing_works_bp.route("/finishing_works", methods=["GET"])
@permission_required("manage_finishing_works", "view")
def get_finishing_works():
    finishing_works = FinishingWork.query.all()
    return jsonify([fw.to_dict() for fw in finishing_works]), 200

@finishing_works_bp.route("/finishing_works/<int:fw_id>", methods=["GET"])
@permission_required("manage_finishing_works", "view")
def get_finishing_work(fw_id):
    finishing_work = FinishingWork.query.get(fw_id)
    if not finishing_work:
        return jsonify({"msg": "Finishing work project not found"}), 404
    return jsonify(finishing_work.to_dict()), 200

@finishing_works_bp.route("/finishing_works/<int:fw_id>", methods=["PUT"])
@permission_required("manage_finishing_works", "edit")
def update_finishing_work(fw_id):
    finishing_work = FinishingWork.query.get(fw_id)
    if not finishing_work:
        return jsonify({"msg": "Finishing work project not found"}), 404

    data = request.get_json()
    unit_id = data.get("unit_id", finishing_work.unit_id)
    project_name_ar = data.get("project_name_ar", finishing_work.project_name_ar)
    project_name_en = data.get("project_name_en", finishing_work.project_name_en)
    start_date_str = data.get("start_date", finishing_work.start_date.isoformat() if finishing_work.start_date else None)
    end_date_str = data.get("end_date", finishing_work.end_date.isoformat() if finishing_work.end_date else None)
    budget = data.get("budget", finishing_work.budget)
    actual_cost = data.get("actual_cost", finishing_work.actual_cost)
    status = data.get("status", finishing_work.status)
    notes = data.get("notes", finishing_work.notes)

    unit = Unit.query.get(unit_id)
    if not unit:
        return jsonify({"msg": "Unit not found"}), 404

    try:
        start_date = datetime.strptime(start_date_str, 
                                       "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_str, 
                                     "%Y-%m-%d").date() if end_date_str else None
        budget = float(budget)
        actual_cost = float(actual_cost)
    except ValueError:
        return jsonify({"msg": "Invalid date or amount format"}), 400

    finishing_work.unit_id = unit_id
    finishing_work.project_name_ar = project_name_ar
    finishing_work.project_name_en = project_name_en
    finishing_work.start_date = start_date
    finishing_work.end_date = end_date
    finishing_work.budget = budget
    finishing_work.actual_cost = actual_cost
    finishing_work.status = status
    finishing_work.notes = notes
    finishing_work.save()

    return jsonify({"msg": "Finishing work project updated successfully", "project": finishing_work.to_dict()}), 200

@finishing_works_bp.route("/finishing_works/<int:fw_id>", methods=["DELETE"])
@permission_required("manage_finishing_works", "delete")
def delete_finishing_work(fw_id):
    finishing_work = FinishingWork.query.get(fw_id)
    if not finishing_work:
        return jsonify({"msg": "Finishing work project not found"}), 404

    # Delete associated expenses
    for expense in finishing_work.expenses:
        # Revert cashier impact for each expense
        current_balance = CashierBalance.get_current_balance()
        cashier_impact = CalculationService.calculate_cashier_impact(
            "finishing_work_expense", expense.amount
        )
        CashierBalance.update_balance(current_balance - cashier_impact)

        # Delete cashier transaction
        cashier_transaction = CashierTransaction.query.filter_by(reference_id=expense.id, transaction_type="finishing_work_expense").first()
        if cashier_transaction:
            cashier_transaction.delete()
        expense.delete()

    finishing_work.delete()
    return jsonify({"msg": "Finishing work project deleted successfully"}), 200

# --- Finishing Work Expenses ---
@finishing_works_bp.route("/finishing_works/<int:fw_id>/expenses", methods=["POST"])
@permission_required("manage_finishing_works", "create")
def add_finishing_work_expense(fw_id):
    finishing_work = FinishingWork.query.get(fw_id)
    if not finishing_work:
        return jsonify({"msg": "Finishing work project not found"}), 404

    data = request.get_json()
    description_ar = data.get("description_ar")
    description_en = data.get("description_en")
    amount = data.get("amount")
    expense_date_str = data.get("expense_date")
    notes = data.get("notes")

    if not all([description_ar, amount, expense_date_str]):
        return jsonify({"msg": "Missing required fields: description_ar, amount, expense_date"}), 400

    try:
        expense_date = datetime.strptime(expense_date_str, 
                                         "%Y-%m-%d").date()
        amount = float(amount)
    except ValueError:
        return jsonify({"msg": "Invalid date or amount format"}), 400

    new_expense = FinishingWorkExpense(
        finishing_work_id=fw_id,
        description_ar=description_ar,
        description_en=description_en,
        amount=amount,
        expense_date=expense_date,
        notes=notes
    )
    new_expense.save()

    # Update actual cost of finishing work project
    finishing_work.actual_cost += new_expense.amount
    finishing_work.save()

    # Update cashier balance and record transaction
    current_balance = CashierBalance.get_current_balance()
    cashier_impact = CalculationService.calculate_cashier_impact(
        "finishing_work_expense", new_expense.amount
    )
    new_balance = current_balance + cashier_impact
    CashierBalance.update_balance(new_balance)

    cashier_transaction = CashierTransaction(
        transaction_date=datetime.utcnow(),
        amount=new_expense.amount,
        transaction_type="finishing_work_expense",
        reference_id=new_expense.id,
        notes=f"مصروف تشطيبات لمشروع {finishing_work.project_name_ar}: {new_expense.description_ar}",
        user_id=get_jwt_identity()
    )
    cashier_transaction.save()

    return jsonify({"msg": "Finishing work expense added successfully", "expense": new_expense.to_dict()}), 201

@finishing_works_bp.route("/finishing_works/<int:fw_id>/expenses", methods=["GET"])
@permission_required("manage_finishing_works", "view")
def get_finishing_work_expenses(fw_id):
    finishing_work = FinishingWork.query.get(fw_id)
    if not finishing_work:
        return jsonify({"msg": "Finishing work project not found"}), 404
    
    expenses = FinishingWorkExpense.query.filter_by(finishing_work_id=fw_id).all()
    return jsonify([expense.to_dict() for expense in expenses]), 200

@finishing_works_bp.route("/finishing_work_expenses/<int:expense_id>", methods=["PUT"])
@permission_required("manage_finishing_works", "edit")
def update_finishing_work_expense(expense_id):
    expense = FinishingWorkExpense.query.get(expense_id)
    if not expense:
        return jsonify({"msg": "Finishing work expense not found"}), 404

    data = request.get_json()
    description_ar = data.get("description_ar", expense.description_ar)
    description_en = data.get("description_en", expense.description_en)
    amount = data.get("amount", expense.amount)
    expense_date_str = data.get("expense_date", expense.expense_date.isoformat() if expense.expense_date else None)
    notes = data.get("notes", expense.notes)

    try:
        expense_date = datetime.strptime(expense_date_str, 
                                         "%Y-%m-%d").date()
        amount = float(amount)
    except ValueError:
        return jsonify({"msg": "Invalid date or amount format"}), 400

    # Revert previous cashier impact
    previous_cashier_impact = CalculationService.calculate_cashier_impact(
        "finishing_work_expense", expense.amount
    )
    current_balance = CashierBalance.get_current_balance()
    CashierBalance.update_balance(current_balance - previous_cashier_impact)

    # Update actual cost of finishing work project
    finishing_work = expense.finishing_work
    if finishing_work:
        finishing_work.actual_cost -= expense.amount
        finishing_work.actual_cost += amount
        finishing_work.save()

    expense.description_ar = description_ar
    expense.description_en = description_en
    expense.amount = amount
    expense.expense_date = expense_date
    expense.notes = notes
    expense.save()

    # Apply new cashier impact
    new_cashier_impact = CalculationService.calculate_cashier_impact(
        "finishing_work_expense", expense.amount
    )
    current_balance = CashierBalance.get_current_balance()
    CashierBalance.update_balance(current_balance + new_cashier_impact)

    # Update cashier transaction
    cashier_transaction = CashierTransaction.query.filter_by(reference_id=expense.id, transaction_type="finishing_work_expense").first()
    if cashier_transaction:
        cashier_transaction.amount = expense.amount
        cashier_transaction.transaction_date = datetime.utcnow()
        cashier_transaction.notes = f"تحديث مصروف تشطيبات لمشروع {finishing_work.project_name_ar}: {expense.description_ar}"
        cashier_transaction.save()

    return jsonify({"msg": "Finishing work expense updated successfully", "expense": expense.to_dict()}), 200

@finishing_works_bp.route("/finishing_work_expenses/<int:expense_id>", methods=["DELETE"])
@permission_required("manage_finishing_works", "delete")
def delete_finishing_work_expense(expense_id):
    expense = FinishingWorkExpense.query.get(expense_id)
    if not expense:
        return jsonify({"msg": "Finishing work expense not found"}), 404

    # Revert cashier impact
    current_balance = CashierBalance.get_current_balance()
    cashier_impact = CalculationService.calculate_cashier_impact(
        "finishing_work_expense", expense.amount
    )
    CashierBalance.update_balance(current_balance - cashier_impact)

    # Update actual cost of finishing work project
    finishing_work = expense.finishing_work
    if finishing_work:
        finishing_work.actual_cost -= expense.amount
        finishing_work.save()

    # Delete cashier transaction
    cashier_transaction = CashierTransaction.query.filter_by(reference_id=expense.id, transaction_type="finishing_work_expense").first()
    if cashier_transaction:
        cashier_transaction.delete()

    expense.delete()
    return jsonify({"msg": "Finishing work expense deleted successfully"}), 200


