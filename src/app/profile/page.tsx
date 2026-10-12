'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/data/store';

export default function GenericProfileRedirectPage() {
  const router = useRouter();
  const { currentUser } = useAppStore();

  useEffect(() => {
    if (!currentUser || (currentUser as any).isGuest) {
      router.replace('/');
      return;
    }

    if (currentUser.role === 'ADMIN') {
      router.replace('/admin/profile');
    } else if (currentUser.role === 'EMPLOYEE') {
      router.replace('/employee/profile');
    } else if (currentUser.role === 'DEALER') {
      router.replace('/dealer/profile');
    } else {
      router.replace('/');
    }
  }, [currentUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
      <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
        <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-ping" />
        <span>Loading profile...</span>
      </div>
    </div>
  );
}
