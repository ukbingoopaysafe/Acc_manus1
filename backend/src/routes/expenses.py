
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models import db, Expense, ExpenseCategory, CashierBalance, CashierTransaction
from src.services.calculation_service import CalculationService
from src.utils.auth_utils import permission_required
from datetime import datetime

expenses_bp = Blueprint("expenses", __name__)

@expenses_bp.route("/expense_categories", methods=["POST"])
@permission_required("manage_expenses", "create")
def create_expense_category():
    data = request.get_json()
    name_ar = data.get("name_ar")
    name_en = data.get("name_en")
    description_ar = data.get("description_ar")
    description_en = data.get("description_en")

    if not all([name_ar, name_en]):
        return jsonify({"msg": "Missing required fields: name_ar, name_en"}), 400

    if ExpenseCategory.query.filter_by(name_ar=name_ar).first() or ExpenseCategory.query.filter_by(name_en=name_en).first():
        return jsonify({"msg": "Expense category with this name already exists"}), 409

    new_category = ExpenseCategory(
        name_ar=name_ar,
        name_en=name_en,
        description_ar=description_ar,
        description_en=description_en
    )
    new_category.save()
    return jsonify({"msg": "Expense category created successfully", "category": new_category.to_dict()}), 201

@expenses_bp.route("/expense_categories", methods=["GET"])
@permission_required("manage_expenses", "view")
def get_expense_categories():
    categories = ExpenseCategory.query.all()
    return jsonify([category.to_dict() for category in categories]), 200

@expenses_bp.route("/expense_categories/<int:category_id>", methods=["PUT"])
@permission_required("manage_expenses", "edit")
def update_expense_category(category_id):
    category = ExpenseCategory.query.get(category_id)
    if not category:
        return jsonify({"msg": "Expense category not found"}), 404

    data = request.get_json()
    category.name_ar = data.get("name_ar", category.name_ar)
    category.name_en = data.get("name_en", category.name_en)
    category.description_ar = data.get("description_ar", category.description_ar)
    category.description_en = data.get("description_en", category.description_en)
    category.save()
    return jsonify({"msg": "Expense category updated successfully", "category": category.to_dict()}), 200

@expenses_bp.route("/expense_categories/<int:category_id>", methods=["DELETE"])
@permission_required("manage_expenses", "delete")
def delete_expense_category(category_id):
    category = ExpenseCategory.query.get(category_id)
    if not category:
        return jsonify({"msg": "Expense category not found"}), 404
    if category.expenses: # Prevent deleting categories with associated expenses
        return jsonify({"msg": "Cannot delete category with associated expenses"}), 400
    category.delete()
    return jsonify({"msg": "Expense category deleted successfully"}), 200

@expenses_bp.route("/expenses", methods=["POST"])
@permission_required("manage_expenses", "create")
def create_expense():
    data = request.get_json()
    description_ar = data.get("description_ar")
    description_en = data.get("description_en")
    amount = data.get("amount")
    expense_date_str = data.get("expense_date")
    category_id = data.get("category_id")
    notes = data.get("notes")

    if not all([description_ar, amount, expense_date_str, category_id]):
        return jsonify({"msg": "Missing required fields: description_ar, amount, expense_date, category_id"}), 400

    if not ExpenseCategory.query.get(category_id):
        return jsonify({"msg": "Expense category not found"}), 404

    try:
        expense_date = datetime.strptime(expense_date_str, 
                                         '%Y-%m-%d').date()
        amount = float(amount)
    except ValueError:
        return jsonify({"msg": "Invalid date or amount format"}), 400

    new_expense = Expense(
        description_ar=description_ar,
        description_en=description_en,
        amount=amount,
        expense_date=expense_date,
        category_id=category_id,
        user_id=get_jwt_identity(),
        notes=notes
    )
    new_expense.save()

    # Update cashier balance and record transaction
    current_balance = CashierBalance.get_current_balance()
    cashier_impact = CalculationService.calculate_cashier_impact(
        "expense_payment", new_expense.amount
    )
    new_balance = current_balance + cashier_impact
    CashierBalance.update_balance(new_balance)

    cashier_transaction = CashierTransaction(
        transaction_date=datetime.utcnow(),
        amount=new_expense.amount,
        transaction_type="expense_payment",
        reference_id=new_expense.id,
        notes=f"دفع مصروف: {new_expense.description_ar}",
        user_id=get_jwt_identity()
    )
    cashier_transaction.save()

    return jsonify({"msg": "Expense created successfully", "expense": new_expense.to_dict()}), 201

@expenses_bp.route("/expenses", methods=["GET"])
@permission_required("manage_expenses", "view")
def get_expenses():
    expenses = Expense.query.all()
    return jsonify([expense.to_dict() for expense in expenses]), 200

@expenses_bp.route("/expenses/<int:expense_id>", methods=["GET"])
@permission_required("manage_expenses", "view")
def get_expense(expense_id):
    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({"msg": "Expense not found"}), 404
    return jsonify(expense.to_dict()), 200

@expenses_bp.route("/expenses/<int:expense_id>", methods=["PUT"])
@permission_required("manage_expenses", "edit")
def update_expense(expense_id):
    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({"msg": "Expense not found"}), 404

    data = request.get_json()
    description_ar = data.get("description_ar", expense.description_ar)
    description_en = data.get("description_en", expense.description_en)
    amount = data.get("amount", expense.amount)
    expense_date_str = data.get("expense_date", expense.expense_date.isoformat() if expense.expense_date else None)
    category_id = data.get("category_id", expense.category_id)
    notes = data.get("notes", expense.notes)

    if not ExpenseCategory.query.get(category_id):
        return jsonify({"msg": "Expense category not found"}), 404

    try:
        expense_date = datetime.strptime(expense_date_str, 
                                         '%Y-%m-%d').date()
        amount = float(amount)
    except ValueError:
        return jsonify({"msg": "Invalid date or amount format"}), 400

    # Revert previous cashier impact
    previous_cashier_impact = CalculationService.calculate_cashier_impact(
        "expense_payment", expense.amount
    )
    current_balance = CashierBalance.get_current_balance()
    CashierBalance.update_balance(current_balance - previous_cashier_impact)

    expense.description_ar = description_ar
    expense.description_en = description_en
    expense.amount = amount
    expense.expense_date = expense_date
    expense.category_id = category_id
    expense.notes = notes
    expense.save()

    # Apply new cashier impact
    new_cashier_impact = CalculationService.calculate_cashier_impact(
        "expense_payment", expense.amount
    )
    current_balance = CashierBalance.get_current_balance()
    CashierBalance.update_balance(current_balance + new_cashier_impact)

    # Update cashier transaction
    cashier_transaction = CashierTransaction.query.filter_by(reference_id=expense.id, transaction_type="expense_payment").first()
    if cashier_transaction:
        cashier_transaction.amount = expense.amount
        cashier_transaction.transaction_date = datetime.utcnow()
        cashier_transaction.notes = f"تحديث دفع مصروف: {expense.description_ar}"
        cashier_transaction.save()

    return jsonify({"msg": "Expense updated successfully", "expense": expense.to_dict()}), 200

@expenses_bp.route("/expenses/<int:expense_id>", methods=["DELETE"])
@permission_required("manage_expenses", "delete")
def delete_expense(expense_id):
    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({"msg": "Expense not found"}), 404

    # Revert cashier impact
    current_balance = CashierBalance.get_current_balance()
    cashier_impact = CalculationService.calculate_cashier_impact(
        "expense_payment", expense.amount
    )
    CashierBalance.update_balance(current_balance - cashier_impact)

    # Delete cashier transaction
    cashier_transaction = CashierTransaction.query.filter_by(reference_id=expense.id, transaction_type="expense_payment").first()
    if cashier_transaction:
        cashier_transaction.delete()

    expense.delete()
    return jsonify({"msg": "Expense deleted successfully"}), 200


