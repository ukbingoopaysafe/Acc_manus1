from src.models import FinancialSetting

class CalculationService:
    """Service for handling financial calculations based on dynamic settings"""
    
    @staticmethod
    def calculate_sale_financials(sale_price, unit_type, salesperson_id=None, sales_manager_id=None):
        """
        Calculate all financial aspects of a sale based on current settings
        
        Args:
            sale_price (float): The sale price of the unit
            unit_type (str): Type of unit (شقة، تجاري، إداري، طبي)
            salesperson_id (int): ID of the salesperson
            sales_manager_id (int): ID of the sales manager
            
        Returns:
            dict: Dictionary containing all calculated values
        """
        
        # Get tax rates
        vat_rate = FinancialSetting.get_value('VAT_RATE', 0.14)
        sales_tax_rate = FinancialSetting.get_value('SALES_TAX_RATE', 0.05)
        admin_discount_rate = FinancialSetting.get_value('ADMIN_DISCOUNT_PERCENTAGE', 0.05)
        
        # Get commission rates based on unit type
        unit_type_mapping = {
            'شقة': 'APARTMENT',
            'تجاري': 'COMMERCIAL', 
            'إداري': 'ADMINISTRATIVE',
            'طبي': 'MEDICAL'
        }
        
        unit_type_key = unit_type_mapping.get(unit_type, 'APARTMENT')
        
        company_commission_rate = FinancialSetting.get_value(f'COMPANY_COMMISSION_{unit_type_key}', 0.02)
        salesperson_commission_rate = FinancialSetting.get_value(f'SALESPERSON_COMMISSION_{unit_type_key}', 0.005)
        sales_manager_commission_rate = FinancialSetting.get_value('SALES_MANAGER_COMMISSION', 0.003)
        
        # Calculate commissions
        company_commission = sale_price * company_commission_rate
        salesperson_commission = sale_price * salesperson_commission_rate if salesperson_id else 0
        sales_manager_commission = sale_price * sales_manager_commission_rate if sales_manager_id else 0
        
        # Calculate gross company revenue (before taxes)
        gross_company_revenue = company_commission
        
        # Apply admin discount (5% reduction)
        after_admin_discount = gross_company_revenue * (1 - admin_discount_rate)
        
        # Calculate taxes
        vat_amount = after_admin_discount * vat_rate
        sales_tax_amount = after_admin_discount * sales_tax_rate
        total_taxes = vat_amount + sales_tax_amount
        
        # Calculate net company revenue (after all deductions)
        net_company_revenue = after_admin_discount - total_taxes
        
        return {
            'company_commission': round(company_commission, 2),
            'salesperson_commission': round(salesperson_commission, 2),
            'sales_manager_commission': round(sales_manager_commission, 2),
            'gross_company_revenue': round(gross_company_revenue, 2),
            'after_admin_discount': round(after_admin_discount, 2),
            'vat_amount': round(vat_amount, 2),
            'sales_tax_amount': round(sales_tax_amount, 2),
            'total_taxes': round(total_taxes, 2),
            'net_company_revenue': round(net_company_revenue, 2),
            'rates_used': {
                'vat_rate': vat_rate,
                'sales_tax_rate': sales_tax_rate,
                'admin_discount_rate': admin_discount_rate,
                'company_commission_rate': company_commission_rate,
                'salesperson_commission_rate': salesperson_commission_rate,
                'sales_manager_commission_rate': sales_manager_commission_rate
            }
        }
    
    @staticmethod
    def calculate_cashier_impact(transaction_type, amount):
        """
        Calculate the impact of a transaction on cashier balance
        
        Args:
            transaction_type (str): Type of transaction
            amount (float): Transaction amount
            
        Returns:
            float: Amount to add/subtract from cashier (positive for income, negative for expense)
        """
        
        income_types = ['sale_revenue', 'rental_income', 'deposit']
        expense_types = ['expense_payment', 'salesperson_commission_payment', 
                        'sales_manager_commission_payment', 'withdrawal']
        
        if transaction_type in income_types:
            return abs(amount)  # Positive impact (income)
        elif transaction_type in expense_types:
            return -abs(amount)  # Negative impact (expense)
        else:
            return 0  # No impact for unknown types
    
    @staticmethod
    def get_commission_rates_by_unit_type():
        """Get all commission rates organized by unit type"""
        
        unit_types = ['APARTMENT', 'COMMERCIAL', 'ADMINISTRATIVE', 'MEDICAL']
        rates = {}
        
        for unit_type in unit_types:
            rates[unit_type] = {
                'company_commission': FinancialSetting.get_value(f'COMPANY_COMMISSION_{unit_type}', 0.02),
                'salesperson_commission': FinancialSetting.get_value(f'SALESPERSON_COMMISSION_{unit_type}', 0.005)
            }
        
        rates['sales_manager_commission'] = FinancialSetting.get_value('SALES_MANAGER_COMMISSION', 0.003)
        
        return rates
    
    @staticmethod
    def get_tax_rates():
        """Get all tax rates"""
        return {
            'vat_rate': FinancialSetting.get_value('VAT_RATE', 0.14),
            'sales_tax_rate': FinancialSetting.get_value('SALES_TAX_RATE', 0.05),
            'admin_discount_rate': FinancialSetting.get_value('ADMIN_DISCOUNT_PERCENTAGE', 0.05),
            'annual_tax_rate': FinancialSetting.get_value('ANNUAL_TAX_RATE', 0.225)
        }

