from .base import db, BaseModel
from .auth import User, Role, Permission, RolePermission
from .units import Unit
from .sales import Sale
from .expenses import Expense, ExpenseCategory
from .rentals import Rental, RentalPayment
from .finishing_works import FinishingWork, FinishingWorkExpense
from .settings import FinancialSetting, Template, CashierBalance, CashierTransaction
from .dynamic_calculations import CalculationRule, CustomField, CustomFieldValue, PrintTemplate, ReportConfiguration

# Import the User model for backward compatibility with the template
from .auth import User

__all__ = [
    'db', 'BaseModel',
    'User', 'Role', 'Permission', 'RolePermission',
    'Unit', 'Sale', 
    'Expense', 'ExpenseCategory',
    'Rental', 'RentalPayment',
    'FinishingWork', 'FinishingWorkExpense',
    'FinancialSetting', 'Template', 'CashierBalance', 'CashierTransaction',
    'CalculationRule', 'CustomField', 'CustomFieldValue', 'PrintTemplate', 'ReportConfiguration'
]

