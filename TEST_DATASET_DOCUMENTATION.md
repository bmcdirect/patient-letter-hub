# Clean Test Dataset Documentation

## Overview
This document describes the clean test dataset created for testing role-based access control and practice-specific functionality in the PatientLetterHub application.

## Dataset Structure

### Practices (5 total)
1. **Sunrise Family Dentistry** (Austin, TX)
   - Address: 123 Main Street, Suite 200, Austin, TX 78701
   - Phone: (512) 555-0101
   - Email: info@sunrisedental.com
   - Type: Dental Practice

2. **Coastal Pediatrics** (San Diego, CA)
   - Address: 456 Ocean Drive, San Diego, CA 92101
   - Phone: (619) 555-0202
   - Email: contact@coastalpediatrics.com
   - Type: Pediatric Practice

3. **Mountain View Orthodontics** (Denver, CO)
   - Address: 789 Pine Avenue, Building B, Denver, CO 80202
   - Phone: (303) 555-0303
   - Email: hello@mountainviewortho.com
   - Type: Orthodontic Practice

4. **Riverside Medical Group** (Portland, OR)
   - Address: 321 River Road, Medical Plaza, Portland, OR 97201
   - Phone: (503) 555-0404
   - Email: admin@riversidemedical.com
   - Type: Family Medicine Practice

5. **Downtown Dermatology** (Chicago, IL)
   - Address: 555 Business Blvd, Floor 15, Chicago, IL 60601
   - Phone: (312) 555-0505
   - Email: appointments@downtownderm.com
   - Type: Dermatology Practice

### Users (5 total)

#### Admin User (1)
- **Super Admin** (superadmin@patientletterhub.com)
  - Role: ADMIN
  - Access: All practices (practiceId: null)
  - Title: System Administrator
  - NPI: 1234567890
  - Clerk ID: user_331Upywb1e4bTSvPTW1ULTPPr02J

#### Regular Users (4)
1. **Dr. Sarah Smith** (dr.smith@sunrisedental.com)
   - Role: USER
   - Practice: Sunrise Family Dentistry
   - Title: Dentist
   - NPI: 1111111111
   - Clerk ID: user_331UudkqVvf9ZSTdpyPGSG1ckoi

2. **Dr. Michael Johnson** (dr.johnson@coastalpediatrics.com)
   - Role: USER
   - Practice: Coastal Pediatrics
   - Title: Pediatrician
   - NPI: 2222222222
   - Clerk ID: user_331UznDcm8bhaYZKMv2uhd3pKfA

3. **Dr. Emily Williams** (dr.williams@mountainviewortho.com)
   - Role: USER
   - Practice: Mountain View Orthodontics
   - Title: Orthodontist
   - NPI: 3333333333
   - Clerk ID: user_331V3jNNzHunf6XOgym0bNnSftS

4. **Dr. Robert Brown** (dr.brown@riversidemedical.com)
   - Role: USER
   - Practice: Riverside Medical Group
   - Title: Family Physician
   - NPI: 4444444444
   - Clerk ID: user_331V6obG4VUBXCQ4tfRIPWvXtTM

## Role-Based Access Control

### Admin User Permissions
- Can view all practices and their data
- Can access `/admin` page
- Can see all quotes and orders across all practices
- Can manage users and practices

### Regular User Permissions
- Can only view their assigned practice
- Can only see quotes and orders for their practice
- Cannot access `/admin` page
- Cannot view other practices' data

## Testing Scenarios

### 1. Admin Access Testing
- Login as superadmin@patientletterhub.com
- Verify access to `/admin` page
- Verify ability to see all practices
- Verify ability to see all quotes/orders

### 2. Practice-Specific Access Testing
- Login as each regular user
- Verify they only see their practice's data
- Verify they cannot access `/admin` page
- Verify they cannot see other practices' data

### 3. Multi-Tenancy Testing
- Create quotes/orders for different practices
- Verify data isolation between practices
- Verify proper filtering in API responses

## Clerk Synchronization ✅ COMPLETED

### Clerk Users Created
The following users have been created in Clerk and synchronized with the database:

1. **superadmin@patientletterhub.com** → `user_331Upywb1e4bTSvPTW1ULTPPr02J`
2. **dr.smith@sunrisedental.com** → `user_331UudkqVvf9ZSTdpyPGSG1ckoi`
3. **dr.johnson@coastalpediatrics.com** → `user_331UznDcm8bhaYZKMv2uhd3pKfA`
4. **dr.williams@mountainviewortho.com** → `user_331V3jNNzHunf6XOgym0bNnSftS`
5. **dr.brown@riversidemedical.com** → `user_331V6obG4VUBXCQ4tfRIPWvXtTM`

### ✅ Sync Status
- ✅ Users created in Clerk dashboard
- ✅ Clerk IDs synchronized with database
- ✅ Ready for authentication testing

## Database Schema Notes

- ✅ All users now have valid Clerk IDs synchronized
- Admin user has `practiceId: null` (access to all practices)
- Regular users have specific `practiceId` values
- All practices have complete address and contact information
- All users have realistic NPI numbers and taxonomy codes

## Next Steps ✅ READY FOR TESTING

1. ✅ Create corresponding users in Clerk development environment
2. ✅ Run Clerk sync script to link Clerk IDs
3. **🎯 Test authentication flows** - Ready to test with any of the 5 users
4. **🎯 Test role-based access control** - Admin vs regular user permissions
5. **🎯 Test practice-specific data filtering** - Multi-tenancy functionality
