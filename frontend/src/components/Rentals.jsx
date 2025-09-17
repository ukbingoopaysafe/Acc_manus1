import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Building,
  DollarSign,
  Calendar,
  User,
  CreditCard
} from 'lucide-react';

const Rentals = () => {
  const { t, isRTL } = useLanguage();
  const [rentals, setRentals] = useState([]);
  const [rentalPayments, setRentalPayments] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRentalDialogOpen, setIsRentalDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingRental, setEditingRental] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedRental, setSelectedRental] = useState(null);
  const [rentalFormData, setRentalFormData] = useState({
    unit_id: '',
    tenant_name: '',
    start_date: '',
    end_date: '',
    rent_amount: '',
    payment_frequency: 'شهري',
    notes: ''
  });
  const [paymentFormData, setPaymentFormData] = useState({
    payment_date: '',
    amount: '',
    status: 'مدفوعة',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const paymentFrequencies = [
    { value: 'شهري', label: t('monthly') },
    { value: 'ربع سنوي', label: t('quarterly') },
    { value: 'نصف سنوي', label: t('semi_annual') },
    { value: 'سنوي', label: t('annual') }
  ];

  const paymentStatuses = [
    { value: 'مدفوعة', label: t('paid'), color: 'bg-green-100 text-green-800' },
    { value: 'مستحقة', label: t('due'), color: 'bg-yellow-100 text-yellow-800' },
    { value: 'متأخرة', label: t('overdue'), color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rentalsData, unitsData] = await Promise.all([
        ApiService.getRentals(),
        ApiService.getUnits()
      ]);
      setRentals(rentalsData);
      setUnits(unitsData.filter(unit => unit.status === 'متاحة' || unit.status === 'مؤجرة'));
    } catch (error) {
      setError('فشل في تحميل البيانات');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRentalPayments = async (rentalId) => {
    try {
      const payments = await ApiService.getRentalPayments(rentalId);
      setRentalPayments(payments);
    } catch (error) {
      console.error('Error fetching rental payments:', error);
    }
  };

  const handleRentalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const rentalData = {
        ...rentalFormData,
        rent_amount: parseFloat(rentalFormData.rent_amount),
        unit_id: parseInt(rentalFormData.unit_id)
      };

      if (editingRental) {
        await ApiService.updateRental(editingRental.id, rentalData);
        setSuccess('تم تحديث الإيجار بنجاح');
      } else {
        await ApiService.createRental(rentalData);
        setSuccess('تم إضافة الإيجار بنجاح');
      }

      setIsRentalDialogOpen(false);
      setEditingRental(null);
      resetRentalForm();
      fetchData();
    } catch (error) {
      setError(error.message || 'حدث خطأ أثناء حفظ الإيجار');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const paymentData = {
        ...paymentFormData,
        amount: parseFloat(paymentFormData.amount)
      };

      if (editingPayment) {
        await ApiService.updateRentalPayment(editingPayment.id, paymentData);
        setSuccess('تم تحديث الدفعة بنجاح');
      } else {
        await ApiService.createRentalPayment(selectedRental.id, paymentData);
        setSuccess('تم إضافة الدفعة بنجاح');
      }

      setIsPaymentDialogOpen(false);
      setEditingPayment(null);
      resetPaymentForm();
      if (selectedRental) {
        fetchRentalPayments(selectedRental.id);
      }
    } catch (error) {
      setError(error.message || 'حدث خطأ أثناء حفظ الدفعة');
    }
  };

  const handleEditRental = (rental) => {
    setEditingRental(rental);
    setRentalFormData({
      unit_id: rental.unit_id.toString(),
      tenant_name: rental.tenant_name,
      start_date: rental.start_date,
      end_date: rental.end_date,
      rent_amount: rental.rent_amount.toString(),
      payment_frequency: rental.payment_frequency,
      notes: rental.notes || ''
    });
    setIsRentalDialogOpen(true);
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setPaymentFormData({
      payment_date: payment.payment_date,
      amount: payment.amount.toString(),
      status: payment.status,
      notes: payment.notes || ''
    });
    setIsPaymentDialogOpen(true);
  };

  const handleDeleteRental = async (rentalId) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        await ApiService.deleteRental(rentalId);
        setSuccess('تم حذف الإيجار بنجاح');
        fetchData();
      } catch (error) {
        setError(error.message || 'فشل في حذف الإيجار');
      }
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        await ApiService.deleteRentalPayment(paymentId);
        setSuccess('تم حذف الدفعة بنجاح');
        if (selectedRental) {
          fetchRentalPayments(selectedRental.id);
        }
      } catch (error) {
        setError(error.message || 'فشل في حذف الدفعة');
      }
    }
  };

  const handleViewPayments = (rental) => {
    setSelectedRental(rental);
    fetchRentalPayments(rental.id);
  };

  const resetRentalForm = () => {
    setRentalFormData({
      unit_id: '',
      tenant_name: '',
      start_date: '',
      end_date: '',
      rent_amount: '',
      payment_frequency: 'شهري',
      notes: ''
    });
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      payment_date: '',
      amount: '',
      status: 'مدفوعة',
      notes: ''
    });
  };

  const filteredRentals = rentals.filter(rental =>
    rental.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rental.unit_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getStatusBadge = (status) => {
    const statusConfig = paymentStatuses.find(s => s.value === status);
    return (
      <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
        {statusConfig?.label || status}
      </Badge>
    );
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
        <h1 className="text-3xl font-bold text-gray-900">{t('rentals')}</h1>
        <p className="text-gray-600 mt-2">إدارة عقود الإيجار والمدفوعات</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && !isRentalDialogOpen && !isPaymentDialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="rentals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rentals">عقود الإيجار</TabsTrigger>
          <TabsTrigger value="payments">المدفوعات</TabsTrigger>
        </TabsList>

        {/* Rentals Tab */}
        <TabsContent value="rentals" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في الإيجارات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isRentalDialogOpen} onOpenChange={setIsRentalDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsRentalDialogOpen(true)}>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('add')} إيجار جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRental ? 'تعديل الإيجار' : 'إضافة إيجار جديد'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRental ? 'تعديل بيانات عقد الإيجار' : 'إضافة عقد إيجار جديد إلى النظام'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleRentalSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit_id">الوحدة *</Label>
                      <Select value={rentalFormData.unit_id} onValueChange={(value) => setRentalFormData({...rentalFormData, unit_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الوحدة" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id.toString()}>
                              {unit.code} - {formatCurrency(unit.price)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tenant_name">{t('tenant_name')} *</Label>
                      <Input
                        id="tenant_name"
                        value={rentalFormData.tenant_name}
                        onChange={(e) => setRentalFormData({...rentalFormData, tenant_name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="start_date">{t('start_date')} *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={rentalFormData.start_date}
                        onChange={(e) => setRentalFormData({...rentalFormData, start_date: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end_date">{t('end_date')} *</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={rentalFormData.end_date}
                        onChange={(e) => setRentalFormData({...rentalFormData, end_date: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rent_amount">{t('rent_amount')} (جنيه) *</Label>
                      <Input
                        id="rent_amount"
                        type="number"
                        step="0.01"
                        value={rentalFormData.rent_amount}
                        onChange={(e) => setRentalFormData({...rentalFormData, rent_amount: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="payment_frequency">{t('payment_frequency')} *</Label>
                      <Select value={rentalFormData.payment_frequency} onValueChange={(value) => setRentalFormData({...rentalFormData, payment_frequency: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentFrequencies.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="notes">ملاحظات</Label>
                      <Textarea
                        id="notes"
                        value={rentalFormData.notes}
                        onChange={(e) => setRentalFormData({...rentalFormData, notes: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsRentalDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit">
                      {editingRental ? t('save') : t('add')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Rentals Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                قائمة عقود الإيجار
              </CardTitle>
              <CardDescription>
                جميع عقود الإيجار المسجلة في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRentals.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>كود الوحدة</TableHead>
                        <TableHead>{t('tenant_name')}</TableHead>
                        <TableHead>فترة الإيجار</TableHead>
                        <TableHead>{t('rent_amount')}</TableHead>
                        <TableHead>تكرار الدفع</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRentals.map((rental) => (
                        <TableRow key={rental.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Building className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                              {rental.unit_code}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                              {rental.tenant_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                              <div>
                                <div>{formatDate(rental.start_date)}</div>
                                <div className="text-sm text-gray-500">إلى {formatDate(rental.end_date)}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center font-semibold text-green-600">
                              <DollarSign className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {formatCurrency(rental.rent_amount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {paymentFrequencies.find(f => f.value === rental.payment_frequency)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPayments(rental)}
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRental(rental)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRental(rental.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد إيجارات</h3>
                  <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة عقد إيجار جديد.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          {selectedRental ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">مدفوعات إيجار {selectedRental.unit_code}</h3>
                  <p className="text-gray-600">المستأجر: {selectedRental.tenant_name}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setSelectedRental(null)}>
                    العودة للقائمة
                  </Button>
                  <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setIsPaymentDialogOpen(true)}>
                        <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        إضافة دفعة
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingPayment ? 'تعديل الدفعة' : 'إضافة دفعة جديدة'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingPayment ? 'تعديل بيانات الدفعة' : 'إضافة دفعة إيجار جديدة'}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={handlePaymentSubmit} className="space-y-4">
                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="payment_date">{t('payment_date')} *</Label>
                            <Input
                              id="payment_date"
                              type="date"
                              value={paymentFormData.payment_date}
                              onChange={(e) => setPaymentFormData({...paymentFormData, payment_date: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="amount">المبلغ (جنيه) *</Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              value={paymentFormData.amount}
                              onChange={(e) => setPaymentFormData({...paymentFormData, amount: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="status">{t('payment_status')} *</Label>
                            <Select value={paymentFormData.status} onValueChange={(value) => setPaymentFormData({...paymentFormData, status: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {paymentStatuses.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="payment_notes">ملاحظات</Label>
                            <Textarea
                              id="payment_notes"
                              value={paymentFormData.notes}
                              onChange={(e) => setPaymentFormData({...paymentFormData, notes: e.target.value})}
                              rows={3}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                            {t('cancel')}
                          </Button>
                          <Button type="submit">
                            {editingPayment ? t('save') : t('add')}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Payments Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    مدفوعات الإيجار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rentalPayments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('payment_date')}</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>ملاحظات</TableHead>
                            <TableHead>الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rentalPayments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  <Calendar className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                                  {formatDate(payment.payment_date)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center font-semibold text-green-600">
                                  <DollarSign className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  {formatCurrency(payment.amount)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(payment.status)}
                              </TableCell>
                              <TableCell>
                                {payment.notes || '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditPayment(payment)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeletePayment(payment.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مدفوعات</h3>
                      <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة دفعة إيجار.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">اختر عقد إيجار</h3>
              <p className="mt-1 text-sm text-gray-500">اختر عقد إيجار من القائمة لعرض المدفوعات.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Rentals;

