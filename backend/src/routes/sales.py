
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models import db, Sale, Unit, User, CashierBalance, CashierTransaction
from src.services.calculation_service import CalculationService
from src.services.dynamic_calculation_service import DynamicCalculationService
from src.utils.auth_utils import permission_required
from datetime import datetime

sales_bp = Blueprint("sales", __name__)

@sales_bp.route("/sales", methods=["POST"])
@permission_required("manage_sales", "create")
def create_sale():
    data = request.get_json()
    unit_id = data.get("unit_id")
    client_name = data.get("client_name")
    sale_date_str = data.get("sale_date")
    sale_price = data.get("sale_price")
    salesperson_id = data.get("salesperson_id")
    sales_manager_id = data.get("sales_manager_id")
    notes = data.get("notes")

    if not all([unit_id, client_name, sale_date_str, sale_price, salesperson_id]):
        return jsonify({"msg": "Missing required fields: unit_id, client_name, sale_date, sale_price, salesperson_id"}), 400

    unit = Unit.query.get(unit_id)
    if not unit:
        return jsonify({"msg": "Unit not found"}), 404
    if unit.status != "متاحة":
        return jsonify({"msg": "Unit is not available for sale"}), 400

    salesperson = User.query.get(salesperson_id)
    if not salesperson:
        return jsonify({"msg": "Salesperson not found"}), 404
    
    sales_manager = None
    if sales_manager_id:
        sales_manager = User.query.get(sales_manager_id)
        if not sales_manager:
            return jsonify({"msg": "Sales manager not found"}), 404

    try:
        sale_date = datetime.strptime(sale_date_str, '%Y-%m-%d').date()
        sale_price = float(sale_price)
    except ValueError:
        return jsonify({"msg": "Invalid date or price format"}), 400

    # Calculate financials using dynamic calculation service
    try:
        calculations = DynamicCalculationService.calculate_sale_amounts(
            sale_price, unit_id, salesperson_id, sales_manager_id
        )
    except Exception as e:
        return jsonify({"msg": f"Calculation error: {str(e)}"}), 500

    new_sale = Sale(
        unit_id=unit_id,
        client_name=client_name,
        sale_date=sale_date,
        sale_price=sale_price,
        salesperson_id=salesperson_id,
        sales_manager_id=sales_manager_id,
        company_commission=calculations["totals"]["company_commission"],
        salesperson_commission=calculations["totals"]["salesperson_commission"],
        sales_manager_commission=calculations["totals"]["sales_manager_commission"],
        total_taxes=calculations["totals"]["total_taxes"],
        net_company_revenue=calculations["totals"]["net_company_revenue"],
        notes=notes
    )
    
    # Store detailed calculation breakdown
    new_sale.set_calculation_breakdown(calculations)
    new_sale.save()

    # Update unit status
    unit.status = "مباعة"
    unit.save()

    # Update cashier balance and record transaction
    current_balance = CashierBalance.get_current_balance()
    cashier_impact = CalculationService.calculate_cashier_impact(
        "sale_revenue", new_sale.net_company_revenue
    )
    new_balance = current_balance + cashier_impact
    CashierBalance.update_balance(new_balance)

    cashier_transaction = CashierTransaction(
        transaction_date=datetime.utcnow(),
        amount=new_sale.net_company_revenue,
        transaction_type="sale_revenue",
        reference_id=new_sale.id,
        notes=f"إيراد بيع الوحدة {unit.code} للعميل {client_name}",
        user_id=get_jwt_identity() # User who created the sale
    )
    cashier_transaction.save()

    return jsonify({"msg": "Sale created successfully", "sale": new_sale.to_dict()}), 201

@sales_bp.route("/sales", methods=["GET"])
@permission_required("manage_sales", "view")
def get_sales():
    sales = Sale.query.all()
    return jsonify([sale.to_dict() for sale in sales]), 200

@sales_bp.route("/sales/<int:sale_id>", methods=["GET"])
@permission_required("manage_sales", "view")
def get_sale(sale_id):
    sale = Sale.query.get(sale_id)
    if not sale:
        return jsonify({"msg": "Sale not found"}), 404
    return jsonify(sale.to_dict()), 200

@sales_bp.route("/sales/<int:sale_id>", methods=["PUT"])
@permission_required("manage_sales", "edit")
def update_sale(sale_id):
    sale = Sale.query.get(sale_id)
    if not sale:
        return jsonify({"msg": "Sale not found"}), 404

    data = request.get_json()
    unit_id = data.get("unit_id", sale.unit_id)
    client_name = data.get("client_name", sale.client_name)
    sale_date_str = data.get("sale_date", sale.sale_date.isoformat() if sale.sale_date else None)
    sale_price = data.get("sale_price", sale.sale_price)
    salesperson_id = data.get("salesperson_id", sale.salesperson_id)
    sales_manager_id = data.get("sales_manager_id", sale.sales_manager_id)
    notes = data.get("notes", sale.notes)

    unit = Unit.query.get(unit_id)
    if not unit:
        return jsonify({"msg": "Unit not found"}), 404
    
    salesperson = User.query.get(salesperson_id)
    if not salesperson:
        return jsonify({"msg": "Salesperson not found"}), 404
    
    sales_manager = None
    if sales_manager_id:
        sales_manager = User.query.get(sales_manager_id)
        if not sales_manager:
            return jsonify({"msg": "Sales manager not found"}), 404

    try:
        sale_date = datetime.strptime(sale_date_str, '%Y-%m-%d').date()
        sale_price = float(sale_price)
    except ValueError:
        return jsonify({"msg": "Invalid date or price format"}), 400

    # Re-calculate financials if relevant fields changed
    if (sale_price != sale.sale_price or 
        unit.type != sale.unit.type or 
        salesperson_id != sale.salesperson_id or 
        sales_manager_id != sale.sales_manager_id):
        
        # Revert previous cashier impact (if any)
        previous_cashier_impact = CalculationService.calculate_cashier_impact(
            "sale_revenue", sale.net_company_revenue
        )
        current_balance = CashierBalance.get_current_balance()
        CashierBalance.update_balance(current_balance - previous_cashier_impact)
        
        financials = CalculationService.calculate_sale_financials(
            sale_price, unit.type, salesperson_id, sales_manager_id
        )
        sale.company_commission = financials["company_commission"]
        sale.salesperson_commission = financials["salesperson_commission"]
        sale.sales_manager_commission = financials["sales_manager_commission"]
        sale.total_taxes = financials["total_taxes"]
        sale.net_company_revenue = financials["net_company_revenue"]
        
        # Apply new cashier impact
        new_cashier_impact = CalculationService.calculate_cashier_impact(
            "sale_revenue", sale.net_company_revenue
        )
        current_balance = CashierBalance.get_current_balance()
        CashierBalance.update_balance(current_balance + new_cashier_impact)

        # Update cashier transaction
        cashier_transaction = CashierTransaction.query.filter_by(reference_id=sale.id, transaction_type="sale_revenue").first()
        if cashier_transaction:
            cashier_transaction.amount = sale.net_company_revenue
            cashier_transaction.transaction_date = datetime.utcnow()
            cashier_transaction.notes = f"تحديث إيراد بيع الوحدة {unit.code} للعميل {client_name}"
            cashier_transaction.save()

    sale.unit_id = unit_id
    sale.client_name = client_name
    sale.sale_date = sale_date
    sale.sale_price = sale_price
    sale.salesperson_id = salesperson_id
    sale.sales_manager_id = sales_manager_id
    sale.notes = notes
    sale.save()

    return jsonify({"msg": "Sale updated successfully", "sale": sale.to_dict()}), 200

@sales_bp.route("/sales/<int:sale_id>", methods=["DELETE"])
@permission_required("manage_sales", "delete")
def delete_sale(sale_id):
    sale = Sale.query.get(sale_id)
    if not sale:
        return jsonify({"msg": "Sale not found"}), 404

    # Revert cashier impact
    current_balance = CashierBalance.get_current_balance()
    cashier_impact = CalculationService.calculate_cashier_impact(
        "sale_revenue", sale.net_company_revenue
    )
    CashierBalance.update_balance(current_balance - cashier_impact)

    # Delete cashier transaction
    cashier_transaction = CashierTransaction.query.filter_by(reference_id=sale.id, transaction_type="sale_revenue").first()
    if cashier_transaction:
        cashier_transaction.delete()

    # Update unit status back to available
    unit = Unit.query.get(sale.unit_id)
    if unit:
        unit.status = "متاحة"
        unit.save()

    sale.delete()
    return jsonify({"msg": "Sale deleted successfully"}), 200


