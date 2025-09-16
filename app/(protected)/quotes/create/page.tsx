'use client';
import { Suspense } from 'react';
import QuotesCreateInner from './QuotesCreateInner';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <QuotesCreateInner />
    </Suspense>
  );
}
