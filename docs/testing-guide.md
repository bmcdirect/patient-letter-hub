# Complete Proofing Workflow Testing Guide

## 🎯 Testing Setup Summary

### ✅ **User Configuration Complete**

**SuperAdmin Account:**
- **Email**: `superadmin@masscomminc.com`
- **Role**: `ADMIN` (SuperAdmin - no practice assignment)
- **Access**: `/admin` dashboard
- **Capabilities**: View all orders from all practices, process proofs, manage status

**Practice User Account:**
- **Email**: `daves@masscomminc.com`
- **Role**: `USER` (Riverside Family Medicine practice)
- **Access**: `/dashboard`
- **Capabilities**: View only Riverside orders, create orders, upload files, approve proofs

**Practice Admin Accounts:**
- **Email**: `admin.riverside@riversidefamilymedicine.com`
- **Role**: `ADMIN` (Riverside Family Medicine practice)
- **Access**: `/admin` (practice-scoped)
- **Capabilities**: View and manage Riverside orders

- **Email**: `admin.brightsmiles@brightsmilesdental.com`
- **Role**: `ADMIN` (Bright Smiles Dental practice)
- **Access**: `/admin` (practice-scoped)
- **Capabilities**: View and manage Bright Smiles orders

## 🧪 **End-to-End Testing Scenarios**

### **Scenario 1: SuperAdmin Workflow**

**Objective**: Test SuperAdmin access to all practice data and admin capabilities

**Steps:**
1. **Login**: Use `superadmin@masscomminc.com`
2. **Access Admin Dashboard**: Navigate to `/admin`
3. **Verify Multi-Tenant Access**: 
   - Should see orders from both Riverside Family Medicine and Bright Smiles Dental
   - Should see all users from both practices
4. **Test Order Processing**:
   - Select an order from Riverside Family Medicine
   - Change status from "pending" to "in-progress"
   - Upload admin proof files
   - Send proof to customer for approval
5. **Test Order Management**:
   - Verify can manage orders from both practices
   - Verify can upload proofs for any order
   - Verify can change status for any order

**Expected Results:**
- ✅ Can access `/admin` dashboard
- ✅ Can see all orders from both practices
- ✅ Can process orders from any practice
- ✅ Can upload proof files for any order
- ✅ Can manage status for any order

### **Scenario 2: Riverside Practice User Workflow**

**Objective**: Test customer workflow for Riverside Family Medicine practice user

**Steps:**
1. **Login**: Use `daves@masscomminc.com`
2. **Access Dashboard**: Navigate to `/dashboard`
3. **Verify Practice Isolation**:
   - Should only see Riverside Family Medicine data
   - Should not see Bright Smiles Dental data
4. **Create New Quote**:
   - Navigate to `/quotes/create`
   - Fill out quote form with practice information pre-populated
   - Upload customer files (PDF letter + CSV data)
   - Submit quote
5. **Convert Quote to Order**:
   - Navigate to `/quotes`
   - Find the created quote
   - Click "Convert to Order"
   - Verify order appears in `/orders`
6. **Test File Upload**:
   - Navigate to `/file-upload`
   - Upload additional files for the order
   - Verify files are associated with the order

**Expected Results:**
- ✅ Can only see Riverside Family Medicine data
- ✅ Practice information is pre-populated in forms
- ✅ Can create quotes and orders
- ✅ Can upload customer files
- ✅ Can convert quotes to orders

### **Scenario 3: Proof Review Workflow**

**Objective**: Test the complete proof review and approval process

**Steps:**
1. **Login as SuperAdmin**: Use `superadmin@masscomminc.com`
2. **Upload Proof Files**:
   - Navigate to `/admin`
   - Select an order from Riverside Family Medicine
   - Upload admin proof files (PDF proofs)
   - Change status to "waiting-approval"
3. **Login as Practice User**: Use `daves@masscomminc.com`
4. **Review Proof**:
   - Navigate to `/orders`
   - Find the order with "waiting-approval" status
   - Click on the order to view details
   - Access proof review page (`/orders/[id]/proof-review`)
   - Review uploaded proof files
5. **Approve or Request Changes**:
   - Approve the proof or request changes
   - Add approval comments if needed
   - Submit approval decision

**Expected Results:**
- ✅ SuperAdmin can upload proof files
- ✅ Practice user receives notification of proof ready
- ✅ Practice user can access proof review page
- ✅ Practice user can approve or request changes
- ✅ Status updates correctly based on approval decision

### **Scenario 4: Multi-Tenant Isolation Testing**

**Objective**: Verify complete data isolation between practices

**Steps:**
1. **Test Riverside User Isolation**:
   - Login as `daves@masscomminc.com` (Riverside practice)
   - Navigate to `/orders`
   - Verify only sees Riverside orders
   - Navigate to `/quotes`
   - Verify only sees Riverside quotes
2. **Test Bright Smiles User Isolation**:
   - Login as `admin.brightsmiles@brightsmilesdental.com` (Bright Smiles practice)
   - Navigate to `/admin`
   - Verify only sees Bright Smiles orders
   - Verify cannot see Riverside orders
3. **Test SuperAdmin Access**:
   - Login as `superadmin@masscomminc.com`
   - Navigate to `/admin`
   - Verify can see orders from both practices
   - Verify can process orders from both practices

**Expected Results:**
- ✅ Riverside users only see Riverside data
- ✅ Bright Smiles users only see Bright Smiles data
- ✅ SuperAdmin can see and manage all data
- ✅ No cross-practice data leakage

## 🔍 **Testing Checklist**

### **Pre-Testing Setup**
- [ ] Create `superadmin@masscomminc.com` in Clerk dashboard
- [ ] Verify all practice users exist in Clerk dashboard
- [ ] Ensure development server is running on `http://localhost:3002`
- [ ] Clear browser cache and cookies for fresh testing

### **Authentication Testing**
- [ ] Test login with `superadmin@masscomminc.com`
- [ ] Test login with `daves@masscomminc.com`
- [ ] Test login with `admin.riverside@riversidefamilymedicine.com`
- [ ] Test login with `admin.brightsmiles@brightsmilesdental.com`
- [ ] Verify proper role-based redirects

### **Customer Workflow Testing**
- [ ] Create new quote as Riverside practice user
- [ ] Upload customer files (PDF + CSV)
- [ ] Convert quote to order
- [ ] Verify order appears in orders list
- [ ] Test file upload functionality
- [ ] Verify practice information pre-population

### **Admin Workflow Testing**
- [ ] Access admin dashboard as SuperAdmin
- [ ] View all orders from both practices
- [ ] Process orders (change status)
- [ ] Upload admin proof files
- [ ] Send proofs for customer approval
- [ ] Test order management features

### **Proof Review Testing**
- [ ] Upload proof files as SuperAdmin
- [ ] Change order status to "waiting-approval"
- [ ] Access proof review as practice user
- [ ] Review uploaded proof files
- [ ] Approve or request changes
- [ ] Verify status updates correctly

### **Multi-Tenant Isolation Testing**
- [ ] Verify Riverside users only see Riverside data
- [ ] Verify Bright Smiles users only see Bright Smiles data
- [ ] Verify SuperAdmin can see all data
- [ ] Test cross-practice data access prevention

### **Error Handling Testing**
- [ ] Test invalid file uploads
- [ ] Test unauthorized access attempts
- [ ] Test network error scenarios
- [ ] Test form validation errors

## 🐛 **Common Issues and Solutions**

### **Authentication Issues**
**Problem**: User cannot login
**Solution**: 
- Verify user exists in Clerk dashboard
- Check email address spelling
- Clear browser cache and cookies
- Verify Clerk environment variables are set

### **Role Access Issues**
**Problem**: User cannot access admin features
**Solution**:
- Verify user role is set to `ADMIN` in database
- Check if user has `practiceId` (SuperAdmin should not have one)
- Verify admin layout middleware is working

### **Data Isolation Issues**
**Problem**: User can see data from other practices
**Solution**:
- Verify `practiceId` is correctly set in database
- Check API queries include proper tenant filtering
- Verify middleware is enforcing tenant isolation

### **File Upload Issues**
**Problem**: Files not uploading or not associated with orders
**Solution**:
- Check file size limits
- Verify file types are allowed
- Check upload directory permissions
- Verify order ID is correctly passed

## 📊 **Testing Results Template**

### **Test Session Summary**
```
Date: [Date]
Tester: [Name]
Environment: Development (localhost:3002)

Test Results:
- [ ] SuperAdmin Access: ✅/❌
- [ ] Practice User Isolation: ✅/❌
- [ ] Quote Creation: ✅/❌
- [ ] Order Conversion: ✅/❌
- [ ] File Upload: ✅/❌
- [ ] Proof Review: ✅/❌
- [ ] Multi-Tenant Isolation: ✅/❌
- [ ] Error Handling: ✅/❌

Issues Found:
1. [Issue description]
2. [Issue description]

Recommendations:
1. [Recommendation]
2. [Recommendation]
```

## 🚀 **Next Steps After Testing**

1. **Document Issues**: Record any issues found during testing
2. **Fix Critical Issues**: Address any blocking issues before proceeding
3. **Performance Testing**: Test with larger datasets if needed
4. **Security Testing**: Verify all security measures are working
5. **User Acceptance Testing**: Have actual users test the workflow
6. **Production Deployment**: Deploy to production environment

## 📞 **Support Contacts**

- **Technical Issues**: [Your contact information]
- **Clerk Authentication**: Check Clerk dashboard documentation
- **Database Issues**: Check Prisma documentation
- **Application Issues**: Check Next.js documentation
