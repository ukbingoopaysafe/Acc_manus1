import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  ShoppingCart, 
  Receipt,
  Building,
  Users
} from 'lucide-react';

const Dashboard = () => {
  const { t, isRTL } = useLanguage();
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    cashierBalance: 0,
    recentSales: [],
    recentExpenses: [],
    totalUnits: 0,
    availableUnits: 0,
    soldUnits: 0,
    rentedUnits: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all required data in parallel
      const [
        revenueReport,
        expensesReport,
        profitLossReport,
        recentSales,
        recentExpenses,
        units
      ] = await Promise.all([
        ApiService.getRevenueReport(),
        ApiService.getExpensesReport(),
        ApiService.getProfitLossReport(),
        ApiService.getSales(),
        ApiService.getExpenses(),
        ApiService.getUnits()
      ]);

      // Calculate totals
      const totalRevenue = profitLossReport.total_revenue || 0;
      const totalExpenses = profitLossReport.total_expenses || 0;
      const netProfit = profitLossReport.net_profit_loss || 0;

      // Unit statistics
      const totalUnits = units.length;
      const availableUnits = units.filter(unit => unit.status === 'متاحة').length;
      const soldUnits = units.filter(unit => unit.status === 'مباعة').length;
      const rentedUnits = units.filter(unit => unit.status === 'مؤجرة').length;

      setDashboardData({
        totalRevenue,
        totalExpenses,
        netProfit,
        cashierBalance: 0, // This would come from a cashier balance endpoint
        recentSales: recentSales.slice(0, 5),
        recentExpenses: recentExpenses.slice(0, 5),
        totalUnits,
        availableUnits,
        soldUnits,
        rentedUnits
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard')}</h1>
        <p className="text-gray-600 mt-2">مرحباً بك في نظام إدارة Broman Real Estate</p>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_revenue')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(dashboardData.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_expenses')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(dashboardData.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('net_profit')}</CardTitle>
            <DollarSign className={`h-4 w-4 ${dashboardData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dashboardData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(dashboardData.netProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cashier_balance')}</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(dashboardData.cashierBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Units Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الوحدات</CardTitle>
            <Building className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalUnits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الوحدات المتاحة</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardData.availableUnits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الوحدات المباعة</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dashboardData.soldUnits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الوحدات المؤجرة</CardTitle>
            <Building className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{dashboardData.rentedUnits}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('recent_sales')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.recentSales.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{sale.client_name}</p>
                      <p className="text-sm text-gray-600">{sale.unit_code}</p>
                      <p className="text-xs text-gray-500">{formatDate(sale.sale_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(sale.sale_price)}</p>
                      <Badge variant="secondary" className="text-xs">
                        {sale.salesperson_name}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">{t('no_data')}</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('recent_expenses')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.recentExpenses.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{expense.description_ar}</p>
                      <p className="text-sm text-gray-600">{expense.category_name_ar}</p>
                      <p className="text-xs text-gray-500">{formatDate(expense.expense_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{formatCurrency(expense.amount)}</p>
                      <Badge variant="outline" className="text-xs">
                        {expense.user_name}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">{t('no_data')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

