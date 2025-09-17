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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  FileText,
  Printer,
  Settings,
  Calendar,
  Filter,
  Eye,
  Save,
  Upload
} from 'lucide-react';

const DynamicPrintExport = () => {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Print Templates State
  const [printTemplates, setPrintTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  // Export State
  const [exportFilters, setExportFilters] = useState({
    start_date: '',
    end_date: '',
    export_type: 'sales'
  });
  
  // Check Generation State
  const [checkData, setCheckData] = useState({
    payee: '',
    amount: '',
    date: '',
    amount_in_words: '',
    memo: ''
  });
  const [isCheckDialogOpen, setIsCheckDialogOpen] = useState(false);
  
  // Template Form State
  const [templateForm, setTemplateForm] = useState({
    name_ar: '',
    name_en: '',
    template_type: 'invoice',
    description_ar: '',
    description_en: '',
    is_default: false,
    template_content: {}
  });

  useEffect(() => {
    fetchPrintTemplates();
  }, []);

  const fetchPrintTemplates = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/print/print-templates');
      if (response.data.success) {
        setPrintTemplates(response.data.data);
      }
    } catch (error) {
      setError('فشل في جلب قوالب الطباعة');
      console.error('Error fetching print templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await ApiService.post('/print/print-templates', templateForm);
      if (response.data.success) {
        setSuccess('تم إنشاء القالب بنجاح');
        setIsTemplateDialogOpen(false);
        resetTemplateForm();
        fetchPrintTemplates();
      }
    } catch (error) {
      setError('فشل في إنشاء القالب');
      console.error('Error creating template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await ApiService.put(`/print/print-templates/${editingTemplate.id}`, templateForm);
      if (response.data.success) {
        setSuccess('تم تحديث القالب بنجاح');
        setIsTemplateDialogOpen(false);
        setEditingTemplate(null);
        resetTemplateForm();
        fetchPrintTemplates();
      }
    } catch (error) {
      setError('فشل في تحديث القالب');
      console.error('Error updating template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القالب؟')) {
      try {
        setLoading(true);
        const response = await ApiService.delete(`/print/print-templates/${templateId}`);
        if (response.data.success) {
          setSuccess('تم حذف القالب بنجاح');
          fetchPrintTemplates();
        }
      } catch (error) {
        setError('فشل في حذف القالب');
        console.error('Error deleting template:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportSales = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await ApiService.post('/print/export-sales', exportFilters, {
        responseType: 'blob'
      });
      
      // إنشاء رابط التحميل
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess('تم تصدير المبيعات بنجاح');
    } catch (error) {
      setError('فشل في تصدير المبيعات');
      console.error('Error exporting sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExpenses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await ApiService.post('/print/export-expenses', exportFilters, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expenses_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess('تم تصدير المصروفات بنجاح');
    } catch (error) {
      setError('فشل في تصدير المصروفات');
      console.error('Error exporting expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportComprehensive = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await ApiService.post('/print/export-comprehensive', exportFilters, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comprehensive_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess('تم تصدير التقرير الشامل بنجاح');
    } catch (error) {
      setError('فشل في تصدير التقرير الشامل');
      console.error('Error exporting comprehensive report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCheck = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await ApiService.post('/print/generate-check', checkData, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `check_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess('تم إنتاج الشيك بنجاح');
      setIsCheckDialogOpen(false);
      resetCheckForm();
    } catch (error) {
      setError('فشل في إنتاج الشيك');
      console.error('Error generating check:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeDefaultTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await ApiService.post('/print/initialize-default-templates');
      if (response.data.success) {
        setSuccess(response.data.message);
        fetchPrintTemplates();
      }
    } catch (error) {
      setError('فشل في تهيئة القوالب الافتراضية');
      console.error('Error initializing default templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name_ar: '',
      name_en: '',
      template_type: 'invoice',
      description_ar: '',
      description_en: '',
      is_default: false,
      template_content: {}
    });
  };

  const resetCheckForm = () => {
    setCheckData({
      payee: '',
      amount: '',
      date: '',
      amount_in_words: '',
      memo: ''
    });
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name_ar: template.name_ar,
      name_en: template.name_en,
      template_type: template.template_type,
      description_ar: template.description_ar,
      description_en: template.description_en,
      is_default: template.is_default,
      template_content: template.template_content || {}
    });
    setIsTemplateDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsTemplateDialogOpen(false);
    setEditingTemplate(null);
    resetTemplateForm();
    setError('');
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
          <h1 className="text-3xl font-bold text-gray-900">الطباعة والتصدير الديناميكية</h1>
          <p className="text-gray-600 mt-2">إدارة قوالب الطباعة وتصدير البيانات بطريقة مرنة</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleInitializeDefaultTemplates} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            تهيئة القوالب الافتراضية
          </Button>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Main Content */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">قوالب الطباعة</TabsTrigger>
          <TabsTrigger value="export">تصدير البيانات</TabsTrigger>
          <TabsTrigger value="checks">إنتاج الشيكات</TabsTrigger>
        </TabsList>

        {/* Print Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>قوالب الطباعة</CardTitle>
                  <CardDescription>إدارة قوالب الطباعة المخصصة للفواتير والتقارير</CardDescription>
                </div>
                <Dialog open={isTemplateDialogOpen} onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة قالب جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingTemplate ? 'تعديل القالب' : 'إضافة قالب جديد'}
                      </DialogTitle>
                      <DialogDescription>
                        قم بإنشاء أو تعديل قالب طباعة مخصص
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name_ar">الاسم بالعربية</Label>
                          <Input
                            id="name_ar"
                            value={templateForm.name_ar}
                            onChange={(e) => setTemplateForm({...templateForm, name_ar: e.target.value})}
                            placeholder="أدخل اسم القالب بالعربية"
                          />
                        </div>
                        <div>
                          <Label htmlFor="name_en">الاسم بالإنجليزية</Label>
                          <Input
                            id="name_en"
                            value={templateForm.name_en}
                            onChange={(e) => setTemplateForm({...templateForm, name_en: e.target.value})}
                            placeholder="أدخل اسم القالب بالإنجليزية"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="template_type">نوع القالب</Label>
                        <Select
                          value={templateForm.template_type}
                          onValueChange={(value) => setTemplateForm({...templateForm, template_type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع القالب" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="invoice">فاتورة</SelectItem>
                            <SelectItem value="check">شيك</SelectItem>
                            <SelectItem value="receipt">إيصال</SelectItem>
                            <SelectItem value="report">تقرير</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="description_ar">الوصف بالعربية</Label>
                          <Textarea
                            id="description_ar"
                            value={templateForm.description_ar}
                            onChange={(e) => setTemplateForm({...templateForm, description_ar: e.target.value})}
                            placeholder="أدخل وصف القالب بالعربية"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description_en">الوصف بالإنجليزية</Label>
                          <Textarea
                            id="description_en"
                            value={templateForm.description_en}
                            onChange={(e) => setTemplateForm({...templateForm, description_en: e.target.value})}
                            placeholder="أدخل وصف القالب بالإنجليزية"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_default"
                          checked={templateForm.is_default}
                          onChange={(e) => setTemplateForm({...templateForm, is_default: e.target.checked})}
                        />
                        <Label htmlFor="is_default">جعل هذا القالب افتراضي</Label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={handleDialogClose}>
                        إلغاء
                      </Button>
                      <Button onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
                        <Save className="w-4 h-4 mr-2" />
                        {editingTemplate ? 'تحديث' : 'حفظ'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name_ar}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template.template_type === 'invoice' ? 'فاتورة' :
                           template.template_type === 'check' ? 'شيك' :
                           template.template_type === 'receipt' ? 'إيصال' : 'تقرير'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {template.is_default && (
                          <Badge variant="default">افتراضي</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {template.created_at ? new Date(template.created_at).toLocaleDateString('ar-EG') : ''}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
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

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تصدير البيانات</CardTitle>
              <CardDescription>تصدير البيانات إلى ملفات Excel مع إمكانية التخصيص</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="start_date">تاريخ البداية</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={exportFilters.start_date}
                    onChange={(e) => setExportFilters({...exportFilters, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">تاريخ النهاية</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={exportFilters.end_date}
                    onChange={(e) => setExportFilters({...exportFilters, end_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="export_type">نوع التصدير</Label>
                  <Select
                    value={exportFilters.export_type}
                    onValueChange={(value) => setExportFilters({...exportFilters, export_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع التصدير" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">المبيعات</SelectItem>
                      <SelectItem value="expenses">المصروفات</SelectItem>
                      <SelectItem value="comprehensive">تقرير شامل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button onClick={handleExportSales}>
                  <Download className="w-4 h-4 mr-2" />
                  تصدير المبيعات
                </Button>
                <Button onClick={handleExportExpenses} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  تصدير المصروفات
                </Button>
                <Button onClick={handleExportComprehensive} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  تقرير شامل
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checks Tab */}
        <TabsContent value="checks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>إنتاج الشيكات</CardTitle>
                  <CardDescription>إنشاء وطباعة الشيكات بتنسيق مخصص</CardDescription>
                </div>
                <Dialog open={isCheckDialogOpen} onOpenChange={setIsCheckDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      إنشاء شيك جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إنشاء شيك جديد</DialogTitle>
                      <DialogDescription>
                        أدخل بيانات الشيك المطلوب إنتاجه
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="payee">المستفيد</Label>
                        <Input
                          id="payee"
                          value={checkData.payee}
                          onChange={(e) => setCheckData({...checkData, payee: e.target.value})}
                          placeholder="أدخل اسم المستفيد"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="amount">المبلغ</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={checkData.amount}
                            onChange={(e) => setCheckData({...checkData, amount: e.target.value})}
                            placeholder="أدخل المبلغ"
                          />
                        </div>
                        <div>
                          <Label htmlFor="date">التاريخ</Label>
                          <Input
                            id="date"
                            type="date"
                            value={checkData.date}
                            onChange={(e) => setCheckData({...checkData, date: e.target.value})}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="amount_in_words">المبلغ بالحروف</Label>
                        <Input
                          id="amount_in_words"
                          value={checkData.amount_in_words}
                          onChange={(e) => setCheckData({...checkData, amount_in_words: e.target.value})}
                          placeholder="أدخل المبلغ بالحروف"
                        />
                      </div>

                      <div>
                        <Label htmlFor="memo">ملاحظات</Label>
                        <Textarea
                          id="memo"
                          value={checkData.memo}
                          onChange={(e) => setCheckData({...checkData, memo: e.target.value})}
                          placeholder="أدخل ملاحظات إضافية"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsCheckDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={handleGenerateCheck}>
                        <Printer className="w-4 h-4 mr-2" />
                        إنتاج الشيك
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">انقر على "إنشاء شيك جديد" لبدء إنتاج شيك</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DynamicPrintExport;
