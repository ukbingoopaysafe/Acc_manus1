import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  ShoppingCart,
  DollarSign,
  Calendar,
  User,
  Building
} from 'lucide-react';

const Sales = () => {
  const { t, isRTL } = useLanguage();
  const [sales, setSales] = useState([]);
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [formData, setFormData] = useState({
    unit_id: '',
    client_name: '',
    sale_date: '',
    sale_price: '',
    salesperson_id: '',
    sales_manager_id: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesData, unitsData, usersData] = await Promise.all([
        ApiService.getSales(),
        ApiService.getUnits(),
        ApiService.getUsers()
      ]);
      setSales(salesData);
      setUnits(unitsData.filter(unit => unit.status === 'متاحة' || unit.status === 'مباعة'));
      setUsers(usersData);
    } catch (error) {
      setError('فشل في تحميل البيانات');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const saleData = {
        ...formData,
        sale_price: parseFloat(formData.sale_price),
        unit_id: parseInt(formData.unit_id),
        salesperson_id: parseInt(formData.salesperson_id),
        sales_manager_id: formData.sales_manager_id ? parseInt(formData.sales_manager_id) : null
      };

      if (editingSale) {
        await ApiService.updateSale(editingSale.id, saleData);
        setSuccess('تم تحديث البيع بنجاح');
      } else {
        await ApiService.createSale(saleData);
        setSuccess('تم إضافة البيع بنجاح');
      }

      setIsDialogOpen(false);
      setEditingSale(null);
      resetForm();
      fetchData();
    } catch (error) {
      setError(error.message || 'حدث خطأ أثناء حفظ البيع');
    }
  };

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setFormData({
      unit_id: sale.unit_id.toString(),
      client_name: sale.client_name,
      sale_date: sale.sale_date,
      sale_price: sale.sale_price.toString(),
      salesperson_id: sale.salesperson_id.toString(),
      sales_manager_id: sale.sales_manager_id ? sale.sales_manager_id.toString() : '',
      notes: sale.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (saleId) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        await ApiService.deleteSale(saleId);
        setSuccess('تم حذف البيع بنجاح');
        fetchData();
      } catch (error) {
        setError(error.message || 'فشل في حذف البيع');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      unit_id: '',
      client_name: '',
      sale_date: '',
      sale_price: '',
      salesperson_id: '',
      sales_manager_id: '',
      notes: ''
    });
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingSale(null);
    resetForm();
    setError('');
  };

  const filteredSales = sales.filter(sale =>
    sale.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.unit_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.salesperson_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('sales')}</h1>
          <p className="text-gray-600 mt-2">إدارة عمليات البيع والمبيعات</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('add')} بيع جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSale ? 'تعديل البيع' : 'إضافة بيع جديد'}
              </DialogTitle>
              <DialogDescription>
                {editingSale ? 'تعديل بيانات عملية البيع' : 'إضافة عملية بيع جديدة إلى النظام'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_id">الوحدة *</Label>
                  <Select value={formData.unit_id} onValueChange={(value) => setFormData({...formData, unit_id: value})}>
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
                  <Label htmlFor="client_name">{t('client_name')} *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sale_date">{t('sale_date')} *</Label>
                  <Input
                    id="sale_date"
                    type="date"
                    value={formData.sale_date}
                    onChange={(e) => setFormData({...formData, sale_date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sale_price">{t('sale_price')} (جنيه) *</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salesperson_id">{t('salesperson')} *</Label>
                  <Select value={formData.salesperson_id} onValueChange={(value) => setFormData({...formData, salesperson_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر موظف المبيعات" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sales_manager_id">{t('sales_manager')}</Label>
                  <Select value={formData.sales_manager_id} onValueChange={(value) => setFormData({...formData, sales_manager_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مدير المبيعات (اختياري)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">بدون مدير مبيعات</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  {t('cancel')}
                </Button>
                <Button type="submit">
                  {editingSale ? t('save') : t('add')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && !isDialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="البحث في المبيعات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            قائمة المبيعات
          </CardTitle>
          <CardDescription>
            جميع عمليات البيع المسجلة في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSales.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>كود الوحدة</TableHead>
                    <TableHead>{t('client_name')}</TableHead>
                    <TableHead>{t('sale_date')}</TableHead>
                    <TableHead>{t('sale_price')}</TableHead>
                    <TableHead>{t('salesperson')}</TableHead>
                    <TableHead>عمولة الشركة</TableHead>
                    <TableHead>صافي الإيراد</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Building className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                          {sale.unit_code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                          {sale.client_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                          {formatDate(sale.sale_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center font-semibold text-green-600">
                          <DollarSign className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                          {formatCurrency(sale.sale_price)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {sale.salesperson_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(sale.company_commission)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          {formatCurrency(sale.net_company_revenue)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(sale)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(sale.id)}
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
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مبيعات</h3>
              <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة عملية بيع جديدة.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;

