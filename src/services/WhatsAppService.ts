import { WhatsAppMessage } from '@/types';

export interface IWhatsAppService {
  sendMessage(toPhone: string, recipientName: string, template: string, params: Record<string, string>): Promise<WhatsAppMessage>;
}

export class MockWhatsAppService implements IWhatsAppService {
  async sendMessage(
    toPhone: string,
    recipientName: string,
    template: string,
    params: Record<string, string>
  ): Promise<WhatsAppMessage> {
    let body = `FILTEC Notification for ${recipientName}: [Template: ${template}]`;

    if (template === 'order_submitted') {
      body = `FILTEC Polyplast: Order ${params.orderNumber} for ₹${params.amount} was received and is pending central review.`;
    } else if (template === 'order_approved') {
      body = `FILTEC Polyplast: Great news! Order ${params.orderNumber} is APPROVED. Invoice: ${params.invoiceNumber}. Reward credited: ₹${params.reward}.`;
    } else if (template === 'order_rejected') {
      body = `FILTEC Polyplast: Order ${params.orderNumber} could not be approved. Reason: ${params.reason}.`;
    } else if (template === 'reward_credited') {
      body = `FILTEC Rewards: ₹${params.points} credited to your reward ledger. Balance: ₹${params.balance}.`;
    }

    const message: WhatsAppMessage = {
      id: `wa-${Date.now()}`,
      recipientPhone: toPhone,
      recipientName,
      templateName: template,
      messageBody: body,
      sentAt: new Date().toISOString(),
      status: 'DELIVERED'
    };

    return message;
  }
}

export const WhatsAppService: IWhatsAppService = new MockWhatsAppService();
