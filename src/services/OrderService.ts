import { Order, OrderItem, OrderStatus, RewardConfig } from '@/types';
import { store } from '@/data/store';

export class OrderService {
  /**
   * Central state machine validation: checks if transition from current to next is valid
   */
  static isValidTransition(current: OrderStatus, next: OrderStatus): boolean {
    const validMap: Record<OrderStatus, OrderStatus[]> = {
      DRAFT: ['SUBMITTED', 'CANCELLED'],
      SUBMITTED: ['PENDING_ADMIN_APPROVAL', 'CANCELLED'],
      PENDING_ADMIN_APPROVAL: ['APPROVED', 'REJECTED', 'CANCELLED'],
      APPROVED: ['SENT_TO_ERP', 'CANCELLED'],
      SENT_TO_ERP: ['PROCESSING', 'CONFIRMED', 'CANCELLED'],
      PROCESSING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['INVOICED', 'COMPLETED'],
      INVOICED: ['COMPLETED'],
      COMPLETED: [],
      REJECTED: ['DRAFT'],
      CANCELLED: ['DRAFT']
    };

    return validMap[current]?.includes(next) ?? false;
  }

  static calculateOrderTotals(items: OrderItem[], rewardConfig: RewardConfig) {
    const subtotal = items.reduce((acc, i) => acc + i.totalAmount, 0);
    const gstAmount = Number((subtotal * 0.18).toFixed(2));
    const totalAmount = Number((subtotal + gstAmount).toFixed(2));

    const totalReward = Number(((subtotal * rewardConfig.ratePercent) / 100).toFixed(2));
    const dealerReward = Number(((totalReward * rewardConfig.dealerSharePercent) / 100).toFixed(2));
    const plumberReward = Number(((totalReward * rewardConfig.plumberSharePercent) / 100).toFixed(2));

    return {
      subtotal,
      gstAmount,
      totalAmount,
      totalReward,
      dealerReward,
      plumberReward
    };
  }

  static submitCartOrder() {
    return store.submitCurrentOrder();
  }

  static approveOrder(orderId: string, adminNotes?: string) {
    store.approveOrder(orderId, adminNotes);
  }

  static rejectOrder(orderId: string, reason: string) {
    store.rejectOrder(orderId, reason);
  }
}
