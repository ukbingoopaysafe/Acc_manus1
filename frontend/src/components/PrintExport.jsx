import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  Printer, 
  Download, 
  FileText, 
  Receipt,
  CreditCard,
  Calendar,
  DollarSign,
  Plus,
  Trash2
} from 'lucide-react';

const PrintExport = () => {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [sales, setSales] = useState([]);
  const [rentalPayments, setRentalPayments] = useState([]);
  const [isCheckDialogOpen, setIsCheckDialogOpen] = useState(false);
  const [isCustomInvoiceDialogOpen, setIsCustomInvoiceDialogOpen] = useState(false);
  const [checkFormData, setCheckFormData] = useState({
    check_number: '',
    date: new Date().toISOString().split('T')[0],
    pay_to: '',
    amount: '',
    bank_name: '',
    account_number: '',
    memo: '',
    template_id: ''
  });
  const [customInvoiceData, setCustomInvoiceData] = useState({
    invoice_number: '',
    date: new Date().toISOString().split('T')[0],
    client_name: '',
    client_phone: '',
    client_address: '',
    unit_code: '',
    items: [{ description: '', quantity: 1, price: 0, total: 0 }],
    subtotal: 0,
    tax_amount: 0,
    total: 0,
    notes: '',
    template_id: ''
  });
  const [exportDateRange, setExportDateRange] = useState({
    start_date: '',
    end_date: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setExportDateRange({
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0]
    });
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesData, salesData, paymentsData] = await Promise.all([
        ApiService.getInvoiceTemplates(),
        ApiService.getSales(),
        ApiService.getRentalPayments()
      ]);
      setTemplates(templatesData);
      setSales(salesData.slice(0, 20)); // Show recent 20 sales
      setRentalPayments(paymentsData.slice(0, 20)); // Show recent 20 payments
    } catch (error) {
      setError('فشل في تحميل البيانات');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Print Functions
  const printSaleInvoice = async (saleId, templateId = null) => {
    try {
      setLoading(true);
      const url = `/api/print_export/print/invoice/sale/${saleId}${templateId ? `?template_id=${templateId}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice_sale_${saleId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setSuccess('تم تحميل الفاتورة بنجاح');
      } else {
        throw new Error('فشل في إنشاء الفاتورة');
      }
    } catch (error) {
      setError(error.message || 'فشل في طباعة الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  const printRentalReceipt = async (paymentId, templateId = null) => {
    try {
      setLoading(true);
      const url = `/api/print_export/print/receipt/rental/${paymentId}${templateId ? `?template_id=${templateId}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt_rental_${paymentId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setSuccess('تم تحميل الإيصال بنجاح');
      } else {
        throw new Error('فشل في إنشاء الإيصال');
      }
    } catch (error) {
      setError(error.message || 'فشل في طباعة الإيصال');
    } finally {
      setLoading(false);
    }
  };

  const printCheck = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/print_export/print/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(checkFormData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `check_${checkFormData.check_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setSuccess('تم تحميل الشيك بنجاح');
        setIsCheckDialogOpen(false);
        resetCheckForm();
      } else {
        throw new Error('فشل في إنشاء الشيك');
      }
    } catch (error) {
      setError(error.message || 'فشل في طباعة الشيك');
    } finally {
      setLoading(false);
    }
  };

  const printCustomInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/print_export/print/custom-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(customInvoiceData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice_${customInvoiceData.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setSuccess('تم تحميل الفاتورة بنجاح');
        setIsCustomInvoiceDialogOpen(false);
        resetCustomInvoiceForm();
      } else {
        throw new Error('فشل في إنشاء الفاتورة');
      }
    } catch (error) {
      setError(error.message || 'فشل في طباعة الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  // Export Functions
  const exportData = async (type) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (exportDateRange.start_date) params.append('start_date', exportDateRange.start_date);
      if (exportDateRange.end_date) params.append('end_date', exportDateRange.end_date);

      const response = await fetch(`/api/print_export/export/${type}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setSuccess('تم تصدير البيانات بنجاح');
      } else {
        throw new Error('فشل في تصدير البيانات');
      }
    } catch (error) {
      setError(error.message || 'فشل في تصدير البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const handleCheckSubmit = (e) => {
    e.preventDefault();
    printCheck();
  };

  const handleCustomInvoiceSubmit = (e) => {
    e.preventDefault();
    printCustomInvoice();
  };

  const addInvoiceItem = () => {
    setCustomInvoiceData({
      ...customInvoiceData,
      items: [...customInvoiceData.items, { description: '', quantity: 1, price: 0, total: 0 }]
    });
  };

  const removeInvoiceItem = (index) => {
    const newItems = customInvoiceData.items.filter((_, i) => i !== index);
    setCustomInvoiceData({
      ...customInvoiceData,
      items: newItems
    });
    calculateInvoiceTotal(newItems);
  };

  const updateInvoiceItem = (index, field, value) => {
    const newItems = [...customInvoiceData.items];
    newItems[index][field] = value;
    
    if (field === 'quantity' || field === 'price') {
      newItems[index].total = newItems[index].quantity * newItems[index].price;
    }
    
    setCustomInvoiceData({
      ...customInvoiceData,
      items: newItems
    });
    calculateInvoiceTotal(newItems);
  };

  const calculateInvoiceTotal = (items) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * 0.14; // 14% tax
    const total = subtotal + taxAmount;
    
    setCustomInvoiceData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total
    }));
  };

  const resetCheckForm = () => {
    setCheckFormData({
      check_number: '',
      date: new Date().toISOString().split('T')[0],
      pay_to: '',
      amount: '',
      bank_name: '',
      account_number: '',
      memo: '',
      template_id: ''
    });
  };

  const resetCustomInvoiceForm = () => {
    setCustomInvoiceData({
      invoice_number: '',
      date: new Date().toISOString().split('T')[0],
      client_name: '',
      client_phone: '',
      client_address: '',
      unit_code: '',
      items: [{ description: '', quantity: 1, price: 0, total: 0 }],
      subtotal: 0,
      tax_amount: 0,
      total: 0,
      notes: '',
      template_id: ''
    });
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
        <h1 className="text-3xl font-bold text-gray-900">الطباعة والتصدير</h1>
        <p className="text-gray-600 mt-2">طباعة الفواتير والشيكات وتصدير البيانات</p>
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

      <Tabs defaultValue="print" className="space-y-6">
        <TabsList>
          <TabsTrigger value="print">الطباعة</TabsTrigger>
          <TabsTrigger value="export">التصدير</TabsTrigger>
        </TabsList>

        {/* Print Tab */}
        <TabsContent value="print" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custom Print Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Printer className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  طباعة مخصصة
                </CardTitle>
                <CardDescription>
                  إنشاء وطباعة فواتير وشيكات مخصصة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={isCustomInvoiceDialogOpen} onOpenChange={setIsCustomInvoiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      إنشاء فاتورة مخصصة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>إنشاء فاتورة مخصصة</DialogTitle>
                      <DialogDescription>
                        إنشاء فاتورة مخصصة للطباعة
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleCustomInvoiceSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="invoice_number">رقم الفاتورة</Label>
                          <Input
                            id="invoice_number"
                            value={customInvoiceData.invoice_number}
                            onChange={(e) => setCustomInvoiceData({...customInvoiceData, invoice_number: e.target.value})}
                            placeholder="سيتم إنشاؤه تلقائياً إذا ترك فارغاً"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="invoice_date">التاريخ</Label>
                          <Input
                            id="invoice_date"
                            type="date"
                            value={customInvoiceData.date}
                            onChange={(e) => setCustomInvoiceData({...customInvoiceData, date: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="client_name">اسم العميل *</Label>
                          <Input
                            id="client_name"
                            value={customInvoiceData.client_name}
                            onChange={(e) => setCustomInvoiceData({...customInvoiceData, client_name: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="client_phone">هاتف العميل</Label>
                          <Input
                            id="client_phone"
                            value={customInvoiceData.client_phone}
                            onChange={(e) => setCustomInvoiceData({...customInvoiceData, client_phone: e.target.value})}
                          />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="client_address">عنوان العميل</Label>
                          <Input
                            id="client_address"
                            value={customInvoiceData.client_address}
                            onChange={(e) => setCustomInvoiceData({...customInvoiceData, client_address: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      {/* Items */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>بنود الفاتورة</Label>
                          <Button type="button" onClick={addInvoiceItem} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {customInvoiceData.items.map((item, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                            <div className="space-y-2">
                              <Label>البيان</Label>
                              <Input
                                value={item.description}
                                onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                                placeholder="وصف البند"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>الكمية</Label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                min="1"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>السعر</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => updateInvoiceItem(index, 'price', parseFloat(e.target.value) || 0)}
                                min="0"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>المجموع</Label>
                              <Input
                                value={item.total.toFixed(2)}
                                readOnly
                                className="bg-gray-100"
                              />
                            </div>
                            <div>
                              {customInvoiceData.items.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeInvoiceItem(index)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Totals */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded">
                        <div className="space-y-2">
                          <Label>المجموع الفرعي</Label>
                          <Input
                            value={customInvoiceData.subtotal.toFixed(2)}
                            readOnly
                            className="bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الضرائب (14%)</Label>
                          <Input
                            value={customInvoiceData.tax_amount.toFixed(2)}
                            readOnly
                            className="bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الإجمالي</Label>
                          <Input
                            value={customInvoiceData.total.toFixed(2)}
                            readOnly
                            className="bg-white font-bold"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="invoice_notes">ملاحظات</Label>
                        <Textarea
                          id="invoice_notes"
                          value={customInvoiceData.notes}
                          onChange={(e) => setCustomInvoiceData({...customInvoiceData, notes: e.target.value})}
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCustomInvoiceDialogOpen(false)}>
                          إلغاء
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? 'جاري الإنشاء...' : 'طباعة الفاتورة'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isCheckDialogOpen} onOpenChange={setIsCheckDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <CreditCard className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      إنشاء شيك
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إنشاء شيك</DialogTitle>
                      <DialogDescription>
                        إنشاء شيك للطباعة
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleCheckSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="check_number">رقم الشيك *</Label>
                          <Input
                            id="check_number"
                            value={checkFormData.check_number}
                            onChange={(e) => setCheckFormData({...checkFormData, check_number: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="check_date">التاريخ *</Label>
                          <Input
                            id="check_date"
                            type="date"
                            value={checkFormData.date}
                            onChange={(e) => setCheckFormData({...checkFormData, date: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="pay_to">ادفعوا لأمر *</Label>
                          <Input
                            id="pay_to"
                            value={checkFormData.pay_to}
                            onChange={(e) => setCheckFormData({...checkFormData, pay_to: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="amount">المبلغ *</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={checkFormData.amount}
                            onChange={(e) => setCheckFormData({...checkFormData, amount: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bank_name">اسم البنك</Label>
                          <Input
                            id="bank_name"
                            value={checkFormData.bank_name}
                            onChange={(e) => setCheckFormData({...checkFormData, bank_name: e.target.value})}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="account_number">رقم الحساب</Label>
                          <Input
                            id="account_number"
                            value={checkFormData.account_number}
                            onChange={(e) => setCheckFormData({...checkFormData, account_number: e.target.value})}
                          />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="memo">ملاحظات</Label>
                          <Input
                            id="memo"
                            value={checkFormData.memo}
                            onChange={(e) => setCheckFormData({...checkFormData, memo: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCheckDialogOpen(false)}>
                          إلغاء
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? 'جاري الإنشاء...' : 'طباعة الشيك'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Recent Sales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  فواتير المبيعات الحديثة
                </CardTitle>
                <CardDescription>
                  طباعة فواتير المبيعات الحديثة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{sale.client_name}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(sale.sale_date)} - {formatCurrency(sale.net_amount)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => printSaleInvoice(sale.id)}
                        disabled={loading}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Rental Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  إيصالات الإيجار الحديثة
                </CardTitle>
                <CardDescription>
                  طباعة إيصالات مدفوعات الإيجار
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {rentalPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{payment.tenant_name}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(payment.payment_date)} - {formatCurrency(payment.amount)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => printRentalReceipt(payment.id)}
                        disabled={loading}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          {/* Date Range Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                فترة التصدير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="export_start_date">من تاريخ</Label>
                  <Input
                    id="export_start_date"
                    type="date"
                    value={exportDateRange.start_date}
                    onChange={(e) => setExportDateRange({...exportDateRange, start_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="export_end_date">إلى تاريخ</Label>
                  <Input
                    id="export_end_date"
                    type="date"
                    value={exportDateRange.end_date}
                    onChange={(e) => setExportDateRange({...exportDateRange, end_date: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>المبيعات</CardTitle>
                <CardDescription>تصدير بيانات المبيعات</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => exportData('sales')}
                  disabled={loading}
                  className="w-full"
                >
                  <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  تصدير المبيعات
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المصروفات</CardTitle>
                <CardDescription>تصدير بيانات المصروفات</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => exportData('expenses')}
                  disabled={loading}
                  className="w-full"
                >
                  <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  تصدير المصروفات
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الإيجارات</CardTitle>
                <CardDescription>تصدير بيانات الإيجارات</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => exportData('rentals')}
                  disabled={loading}
                  className="w-full"
                >
                  <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  تصدير الإيجارات
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>التشطيبات</CardTitle>
                <CardDescription>تصدير بيانات التشطيبات</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => exportData('finishing-works')}
                  disabled={loading}
                  className="w-full"
                >
                  <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  تصدير التشطيبات
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الوحدات</CardTitle>
                <CardDescription>تصدير بيانات الوحدات</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => exportData('units')}
                  disabled={loading}
                  className="w-full"
                >
                  <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  تصدير الوحدات
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معاملات الخزنة</CardTitle>
                <CardDescription>تصدير معاملات الخزنة</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => exportData('cashier-transactions')}
                  disabled={loading}
                  className="w-full"
                >
                  <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  تصدير المعاملات
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Comprehensive Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                التقرير الشامل
              </CardTitle>
              <CardDescription>
                تصدير جميع البيانات في ملف واحد
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => exportData('comprehensive-report')}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                تصدير التقرير الشامل
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrintExport;

