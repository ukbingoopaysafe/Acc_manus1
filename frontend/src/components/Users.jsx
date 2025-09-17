import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
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
  Users as UsersIcon,
  Shield,
  User,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';

const Users = () => {
  const { t, isRTL } = useLanguage();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    role_id: '',
    is_active: true
  });
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData, permissionsData] = await Promise.all([
        ApiService.getUsers(),
        ApiService.getRoles(),
        ApiService.getPermissions()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      setError('فشل في تحميل البيانات');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const userData = {
        ...userFormData,
        role_id: parseInt(userFormData.role_id)
      };

      // Remove password if empty for updates
      if (editingUser && !userData.password) {
        delete userData.password;
      }

      if (editingUser) {
        await ApiService.updateUser(editingUser.id, userData);
        setSuccess('تم تحديث المستخدم بنجاح');
      } else {
        await ApiService.createUser(userData);
        setSuccess('تم إضافة المستخدم بنجاح');
      }

      setIsUserDialogOpen(false);
      setEditingUser(null);
      resetUserForm();
      fetchData();
    } catch (error) {
      setError(error.message || 'حدث خطأ أثناء حفظ المستخدم');
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const roleData = {
        ...roleFormData,
        permissions: roleFormData.permissions.map(id => parseInt(id))
      };

      if (editingRole) {
        await ApiService.updateRole(editingRole.id, roleData);
        setSuccess('تم تحديث الدور بنجاح');
      } else {
        await ApiService.createRole(roleData);
        setSuccess('تم إضافة الدور بنجاح');
      }

      setIsRoleDialogOpen(false);
      setEditingRole(null);
      resetRoleForm();
      fetchData();
    } catch (error) {
      setError(error.message || 'حدث خطأ أثناء حفظ الدور');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || '',
      password: '', // Don't populate password for security
      role_id: user.role_id.toString(),
      is_active: user.is_active
    });
    setIsUserDialogOpen(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions.map(p => p.id.toString())
    });
    setIsRoleDialogOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser.id) {
      setError('لا يمكنك حذف حسابك الخاص');
      return;
    }

    if (window.confirm(t('confirm_delete'))) {
      try {
        await ApiService.deleteUser(userId);
        setSuccess('تم حذف المستخدم بنجاح');
        fetchData();
      } catch (error) {
        setError(error.message || 'فشل في حذف المستخدم');
      }
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        await ApiService.deleteRole(roleId);
        setSuccess('تم حذف الدور بنجاح');
        fetchData();
      } catch (error) {
        setError(error.message || 'فشل في حذف الدور');
      }
    }
  };

  const resetUserForm = () => {
    setUserFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      password: '',
      role_id: '',
      is_active: true
    });
  };

  const resetRoleForm = () => {
    setRoleFormData({
      name: '',
      description: '',
      permissions: []
    });
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US');
  };

  const handlePermissionToggle = (permissionId) => {
    const currentPermissions = roleFormData.permissions;
    if (currentPermissions.includes(permissionId)) {
      setRoleFormData({
        ...roleFormData,
        permissions: currentPermissions.filter(id => id !== permissionId)
      });
    } else {
      setRoleFormData({
        ...roleFormData,
        permissions: [...currentPermissions, permissionId]
      });
    }
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
        <h1 className="text-3xl font-bold text-gray-900">{t('users')}</h1>
        <p className="text-gray-600 mt-2">إدارة المستخدمين والأدوار</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && !isUserDialogOpen && !isRoleDialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">المستخدمين</TabsTrigger>
          <TabsTrigger value="roles">الأدوار والصلاحيات</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في المستخدمين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsUserDialogOpen(true)}>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('add')} مستخدم جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد إلى النظام'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">اسم المستخدم *</Label>
                      <Input
                        id="username"
                        value={userFormData.username}
                        onChange={(e) => setUserFormData({...userFormData, username: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="first_name">الاسم الأول *</Label>
                      <Input
                        id="first_name"
                        value={userFormData.first_name}
                        onChange={(e) => setUserFormData({...userFormData, first_name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last_name">الاسم الأخير *</Label>
                      <Input
                        id="last_name"
                        value={userFormData.last_name}
                        onChange={(e) => setUserFormData({...userFormData, last_name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        value={userFormData.phone}
                        onChange={(e) => setUserFormData({...userFormData, phone: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role_id">الدور *</Label>
                      <Select value={userFormData.role_id} onValueChange={(value) => setUserFormData({...userFormData, role_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الدور" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="password">
                        {editingUser ? 'كلمة المرور الجديدة (اتركها فارغة إذا لم تريد تغييرها)' : 'كلمة المرور *'}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                        required={!editingUser}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={userFormData.is_active}
                          onChange={(e) => setUserFormData({...userFormData, is_active: e.target.checked})}
                          className="rounded"
                        />
                        <Label htmlFor="is_active">المستخدم نشط</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit">
                      {editingUser ? t('save') : t('add')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UsersIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                قائمة المستخدمين
              </CardTitle>
              <CardDescription>
                جميع المستخدمين المسجلين في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المستخدم</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>الهاتف</TableHead>
                        <TableHead>الدور</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ الإنشاء</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <User className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                              <div>
                                <p className="font-medium">{user.first_name} {user.last_name}</p>
                                <p className="text-sm text-gray-500">@{user.username}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Mail className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.phone ? (
                              <div className="flex items-center">
                                <Phone className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                                {user.phone}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              <Shield className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                              {user.role_name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {user.is_active ? 'نشط' : 'غير نشط'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400`} />
                              {formatDate(user.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {user.id !== currentUser.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مستخدمين</h3>
                  <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة مستخدم جديد.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">الأدوار والصلاحيات</h3>
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsRoleDialogOpen(true)}>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('add')} دور جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRole ? 'تعديل الدور' : 'إضافة دور جديد'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRole ? 'تعديل الدور والصلاحيات' : 'إضافة دور جديد مع الصلاحيات'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleRoleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="role_name">اسم الدور *</Label>
                      <Input
                        id="role_name"
                        value={roleFormData.name}
                        onChange={(e) => setRoleFormData({...roleFormData, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role_description">وصف الدور</Label>
                      <Input
                        id="role_description"
                        value={roleFormData.description}
                        onChange={(e) => setRoleFormData({...roleFormData, description: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>الصلاحيات</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                        {permissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`permission_${permission.id}`}
                              checked={roleFormData.permissions.includes(permission.id.toString())}
                              onChange={() => handlePermissionToggle(permission.id.toString())}
                              className="rounded"
                            />
                            <Label htmlFor={`permission_${permission.id}`} className="text-sm">
                              {permission.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit">
                      {editingRole ? t('save') : t('add')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Card key={role.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {role.name}
                  </CardTitle>
                  <CardDescription>
                    {role.description || 'لا يوجد وصف'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">الصلاحيات:</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.map((permission) => (
                          <Badge key={permission.id} variant="outline" className="text-xs">
                            {permission.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRole(role)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
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

          {roles.length === 0 && (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد أدوار</h3>
              <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة دور جديد.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Users;

