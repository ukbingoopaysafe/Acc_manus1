
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import Sale, Expense, RentalPayment, FinishingWorkExpense, CashierTransaction
from src.utils.auth_utils import permission_required
from datetime import datetime

reports_bp = Blueprint("reports", __name__)

@reports_bp.route("/reports/expenses", methods=["GET"])
@permission_required("view_reports", "view")
def get_expenses_report():
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")
    category_id = request.args.get("category_id", type=int)

    query = Expense.query

    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, 
                                           "%Y-%m-%d").date()
            query = query.filter(Expense.expense_date >= start_date)
        except ValueError:
            return jsonify({"msg": "Invalid start_date format"}), 400

    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, 
                                         "%Y-%m-%d").date()
            query = query.filter(Expense.expense_date <= end_date)
        except ValueError:
            return jsonify({"msg": "Invalid end_date format"}), 400

    if category_id:
        query = query.filter(Expense.category_id == category_id)

    expenses = query.all()
    return jsonify([expense.to_dict() for expense in expenses]), 200

@reports_bp.route("/reports/revenue", methods=["GET"])
@permission_required("view_reports", "view")
def get_revenue_report():
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")

    sales_query = Sale.query
    rentals_query = RentalPayment.query

    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, 
                                           "%Y-%m-%d").date()
            sales_query = sales_query.filter(Sale.sale_date >= start_date)
            rentals_query = rentals_query.filter(RentalPayment.payment_date >= start_date)
        except ValueError:
            return jsonify({"msg": "Invalid start_date format"}), 400

    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, 
                                         "%Y-%m-%d").date()
            sales_query = sales_query.filter(Sale.sale_date <= end_date)
            rentals_query = rentals_query.filter(RentalPayment.payment_date <= end_date)
        except ValueError:
            return jsonify({"msg": "Invalid end_date format"}), 400

    sales = sales_query.all()
    rental_payments = rentals_query.all()

    revenue_data = []
    for sale in sales:
        revenue_data.append({
            "type": "sale",
            "date": sale.sale_date.isoformat(),
            "description": f"بيع الوحدة {sale.unit.code} للعميل {sale.client_name}",
            "amount": float(sale.net_company_revenue)
        })
    for payment in rental_payments:
        revenue_data.append({
            "type": "rental_payment",
            "date": payment.payment_date.isoformat(),
            "description": f"دفعة إيجار من {payment.rental.tenant_name} للوحدة {payment.rental.unit.code}",
            "amount": float(payment.amount)
        })
    
    # Sort by date
    revenue_data.sort(key=lambda x: x["date"])

    return jsonify(revenue_data), 200

@reports_bp.route("/reports/profit_loss", methods=["GET"])
@permission_required("view_reports", "view")
def get_profit_loss_report():
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")

    sales_query = Sale.query
    expenses_query = Expense.query
    rental_payments_query = RentalPayment.query
    finishing_work_expenses_query = FinishingWorkExpense.query

    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, 
                                           "%Y-%m-%d").date()
            sales_query = sales_query.filter(Sale.sale_date >= start_date)
            expenses_query = expenses_query.filter(Expense.expense_date >= start_date)
            rental_payments_query = rental_payments_query.filter(RentalPayment.payment_date >= start_date)
            finishing_work_expenses_query = finishing_work_expenses_query.filter(FinishingWorkExpense.expense_date >= start_date)
        except ValueError:
            return jsonify({"msg": "Invalid start_date format"}), 400

    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, 
                                         "%Y-%m-%d").date()
            sales_query = sales_query.filter(Sale.sale_date <= end_date)
            expenses_query = expenses_query.filter(Expense.expense_date <= end_date)
            rental_payments_query = rental_payments_query.filter(RentalPayment.payment_date <= end_date)
            finishing_work_expenses_query = finishing_work_expenses_query.filter(FinishingWorkExpense.expense_date <= end_date)
        except ValueError:
            return jsonify({"msg": "Invalid end_date format"}), 400

    total_revenue = sum(float(s.net_company_revenue) for s in sales_query.all()) + \
                    sum(float(rp.amount) for rp in rental_payments_query.all())
    total_expenses = sum(float(e.amount) for e in expenses_query.all()) + \
                     sum(float(fwe.amount) for fwe in finishing_work_expenses_query.all())

    net_profit_loss = total_revenue - total_expenses

    return jsonify({
        "total_revenue": round(total_revenue, 2),
        "total_expenses": round(total_expenses, 2),
        "net_profit_loss": round(net_profit_loss, 2)
    }), 200

@reports_bp.route("/reports/cashier_transactions", methods=["GET"])
@permission_required("view_reports", "view")
def get_cashier_transactions_report():
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")
    transaction_type = request.args.get("transaction_type")

    query = CashierTransaction.query

    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, 
                                           "%Y-%m-%d").date()
            query = query.filter(db.func.date(CashierTransaction.transaction_date) >= start_date)
        except ValueError:
            return jsonify({"msg": "Invalid start_date format"}), 400

    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, 
                                         "%Y-%m-%d").date()
            query = query.filter(db.func.date(CashierTransaction.transaction_date) <= end_date)
        except ValueError:
            return jsonify({"msg": "Invalid end_date format"}), 400

    if transaction_type:
        query = query.filter(CashierTransaction.transaction_type == transaction_type)

    transactions = query.order_by(CashierTransaction.transaction_date.asc()).all()
    return jsonify([t.to_dict() for t in transactions]), 200


