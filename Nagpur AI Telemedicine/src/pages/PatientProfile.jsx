/* eslint-disable */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Activity, ShieldCheck, Edit2, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const PatientProfile = () => {
    const { user, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);

    if (!user) return null;

    const healthMetrics = [
        { label: 'Blood Group', value: 'O+', icon: Activity, color: '#ef4444' },
        { label: 'Height', value: '175 cm', icon: Activity, color: '#3b82f6' },
        { label: 'Weight', value: '72 kg', icon: Activity, color: '#22c55e' },
    ];

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1>Personal <span className="gradient-text">Profile</span></h1>
                    <button
                        onClick={logout}
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                    {/* Left Column: Brief Info */}
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', height: 'fit-content' }}>
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                background: 'linear-gradient(45deg, var(--color-accent), #3b82f6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '3rem',
                                color: 'white',
                                fontWeight: 'bold'
                            }}>
                                {user.name.charAt(0)}
                            </div>
                            <button style={{
                                position: 'absolute',
                                bottom: '5px',
                                right: '5px',
                                background: 'var(--color-accent)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                cursor: 'pointer'
                            }}>
                                <Edit2 size={16} />
                            </button>
                        </div>
                        <h2 style={{ marginBottom: '0.5rem' }}>{user.name}</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', textTransform: 'capitalize' }}>{user.role}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                <Mail size={18} /> {user.email}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                <Calendar size={18} /> Joined Jan 2026
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#22c55e' }}>
                                <ShieldCheck size={18} /> Identity Verified
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Detailed Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Health Metrics */}
                        <section className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Health Metrics</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                {healthMetrics.map((m, i) => (
                                    <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center' }}>
                                        <m.icon size={20} color={m.color} style={{ marginBottom: '0.5rem' }} />
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{m.value}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{m.label}</div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Recent Activity placeholder */}
                        <section className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Recent Consultations</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>Dr. Anjali Deshmukh</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>12 Jan 2026 • General Health</div>
                                    </div>
                                    <span style={{ color: 'var(--color-accent)', fontWeight: '600', fontSize: '0.9rem' }}>Completed</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>Dr. Rahul Sharma</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>05 Jan 2026 • Follow-up</div>
                                    </div>
                                    <span style={{ color: 'var(--color-accent)', fontWeight: '600', fontSize: '0.9rem' }}>Completed</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientProfile;
