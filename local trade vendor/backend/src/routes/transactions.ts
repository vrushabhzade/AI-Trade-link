import express from 'express';
import { transactionService } from '../services/transactionService';
import { authenticate } from '../middleware/auth';
import { CreateTransactionData, UpdateTransactionData, TransactionFilters } from '../types';

const router = express.Router();

/**
 * Create a new transaction from an accepted negotiation
 * POST /api/transactions
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const data: CreateTransactionData = req.body;
    const transaction = await transactionService.createTransaction(data);

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'TRANSACTION_CREATE_ERROR',
        message: error.message || 'Failed to create transaction',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get transaction by ID
 * GET /api/transactions/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await transactionService.getTransactionById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check authorization - user must be buyer or vendor
    if (
      transaction.buyerId !== req.user!.id &&
      transaction.vendorId !== req.user!.id
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized to view this transaction',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRANSACTION_FETCH_ERROR',
        message: 'Failed to fetch transaction',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get transaction by negotiation ID
 * GET /api/transactions/negotiation/:negotiationId
 */
router.get('/negotiation/:negotiationId', authenticate, async (req, res) => {
  try {
    const { negotiationId } = req.params;
    const transaction = await transactionService.getTransactionByNegotiationId(negotiationId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found for this negotiation',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check authorization
    if (
      transaction.buyerId !== req.user!.id &&
      transaction.vendorId !== req.user!.id
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized to view this transaction',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRANSACTION_FETCH_ERROR',
        message: 'Failed to fetch transaction',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get transactions with filters
 * GET /api/transactions
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const filters: TransactionFilters = {
      buyerId: req.query.buyerId as string,
      vendorId: req.query.vendorId as string,
      productId: req.query.productId as string,
      status: req.query.status as any,
      paymentStatus: req.query.paymentStatus as any,
      deliveryStatus: req.query.deliveryStatus as any,
    };

    // Users can only see their own transactions
    if (req.user!.role === 'buyer') {
      filters.buyerId = req.user!.id;
    } else if (req.user!.role === 'vendor') {
      // Get vendor ID for the user
      const vendor = await require('../config/database').prisma.vendor.findUnique({
        where: { userId: req.user!.id },
      });
      if (vendor) {
        filters.vendorId = vendor.id;
      }
    }

    const transactions = await transactionService.getTransactions(filters);

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRANSACTIONS_FETCH_ERROR',
        message: 'Failed to fetch transactions',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Update transaction
 * PATCH /api/transactions/:id
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const data: UpdateTransactionData = req.body;

    // Get transaction to check authorization
    const existingTransaction = await transactionService.getTransactionById(id);
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check authorization
    if (
      existingTransaction.buyerId !== req.user!.id &&
      existingTransaction.vendorId !== req.user!.id
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized to update this transaction',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const transaction = await transactionService.updateTransaction(id, data);

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'TRANSACTION_UPDATE_ERROR',
        message: error.message || 'Failed to update transaction',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Process payment for transaction
 * POST /api/transactions/:id/payment
 */
router.post('/:id/payment', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentDetails } = req.body;

    // Get transaction to check authorization
    const existingTransaction = await transactionService.getTransactionById(id);
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Only buyer can process payment
    if (existingTransaction.buyerId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only the buyer can process payment',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const transaction = await transactionService.processPayment(
      id,
      paymentMethod,
      paymentDetails
    );

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Error processing payment:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'PAYMENT_PROCESSING_ERROR',
        message: error.message || 'Failed to process payment',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Update delivery status
 * POST /api/transactions/:id/delivery
 */
router.post('/:id/delivery', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryStatus, trackingNumber } = req.body;

    // Get transaction to check authorization
    const existingTransaction = await transactionService.getTransactionById(id);
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Only vendor can update delivery status
    if (existingTransaction.vendorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only the vendor can update delivery status',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const transaction = await transactionService.updateDeliveryStatus(
      id,
      deliveryStatus,
      trackingNumber
    );

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Error updating delivery status:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'DELIVERY_UPDATE_ERROR',
        message: error.message || 'Failed to update delivery status',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Cancel transaction
 * POST /api/transactions/:id/cancel
 */
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Get transaction to check authorization
    const existingTransaction = await transactionService.getTransactionById(id);
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Both buyer and vendor can cancel
    if (
      existingTransaction.buyerId !== req.user!.id &&
      existingTransaction.vendorId !== req.user!.id
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized to cancel this transaction',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const transaction = await transactionService.cancelTransaction(id, reason);

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Error cancelling transaction:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'TRANSACTION_CANCEL_ERROR',
        message: error.message || 'Failed to cancel transaction',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Create dispute
 * POST /api/transactions/:id/dispute
 */
router.post('/:id/dispute', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REASON',
          message: 'Dispute reason is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Get transaction to check authorization
    const existingTransaction = await transactionService.getTransactionById(id);
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Both buyer and vendor can create disputes
    if (
      existingTransaction.buyerId !== req.user!.id &&
      existingTransaction.vendorId !== req.user!.id
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized to dispute this transaction',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const transaction = await transactionService.createDispute(id, reason);

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Error creating dispute:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'DISPUTE_CREATE_ERROR',
        message: error.message || 'Failed to create dispute',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Resolve dispute
 * POST /api/transactions/:id/dispute/resolve
 */
router.post('/:id/dispute/resolve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    if (!resolution || !['refund', 'continue'].includes(resolution)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RESOLUTION',
          message: 'Resolution must be either "refund" or "continue"',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Get transaction to check authorization
    const existingTransaction = await transactionService.getTransactionById(id);
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Only admin can resolve disputes (for now, allow both parties)
    if (
      existingTransaction.buyerId !== req.user!.id &&
      existingTransaction.vendorId !== req.user!.id &&
      req.user!.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized to resolve this dispute',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const transaction = await transactionService.resolveDispute(id, resolution);

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Error resolving dispute:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'DISPUTE_RESOLVE_ERROR',
        message: error.message || 'Failed to resolve dispute',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get transaction statistics
 * GET /api/transactions/stats/:userId
 */
router.get('/stats/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.query;

    // Users can only see their own stats
    if (userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized to view these statistics',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const userRole = (role as 'buyer' | 'vendor') || req.user!.role;
    const stats = await transactionService.getTransactionStats(userId, userRole);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_FETCH_ERROR',
        message: 'Failed to fetch transaction statistics',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
