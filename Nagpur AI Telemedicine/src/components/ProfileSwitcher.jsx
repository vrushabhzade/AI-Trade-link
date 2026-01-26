import React, { useState } from 'react';
import { User, Users, ChevronDown, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const ProfileSwitcher = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [activeProfile, setActiveProfile] = useState(user?.name || 'Primary Profile');

    // Mock family profiles if not set in DB yet
    const profiles = [
        { id: 'main', name: user?.name || 'Primary Profile', relation: 'Self', isMain: true },
        { id: 'f1', name: 'Rahul (Son)', relation: 'Dependent', isMain: false },
        { id: 'f2', name: 'Sunita (Mother)', relation: 'Dependent', isMain: false },
    ];

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--color-glass-border)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '50px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'var(--color-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                }}>
                    {activeProfile.charAt(0)}
                </div>
                <div style={{ textAlign: 'left', display: 'none', '@media (min-width: 640px)': { display: 'block' } }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', lineHeight: 1 }}>{activeProfile}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>Switch Account</div>
                </div>
                <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        style={{
                            position: 'absolute',
                            top: '120%',
                            right: 0,
                            width: '240px',
                            background: '#1e293b',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            padding: '0.75rem',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                            zIndex: 1000
                        }}
                    >
                        <div style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Family Accounts
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
                            {profiles.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        setActiveProfile(p.name);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        padding: '0.6rem 0.75rem',
                                        background: activeProfile === p.name ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: p.isMain ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.7rem'
                                        }}>
                                            {p.isMain ? <User size={14} /> : <Users size={14} />}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>{p.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-secondary)' }}>{p.relation}</div>
                                        </div>
                                    </div>
                                    {activeProfile === p.name && <Check size={16} color="var(--color-accent)" />}
                                </button>
                            ))}
                        </div>

                        <button style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.6rem 0.75rem',
                            background: 'transparent',
                            border: '1px dashed rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}>
                            <Plus size={14} /> Add Family Member
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileSwitcher;
