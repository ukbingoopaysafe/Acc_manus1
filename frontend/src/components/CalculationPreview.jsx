import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator,
  Eye,
  DollarSign,
  Percent,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const CalculationPreview = ({ 
  isOpen, 
  onClose, 
  initialData = {}, 
  onConfirm = null 
}) => {
  const { t, isRTL } = useLanguage();
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    sale_price: initialData.sale_price || '',
    unit_id: initialData.unit_id || '',
    salesperson_id: initialData.salesperson_id || '',
    sales_manager_id: initialData.sales_manager_id || ''
  });

  useEffect(() => {
    if (isOpen) {
      loadSelectData();
      if (initialData.sale_price && initialData.unit_id) {
        handlePreview();
      }
    }
  }, [isOpen, initialData]);

  const loadSelectData = async () => {
    try {
      const [unitsResponse, usersResponse] = await Promise.all([
        ApiService.get('/units'),
        ApiService.get('/users')
      ]);
      setUnits(unitsResponse.data || []);
      setUsers(usersResponse.data || []);
    } catch (error) {
      console.error('Error loading select data:', error);
    }
  };

  const handlePreview = async () => {
    if (!formData.sale_price || !formData.unit_id) {
      setError('يرجى إدخال سعر البيع ومعرف الوحدة');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await ApiService.post('/dynamic/calculate-preview', {
        sale_price: parseFloat(formData.sale_price),
        unit_id: parseInt(formData.unit_id),
        salesperson_id: formData.salesperson_id ? parseInt(formData.salesperson_id) : null,
        sales_manager_id: formData.sales_manager_id ? parseInt(formData.sales_manager_id) : null
      });

      if (response.data.success) {
        setPreviewData(response.data.data);
      } else {
        setError('فشل في حساب المعاينة');
      }
    } catch (error) {
      setError('حدث خطأ أثناء حساب المعاينة');
      console.error('Preview calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (onConfirm && previewData) {
      onConfirm(formData, previewData);
    }
    onClose();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getRuleTypeIcon = (ruleType) => {
    switch (ruleType) {
      case 'commission':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'tax':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'discount':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'fee':
        return <TrendingDown className="w-4 h-4 text-orange-500" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getRuleTypeLabel = (ruleType) => {
    const types = {
      commission: 'عمولة',
      tax: 'ضريبة',
      discount: 'خصم',
      fee: 'رسوم'
    };
    return types[ruleType] || ruleType;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            معاينة حسابات المبيعة
          </DialogTitle>
          <DialogDescription>
            اختبر قواعد الحساب الحالية وتأكد من صحة النتائج قبل حفظ المبيعة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">بيانات المبيعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sale_price">سعر البيع</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                    placeholder="أدخل سعر البيع"
                  />
                </div>
                <div>
                  <Label htmlFor="unit_id">الوحدة</Label>
                  <Select
                    value={formData.unit_id}
                    onValueChange={(value) => setFormData({...formData, unit_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الوحدة" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.code} - {unit.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salesperson_id">البائع</Label>
                  <Select
                    value={formData.salesperson_id}
                    onValueChange={(value) => setFormData({...formData, salesperson_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر البائع" />
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
                <div>
                  <Label htmlFor="sales_manager_id">مدير المبيعات</Label>
                  <Select
                    value={formData.sales_manager_id}
                    onValueChange={(value) => setFormData({...formData, sales_manager_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مدير المبيعات" />
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
              </div>

              <Button onClick={handlePreview} disabled={loading} className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                {loading ? 'جاري الحساب...' : 'معاينة الحسابات'}
              </Button>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview Results */}
          {previewData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    ملخص الحسابات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">المبلغ الأساسي:</span>
                    <span className="font-medium">{formatCurrency(previewData.base_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">نوع الوحدة:</span>
                    <Badge variant="outline">{previewData.unit_type}</Badge>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">عمولة الشركة:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(previewData.totals.company_commission)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">عمولة البائع:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(previewData.totals.salesperson_commission)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">عمولة مدير المبيعات:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(previewData.totals.sales_manager_commission)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">إجمالي الضرائب:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(previewData.totals.total_taxes)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">إجمالي الرسوم:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(previewData.totals.total_fees)}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>صافي إيرادات الشركة:</span>
                    <span className="text-blue-600">
                      {formatCurrency(previewData.totals.net_company_revenue)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Applied Rules Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">القواعد المطبقة</CardTitle>
                  <CardDescription>
                    تفاصيل كل قاعدة حساب تم تطبيقها
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {previewData.applied_rules.map((rule, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getRuleTypeIcon(rule.rule_type)}
                          <div>
                            <div className="font-medium text-sm">{rule.rule_name_ar}</div>
                            <div className="text-xs text-muted-foreground">
                              {getRuleTypeLabel(rule.rule_type)} - 
                              {rule.calculation_type === 'percentage' ? (
                                <span className="flex items-center">
                                  <Percent className="w-3 h-3 mr-1" />
                                  {rule.value}%
                                </span>
                              ) : (
                                <span>مبلغ ثابت</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(rule.calculated_amount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            من {formatCurrency(rule.base_amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          {onConfirm && previewData && (
            <Button onClick={handleConfirm}>
              تأكيد وحفظ المبيعة
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalculationPreview;
