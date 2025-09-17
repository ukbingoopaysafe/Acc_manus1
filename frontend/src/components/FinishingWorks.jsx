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
  Hammer,
  DollarSign,
  Calendar,
  User,
  Building,
  Receipt
} from 'lucide-react';

const FinishingWorks = () => {
  const { t, isRTL } = useLanguage();
  const [finishingWorks, setFinishingWorks] = useState([]);
  const [finishingExpenses, setFinishingExpenses] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isWorkDialogOpen, setIsWorkDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedWork, setSelectedWork] = useState(null);
  const [workFormData, setWorkFormData] = useState({
    unit_id: '',
    project_name: '',
    start_date: '',
    end_date: '',
    budget: '',
    status: 'قيد التنفيذ',
    description: '',
    notes: ''
  });
  const [expenseFormData, setExpenseFormData] = useState({
    description: '',
    amount: '',
    expense_date: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const workStatuses = [
    { value: 'قيد التنفيذ', label: t('in_progress'), color: 'bg-yellow-100 text-yellow-800' },
    { value: 'مكتملة', label: t('completed'), color: 'bg-green-100 text-green-800' },
    { value: 'متوقفة', label: t('paused'), color: 'bg-red-100 text-red-800' },
    { value: 'ملغية', label: t('cancelled'), color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [worksData, unitsData] = await Promise.all([
        ApiService.getFinishingWorks(),
        ApiService.getUnits()
      ]);
      setFinishingWorks(worksData);
      setUnits(unitsData);
    } catch (error) {
      setError('فشل في تحميل البيانات');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinishingExpenses = async (workId) => {
    try {
      const expenses = await ApiService.getFinishingExpenses(workId);
      setFinishingExpenses(expenses);
    } catch (error) {
      console.error('Error fetching finishing expenses:', error);
    }
  };

  const handleWorkSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const workData = {
        ...workFormData,
        budget: parseFloat(workFormData.budget),
        unit_id: parseInt(workFormData.unit_id)
      };

      if (editingWork) {
        await ApiService.updateFinishingWork(editingWork.id, workData);
        setSuccess('تم تحديث مشروع التشطيب بنجاح');
      } else {
        await ApiService.createFinishingWork(workData);
        setSuccess('تم إضافة مشروع التشطيب بنجاح');
      }

      setIsWorkDialogOpen(false);
      setEditingWork(null);
      resetWorkForm();
      fetchData();
    } catch (error) {
      setError(error.message || 'حدث خطأ أثناء حفظ مشروع التشطيب');
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const expenseData = {
        ...expenseFormData,
        amount: parseFloat(expenseFormData.amount)
      };

      if (editingExpense) {
        await ApiService.updateFinishingExpense(editingExpense.id, expenseData);
        setSuccess('تم تحديث المصروف بنجاح');
      } else {
        await ApiService.createFinishingExpense(selectedWork.id, expenseData);
        setSuccess('تم إضافة المصروف بنجاح');
      }

      setIsExpenseDialogOpen(false);
      setEditingExpense(null);
      resetExpenseForm();
      if (selectedWork) {
        fetchFinishingExpenses(selectedWork.id);
      }
    } catch (error) {
      setError(error.message || 'حدث خطأ أثناء حفظ المصروف');
    }
  };

  const handleEditWork = (work) => {
    setEditingWork(work);
    setWorkFormData({
      unit_id: work.unit_id.toString(),
      project_name: work.project_name,
      start_date: work.start_date,
      end_date: work.end_date || '',
      budget: work.budget.toString(),
      status: work.status,
      description: work.description || '',
      notes: work.notes || ''
    });
    setIsWorkDialogOpen(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      expense_date: expense.expense_date,
      notes: expense.notes || ''
    });
    setIsExpenseDialogOpen(true);
  };

  const handleDeleteWork = async (workId) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        await ApiService.deleteFinishingWork(workId);
        setSuccess('تم حذف مشروع التشطيب بنجاح');
        fetchData();
      } catch (error) {
        setError(error.message || 'فشل في حذف مشروع التشطيب');
      }
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        await ApiService.deleteFinishingExpense(expenseId);
        setSuccess('تم حذف المصروف بنجاح');
        if (selectedWork) {
          fetchFinishingExpenses(selectedWork.id);
        }
      } catch (error) {
        setError(error.message || 'فشل في حذف المصروف');
      }
    }
  };

  const handleViewExpenses = (work) => {
    setSelectedWork(work);
    fetchFinishingExpenses(work.id);
  };

  const resetWorkForm = () => {
    setWorkFormData({
      unit_id: '',
      project_name: '',
      start_date: '',
      end_date: '',
      budget: '',
      status: 'قيد التنفيذ',
      description: '',
      notes: ''
    });
  };

  const resetExpenseForm = () => {
    setExpenseFormData({
      description: '',
      amount: '',
      expense_date: '',
      notes: ''
    });
  };

  const filteredWorks = finishingWorks.filter(work =>
    work.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    work.unit_code?.toLowerCase().includes(searchTerm.toLowerCase())
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
    const statusConfig = workStatuses.find(s => s.value === status);
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
        <h1 className="text-3xl font-bold text-gray-900">{t('finishing_works')}</h1>
        <p className="text-gray-600 mt-2">إدارة مشاريع التشطيبات ومصروفاتها</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && !isWorkDialogOpen && !isExpenseDialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projects">مشاريع التشطيب</TabsTrigger>
          <TabsTrigger value="expenses">مصروفات التشطيب</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في مشاريع التشطيب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isWorkDialogOpen} onOpenChange={setIsWorkDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsWorkDialogOpen(true)}>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('add')} مشروع تشطيب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingWork ? 'تعديل مشروع التشطيب' : 'إضافة مشروع تشطيب جديد'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingWork ? 'تعديل بيانات مشروع التشطيب' : 'إضافة مشروع تشطيب جديد إلى النظام'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleWorkSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit_id">الوحدة *</Label>
                      <Select value={workFormData.unit_id} onValueChange={(value) => setWorkFormData({...workFormData, unit_id: value})}>
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="project_name">اسم المشروع *</Label>
                      <Input
                        id="project_name"
                        value={workFormData.project_name}
                        onChange={(e) => setWorkFormData({...workFormData, project_name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="start_date">تاريخ البداية *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={workFormData.start_date}
                        onChange={(e) => setWorkFormData({...workFormData, start_date: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end_date">تاريخ النهاية</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={workFormData.end_date}
                        onChange={(e) => setWorkFormData({...workFormData, end_date: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="budget">الميزانية (جنيه) *</Label>
                      <Input
                        id="budget"
                        type="number"
                        step="0.01"
                        value={workFormData.budget}
                        onChange={(e) => setWorkFormData({...workFormData, budget: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">حالة المشروع *</Label>
                      <Select value={workFormData.status} onValueChange={(value) => setWorkFormData({...workFormData, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {workStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">وصف المشروع</Label>
                      <Textarea
                        id="description"
                        value={workFormData.description}
                        onChange={(e) => setWorkFormData({...workFormData, description: e.target.value})}
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="notes">ملاحظات</Label>
                      <Textarea
                        id="notes"
                        value={workFormData.notes}
                        onChange={(e) => setWorkFormData({...workFormData, notes: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsWorkDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit">
                      {editingWork ? t('save') : t('add')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Projects Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Hammer className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                قائمة مشاريع التشطيب
              </CardTitle>
              <CardDescription>
                جميع مشاريع التشطيب المسجلة في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredWorks.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم المشروع</TableHead>
                        <TableHead>كود الوحدة</TableHead>
                        <TableHead>تاريخ البداية</TableHead>
                        <TableHead>الميزانية</TableHead>
                        <TableHead>المصروف</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWorks.map((work) => (
                        <TableRow key={work.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{work.project_name}</p>
                              {work.description && (
                                <p className="text-sm text-gray-500">{work.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Building className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                              {work.unit_code}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                              <div>
                                <div>{formatDate(work.start_date)}</div>
                                {work.end_date && (
                                  <div className="text-sm text-gray-500">إلى {formatDate(work.end_date)}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center font-semibold text-blue-600">
                              <DollarSign className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {formatCurrency(work.budget)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center font-semibold text-red-600">
                              <DollarSign className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {formatCurrency(work.total_expenses)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(work.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewExpenses(work)}
                              >
                                <Receipt className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditWork(work)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteWork(work.id)}
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
                  <Hammer className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مشاريع تشطيب</h3>
                  <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة مشروع تشطيب جديد.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          {selectedWork ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">مصروفات مشروع {selectedWork.project_name}</h3>
                  <p className="text-gray-600">الوحدة: {selectedWork.unit_code}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setSelectedWork(null)}>
                    العودة للقائمة
                  </Button>
                  <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setIsExpenseDialogOpen(true)}>
                        <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        إضافة مصروف
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingExpense ? 'تعديل بيانات المصروف' : 'إضافة مصروف تشطيب جديد'}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={handleExpenseSubmit} className="space-y-4">
                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="description">وصف المصروف *</Label>
                            <Input
                              id="description"
                              value={expenseFormData.description}
                              onChange={(e) => setExpenseFormData({...expenseFormData, description: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="amount">المبلغ (جنيه) *</Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              value={expenseFormData.amount}
                              onChange={(e) => setExpenseFormData({...expenseFormData, amount: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expense_date">تاريخ المصروف *</Label>
                            <Input
                              id="expense_date"
                              type="date"
                              value={expenseFormData.expense_date}
                              onChange={(e) => setExpenseFormData({...expenseFormData, expense_date: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expense_notes">ملاحظات</Label>
                            <Textarea
                              id="expense_notes"
                              value={expenseFormData.notes}
                              onChange={(e) => setExpenseFormData({...expenseFormData, notes: e.target.value})}
                              rows={3}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                            {t('cancel')}
                          </Button>
                          <Button type="submit">
                            {editingExpense ? t('save') : t('add')}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Expenses Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Receipt className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    مصروفات التشطيب
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {finishingExpenses.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>الوصف</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>المستخدم</TableHead>
                            <TableHead>ملاحظات</TableHead>
                            <TableHead>الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {finishingExpenses.map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell>
                                <p className="font-medium">{expense.description}</p>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center font-semibold text-red-600">
                                  <DollarSign className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  {formatCurrency(expense.amount)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Calendar className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                                  {formatDate(expense.expense_date)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <User className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                                  {expense.user_name}
                                </div>
                              </TableCell>
                              <TableCell>
                                {expense.notes || '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditExpense(expense)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteExpense(expense.id)}
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
                      <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مصروفات</h3>
                      <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة مصروف تشطيب.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">اختر مشروع تشطيب</h3>
              <p className="mt-1 text-sm text-gray-500">اختر مشروع تشطيب من القائمة لعرض المصروفات.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinishingWorks;

