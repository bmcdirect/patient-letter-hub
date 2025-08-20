-- Export Current Database State for BACKUP_8_20_2025_2_30pm_EST
-- Run this script to capture the exact current state of your database
-- This can be used to restore to this exact point later

-- Export practices
SELECT '-- Practices' as comment;
SELECT 'INSERT INTO "practices" ("id", "name", "address", "phone", "email", "createdAt", "updatedAt", "organizationId") VALUES' as sql_start;
SELECT '  (''' || id || ''', ''' || name || ''', ''' || address || ''', ''' || phone || ''', ''' || email || ''', ''' || "createdAt" || ''', ''' || "updatedAt" || ''', ''' || "organizationId" || ''')' || 
       CASE WHEN ROW_NUMBER() OVER (ORDER BY id) < COUNT(*) OVER () THEN ',' ELSE ';' END as sql_values
FROM "practices"
ORDER BY id;

-- Export users
SELECT '-- Users' as comment;
SELECT 'INSERT INTO "users" ("id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt", "role", "stripeCustomerId", "stripeSubscriptionId", "stripePriceId", "stripeCurrentPeriodEnd", "practiceId", "clerkId") VALUES' as sql_start;
SELECT '  (''' || id || ''', ''' || name || ''', ''' || email || ''', ' || 
       COALESCE('''' || "emailVerified" || '''', 'NULL') || ', ' ||
       COALESCE('''' || image || '''', 'NULL') || ', ''' || "createdAt" || ''', ''' || "updatedAt" || ''', ''' || role || ''', ' ||
       COALESCE('''' || "stripeCustomerId" || '''', 'NULL') || ', ' ||
       COALESCE('''' || "stripeSubscriptionId" || '''', 'NULL') || ', ' ||
       COALESCE('''' || "stripePriceId" || '''', 'NULL') || ', ' ||
       COALESCE('''' || "stripeCurrentPeriodEnd" || '''', 'NULL') || ', ' ||
       COALESCE('''' || "practiceId" || '''', 'NULL') || ', ''' || "clerkId" || ''')' ||
       CASE WHEN ROW_NUMBER() OVER (ORDER BY id) < COUNT(*) OVER () THEN ',' ELSE ';' END as sql_values
FROM "users"
ORDER BY id;

-- Export quotes
SELECT '-- Quotes' as comment;
SELECT 'INSERT INTO "quotes" ("id", "quoteNumber", "subject", "templateType", "colorMode", "cost", "status", "practiceId", "userId", "createdAt", "updatedAt") VALUES' as sql_start;
SELECT '  (''' || id || ''', ''' || "quoteNumber" || ''', ''' || subject || ''', ' ||
       COALESCE('''' || "templateType" || '''', 'NULL') || ', ' ||
       COALESCE('''' || "colorMode" || '''', 'NULL') || ', ' ||
       COALESCE(cost::text, 'NULL') || ', ''' || status || ''', ''' || "practiceId" || ''', ''' || "userId" || ''', ''' || "createdAt" || ''', ''' || "updatedAt" || ''')' ||
       CASE WHEN ROW_NUMBER() OVER (ORDER BY id) < COUNT(*) OVER () THEN ',' ELSE ';' END as sql_values
FROM "quotes"
ORDER BY id;

-- Export orders
SELECT '-- Orders' as comment;
SELECT 'INSERT INTO "orders" ("id", "orderNumber", "subject", "templateType", "colorMode", "cost", "status", "practiceId", "userId", "createdAt", "updatedAt") VALUES' as sql_start;
SELECT '  (''' || id || ''', ''' || "orderNumber" || ''', ''' || subject || ''', ' ||
       COALESCE('''' || "templateType" || '''', 'NULL') || ', ' ||
       COALESCE('''' || "colorMode" || '''', 'NULL') || ', ' ||
       COALESCE(cost::text, 'NULL') || ', ''' || status || ''', ''' || "practiceId" || ''', ''' || "userId" || ''', ''' || "createdAt" || ''', ''' || "updatedAt" || ''')' ||
       CASE WHEN ROW_NUMBER() OVER (ORDER BY id) < COUNT(*) OVER () THEN ',' ELSE ';' END as sql_values
FROM "orders"
ORDER BY id;

-- Export order files
SELECT '-- Order Files' as comment;
SELECT 'INSERT INTO "orderFiles" ("id", "orderId", "fileName", "filePath", "fileSize", "uploadedBy", "createdAt") VALUES' as sql_start;
SELECT '  (''' || id || ''', ''' || "orderId" || ''', ''' || "fileName" || ''', ''' || "filePath" || ''', ' ||
       COALESCE("fileSize"::text, 'NULL') || ', ''' || "uploadedBy" || ''', ''' || "createdAt" || ''')' ||
       CASE WHEN ROW_NUMBER() OVER (ORDER BY id) < COUNT(*) OVER () THEN ',' ELSE ';' END as sql_values
FROM "orderFiles"
ORDER BY id;

-- Export order approvals
SELECT '-- Order Approvals' as comment;
SELECT 'INSERT INTO "orderApprovals" ("id", "orderId", "revision", "status", "comments", "approvedBy", "filePath", "createdAt") VALUES' as sql_start;
SELECT '  (''' || id || ''', ''' || "orderId" || ''', ' || revision || ', ''' || status || ''', ' ||
       COALESCE('''' || comments || '''', 'NULL') || ', ''' || "approvedBy" || ''', ' ||
       COALESCE('''' || "filePath" || '''', 'NULL') || ', ''' || "createdAt" || ''')' ||
       CASE WHEN ROW_NUMBER() OVER (ORDER BY id) < COUNT(*) OVER () THEN ',' ELSE ';' END as sql_values
FROM "orderApprovals"
ORDER BY id;

-- Export status history
SELECT '-- Status History' as comment;
SELECT 'INSERT INTO "orderStatusHistory" ("id", "orderId", "fromStatus", "toStatus", "changedBy", "changedByRole", "comments", "metadata", "createdAt") VALUES' as sql_start;
SELECT '  (''' || id || ''', ''' || "orderId" || ''', ''' || "fromStatus" || ''', ''' || "toStatus" || ''', ''' || "changedBy" || ''', ''' || "changedByRole" || ''', ' ||
       COALESCE('''' || comments || '''', 'NULL') || ', ' ||
       COALESCE('''' || metadata::text || '''', 'NULL') || ', ''' || "createdAt" || ''')' ||
       CASE WHEN ROW_NUMBER() OVER (ORDER BY id) < COUNT(*) OVER () THEN ',' ELSE ';' END as sql_values
FROM "orderStatusHistory"
ORDER BY id;

-- Summary counts
SELECT '-- Summary Counts' as comment;
SELECT 'Practices: ' || COUNT(*) as count FROM "practices"
UNION ALL
SELECT 'Users: ' || COUNT(*) as count FROM "users"
UNION ALL
SELECT 'Quotes: ' || COUNT(*) as count FROM "quotes"
UNION ALL
SELECT 'Orders: ' || COUNT(*) as count FROM "orders"
UNION ALL
SELECT 'Order Files: ' || COUNT(*) as count FROM "orderFiles"
UNION ALL
SELECT 'Order Approvals: ' || COUNT(*) as count FROM "orderApprovals"
UNION ALL
SELECT 'Status History: ' || COUNT(*) as count FROM "orderStatusHistory";
