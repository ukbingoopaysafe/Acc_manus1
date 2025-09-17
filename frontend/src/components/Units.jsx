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
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Home,
  MapPin,
  DollarSign,
  Square
} from 'lucide-react';

const Units = () => {
  const { t, isRTL } = useLanguage();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: '',
    price: '',
    address: '',
    area_sqm: '',
    description_ar: '',
    description_en: '',
    status: 'متاحة'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const unitTypes = [
    { value: 'شقة', label: t('apartment') },
    { value: 'تجاري', label: t('commercial') },
    { value: 'إداري', label: t('administrative') },
    { value: 'طبي', label: t('medical') }
  ];

  const unitStatuses = [
    { value: 'متاحة', label: t('available'), color: 'bg-green-100 text-green-800' },
    { value: 'مباعة', label: t('sold'), color: 'bg-blue-100 text-blue-800' },
    { value: 'مؤجرة', label: t('rented'), color: 'bg-purple-100 text-purple-800' },
    { value: 'تحت التشطيب', label: t('under_finishing'), color: 'bg-yellow-100 text-yellow-800' }
  ];

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getUnits();
      setUnits(data);
    } catch (error) {
      setError('فشل في تحميل الوحدات');
      console.error('Error fetching units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const unitData = {
        ...formData,
        price: parseFloat(formData.price),
        area_sqm: formData.area_sqm ? parseFloat(formData.area_sqm) : null
      };

      if (editingUnit) {
        await ApiService.updateUnit(editingUnit.id, unitData);
        setSuccess('تم تحديث الوحدة بنجاح');
      } else {
        await ApiService.createUnit(unitData);
        setSuccess('تم إضافة الوحدة بنجاح');
      }

      setIsDialogOpen(false);
      setEditingUnit(null);
      resetForm();
      fetchUnits();
    } catch (error) {
      setError(error.message || 'حدث خطأ أثناء حفظ الوحدة');
    }
  };

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({
      code: unit.code,
      type: unit.type,
      price: unit.price.toString(),
      address: unit.address || '',
      area_sqm: unit.area_sqm ? unit.area_sqm.toString() : '',
      description_ar: unit.description_ar || '',
      description_en: unit.description_en || '',
      status: unit.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (unitId) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        await ApiService.deleteUnit(unitId);
        setSuccess('تم حذف الوحدة بنجاح');
        fetchUnits();
      } catch (error) {
        setError(error.message || 'فشل في حذف الوحدة');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: '',
      price: '',
      address: '',
      area_sqm: '',
      description_ar: '',
      description_en: '',
      status: 'متاحة'
    });
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingUnit(null);
    resetForm();
    setError('');
  };

  const filteredUnits = units.filter(unit =>
    unit.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = unitStatuses.find(s => s.value === status);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('units')}</h1>
          <p className="text-gray-600 mt-2">إدارة الوحدات العقارية</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('add')} وحدة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingUnit ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}
              </DialogTitle>
              <DialogDescription>
                {editingUnit ? 'تعديل بيانات الوحدة العقارية' : 'إضافة وحدة عقارية جديدة إلى النظام'}
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
                  <Label htmlFor="code">{t('unit_code')} *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">{t('unit_type')} *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الوحدة" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">{t('unit_price')} (جنيه) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="area_sqm">{t('unit_area')} (متر مربع)</Label>
                  <Input
                    id="area_sqm"
                    type="number"
                    value={formData.area_sqm}
                    onChange={(e) => setFormData({...formData, area_sqm: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">{t('unit_address')}</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">{t('unit_status')}</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unitStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description_ar">الوصف (عربي)</Label>
                  <Textarea
                    id="description_ar"
                    value={formData.description_ar}
                    onChange={(e) => setFormData({...formData, description_ar: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description_en">الوصف (إنجليزي)</Label>
                  <Textarea
                    id="description_en"
                    value={formData.description_en}
                    onChange={(e) => setFormData({...formData, description_en: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  {t('cancel')}
                </Button>
                <Button type="submit">
                  {editingUnit ? t('save') : t('add')}
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
            placeholder="البحث في الوحدات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUnits.map((unit) => (
          <Card key={unit.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Home className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {unit.code}
                </CardTitle>
                {getStatusBadge(unit.status)}
              </div>
              <CardDescription>
                {unitTypes.find(type => type.value === unit.type)?.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  <span className="font-semibold text-green-600">
                    {formatCurrency(unit.price)}
                  </span>
                </div>
                
                {unit.area_sqm && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Square className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {unit.area_sqm} متر مربع
                  </div>
                )}
                
                {unit.address && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {unit.address}
                  </div>
                )}
                
                {unit.description_ar && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {unit.description_ar}
                  </p>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(unit)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(unit.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUnits.length === 0 && (
        <div className="text-center py-12">
          <Home className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد وحدات</h3>
          <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة وحدة عقارية جديدة.</p>
        </div>
      )}
    </div>
  );
};

export default Units;

