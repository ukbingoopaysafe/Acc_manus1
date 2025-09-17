
# تصميم هيكل قاعدة البيانات والنظام لتطبيق Broman Real Estate المحاسبي

## 1. مقدمة
يهدف هذا المستند إلى تحديد هيكل قاعدة البيانات والتصميم المعماري العام لتطبيق ويب محاسبي لشركة Broman Real Estate. بناءً على المتطلبات المقدمة من المستخدم، سيتم التركيز على المرونة وقابلية التخصيص من قبل مسؤول النظام (Admin) لتمكين إدارة ديناميكية للعمولات، الضرائب، قوالب الفواتير، وقوالب الشيكات. سيدعم التطبيق اللغتين العربية والإنجليزية.

## 2. الكيانات الرئيسية (Core Entities)

### 2.1. المستخدمون والأدوار (Users and Roles)

**الهدف:** إدارة الوصول والصلاحيات داخل التطبيق.

#### جدول `Users`
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `id`                   | `INTEGER` (PK)           | معرف المستخدم الفريد.                                           |
| `username`             | `VARCHAR(50)` (UNIQUE)   | اسم المستخدم لتسجيل الدخول.                                     |
| `password_hash`        | `VARCHAR(128)`           | التجزئة المشفرة لكلمة المرور.                                   |
| `email`                | `VARCHAR(100)` (UNIQUE)  | البريد الإلكتروني للمستخدم.                                     |
| `first_name`           | `VARCHAR(50)`            | الاسم الأول للمستخدم.                                           |
| `last_name`            | `VARCHAR(50)`            | الاسم الأخير للمستخدم.                                          |
| `role_id`              | `INTEGER` (FK)           | معرف الدور الذي ينتمي إليه المستخدم (يرتبط بجدول `Roles`).      |
| `is_active`            | `BOOLEAN`                | لتحديد ما إذا كان الحساب نشطًا.                                 |
| `created_at`           | `DATETIME`               | تاريخ ووقت إنشاء الحساب.                                        |
| `updated_at`           | `DATETIME`               | تاريخ ووقت آخر تحديث للحساب.                                    |

#### جدول `Roles`
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `id`                   | `INTEGER` (PK)           | معرف الدور الفريد.                                              |
| `name`                 | `VARCHAR(50)` (UNIQUE)   | اسم الدور (مثال: Admin, Accountant, Sales).                      |
| `description`          | `TEXT`                   | وصف للدور.                                                      |

#### جدول `Permissions`
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `id`                   | `INTEGER` (PK)           | معرف الإذن الفريد.                                              |
| `name`                 | `VARCHAR(100)` (UNIQUE)  | اسم الإذن (مثال: create_sale, view_expenses, edit_settings).    |
| `description`          | `TEXT`                   | وصف للإذن.                                                      |

#### جدول `RolePermissions` (جدول وسيط للعلاقة Many-to-Many)
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `role_id`              | `INTEGER` (FK)           | معرف الدور.                                                     |
| `permission_id`        | `INTEGER` (FK)           | معرف الإذن.                                                     |
| `can_view`             | `BOOLEAN`                | هل يمكن للدور عرض هذا المورد/الإجراء؟                            |
| `can_create`           | `BOOLEAN`                | هل يمكن للدور إنشاء هذا المورد/الإجراء؟                          |
| `can_edit`             | `BOOLEAN`                | هل يمكن للدور تعديل هذا المورد/الإجراء؟                          |
| `can_delete`           | `BOOLEAN`                | هل يمكن للدور حذف هذا المورد/الإجراء؟                            |

### 2.2. الوحدات العقارية (Real Estate Units)

**الهدف:** تخزين معلومات الوحدات العقارية المتاحة للبيع أو الإيجار.

#### جدول `Units`
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `id`                   | `INTEGER` (PK)           | معرف الوحدة الفريد.                                             |
| `code`                 | `VARCHAR(50)` (UNIQUE)   | كود الوحدة (من ملف Excel).                                      |
| `type`                 | `VARCHAR(50)`            | نوع العقار (شقة، تجاري، إداري، طبي).                            |
| `address`              | `TEXT`                   | عنوان الوحدة.                                                   |
| `area_sqm`             | `DECIMAL(10,2)`          | المساحة بالمتر المربع.                                          |
| `price`                | `DECIMAL(15,2)`          | سعر الوحدة الأساسي.                                             |
| `description_ar`       | `TEXT`                   | وصف الوحدة باللغة العربية.                                      |
| `description_en`       | `TEXT`                   | وصف الوحدة باللغة الإنجليزية.                                  |
| `status`               | `VARCHAR(50)`            | حالة الوحدة (متاحة، مباعة، مؤجرة).                              |
| `created_at`           | `DATETIME`               | تاريخ ووقت إنشاء سجل الوحدة.                                    |
| `updated_at`           | `DATETIME`               | تاريخ ووقت آخر تحديث لسجل الوحدة.                               |

### 2.3. المبيعات (Sales)

**الهدف:** تسجيل تفاصيل عمليات بيع الوحدات العقارية وحساب العمولات والضرائب.

#### جدول `Sales`
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `id`                   | `INTEGER` (PK)           | معرف عملية البيع الفريد.                                        |
| `unit_id`              | `INTEGER` (FK)           | معرف الوحدة المباعة (يرتبط بجدول `Units`).                      |
| `client_name`          | `VARCHAR(100)`           | اسم العميل (من ملف Excel).                                      |
| `sale_date`            | `DATE`                   | تاريخ البيع (من ملف Excel).                                     |
| `sale_price`           | `DECIMAL(15,2)`          | سعر البيع الفعلي للوحدة.                                        |
| `salesperson_id`       | `INTEGER` (FK)           | معرف السيلز الذي أتم البيع (يرتبط بجدول `Users`).                |
| `sales_manager_id`     | `INTEGER` (FK)           | معرف مدير المبيعات (يرتبط بجدول `Users`).                       |
| `company_commission`   | `DECIMAL(15,2)`          | عمولة الشركة المحسوبة.                                          |
| `salesperson_commission`| `DECIMAL(15,2)`          | عمولة السيلز المحسوبة.                                          |
| `sales_manager_commission`| `DECIMAL(15,2)`          | عمولة مدير المبيعات المحسوبة.                                   |
| `total_taxes`          | `DECIMAL(15,2)`          | إجمالي الضرائب المحسوبة.                                        |
| `net_company_revenue`  | `DECIMAL(15,2)`          | صافي إيرادات الشركة من البيع.                                   |
| `notes`                | `TEXT`                   | ملاحظات إضافية حول عملية البيع.                                 |
| `created_at`           | `DATETIME`               | تاريخ ووقت إنشاء سجل البيع.                                     |
| `updated_at`           | `DATETIME`               | تاريخ ووقت آخر تحديث لسجل البيع.                                |

### 2.4. المصروفات (Expenses)

**الهدف:** إدارة وتسجيل جميع مصروفات الشركة.

#### جدول `Expenses`
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `id`                   | `INTEGER` (PK)           | معرف المصروف الفريد.                                            |
| `description_ar`       | `TEXT`                   | وصف المصروف باللغة العربية (مثال: مرتبات، بوفيه، مواصلات).       |
| `description_en`       | `TEXT`                   | وصف المصروف باللغة الإنجليزية.                                  |
| `amount`               | `DECIMAL(15,2)`          | قيمة المصروف.                                                   |
| `expense_date`         | `DATE`                   | تاريخ المصروف.                                                  |
| `category_id`          | `INTEGER` (FK)           | معرف فئة المصروف (يرتبط بجدول `ExpenseCategories`).             |
| `user_id`              | `INTEGER` (FK)           | معرف المستخدم الذي سجل المصروف (يرتبط بجدول `Users`).           |
| `notes`                | `TEXT`                   | ملاحظات إضافية.                                                 |
| `created_at`           | `DATETIME`               | تاريخ ووقت إنشاء سجل المصروف.                                   |
| `updated_at`           | `DATETIME`               | تاريخ ووقت آخر تحديث لسجل المصروف.                               |

#### جدول `ExpenseCategories`
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `id`                   | `INTEGER` (PK)           | معرف فئة المصروف الفريد.                                        |
| `name_ar`              | `VARCHAR(100)` (UNIQUE)  | اسم الفئة باللغة العربية (مثال: مرتبات، بوفيه).                  |
| `name_en`              | `VARCHAR(100)` (UNIQUE)  | اسم الفئة باللغة الإنجليزية.                                    |
| `description_ar`       | `TEXT`                   | وصف الفئة باللغة العربية.                                       |
| `description_en`       | `TEXT`                   | وصف الفئة باللغة الإنجليزية.                                    |

### 2.5. الإيجارات (Rentals)

**الهدف:** إدارة عقود الإيجار والمدفوعات.

#### جدول `Rentals`
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `id`                   | `INTEGER` (PK)           | معرف عقد الإيجار الفريد.                                        |
| `unit_id`              | `INTEGER` (FK)           | معرف الوحدة المؤجرة (يرتبط بجدول `Units`).                      |
| `tenant_name`          | `VARCHAR(100)`           | اسم المستأجر.                                                   |
| `start_date`           | `DATE`                   | تاريخ بدء عقد الإيجار.                                          |
| `end_date`             | `DATE`                   | تاريخ انتهاء عقد الإيجار.                                       |
| `rent_amount`          | `DECIMAL(15,2)`          | قيمة الإيجار الشهري/السنوي.                                     |
| `payment_frequency`    | `VARCHAR(50)`            | وتيرة الدفع (شهري، ربع سنوي، سنوي).                              |
| `notes`                | `TEXT`                   | ملاحظات إضافية.                                                 |
| `created_at`           | `DATETIME`               | تاريخ ووقت إنشاء سجل الإيجار.                                   |
| `updated_at`           | `DATETIME`               | تاريخ ووقت آخر تحديث لسجل الإيجار.                               |

#### جدول `RentalPayments`
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `id`                   | `INTEGER` (PK)           | معرف الدفعة الفريد.                                             |
| `rental_id`            | `INTEGER` (FK)           | معرف عقد الإيجار (يرتبط بجدول `Rentals`).                       |
| `payment_date`         | `DATE`                   | تاريخ الدفعة.                                                   |
| `amount`               | `DECIMAL(15,2)`          | مبلغ الدفعة.                                                    |
| `status`               | `VARCHAR(50)`            | حالة الدفعة (مدفوعة، متأخرة، مستحقة).                           |
| `notes`                | `TEXT`                   | ملاحظات إضافية.                                                 |
| `created_at`           | `DATETIME`               | تاريخ ووقت إنشاء سجل الدفعة.                                    |
| `updated_at`           | `DATETIME`               | تاريخ ووقت آخر تحديث لسجل الدفعة.                               |

### 2.6. التشطيبات (Finishing Works)

**الهدف:** إدارة مشاريع التشطيبات وتكاليفها.

#### جدول `FinishingWorks`
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `id`                   | `INTEGER` (PK)           | معرف مشروع التشطيب الفريد.                                      |
| `unit_id`              | `INTEGER` (FK)           | معرف الوحدة التي يتم تشطيبها (يرتبط بجدول `Units`).             |
| `project_name_ar`      | `VARCHAR(100)`           | اسم مشروع التشطيب باللغة العربية.                               |
| `project_name_en`      | `VARCHAR(100)`           | اسم مشروع التشطيب باللغة الإنجليزية.                            |
| `start_date`           | `DATE`                   | تاريخ بدء المشروع.                                              |
| `end_date`             | `DATE`                   | تاريخ انتهاء المشروع المتوقع/الفعلي.                            |
| `budget`               | `DECIMAL(15,2)`          | الميزانية المخصصة للمشروع.                                      |
| `actual_cost`          | `DECIMAL(15,2)`          | التكلفة الفعلية للمشروع.                                        |
| `status`               | `VARCHAR(50)`            | حالة المشروع (قيد التنفيذ، مكتمل، متوقف).                       |
| `notes`                | `TEXT`                   | ملاحظات إضافية.                                                 |
| `created_at`           | `DATETIME`               | تاريخ ووقت إنشاء سجل المشروع.                                   |
| `updated_at`           | `DATETIME`               | تاريخ ووقت آخر تحديث لسجل المشروع.                               |

#### جدول `FinishingWorkExpenses`
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `id`                   | `INTEGER` (PK)           | معرف مصروف التشطيب الفريد.                                      |
| `finishing_work_id`    | `INTEGER` (FK)           | معرف مشروع التشطيب (يرتبط بجدول `FinishingWorks`).              |
| `description_ar`       | `TEXT`                   | وصف المصروف باللغة العربية.                                     |
| `description_en`       | `TEXT`                   | وصف المصروف باللغة الإنجليزية.                                  |
| `amount`               | `DECIMAL(15,2)`          | قيمة المصروف.                                                   |
| `expense_date`         | `DATE`                   | تاريخ المصروف.                                                  |
| `notes`                | `TEXT`                   | ملاحظات إضافية.                                                 |
| `created_at`           | `DATETIME`               | تاريخ ووقت إنشاء سجل المصروف.                                   |
| `updated_at`           | `DATETIME`               | تاريخ ووقت آخر تحديث لسجل المصروف.                               |

### 2.7. إعدادات النظام المالية (Financial System Settings) - قابلة للتخصيص من Admin

**الهدف:** تمكين مسؤول النظام من تعريف وتعديل العمولات، الضرائب، والنسب الحسابية ديناميكيًا.

#### جدول `FinancialSettings`
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `id`                   | `INTEGER` (PK)           | معرف الإعداد الفريد.                                            |
| `key`                  | `VARCHAR(100)` (UNIQUE)  | مفتاح الإعداد (مثال: VAT_RATE, ADMIN_DISCOUNT_PERCENTAGE).       |
| `value`                | `TEXT`                   | قيمة الإعداد (يمكن أن تكون رقمًا، نصًا، JSON).                   |
| `type`                 | `VARCHAR(50)`            | نوع القيمة (مثال: percentage, fixed_amount, text).              |
| `description_ar`       | `TEXT`                   | وصف الإعداد باللغة العربية.                                     |
| `description_en`       | `TEXT`                   | وصف الإعداد باللغة الإنجليزية.                                  |
| `is_active`            | `BOOLEAN`                | لتحديد ما إذا كان الإعداد نشطًا.                                 |
| `created_at`           | `DATETIME`               | تاريخ ووقت إنشاء الإعداد.                                       |
| `updated_at`           | `DATETIME`               | تاريخ ووقت آخر تحديث للإعداد.                                   |

**أمثلة على البيانات في `FinancialSettings`:**
-   `key`: `VAT_RATE`, `value`: `0.14`, `type`: `percentage`, `description_ar`: `نسبة ضريبة القيمة المضافة`
-   `key`: `SALES_TAX_RATE`, `value`: `0.05`, `type`: `percentage`, `description_ar`: `نسبة ضريبة المبيعات`
-   `key`: `ADMIN_DISCOUNT_PERCENTAGE`, `value`: `0.05`, `type`: `percentage`, `description_ar`: `نسبة الخصم الإداري`
-   `key`: `COMPANY_COMMISSION_APARTMENT`, `value`: `0.02`, `type`: `percentage`, `description_ar`: `عمولة الشركة على الشقق`
-   `key`: `SALESPERSON_COMMISSION_APARTMENT`, `value`: `0.005`, `type`: `percentage`, `description_ar`: `عمولة السيلز على الشقق`

### 2.8. رصيد الخزنة (Cashier Balance)

**الهدف:** تتبع رصيد الشركة في الخزنة.

#### جدول `CashierBalance`
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `id`                   | `INTEGER` (PK)           | معرف الرصيد الفريد (سيكون هناك سجل واحد فقط).                   |
| `balance`              | `DECIMAL(18,2)`          | الرصيد الحالي في الخزنة.                                        |
| `last_updated_at`      | `DATETIME`               | تاريخ ووقت آخر تحديث للرصيد.                                    |

#### جدول `CashierTransactions`
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `id`                   | `INTEGER` (PK)           | معرف المعاملة الفريد.                                           |
| `transaction_date`     | `DATETIME`               | تاريخ ووقت المعاملة.                                            |
| `amount`               | `DECIMAL(15,2)`          | مبلغ المعاملة (موجب للإيداع، سالب للسحب).                       |
| `transaction_type`     | `VARCHAR(50)`            | نوع المعاملة (مثال: sale_revenue, expense_payment, rental_income).|
| `reference_id`         | `INTEGER`                | معرف الكيان المرتبط بالمعاملة (مثال: `sale_id`, `expense_id`).  |
| `notes`                | `TEXT`                   | ملاحظات حول المعاملة.                                           |
| `user_id`              | `INTEGER` (FK)           | المستخدم الذي أجرى المعاملة (يرتبط بجدول `Users`).              |

### 2.9. قوالب الفواتير والشيكات (Invoice and Check Templates) - قابلة للتخصيص من Admin

**الهدف:** تمكين مسؤول النظام من تخصيص قوالب الفواتير والشيكات.

#### جدول `Templates`
| اسم الحقل (Field Name) | نوع البيانات (Data Type) | الوصف (Description) |
|------------------------|--------------------------|------------------------------------------------------------------|
| `id`                   | `INTEGER` (PK)           | معرف القالب الفريد.                                             |
| `name`                 | `VARCHAR(100)` (UNIQUE)  | اسم القالب (مثال: Sales Invoice, Rental Invoice, Check Template).|
| `type`                 | `VARCHAR(50)`            | نوع القالب (invoice, check).                                    |
| `content`              | `TEXT`                   | محتوى القالب (يمكن أن يكون HTML/CSS أو JSON يصف الحقول).        |
| `is_active`            | `BOOLEAN`                | لتحديد ما إذا كان القالب نشطًا.                                 |
| `created_at`           | `DATETIME`               | تاريخ ووقت إنشاء القالب.                                        |
| `updated_at`           | `DATETIME`               | تاريخ ووقت آخر تحديث للقالب.                                    |

**ملاحظة على `content`:** يمكن تخزين محتوى القالب كـ JSON يصف الحقول التي يجب عرضها ومواقعها، أو كقالب HTML/CSS يمكن ملؤه بالبيانات ديناميكيًا. الخيار الأول يوفر مرونة أكبر في التخصيص من خلال واجهة المستخدم، بينما الثاني يتطلب معرفة تقنية أكبر لتعديله.

## 3. التصميم المعماري العام (Overall System Architecture)

سيتبع التطبيق بنية `Client-Server` مع فصل واضح بين الواجهة الأمامية (Frontend) والواجهة الخلفية (Backend).

### 3.1. الواجهة الخلفية (Backend)
-   **الإطار (Framework):** Flask (Python).
-   **قاعدة البيانات (Database):** PostgreSQL (موصى به للبيانات المالية بسبب موثوقيته وقابليته للتوسع) أو SQLite (للتطوير والاختبار السريع).
-   **ORM (Object-Relational Mapper):** SQLAlchemy لإدارة التفاعل مع قاعدة البيانات.
-   **المصادقة (Authentication):** JWT (JSON Web Tokens) للمصادقة الآمنة.
-   **اللغات:** دعم اللغتين العربية والإنجليزية من خلال مكتبات الترجمة (مثل Flask-Babel).
-   **الوظائف الرئيسية:**
    -   إدارة المستخدمين والأدوار والصلاحيات.
    -   واجهات برمجة التطبيقات (APIs) لجميع الكيانات (CRUD operations).
    -   منطق العمل لحساب العمولات والضرائب بناءً على `FinancialSettings`.
    -   إدارة رصيد الخزنة وتحديثه تلقائيًا.
    -   توليد التقارير وتصدير البيانات (Excel).
    -   توليد الفواتير والشيكات بناءً على `Templates`.

### 3.2. الواجهة الأمامية (Frontend)
-   **الإطار (Framework):** React (JavaScript).
-   **إدارة الحالة (State Management):** Redux أو React Context API.
-   **التصميم (Styling):** Tailwind CSS أو Material-UI لتصميم سريع الاستجابة وجذاب.
-   **اللغات:** دعم اللغتين العربية والإنجليزية باستخدام مكتبات i18n (مثل `react-i18next`).
-   **الوظائف الرئيسية:**
    -   واجهة مستخدم سهلة الاستخدام لإدارة الوحدات، المبيعات، المصروفات، الإيجارات، التشطيبات.
    -   لوحة تحكم للمسؤول لإدارة المستخدمين، الأدوار، الصلاحيات، الإعدادات المالية، قوالب الفواتير والشيكات.
    -   عرض التقارير المالية الأساسية.
    -   واجهة لطباعة الفواتير والشيكات وتصدير البيانات.
    -   لوحة تحكم (Dashboard) تعرض ملخصًا ماليًا للشركة.

## 4. العلاقات بين الكيانات (Entity Relationships)

-   `Users` <-> `Roles`: Many-to-One (كل مستخدم له دور واحد، كل دور يمكن أن يكون له عدة مستخدمين).
-   `Roles` <-> `Permissions`: Many-to-Many عبر جدول `RolePermissions`.
-   `Sales` <-> `Units`: Many-to-One (كل عملية بيع لوحدة واحدة، الوحدة يمكن أن تُباع مرة واحدة أو أكثر إذا تم إعادة بيعها).
-   `Sales` <-> `Users` (Salesperson): Many-to-One.
-   `Sales` <-> `Users` (Sales Manager): Many-to-One.
-   `Expenses` <-> `ExpenseCategories`: Many-to-One.
-   `Expenses` <-> `Users`: Many-to-One (المستخدم الذي سجل المصروف).
-   `Rentals` <-> `Units`: Many-to-One.
-   `RentalPayments` <-> `Rentals`: Many-to-One.
-   `FinishingWorks` <-> `Units`: Many-to-One.
-   `FinishingWorkExpenses` <-> `FinishingWorks`: Many-to-One.
-   `CashierTransactions` <-> `Users`: Many-to-One (المستخدم الذي أجرى المعاملة).
-   `CashierTransactions` <-> `Sales`, `Expenses`, `Rentals`, `FinishingWorks`: One-to-One (معاملة الخزنة ترتبط بكيان واحد من هذه الكيانات).

## 5. الاعتبارات الأمنية (Security Considerations)

-   **المصادقة (Authentication):** استخدام JWTs لضمان أن المستخدمين المصرح لهم فقط يمكنهم الوصول إلى موارد الواجهة الخلفية.
-   **التفويض (Authorization):** تطبيق نظام دقيق للصلاحيات بناءً على الأدوار لضمان أن المستخدمين يمكنهم فقط تنفيذ الإجراءات التي يمتلكون إذنًا بها.
-   **تشفير البيانات (Data Encryption):** تخزين كلمات المرور مجزأة (hashed) في قاعدة البيانات. النظر في تشفير البيانات الحساسة في حالة الراحة (at rest) وأثناء النقل (in transit).
-   **التحقق من صحة المدخلات (Input Validation):** التحقق من صحة جميع المدخلات من الواجهة الأمامية لمنع هجمات الحقن (SQL Injection, XSS).

## 6. قابلية التوسع (Scalability)

-   تم تصميم قاعدة البيانات بعلاقات واضحة وجداول منفصلة لسهولة التوسع.
-   يمكن توسيع الواجهة الخلفية (Flask) باستخدام مفاهيم مثل Microservices إذا زاد التعقيد أو الحمل بشكل كبير.
-   الواجهة الأمامية (React) بطبيعتها قابلة للتوسع من خلال تقسيم المكونات وإدارة الحالة بشكل فعال.

## 7. الخطوات التالية

بعد الموافقة على هذا التصميم، ستكون الخطوة التالية هي إعداد بيئة التطوير وإنشاء هياكل المشروع للواجهة الخلفية والواجهة الأمامية.



## 8. تصميم قوالب الفواتير والشيكات الديناميكية (Dynamic Invoice and Check Templates)

لتحقيق المرونة المطلوبة في تخصيص قوالب الفواتير والشيكات، سنعتمد على تخزين تعريف القالب كبيانات منظمة (JSON) في جدول `Templates`. هذا يسمح للمسؤول بتحديد الحقول المراد عرضها وترتيبها وتنسيقها دون الحاجة لتعديل الكود.

### 8.1. هيكل JSON المقترح لقالب الفاتورة (Invoice Template JSON Structure)

يمكن أن يحتوي حقل `content` في جدول `Templates` على هيكل JSON يصف الفاتورة. على سبيل المثال:

```json
{
  "template_name": {
    "ar": "فاتورة مبيعات",
    "en": "Sales Invoice"
  },
  "header": [
    {
      "field": "company_logo",
      "type": "image",
      "label": {"ar": "شعار الشركة", "en": "Company Logo"},
      "visible": true,
      "position": "left"
    },
    {
      "field": "company_name",
      "type": "text",
      "label": {"ar": "اسم الشركة", "en": "Company Name"},
      "value": "Broman Real Estate",
      "visible": true,
      "style": "font-size: 24px; font-weight: bold;"
    },
    {
      "field": "invoice_number",
      "type": "data",
      "label": {"ar": "رقم الفاتورة", "en": "Invoice No."}, 
      "source": "sale.invoice_number",
      "visible": true
    },
    {
      "field": "invoice_date",
      "type": "data",
      "label": {"ar": "تاريخ الفاتورة", "en": "Invoice Date"},
      "source": "sale.sale_date",
      "visible": true
    }
  ],
  "client_info": [
    {
      "field": "client_name",
      "type": "data",
      "label": {"ar": "اسم العميل", "en": "Client Name"},
      "source": "sale.client_name",
      "visible": true
    },
    {
      "field": "client_address",
      "type": "data",
      "label": {"ar": "عنوان العميل", "en": "Client Address"},
      "source": "sale.client_address",
      "visible": false, 
      "custom_field": true 
    }
  ],
  "items_table": {
    "visible": true,
    "columns": [
      {
        "field": "item_description",
        "type": "data",
        "label": {"ar": "الوصف", "en": "Description"},
        "source": "unit.description",
        "visible": true
      },
      {
        "field": "unit_price",
        "type": "data",
        "label": {"ar": "سعر الوحدة", "en": "Unit Price"},
        "source": "unit.price",
        "visible": true
      },
      {
        "field": "quantity",
        "type": "static",
        "label": {"ar": "الكمية", "en": "Quantity"},
        "value": 1,
        "visible": true
      },
      {
        "field": "total",
        "type": "calculated",
        "label": {"ar": "الإجمالي", "en": "Total"},
        "formula": "unit_price * quantity",
        "visible": true
      }
    ]
  },
  "summary": [
    {
      "field": "subtotal",
      "type": "data",
      "label": {"ar": "المجموع الفرعي", "en": "Subtotal"},
      "source": "sale.sale_price",
      "visible": true
    },
    {
      "field": "vat_amount",
      "type": "data",
      "label": {"ar": "ضريبة القيمة المضافة", "en": "VAT Amount"},
      "source": "sale.vat_amount",
      "visible": true
    },
    {
      "field": "total_amount",
      "type": "data",
      "label": {"ar": "المبلغ الإجمالي", "en": "Total Amount"},
      "source": "sale.total_amount",
      "visible": true
    }
  ],
  "footer": [
    {
      "field": "notes",
      "type": "data",
      "label": {"ar": "ملاحظات", "en": "Notes"},
      "source": "sale.notes",
      "visible": true
    },
    {
      "field": "bank_details",
      "type": "text",
      "label": {"ar": "تفاصيل البنك", "en": "Bank Details"},
      "value": "Bank Name: ABC, Account: 123456789",
      "visible": true
    }
  ]
}
```

**شرح هيكل JSON:**
-   `template_name`: اسم القالب باللغتين. 
-   `header`, `client_info`, `items_table`, `summary`, `footer`: أقسام رئيسية في الفاتورة.
-   كل عنصر داخل هذه الأقسام يمثل حقلاً أو مكونًا:
    -   `field`: اسم فريد للحقل.
    -   `type`: نوع الحقل (مثل `image`, `text`, `data`, `calculated`, `static`).
        -   `data`: حقل يتم جلب قيمته من بيانات التطبيق (مثل `sale.client_name`).
        -   `calculated`: حقل يتم حساب قيمته بناءً على `formula`.
        -   `static`: حقل بقيمة ثابتة.
        -   `custom_field`: حقل يمكن للمسؤول إدخال قيمته يدويًا أو ربطه ببيانات إضافية.
    -   `label`: تسمية الحقل باللغتين.
    -   `source`: المسار إلى البيانات في نموذج الكيان (مثال: `sale.client_name` يشير إلى حقل `client_name` في كائن `sale`).
    -   `value`: القيمة الثابتة للحقل (إذا كان `type` هو `text` أو `static`).
    -   `visible`: `true` أو `false` لتحديد ما إذا كان الحقل مرئيًا في الفاتورة المطبوعة.
    -   `style`: أنماط CSS إضافية للحقل.
    -   `formula`: صيغة حسابية للحقول المحسوبة.

### 8.2. هيكل JSON المقترح لقالب الشيك (Check Template JSON Structure)

بالمثل، يمكن تعريف قالب الشيك:

```json
{
  "template_name": {
    "ar": "قالب شيك",
    "en": "Check Template"
  },
  "fields": [
    {
      "field": "payee_name",
      "type": "data",
      "label": {"ar": "اسم المستفيد", "en": "Payee Name"},
      "source": "expense.payee_name", 
      "visible": true,
      "x": 100, "y": 50, "width": 300, "height": 20 
    },
    {
      "field": "amount_numeric",
      "type": "data",
      "label": {"ar": "المبلغ بالأرقام", "en": "Amount (Numeric)"},
      "source": "expense.amount",
      "visible": true,
      "x": 450, "y": 70, "width": 150, "height": 20 
    },
    {
      "field": "amount_words",
      "type": "calculated",
      "label": {"ar": "المبلغ بالحروف", "en": "Amount (Words)"},
      "formula": "convert_number_to_words(expense.amount, 'ar')", 
      "visible": true,
      "x": 100, "y": 90, "width": 500, "height": 20 
    },
    {
      "field": "check_date",
      "type": "data",
      "label": {"ar": "التاريخ", "en": "Date"},
      "source": "expense.expense_date",
      "visible": true,
      "x": 500, "y": 30, "width": 100, "height": 20 
    },
    {
      "field": "memo",
      "type": "data",
      "label": {"ar": "ملاحظات", "en": "Memo"},
      "source": "expense.notes",
      "visible": true,
      "x": 100, "y": 130, "width": 400, "height": 20 
    }
  ]
}
```

**شرح هيكل JSON للشيك:**
-   بالإضافة إلى الحقول المشابهة للفاتورة، يمكن إضافة إحداثيات (`x`, `y`, `width`, `height`) لتحديد موضع كل حقل على قالب الشيك المطبوع، مما يتيح محررًا مرئيًا للقالب.
-   يمكن استخدام وظائف مساعدة (مثل `convert_number_to_words`) للحقول المحسوبة.

## 9. تصميم التقارير المالية (Financial Reports Design)

ستعتمد التقارير المالية على استعلامات قاعدة البيانات المباشرة لجمع البيانات، ثم معالجتها وعرضها في الواجهة الأمامية. ميزة التصدير إلى Excel ستكون متاحة لجميع التقارير.

### 9.1. تقرير المصروفات (Expenses Report)
-   **البيانات:** `Expenses`، `ExpenseCategories`، `Users`.
-   **التصنيف:** حسب الفئة، التاريخ، المستخدم.
-   **الحقول:** تاريخ المصروف، الوصف، الفئة، المبلغ، المستخدم الذي سجله.

### 9.2. تقرير الإيرادات (Revenue Report)
-   **البيانات:** `Sales`، `Rentals`، `RentalPayments`.
-   **التصنيف:** حسب نوع الإيراد (مبيعات، إيجارات)، التاريخ.
-   **الحقول:** تاريخ المعاملة، نوع المعاملة، الوصف، المبلغ، العميل/المستأجر.

### 9.3. تقرير الأرباح والخسائر المبسط (Simplified Profit & Loss Report)
-   **البيانات:** تجميع من `Sales` (صافي إيرادات الشركة)، `Expenses`، `FinishingWorks` (التكلفة الفعلية).
-   **الحقول:** إجمالي الإيرادات، إجمالي المصروفات، صافي الربح/الخسارة.
-   يمكن للمسؤول تحديد الفترة الزمنية للتقرير.

## 10. هيكل مجلدات المشروع المقترح (Proposed Project Folder Structure)

للحفاظ على تنظيم المشروع، سيتم تقسيم الواجهة الخلفية والواجهة الأمامية إلى مجلدات منفصلة.

```
/broman_real_estate_app
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── models.py         # تعريفات SQLAlchemy للكيانات
│   │   ├── routes/           # وحدات API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── units.py
│   │   │   ├── sales.py
│   │   │   ├── expenses.py
│   │   │   ├── rentals.py
│   │   │   ├── finishing_works.py
│   │   │   ├── settings.py     # لإدارة FinancialSettings و Templates
│   │   │   ├── reports.py
│   │   │   └── cashier.py
│   │   ├── services/         # منطق العمل (business logic)
│   │   │   ├── __init__.py
│   │   │   ├── calculation_service.py # لحساب العمولات والضرائب
│   │   │   ├── report_service.py
│   │   │   └── template_renderer.py # لتوليد الفواتير والشيكات
│   │   ├── utils/            # وظائف مساعدة (مثل JWT, i18n)
│   │   │   ├── __init__.py
│   │   │   ├── auth_helper.py
│   │   │   └── i18n.py
│   │   └── templates/        # قوالب HTML (إذا لزم الأمر لبعض المخرجات)
│   ├── migrations/         # ملفات ترحيل قاعدة البيانات (Alembic)
│   ├── tests/
│   ├── venv/
│   ├── .env
│   ├── requirements.txt
│   └── run.py              # نقطة دخول التطبيق
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   ├── Units/
│   │   │   ├── Sales/
│   │   │   ├── Expenses/
│   │   │   ├── Rentals/
│   │   │   ├── FinishingWorks/
│   │   │   ├── Settings/
│   │   │   ├── Reports/
│   │   │   └── InvoicesChecks/
│   │   ├── services/         # لربط الـ APIs
│   │   ├── store/            # لإدارة الحالة (Redux/Context)
│   │   ├── styles/
│   │   ├── translations/     # ملفات الترجمة (ar.json, en.json)
│   │   ├── App.js
│   │   ├── index.js
│   │   └── i18n.js
│   ├── .env
│   ├── package.json
│   └── README.md
├── .gitignore
├── README.md
└── todo.md
```

## 11. الخلاصة

يوفر هذا التصميم هيكلاً قويًا ومرنًا لتطبيق Broman Real Estate المحاسبي. من خلال فصل الواجهة الأمامية والخلفية، واستخدام قاعدة بيانات منظمة، والأهم من ذلك، تمكين التخصيص الديناميكي من خلال لوحة تحكم المسؤول، يمكننا بناء تطبيق يلبي المتطلبات الحالية ويكون قابلاً للتوسع والصيانة في المستقبل. الخطوة التالية هي البدء في إعداد البيئة التقنية وإنشاء هياكل المشروع الفعلية.

