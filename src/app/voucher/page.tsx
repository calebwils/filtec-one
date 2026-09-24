import { Suspense } from 'react';
import VirtualCardPage from './[id]/page';

export default function VoucherIndexPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F172A]" />}>
      <VirtualCardPage />
    </Suspense>
  );
}
