import React, { useState } from 'react';
import { Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, ShieldCheck, History, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HealthWallet = () => {
    const [balance, setBalance] = useState(12500); // INR
    const [showTransactions, setShowTransactions] = useState(false);

    const transactions = [
        { id: 1, type: 'payment', amount: -650, title: 'Consultation - Dr. Anjali', date: '15 Jan 2026', status: 'Completed' },
        { id: 2, type: 'claim', amount: 5000, title: 'Insurance Reimbursement', date: '12 Jan 2026', status: 'Completed' },
        { id: 3, type: 'payment', amount: -1200, title: 'Lab Test - Metropolis', date: '10 Jan 2026', status: 'Pending' },
        { id: 4, type: 'topup', amount: 2000, title: 'Wallet Top-up', date: '05 Jan 2026', status: 'Completed' },
    ];

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '10px', color: 'var(--color-accent)' }}>
                        <Wallet size={20} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Health Wallet</h3>
                </div>
                <button
                    onClick={() => setShowTransactions(!showTransactions)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}
                >
                    {showTransactions ? 'Show Summary' : 'Vew History'}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {!showTransactions ? (
                    <motion.div
                        key="summary"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                    >
                        {/* Balance Card */}
                        <div style={{
                            background: 'linear-gradient(135deg, var(--color-accent), #0369a1)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                        }}>
                            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                                <CreditCard size={120} />
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>Current Balance</p>
                            <h2 style={{ margin: '0.5rem 0', fontSize: '2.2rem', fontWeight: '700' }}>₹{balance.toLocaleString()}</h2>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <div style={{ padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.2)', borderRadius: '50px', fontSize: '0.7rem' }}>
                                    ● Ayushman Bharat Linked
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <button style={{
                                padding: '0.75rem',
                                border: '1px solid var(--color-glass-border)',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}>
                                <Plus size={16} /> Add Funds
                            </button>
                            <button style={{
                                padding: '0.75rem',
                                border: 'none',
                                background: 'var(--color-accent)',
                                borderRadius: '12px',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}>
                                Pay Bill
                            </button>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                <div style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                                    <ArrowDownLeft size={14} /> Recovered
                                </div>
                                <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>₹8.2k</div>
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                                    <ArrowUpRight size={14} /> Expenses
                                </div>
                                <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>₹2.4k</div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}
                    >
                        {transactions.map(tx => (
                            <div key={tx.id} style={{
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        background: tx.amount > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: tx.amount > 0 ? '#22c55e' : '#ef4444'
                                    }}>
                                        {tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{tx.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{tx.date}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '700', color: tx.amount > 0 ? '#22c55e' : 'white' }}>
                                        {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: tx.status === 'Pending' ? '#f59e0b' : '#34d399' }}>
                                        ● {tx.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HealthWallet;
