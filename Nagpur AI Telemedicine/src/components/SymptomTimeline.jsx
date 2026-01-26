import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const SymptomTimeline = () => {
    const history = [
        { date: 'Oct 24, 2025', symptom: 'Mild Fever & Cough', status: 'Resolved', severity: 'low' },
        { date: 'Nov 12, 2025', symptom: 'Headache & Nausea', status: 'Consultation Done', severity: 'medium' },
        { date: 'Dec 05, 2025', symptom: 'High Glucose (180 mg/dL)', status: 'Active Monitoring', severity: 'high' }
    ];

    return (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Clock size={20} color="var(--color-accent)" />
                <h3 style={{ margin: 0 }}>Health Journey</h3>
            </div>

            <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                {/* Vertical Line */}
                <div style={{
                    position: 'absolute',
                    left: '7px',
                    top: '0',
                    bottom: '0',
                    width: '2px',
                    background: 'rgba(255,255,255,0.1)'
                }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {history.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            style={{ position: 'relative' }}
                        >
                            {/* Dot */}
                            <div style={{
                                position: 'absolute',
                                left: '-29px',
                                top: '5px',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: item.severity === 'high' ? 'var(--color-error)' : item.severity === 'medium' ? 'var(--color-warning)' : 'var(--color-success)',
                                border: '3px solid rgba(0,0,0,0.5)',
                                zIndex: 1
                            }} />

                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Calendar size={12} /> {item.date}
                            </div>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{item.symptom}</div>
                            <div style={{
                                fontSize: '0.8rem',
                                color: item.status === 'Resolved' ? '#22c55e' : '#60a5fa',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}>
                                {item.status === 'Resolved' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                {item.status}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <button style={{
                marginTop: '1.5rem',
                width: '100%',
                padding: '0.6rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.85rem',
                cursor: 'pointer'
            }}>
                View Full Medical History
            </button>
        </div>
    );
};

export default SymptomTimeline;
