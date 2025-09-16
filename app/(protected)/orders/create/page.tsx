'use client';
import { Suspense } from 'react';
import OrdersCreateInner from './OrdersCreateInner';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OrdersCreateInner />
    </Suspense>
  );
} 
