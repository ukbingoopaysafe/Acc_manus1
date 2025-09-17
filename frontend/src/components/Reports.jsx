import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  BarChart3, 
  Download, 
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  PieChart
} from 'lucide-react';

const Reports = () => {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });
  const [revenueReport, setRevenueReport] = useState(null);
  const [expensesReport, setExpensesReport] = useState(null);
  const [profitLossReport, setProfitLossReport] = useState(null);
  const [cashierTransactions, setCashierTransactions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setDateRange({
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0]
    });
  }, []);

  const fetchRevenueReport = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getRevenueReport(dateRange.start_date, dateRange.end_date);
      setRevenueReport(data);
    } catch (error) {
      setError('فشل في تحميل تقرير الإيرادات');
      console.error('Error fetching revenue report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpensesReport = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getExpensesReport(dateRange.start_date, dateRange.end_date);
      setExpensesReport(data);
    } catch (error) {
      setError('فشل في تحميل تقرير المصروفات');
      console.error('Error fetching expenses report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfitLossReport = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getProfitLossReport(dateRange.start_date, dateRange.end_date);
      setProfitLossReport(data);
    } catch (error) {
      setError('فشل في تحميل تقرير الأرباح والخسائر');
      console.error('Error fetching profit loss report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCashierTransactions = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getCashierTransactions(dateRange.start_date, dateRange.end_date);
      setCashierTransactions(data);
    } catch (error) {
      setError('فشل في تحميل معاملات الخزنة');
      console.error('Error fetching cashier transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async (reportType) => {
    try {
      setLoading(true);
      let data;
      let filename;

      switch (reportType) {
        case 'revenue':
          data = await ApiService.exportRevenueReport(dateRange.start_date, dateRange.end_date);
          filename = `revenue_report_${dateRange.start_date}_${dateRange.end_date}.xlsx`;
          break;
        case 'expenses':
          data = await ApiService.exportExpensesReport(dateRange.start_date, dateRange.end_date);
          filename = `expenses_report_${dateRange.start_date}_${dateRange.end_date}.xlsx`;
          break;
        case 'profit_loss':
          data = await ApiService.exportProfitLossReport(dateRange.start_date, dateRange.end_date);
          filename = `profit_loss_report_${dateRange.start_date}_${dateRange.end_date}.xlsx`;
          break;
        case 'cashier':
          data = await ApiService.exportCashierTransactions(dateRange.start_date, dateRange.end_date);
          filename = `cashier_transactions_${dateRange.start_date}_${dateRange.end_date}.xlsx`;
          break;
        default:
          throw new Error('نوع التقرير غير صحيح');
      }

      // Create blob and download
      const blob = new Blob([data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess('تم تصدير التقرير بنجاح');
    } catch (error) {
      setError(error.message || 'فشل في تصدير التقرير');
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('reports')}</h1>
        <p className="text-gray-600 mt-2">التقارير المالية والإحصائيات</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            فترة التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="start_date">من تاريخ</Label>
              <Input
                id="start_date"
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">إلى تاريخ</Label>
              <Input
                id="end_date"
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Button 
                onClick={() => {
                  fetchRevenueReport();
                  fetchExpensesReport();
                  fetchProfitLossReport();
                  fetchCashierTransactions();
                }}
                disabled={loading || !dateRange.start_date || !dateRange.end_date}
                className="w-full"
              >
                {loading ? 'جاري التحميل...' : 'تحديث التقارير'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">تقرير الإيرادات</TabsTrigger>
          <TabsTrigger value="expenses">تقرير المصروفات</TabsTrigger>
          <TabsTrigger value="profit_loss">الأرباح والخسائر</TabsTrigger>
          <TabsTrigger value="cashier">معاملات الخزنة</TabsTrigger>
        </TabsList>

        {/* Revenue Report Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">تقرير الإيرادات</h3>
            <Button 
              onClick={() => exportToExcel('revenue')}
              disabled={loading || !revenueReport}
            >
              <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              تصدير Excel
            </Button>
          </div>

          {revenueReport ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <TrendingUp className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    إجمالي المبيعات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(revenueReport.total_sales || 0)}
                  </div>
                  <p className="text-sm text-gray-600">
                    عدد المبيعات: {revenueReport.sales_count || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-600">
                    <TrendingUp className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    إجمالي الإيجارات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(revenueReport.total_rentals || 0)}
                  </div>
                  <p className="text-sm text-gray-600">
                    عدد المدفوعات: {revenueReport.rental_payments_count || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-600">
                    <DollarSign className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    إجمالي الإيرادات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency((revenueReport.total_sales || 0) + (revenueReport.total_rentals || 0))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد بيانات</h3>
              <p className="mt-1 text-sm text-gray-500">اختر فترة زمنية وانقر على تحديث التقارير.</p>
            </div>
          )}
        </TabsContent>

        {/* Expenses Report Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">تقرير المصروفات</h3>
            <Button 
              onClick={() => exportToExcel('expenses')}
              disabled={loading || !expensesReport}
            >
              <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              تصدير Excel
            </Button>
          </div>

          {expensesReport ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-600">
                      <TrendingDown className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      إجمالي المصروفات العامة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(expensesReport.total_general_expenses || 0)}
                    </div>
                    <p className="text-sm text-gray-600">
                      عدد المصروفات: {expensesReport.general_expenses_count || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-orange-600">
                      <TrendingDown className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      إجمالي مصروفات التشطيب
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(expensesReport.total_finishing_expenses || 0)}
                    </div>
                    <p className="text-sm text-gray-600">
                      عدد المصروفات: {expensesReport.finishing_expenses_count || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {expensesReport.expenses_by_category && expensesReport.expenses_by_category.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      المصروفات حسب الفئة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>الفئة</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead>عدد المصروفات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expensesReport.expenses_by_category.map((category, index) => (
                            <TableRow key={index}>
                              <TableCell>{category.category_name}</TableCell>
                              <TableCell className="font-semibold text-red-600">
                                {formatCurrency(category.total_amount)}
                              </TableCell>
                              <TableCell>{category.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد بيانات</h3>
              <p className="mt-1 text-sm text-gray-500">اختر فترة زمنية وانقر على تحديث التقارير.</p>
            </div>
          )}
        </TabsContent>

        {/* Profit Loss Report Tab */}
        <TabsContent value="profit_loss" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">تقرير الأرباح والخسائر</h3>
            <Button 
              onClick={() => exportToExcel('profit_loss')}
              disabled={loading || !profitLossReport}
            >
              <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              تصدير Excel
            </Button>
          </div>

          {profitLossReport ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <TrendingUp className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    إجمالي الإيرادات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(profitLossReport.total_revenue || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <TrendingDown className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    إجمالي المصروفات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(profitLossReport.total_expenses || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className={`flex items-center ${
                    (profitLossReport.net_profit_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <DollarSign className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    صافي الربح/الخسارة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    (profitLossReport.net_profit_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(profitLossReport.net_profit_loss || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد بيانات</h3>
              <p className="mt-1 text-sm text-gray-500">اختر فترة زمنية وانقر على تحديث التقارير.</p>
            </div>
          )}
        </TabsContent>

        {/* Cashier Transactions Tab */}
        <TabsContent value="cashier" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">معاملات الخزنة</h3>
            <Button 
              onClick={() => exportToExcel('cashier')}
              disabled={loading || cashierTransactions.length === 0}
            >
              <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              تصدير Excel
            </Button>
          </div>

          {cashierTransactions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  سجل معاملات الخزنة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>نوع المعاملة</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>الرصيد بعد المعاملة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cashierTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                              {formatDate(transaction.transaction_date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.transaction_type === 'إيداع' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.transaction_type}
                            </span>
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <div className={`flex items-center font-semibold ${
                              transaction.transaction_type === 'إيداع' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              <DollarSign className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {formatCurrency(transaction.amount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center font-semibold text-blue-600">
                              <DollarSign className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {formatCurrency(transaction.balance_after)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد معاملات</h3>
              <p className="mt-1 text-sm text-gray-500">اختر فترة زمنية وانقر على تحديث التقارير.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;

