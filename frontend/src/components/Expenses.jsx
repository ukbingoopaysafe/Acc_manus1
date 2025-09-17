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
  Receipt,
  DollarSign,
  Calendar,
  User,
  Tag
} from 'lucide-react';

const Expenses = () => {
  const { t, isRTL } = useLanguage();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expenseFormData, setExpenseFormData] = useState({
    description_ar: '',
    description_en: '',
    amount: '',
    expense_date: '',
    category_id: '',
    notes: ''
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesData, categoriesData] = await Promise.all([
        ApiService.getExpenses(),
        ApiService.getExpenseCategories()
      ]);
      setExpenses(expensesData);
      setCategories(categoriesData);
    } catch (error) {
      setError('فشل في تحميل البيانات');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const expenseData = {
        ...expenseFormData,
        amount: parseFloat(expenseFormData.amount),
        category_id: parseInt(expenseFormData.category_id)
      };

      if (editingExpense) {
        await ApiService.updateExpense(editingExpense.id, expenseData);
        setSuccess('تم تحديث المصروف بنجاح');
      } else {
        await ApiService.createExpense(expenseData);
        setSuccess('تم إضافة المصروف بنجاح');
      }

      setIsExpenseDialogOpen(false);
      setEditingExpense(null);
      resetExpenseForm();
      fetchData();
    } catch (error) {
      setError(error.message || 'حدث خطأ أثناء حفظ المصروف');
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCategory) {
        await ApiService.updateExpenseCategory(editingCategory.id, categoryFormData);
        setSuccess('تم تحديث الفئة بنجاح');
      } else {
        await ApiService.createExpenseCategory(categoryFormData);
        setSuccess('تم إضافة الفئة بنجاح');
      }

      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      resetCategoryForm();
      fetchData();
    } catch (error) {
      setError(error.message || 'حدث خطأ أثناء حفظ الفئة');
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseFormData({
      description_ar: expense.description_ar,
      description_en: expense.description_en || '',
      amount: expense.amount.toString(),
      expense_date: expense.expense_date,
      category_id: expense.category_id.toString(),
      notes: expense.notes || ''
    });
    setIsExpenseDialogOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name_ar: category.name_ar,
      name_en: category.name_en,
      description_ar: category.description_ar || '',
      description_en: category.description_en || ''
    });
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        await ApiService.deleteExpense(expenseId);
        setSuccess('تم حذف المصروف بنجاح');
        fetchData();
      } catch (error) {
        setError(error.message || 'فشل في حذف المصروف');
      }
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        await ApiService.deleteExpenseCategory(categoryId);
        setSuccess('تم حذف الفئة بنجاح');
        fetchData();
      } catch (error) {
        setError(error.message || 'فشل في حذف الفئة');
      }
    }
  };

  const resetExpenseForm = () => {
    setExpenseFormData({
      description_ar: '',
      description_en: '',
      amount: '',
      expense_date: '',
      category_id: '',
      notes: ''
    });
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name_ar: '',
      name_en: '',
      description_ar: '',
      description_en: ''
    });
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category_name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter(category =>
    category.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.name_en.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('expenses')}</h1>
        <p className="text-gray-600 mt-2">إدارة المصروفات وفئاتها</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && !isExpenseDialogOpen && !isCategoryDialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="expenses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="expenses">المصروفات</TabsTrigger>
          <TabsTrigger value="categories">فئات المصروفات</TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في المصروفات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsExpenseDialogOpen(true)}>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('add')} مصروف جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingExpense ? 'تعديل بيانات المصروف' : 'إضافة مصروف جديد إلى النظام'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description_ar">وصف المصروف (عربي) *</Label>
                      <Input
                        id="description_ar"
                        value={expenseFormData.description_ar}
                        onChange={(e) => setExpenseFormData({...expenseFormData, description_ar: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description_en">وصف المصروف (إنجليزي)</Label>
                      <Input
                        id="description_en"
                        value={expenseFormData.description_en}
                        onChange={(e) => setExpenseFormData({...expenseFormData, description_en: e.target.value})}
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
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="category_id">فئة المصروف *</Label>
                      <Select value={expenseFormData.category_id} onValueChange={(value) => setExpenseFormData({...expenseFormData, category_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر فئة المصروف" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name_ar}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="notes">ملاحظات</Label>
                      <Textarea
                        id="notes"
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

          {/* Expenses Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                قائمة المصروفات
              </CardTitle>
              <CardDescription>
                جميع المصروفات المسجلة في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الوصف</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الفئة</TableHead>
                        <TableHead>المستخدم</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{expense.description_ar}</p>
                              {expense.notes && (
                                <p className="text-sm text-gray-500">{expense.notes}</p>
                              )}
                            </div>
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
                            <Badge variant="secondary">
                              <Tag className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                              {expense.category_name_ar}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                              {expense.user_name}
                            </div>
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
                  <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة مصروف جديد.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في الفئات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsCategoryDialogOpen(true)}>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('add')} فئة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCategory ? 'تعديل بيانات فئة المصروف' : 'إضافة فئة مصروف جديدة'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name_ar">اسم الفئة (عربي) *</Label>
                      <Input
                        id="name_ar"
                        value={categoryFormData.name_ar}
                        onChange={(e) => setCategoryFormData({...categoryFormData, name_ar: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name_en">اسم الفئة (إنجليزي) *</Label>
                      <Input
                        id="name_en"
                        value={categoryFormData.name_en}
                        onChange={(e) => setCategoryFormData({...categoryFormData, name_en: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description_ar">الوصف (عربي)</Label>
                      <Textarea
                        id="description_ar"
                        value={categoryFormData.description_ar}
                        onChange={(e) => setCategoryFormData({...categoryFormData, description_ar: e.target.value})}
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description_en">الوصف (إنجليزي)</Label>
                      <Textarea
                        id="description_en"
                        value={categoryFormData.description_en}
                        onChange={(e) => setCategoryFormData({...categoryFormData, description_en: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit">
                      {editingCategory ? t('save') : t('add')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Tag className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {category.name_ar}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {category.name_en}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.description_ar && (
                      <p className="text-sm text-gray-600">
                        {category.description_ar}
                      </p>
                    )}
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
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

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد فئات</h3>
              <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة فئة مصروف جديدة.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Expenses;

