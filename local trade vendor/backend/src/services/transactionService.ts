import { prisma } from '../config/database';
import { Transaction, TransactionStatus, PaymentStatus, DeliveryStatus } from '@prisma/client';
import { CreateTransactionData, UpdateTransactionData, TransactionFilters } from '../types';

export class TransactionService {
  /**
   * Create a new transaction from an accepted negotiation
   */
  async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    // Get the negotiation details
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: data.negotiationId },
      include: {
        product: true,
      },
    });

    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    if (negotiation.status !== 'ACCEPTED') {
      throw new Error('Can only create transaction from accepted negotiation');
    }

    if (!negotiation.finalPrice) {
      throw new Error('Negotiation must have a final price');
    }

    // Check if transaction already exists for this negotiation
    const existingTransaction = await prisma.transaction.findUnique({
      where: { negotiationId: data.negotiationId },
    });

    if (existingTransaction) {
      throw new Error('Transaction already exists for this negotiation');
    }

    const quantity = data.quantity || 1;
    const agreedPrice = parseFloat(negotiation.finalPrice.toString());
    const totalAmount = agreedPrice * quantity;

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        negotiationId: data.negotiationId,
        buyerId: negotiation.buyerId,
        vendorId: negotiation.vendorId,
        productId: negotiation.productId,
        quantity,
        agreedPrice,
        totalAmount,
        currency: negotiation.product.currency,
        deliveryAddress: data.deliveryAddress || null,
        notes: data.notes,
        status: TransactionStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        deliveryStatus: DeliveryStatus.PENDING,
      },
      include: {
        negotiation: {
          include: {
            product: true,
          },
        },
        buyer: true,
        vendor: {
          include: {
            user: true,
          },
        },
        product: true,
      },
    });

    return transaction;
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { id },
      include: {
        negotiation: {
          include: {
            product: true,
          },
        },
        buyer: true,
        vendor: {
          include: {
            user: true,
          },
        },
        product: true,
      },
    });
  }

  /**
   * Get transaction by negotiation ID
   */
  async getTransactionByNegotiationId(negotiationId: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { negotiationId },
      include: {
        negotiation: {
          include: {
            product: true,
          },
        },
        buyer: true,
        vendor: {
          include: {
            user: true,
          },
        },
        product: true,
      },
    });
  }

  /**
   * Update transaction
   */
  async updateTransaction(id: string, data: UpdateTransactionData): Promise<Transaction> {
    const updateData: any = { ...data };

    // If status is being set to completed, set completedAt timestamp
    if (data.status === 'completed' && !data.completedAt) {
      updateData.completedAt = new Date();
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        negotiation: {
          include: {
            product: true,
          },
        },
        buyer: true,
        vendor: {
          include: {
            user: true,
          },
        },
        product: true,
      },
    });

    // If transaction is completed, update product inventory
    if (transaction.status === TransactionStatus.COMPLETED) {
      await this.updateInventoryOnCompletion(transaction);
    }

    return transaction;
  }

  /**
   * Get transactions with filters
   */
  async getTransactions(filters: TransactionFilters): Promise<Transaction[]> {
    const where: any = {};

    if (filters.buyerId) where.buyerId = filters.buyerId;
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.productId) where.productId = filters.productId;
    if (filters.status) where.status = filters.status.toUpperCase();
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus.toUpperCase();
    if (filters.deliveryStatus) where.deliveryStatus = filters.deliveryStatus.toUpperCase();

    return prisma.transaction.findMany({
      where,
      include: {
        negotiation: {
          include: {
            product: true,
          },
        },
        buyer: true,
        vendor: {
          include: {
            user: true,
          },
        },
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Process payment (placeholder for payment gateway integration)
   */
  async processPayment(
    transactionId: string,
    paymentMethod: string,
    paymentDetails?: any
  ): Promise<Transaction> {
    const transaction = await this.getTransactionById(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.paymentStatus !== PaymentStatus.PENDING) {
      throw new Error('Payment already processed');
    }

    // PLACEHOLDER: In production, integrate with payment gateway (Stripe, PayPal, etc.)
    // For now, we'll simulate successful payment
    console.log(`Processing payment for transaction ${transactionId} using ${paymentMethod}`);
    console.log(`Amount: ${transaction.totalAmount} ${transaction.currency}`);
    console.log('Payment details:', paymentDetails);

    // Simulate payment processing
    const paymentSuccessful = true; // In production, this would come from payment gateway

    if (paymentSuccessful) {
      return this.updateTransaction(transactionId, {
        paymentMethod,
        paymentStatus: 'captured',
        status: 'confirmed',
      });
    } else {
      return this.updateTransaction(transactionId, {
        paymentMethod,
        paymentStatus: 'failed',
        status: 'cancelled',
      });
    }
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(
    transactionId: string,
    deliveryStatus: DeliveryStatus,
    trackingNumber?: string
  ): Promise<Transaction> {
    const updateData: UpdateTransactionData = {
      deliveryStatus: deliveryStatus.toLowerCase() as any,
    };

    if (trackingNumber) {
      updateData.deliveryTracking = trackingNumber;
    }

    // If delivery is completed, mark transaction as processing
    if (deliveryStatus === DeliveryStatus.DELIVERED) {
      updateData.status = 'completed';
    }

    return this.updateTransaction(transactionId, updateData);
  }

  /**
   * Update inventory when transaction is completed
   */
  private async updateInventoryOnCompletion(transaction: Transaction): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id: transaction.productId },
    });

    if (!product) {
      console.error(`Product ${transaction.productId} not found for inventory update`);
      return;
    }

    if (product.quantityAvailable === null) {
      // Product doesn't track inventory
      return;
    }

    const newQuantity = Math.max(0, product.quantityAvailable - transaction.quantity);

    await prisma.product.update({
      where: { id: transaction.productId },
      data: {
        quantityAvailable: newQuantity,
      },
    });

    console.log(
      `Updated inventory for product ${transaction.productId}: ${product.quantityAvailable} -> ${newQuantity}`
    );

    // Update vendor's total sales
    await prisma.vendor.update({
      where: { id: transaction.vendorId },
      data: {
        totalSales: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction(transactionId: string, reason?: string): Promise<Transaction> {
    const transaction = await this.getTransactionById(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status === TransactionStatus.COMPLETED) {
      throw new Error('Cannot cancel completed transaction');
    }

    return this.updateTransaction(transactionId, {
      status: 'cancelled',
      disputeReason: reason,
    });
  }

  /**
   * Create dispute
   */
  async createDispute(transactionId: string, reason: string): Promise<Transaction> {
    const transaction = await this.getTransactionById(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status === TransactionStatus.COMPLETED) {
      throw new Error('Cannot dispute completed transaction');
    }

    return this.updateTransaction(transactionId, {
      status: 'disputed',
      disputeReason: reason,
    });
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(
    transactionId: string,
    resolution: 'refund' | 'continue'
  ): Promise<Transaction> {
    const transaction = await this.getTransactionById(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.DISPUTED) {
      throw new Error('Transaction is not in disputed state');
    }

    if (resolution === 'refund') {
      return this.updateTransaction(transactionId, {
        status: 'refunded',
        paymentStatus: 'refunded',
      });
    } else {
      return this.updateTransaction(transactionId, {
        status: 'confirmed',
      });
    }
  }

  /**
   * Get transaction statistics for a user
   */
  async getTransactionStats(
    userId: string,
    role: 'buyer' | 'vendor'
  ): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    disputed: number;
    totalRevenue: number;
  }> {
    const where = role === 'buyer' ? { buyerId: userId } : { vendorId: userId };

    const [total, pending, confirmed, completed, cancelled, disputed, transactions] =
      await Promise.all([
        prisma.transaction.count({ where }),
        prisma.transaction.count({ where: { ...where, status: TransactionStatus.PENDING } }),
        prisma.transaction.count({ where: { ...where, status: TransactionStatus.CONFIRMED } }),
        prisma.transaction.count({ where: { ...where, status: TransactionStatus.COMPLETED } }),
        prisma.transaction.count({ where: { ...where, status: TransactionStatus.CANCELLED } }),
        prisma.transaction.count({ where: { ...where, status: TransactionStatus.DISPUTED } }),
        prisma.transaction.findMany({
          where: { ...where, status: TransactionStatus.COMPLETED },
          select: { totalAmount: true },
        }),
      ]);

    const totalRevenue = transactions.reduce(
      (sum, t) => sum + parseFloat(t.totalAmount.toString()),
      0
    );

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      disputed,
      totalRevenue,
    };
  }
}

export const transactionService = new TransactionService();
