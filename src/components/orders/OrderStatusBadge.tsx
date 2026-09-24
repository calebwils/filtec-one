import React from 'react';
import { OrderStatus } from '@/types';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case 'PENDING_ADMIN_APPROVAL':
    case 'SUBMITTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
          Created
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-neutral-100 text-neutral-800 border border-neutral-200">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-600"></span>
          Completed
        </span>
      );
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-500"></span>
          Confirmed
        </span>
      );
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
          Approved
        </span>
      );
    case 'SENT_TO_ERP':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
          Sent to ERP
        </span>
      );
    case 'PROCESSING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
          Processing
        </span>
      );
    case 'INVOICED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
          Invoiced
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
          Rejected
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-neutral-100 text-neutral-500 border border-neutral-200 line-through">
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
          Draft
        </span>
      );
  }
}
