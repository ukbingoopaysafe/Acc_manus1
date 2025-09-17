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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calculator,
  Percent,
  DollarSign,
  Eye,
  Settings as SettingsIcon,
  FileText,
  BarChart3
} from 'lucide-react';

const DynamicCalculations = () => {
  const { t, isRTL } = useLanguage();
  const [calculationRules, setCalculationRules] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [printTemplates, setPrintTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  // Form states
  const [currentRule, setCurrentRule] = useState(null);
  const [currentField, setCurrentField] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // Form data
  const [ruleForm, setRuleForm] = useState({
    name_ar: '',
    name_en: '',
    rule_type: 'commission',
    calculation_type: 'percentage',
    value: '',
    applies_to: 'sales',
    unit_type_filter: [],
    order_index: 0,
    description_ar: '',
    description_en: '',
    is_active: true
  });

  const [fieldForm, setFieldForm] = useState({
    entity_type: 'sales',
    field_name: '',
    field_label_ar: '',
    field_label_en: '',
    field_type: 'text',
    field_options: [],
    is_required: false,
    order_index: 0
  });

  const [previewForm, setPreviewForm] = useState({
    sale_price: '',
    unit_id: '',
    salesperson_id: '',
    sales_manager_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesResponse, fieldsResponse, templatesResponse] = await Promise.all([
        ApiService.get('/dynamic/calculation-rules'),
        ApiService.get('/dynamic/custom-fields/sales'),
        ApiService.get('/dynamic/print-templates/invoice')
      ]);

      setCalculationRules(rulesResponse.data.data || []);
      setCustomFields(fieldsResponse.data.data || []);
      setPrintTemplates(templatesResponse.data.data || []);
    } catch (error) {
      setError('فشل في تحميل البيانات');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      const response = await ApiService.post('/dynamic/calculation-rules', ruleForm);
      if (response.data.success) {
        setSuccess('تم إنشاء القاعدة بنجاح');
        setIsRuleDialogOpen(false);
        resetRuleForm();
        loadData();
      }
    } catch (error) {
      setError('فشل في إنشاء القاعدة');
      console.error('Error creating rule:', error);
    }
  };

  const handleUpdateRule = async () => {
    try {
      const response = await ApiService.put(`/dynamic/calculation-rules/${currentRule.id}`, ruleForm);
      if (response.data.success) {
        setSuccess('تم تحديث القاعدة بنجاح');
        setIsRuleDialogOpen(false);
        resetRuleForm();
        loadData();
      }
    } catch (error) {
      setError('فشل في تحديث القاعدة');
      console.error('Error updating rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('هل أنت متأكد من حذف هذه القاعدة؟')) return;

    try {
      const response = await ApiService.delete(`/dynamic/calculation-rules/${ruleId}`);
      if (response.data.success) {
        setSuccess('تم حذف القاعدة بنجاح');
        loadData();
      }
    } catch (error) {
      setError('فشل في حذف القاعدة');
      console.error('Error deleting rule:', error);
    }
  };

  const handlePreviewCalculation = async () => {
    try {
      const response = await ApiService.post('/dynamic/calculate-preview', previewForm);
      if (response.data.success) {
        setPreviewData(response.data.data);
        setIsPreviewDialogOpen(true);
      }
    } catch (error) {
      setError('فشل في معاينة الحسابات');
      console.error('Error previewing calculation:', error);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      const response = await ApiService.post('/dynamic/initialize-defaults');
      if (response.data.success) {
        setSuccess('تم تهيئة القواعد الافتراضية بنجاح');
        loadData();
      }
    } catch (error) {
      setError('فشل في تهيئة القواعد الافتراضية');
      console.error('Error initializing defaults:', error);
    }
  };

  const resetRuleForm = () => {
    setRuleForm({
      name_ar: '',
      name_en: '',
      rule_type: 'commission',
      calculation_type: 'percentage',
      value: '',
      applies_to: 'sales',
      unit_type_filter: [],
      order_index: 0,
      description_ar: '',
      description_en: '',
      is_active: true
    });
    setCurrentRule(null);
  };

  const openRuleDialog = (rule = null) => {
    if (rule) {
      setCurrentRule(rule);
      setRuleForm({
        name_ar: rule.name_ar || '',
        name_en: rule.name_en || '',
        rule_type: rule.rule_type || 'commission',
        calculation_type: rule.calculation_type || 'percentage',
        value: rule.value || '',
        applies_to: rule.applies_to || 'sales',
        unit_type_filter: rule.unit_type_filter || [],
        order_index: rule.order_index || 0,
        description_ar: rule.description_ar || '',
        description_en: rule.description_en || '',
        is_active: rule.is_active !== undefined ? rule.is_active : true
      });
    } else {
      resetRuleForm();
    }
    setIsRuleDialogOpen(true);
  };

  const getRuleTypeLabel = (type) => {
    const types = {
      commission: 'عمولة',
      tax: 'ضريبة',
      discount: 'خصم',
      fee: 'رسوم'
    };
    return types[type] || type;
  };

  const getCalculationTypeLabel = (type) => {
    const types = {
      percentage: 'نسبة مئوية',
      fixed_amount: 'مبلغ ثابت'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الحسابات الديناميكية</h1>
          <p className="text-muted-foreground">
            إدارة قواعد العمولات والضرائب والحقول المخصصة
          </p>
        </div>
        <Button onClick={handleInitializeDefaults} variant="outline">
          <SettingsIcon className="w-4 h-4 mr-2" />
          تهيئة القواعد الافتراضية
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="calculation-rules" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculation-rules">
            <Calculator className="w-4 h-4 mr-2" />
            قواعد الحساب
          </TabsTrigger>
          <TabsTrigger value="custom-fields">
            <FileText className="w-4 h-4 mr-2" />
            الحقول المخصصة
          </TabsTrigger>
          <TabsTrigger value="print-templates">
            <FileText className="w-4 h-4 mr-2" />
            قوالب الطباعة
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            معاينة الحسابات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculation-rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>قواعد الحساب</CardTitle>
                  <CardDescription>
                    إدارة قواعد العمولات والضرائب والخصومات
                  </CardDescription>
                </div>
                <Button onClick={() => openRuleDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة قاعدة جديدة
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>نوع الحساب</TableHead>
                    <TableHead>القيمة</TableHead>
                    <TableHead>الترتيب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculationRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name_ar}</div>
                          <div className="text-sm text-muted-foreground">{rule.name_en}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getRuleTypeLabel(rule.rule_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getCalculationTypeLabel(rule.calculation_type)}
                      </TableCell>
                      <TableCell>
                        {rule.calculation_type === 'percentage' ? (
                          <span className="flex items-center">
                            <Percent className="w-4 h-4 mr-1" />
                            {rule.value}%
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {rule.value}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{rule.order_index}</TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRuleDialog(rule)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>معاينة الحسابات</CardTitle>
              <CardDescription>
                اختبر قواعد الحساب الحالية مع بيانات تجريبية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sale_price">سعر البيع</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    value={previewForm.sale_price}
                    onChange={(e) => setPreviewForm({...previewForm, sale_price: e.target.value})}
                    placeholder="أدخل سعر البيع"
                  />
                </div>
                <div>
                  <Label htmlFor="unit_id">معرف الوحدة</Label>
                  <Input
                    id="unit_id"
                    type="number"
                    value={previewForm.unit_id}
                    onChange={(e) => setPreviewForm({...previewForm, unit_id: e.target.value})}
                    placeholder="أدخل معرف الوحدة"
                  />
                </div>
              </div>
              <Button onClick={handlePreviewCalculation} className="w-full">
                <BarChart3 className="w-4 h-4 mr-2" />
                معاينة الحسابات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rule Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentRule ? 'تعديل قاعدة الحساب' : 'إضافة قاعدة حساب جديدة'}
            </DialogTitle>
            <DialogDescription>
              قم بتعبئة البيانات المطلوبة لإنشاء أو تعديل قاعدة الحساب
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name_ar">الاسم بالعربية</Label>
                <Input
                  id="name_ar"
                  value={ruleForm.name_ar}
                  onChange={(e) => setRuleForm({...ruleForm, name_ar: e.target.value})}
                  placeholder="أدخل الاسم بالعربية"
                />
              </div>
              <div>
                <Label htmlFor="name_en">الاسم بالإنجليزية</Label>
                <Input
                  id="name_en"
                  value={ruleForm.name_en}
                  onChange={(e) => setRuleForm({...ruleForm, name_en: e.target.value})}
                  placeholder="Enter name in English"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rule_type">نوع القاعدة</Label>
                <Select
                  value={ruleForm.rule_type}
                  onValueChange={(value) => setRuleForm({...ruleForm, rule_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع القاعدة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commission">عمولة</SelectItem>
                    <SelectItem value="tax">ضريبة</SelectItem>
                    <SelectItem value="discount">خصم</SelectItem>
                    <SelectItem value="fee">رسوم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="calculation_type">نوع الحساب</Label>
                <Select
                  value={ruleForm.calculation_type}
                  onValueChange={(value) => setRuleForm({...ruleForm, calculation_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الحساب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية</SelectItem>
                    <SelectItem value="fixed_amount">مبلغ ثابت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">القيمة</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={ruleForm.value}
                  onChange={(e) => setRuleForm({...ruleForm, value: e.target.value})}
                  placeholder="أدخل القيمة"
                />
              </div>
              <div>
                <Label htmlFor="order_index">ترتيب التطبيق</Label>
                <Input
                  id="order_index"
                  type="number"
                  value={ruleForm.order_index}
                  onChange={(e) => setRuleForm({...ruleForm, order_index: parseInt(e.target.value) || 0})}
                  placeholder="ترتيب التطبيق"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={ruleForm.is_active}
                onCheckedChange={(checked) => setRuleForm({...ruleForm, is_active: checked})}
              />
              <Label htmlFor="is_active">قاعدة نشطة</Label>
            </div>

            <div>
              <Label htmlFor="description_ar">الوصف بالعربية</Label>
              <Textarea
                id="description_ar"
                value={ruleForm.description_ar}
                onChange={(e) => setRuleForm({...ruleForm, description_ar: e.target.value})}
                placeholder="أدخل وصف القاعدة بالعربية"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={currentRule ? handleUpdateRule : handleCreateRule}>
              {currentRule ? 'تحديث' : 'إنشاء'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>معاينة الحسابات</DialogTitle>
            <DialogDescription>
              نتائج تطبيق قواعد الحساب على البيانات المدخلة
            </DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">المبالغ الإجمالية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>المبلغ الأساسي:</span>
                      <span className="font-medium">{previewData.base_amount} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span>عمولة الشركة:</span>
                      <span className="font-medium">{previewData.totals.company_commission} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span>عمولة البائع:</span>
                      <span className="font-medium">{previewData.totals.salesperson_commission} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span>إجمالي الضرائب:</span>
                      <span className="font-medium">{previewData.totals.total_taxes} جنيه</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold">صافي إيرادات الشركة:</span>
                      <span className="font-bold">{previewData.totals.net_company_revenue} جنيه</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">القواعد المطبقة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {previewData.applied_rules.map((rule, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{rule.rule_name_ar}:</span>
                          <span>{rule.calculated_amount} جنيه</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DynamicCalculations;
