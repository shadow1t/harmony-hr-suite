

# خطة ترقية النظام إلى منصة B2B SaaS متعددة الشركات

## نظرة عامة

تحويل نظام HR الحالي (شركة واحدة) إلى منصة SaaS متعددة الشركات. سننفذ المرحلة 1 و 2 الآن (البنية التحتية + لوحة Super Admin).

---

## المرحلة 1: بنية Multi-Tenancy

### 1.1 تغييرات قاعدة البيانات (Migration)

```text
companies (جديد)
├── id, name_ar, name_en, logo_url
├── domain, subscription_plan, status
├── max_employees, created_at
│
profiles (تحديث)
├── + company_id → companies.id
├── + is_super_admin (boolean, default false)
│
كل الجداول الموجودة (تحديث)
├── employees + company_id
├── departments + company_id
├── branches + company_id
├── attendance + company_id
├── leave_requests + company_id
├── leave_balances + company_id
├── payroll + company_id
├── loans + company_id
├── job_postings + company_id
├── training_courses + company_id
├── training_enrollments + company_id
├── evaluation_cycles + company_id
├── evaluations + company_id
```

### 1.2 دوال أمان جديدة

- `get_user_company_id(uid)` -- SECURITY DEFINER function تُرجع company_id للمستخدم
- `is_super_admin(uid)` -- SECURITY DEFINER function تتحقق من is_super_admin

### 1.3 تحديث جميع سياسات RLS

كل سياسة SELECT/INSERT/UPDATE/DELETE ستتضمن شرط:
- `company_id = get_user_company_id(auth.uid())` للمستخدمين العاديين
- Super Admin يتجاوز شرط company_id

### 1.4 تحديث trigger الـ handle_new_user

عند تسجيل مستخدم جديد، يُنشئ شركة افتراضية جديدة ويربط profile بها.

---

## المرحلة 2: لوحة تحكم Super Admin

### 2.1 ملفات جديدة

```text
src/
├── components/
│   └── admin/
│       ├── AdminLayout.tsx        -- Layout خاص بـ /admin
│       ├── AdminSidebar.tsx       -- قائمة جانبية للـ admin
│       └── AdminProtectedRoute.tsx -- حماية بـ is_super_admin
├── pages/
│   └── admin/
│       ├── AdminDashboard.tsx     -- إحصائيات المنصة
│       └── TenantsManagement.tsx  -- إدارة الشركات
```

### 2.2 شاشة AdminDashboard

- إجمالي الشركات، إجمالي الموظفين، النشطة vs الموقوفة
- رسوم بيانية بـ Recharts (توزيع الباقات، نمو الشركات)

### 2.3 شاشة TenantsManagement

- جدول بجميع الشركات مع: الاسم، الباقة، عدد الموظفين، الحالة
- أزرار: تغيير الباقة، إيقاف/تفعيل الحساب

### 2.4 تحديث App.tsx

- إضافة routes جديدة تحت `/admin/*`
- AdminProtectedRoute يتحقق من `is_super_admin`

### 2.5 تحديث الكود الحالي

- تحديث جميع عمليات INSERT في الصفحات لتشمل `company_id`
- تحديث `useAuth` أو إضافة hook جديد `useCompany` لجلب company_id
- تحديث AppSidebar لإظهار اسم الشركة بدل "HR System"
- تعيين المستخدم الحالي كـ super_admin

---

## تفاصيل تقنية

### Security Functions (SQL)

```sql
-- جلب company_id للمستخدم
CREATE FUNCTION get_user_company_id(_user_id uuid) RETURNS uuid
  SECURITY DEFINER ...

-- التحقق من super admin
CREATE FUNCTION is_super_admin(_user_id uuid) RETURNS boolean
  SECURITY DEFINER ...
```

### نمط RLS الموحد لكل جدول

```sql
-- مثال: employees
DROP POLICY "..." ON employees;
CREATE POLICY "tenant_isolation" ON employees
  FOR ALL USING (
    company_id = get_user_company_id(auth.uid())
    OR is_super_admin(auth.uid())
  );
```

### ترتيب التنفيذ

1. Migration: إنشاء `companies` + إضافة `company_id` لكل الجداول + دوال أمان + RLS
2. إنشاء hook `useCompany` 
3. تحديث كل صفحات CRUD لتشمل company_id
4. بناء لوحة Super Admin (Layout + Dashboard + Tenants)
5. تحديث الـ routing في App.tsx
6. تحديث translations

