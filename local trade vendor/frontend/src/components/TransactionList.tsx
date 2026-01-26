import React, { useState } from 'react';
import { Transaction } from '../types';
import TransactionCard from './TransactionCard';
import TransactionDetailModal from './TransactionDetailModal';

interface TransactionListProps {
  transactions: Transaction[];
  userRole: 'buyer' | 'vendor';
  onUpdate: () => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  userRole,
  onUpdate,
}) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  return (
    <>
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            userRole={userRole}
            onClick={() => setSelectedTransaction(transaction)}
          />
        ))}
      </div>

      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          userRole={userRole}
          onClose={() => setSelectedTransaction(null)}
          onUpdate={() => {
            setSelectedTransaction(null);
            onUpdate();
          }}
        />
      )}
    </>
  );
};

export default TransactionList;
