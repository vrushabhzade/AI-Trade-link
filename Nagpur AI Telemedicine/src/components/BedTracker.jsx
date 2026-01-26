import React, { useState, useEffect } from 'react';
import { Building2, TrendingUp, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';

const BedTracker = () => {
    const [hospitalData, setHospitalData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Real-time listener from Firestore
        const unsubscribe = onSnapshot(collection(db, 'hospitals'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setHospitalData(data);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching hospitals:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'stable': return 'var(--color-success)';
            case 'busy': return 'var(--color-warning)';
            case 'critical': return 'var(--color-error)';
            default: return 'var(--color-text-muted)';
        }
    };

    if (isLoading) {
        return (
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>Loading live bed data...</p>
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Building2 size={20} color="var(--color-accent)" /> Live Bed Tracker
                </h3>
                <div style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '6px', height: '6px', background: 'var(--color-success)', borderRadius: '50%' }}></div>
                    Live: Nagpur Region
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {hospitalData.map(h => (
                    <div key={h.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>{h.name}</div>
                            <div style={{ color: getStatusColor(h.status), fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                {h.status}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(h.beds / h.total) * 100}%` }}
                                    style={{ height: '100%', background: getStatusColor(h.status) }}
                                />
                            </div>
                            <div style={{ width: '60px', textAlign: 'right', fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: 'bold', color: 'white' }}>{h.beds}</span>
                                <span style={{ color: 'var(--color-text-muted)' }}>/{h.total}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-glass-border)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={16} color="var(--color-accent)" />
                    <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Avg. Wait Time</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>12 mins</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={16} color="var(--color-success)" />
                    <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Total Available</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{hospitalData.reduce((acc, curr) => acc + curr.beds, 0)} Beds</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BedTracker;
