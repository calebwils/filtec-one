'use client';

import React from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { ProfilePageContent } from '@/components/profile/ProfilePageContent';

export default function DealerProfilePage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Dealer Profile" subtitle="Business & Account Details" />
      <DesktopSubNav />
      <main>
        <ProfilePageContent />
      </main>
      <MobileBottomNav />
    </div>
  );
}
