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
  Plus, 
  Edit, 
  Trash2, 
  Settings as SettingsIcon,
  DollarSign,
  FileText,
  Percent
} from 'lucide-react';

const Settings = () => {
  const { t, isRTL } = useLanguage();
  const [financialSettings, setFinancialSettings] = useState([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [settingFormData, setSettingFormData] = useState({
    setting_key: '',
    setting_name_ar: '',
    setting_name_en: '',
    setting_value: '',
    value_type: 'percentage',
    description_ar: '',
    description_en: ''
  });
  const [templateFormData, setTemplateFormData] = useState({
    template_name: '',
    template_type: 'فاتورة',
    template_content: '',
    is_default: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const valueTypes = [
    { value: 'percentage', label: 'نسبة مئوية (%)' },
    { value: 'amount', label: 'مبلغ ثابت (جنيه)' },
    { value: 'text', label: 'نص' },
    { value: 'number', label: 'رقم' }
  ];

  const templateTypes = [
    { value: 'فاتورة', label: 'فاتورة' },
    { value: 'شيك', label: 'شيك' },
    { value: 'إيصال', label: 'إيصال' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsData, templatesData] = await Promise.all([
        ApiService.getFinancialSettings(),
        ApiService.getInvoiceTemplates()
      ]);
      setFinancialSettings(settingsData);
      setInvoiceTemplates(templatesData);
    } catch (error) {
      setError('فشل في تحميل البيانات');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const settingData = {
        ...settingFormData,
        setting_value: settingFormData.value_type === 'number' || settingFormData.value_type === 'percentage' 
          ? parseFloat(settingFormData.setting_value) 
          : settingFormData.setting_value
      };

      if (editingSetting) {
        await ApiService.updateFinancialSetting(editingSetting.id, settingData);
        setSuccess('تم تحديث الإعداد بنجاح');
      } else {
        await ApiService.createFinancialSetting(settingData);
        setSuccess('تم إضافة الإعداد بنجاح');
      }

      setIsSettingDialogOpen(false);
      setEditingSetting(null);
      resetSettingForm();
      fetchData();
    } catch (error) {
      setError(error.message || 'حدث خطأ أثناء حفظ الإعداد');
    }
  };

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingTemplate) {
        await ApiService.updateInvoiceTemplate(editingTemplate.id, templateFormData);
        setSuccess('تم تحديث القالب بنجاح');
      } else {
        await ApiService.createInvoiceTemplate(templateFormData);
        setSuccess('تم إضافة القالب بنجاح');
      }

      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      resetTemplateForm();
      fetchData();
    } catch (error) {
      setError(error.message || 'حدث خطأ أثناء حفظ القالب');
    }
  };

  const handleEditSetting = (setting) => {
    setEditingSetting(setting);
    setSettingFormData({
      setting_key: setting.setting_key,
      setting_name_ar: setting.setting_name_ar,
      setting_name_en: setting.setting_name_en,
      setting_value: setting.setting_value.toString(),
      value_type: setting.value_type,
      description_ar: setting.description_ar || '',
      description_en: setting.description_en || ''
    });
    setIsSettingDialogOpen(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateFormData({
      template_name: template.template_name,
      template_type: template.template_type,
      template_content: template.template_content,
      is_default: template.is_default
    });
    setIsTemplateDialogOpen(true);
  };

  const handleDeleteSetting = async (settingId) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        await ApiService.deleteFinancialSetting(settingId);
        setSuccess('تم حذف الإعداد بنجاح');
        fetchData();
      } catch (error) {
        setError(error.message || 'فشل في حذف الإعداد');
      }
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        await ApiService.deleteInvoiceTemplate(templateId);
        setSuccess('تم حذف القالب بنجاح');
        fetchData();
      } catch (error) {
        setError(error.message || 'فشل في حذف القالب');
      }
    }
  };

  const resetSettingForm = () => {
    setSettingFormData({
      setting_key: '',
      setting_name_ar: '',
      setting_name_en: '',
      setting_value: '',
      value_type: 'percentage',
      description_ar: '',
      description_en: ''
    });
  };

  const resetTemplateForm = () => {
    setTemplateFormData({
      template_name: '',
      template_type: 'فاتورة',
      template_content: '',
      is_default: false
    });
  };

  const formatValue = (value, type) => {
    if (type === 'percentage') {
      return `${value}%`;
    } else if (type === 'amount') {
      return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value;
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
        <h1 className="text-3xl font-bold text-gray-900">{t('settings')}</h1>
        <p className="text-gray-600 mt-2">إعدادات النظام والقوالب</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && !isSettingDialogOpen && !isTemplateDialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList>
          <TabsTrigger value="financial">الإعدادات المالية</TabsTrigger>
          <TabsTrigger value="templates">قوالب الطباعة</TabsTrigger>
        </TabsList>

        {/* Financial Settings Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">الإعدادات المالية</h3>
            <Dialog open={isSettingDialogOpen} onOpenChange={setIsSettingDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsSettingDialogOpen(true)}>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('add')} إعداد جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingSetting ? 'تعديل الإعداد المالي' : 'إضافة إعداد مالي جديد'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSetting ? 'تعديل بيانات الإعداد المالي' : 'إضافة إعداد مالي جديد للنظام'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSettingSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="setting_key">مفتاح الإعداد *</Label>
                      <Input
                        id="setting_key"
                        value={settingFormData.setting_key}
                        onChange={(e) => setSettingFormData({...settingFormData, setting_key: e.target.value})}
                        placeholder="مثال: vat_rate"
                        required
                        disabled={editingSetting} // Don't allow editing key for existing settings
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="value_type">نوع القيمة *</Label>
                      <Select value={settingFormData.value_type} onValueChange={(value) => setSettingFormData({...settingFormData, value_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {valueTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="setting_name_ar">اسم الإعداد (عربي) *</Label>
                      <Input
                        id="setting_name_ar"
                        value={settingFormData.setting_name_ar}
                        onChange={(e) => setSettingFormData({...settingFormData, setting_name_ar: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="setting_name_en">اسم الإعداد (إنجليزي) *</Label>
                      <Input
                        id="setting_name_en"
                        value={settingFormData.setting_name_en}
                        onChange={(e) => setSettingFormData({...settingFormData, setting_name_en: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="setting_value">قيمة الإعداد *</Label>
                      <Input
                        id="setting_value"
                        type={settingFormData.value_type === 'text' ? 'text' : 'number'}
                        step={settingFormData.value_type === 'percentage' || settingFormData.value_type === 'amount' ? '0.01' : '1'}
                        value={settingFormData.setting_value}
                        onChange={(e) => setSettingFormData({...settingFormData, setting_value: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description_ar">الوصف (عربي)</Label>
                      <Textarea
                        id="description_ar"
                        value={settingFormData.description_ar}
                        onChange={(e) => setSettingFormData({...settingFormData, description_ar: e.target.value})}
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description_en">الوصف (إنجليزي)</Label>
                      <Textarea
                        id="description_en"
                        value={settingFormData.description_en}
                        onChange={(e) => setSettingFormData({...settingFormData, description_en: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsSettingDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit">
                      {editingSetting ? t('save') : t('add')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Financial Settings Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                قائمة الإعدادات المالية
              </CardTitle>
              <CardDescription>
                إعدادات الضرائب والعمولات والنسب المالية
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financialSettings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم الإعداد</TableHead>
                        <TableHead>المفتاح</TableHead>
                        <TableHead>القيمة</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialSettings.map((setting) => (
                        <TableRow key={setting.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{setting.setting_name_ar}</p>
                              <p className="text-sm text-gray-500">{setting.setting_name_en}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {setting.setting_key}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center font-semibold">
                              {setting.value_type === 'percentage' && <Percent className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />}
                              {setting.value_type === 'amount' && <DollarSign className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />}
                              {formatValue(setting.setting_value, setting.value_type)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {valueTypes.find(t => t.value === setting.value_type)?.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{setting.description_ar}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditSetting(setting)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteSetting(setting.id)}
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
                  <SettingsIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد إعدادات</h3>
                  <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة إعداد مالي جديد.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">قوالب الطباعة</h3>
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsTemplateDialogOpen(true)}>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('add')} قالب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'تعديل القالب' : 'إضافة قالب جديد'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTemplate ? 'تعديل قالب الطباعة' : 'إضافة قالب طباعة جديد للفواتير والشيكات'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleTemplateSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template_name">اسم القالب *</Label>
                      <Input
                        id="template_name"
                        value={templateFormData.template_name}
                        onChange={(e) => setTemplateFormData({...templateFormData, template_name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="template_type">نوع القالب *</Label>
                      <Select value={templateFormData.template_type} onValueChange={(value) => setTemplateFormData({...templateFormData, template_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {templateTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="template_content">محتوى القالب *</Label>
                      <Textarea
                        id="template_content"
                        value={templateFormData.template_content}
                        onChange={(e) => setTemplateFormData({...templateFormData, template_content: e.target.value})}
                        rows={10}
                        placeholder="أدخل محتوى القالب هنا..."
                        required
                      />
                      <p className="text-sm text-gray-500">
                        يمكنك استخدام متغيرات مثل: {'{'}client_name{'}'}, {'{'}amount{'}'}, {'{'}date{'}'}, {'{'}unit_code{'}'}
                      </p>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_default"
                          checked={templateFormData.is_default}
                          onChange={(e) => setTemplateFormData({...templateFormData, is_default: e.target.checked})}
                          className="rounded"
                        />
                        <Label htmlFor="is_default">جعل هذا القالب افتراضي</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit">
                      {editingTemplate ? t('save') : t('add')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoiceTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <FileText className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {template.template_name}
                    </CardTitle>
                    {template.is_default && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        افتراضي
                      </span>
                    )}
                  </div>
                  <CardDescription>
                    {templateTypes.find(t => t.value === template.template_type)?.label}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                      {template.template_content.substring(0, 200)}
                      {template.template_content.length > 200 && '...'}
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
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

          {invoiceTemplates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد قوالب</h3>
              <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة قالب طباعة جديد.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

