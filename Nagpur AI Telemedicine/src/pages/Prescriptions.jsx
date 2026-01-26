import React, { useState, useEffect } from 'react';
import { FileText, Download, Share2, Pill, Plus, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPrescriptions } from '../services/api';
import { explainPrescription } from '../services/ai';
import PrescriptionForm from '../components/PrescriptionForm';
import { Bot, Sparkles, X, Activity } from 'lucide-react';

const Prescriptions = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [prescriptions, setPrescriptions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [explainingId, setExplainingId] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        const data = await fetchPrescriptions();
        setPrescriptions(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleExplain = async (rx) => {
        setExplainingId(rx.id);
        setExplanation(null);
        try {
            const aiLang = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
            const aiResult = await explainPrescription(rx, aiLang);
            setExplanation(aiResult);
            setShowExplanation(true);
        } catch (error) {
            alert("Could not generate explanation.");
        } finally {
            setExplainingId(null);
        }
    };

    const isDoctor = user?.role === 'doctor';

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1>{t('prescriptions.title').split(' ')[0]} <span className="gradient-text">{t('prescriptions.title').split(' ').slice(1).join(' ')}</span></h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{t('prescriptions.subtitle')}</p>
                </div>
                {isDoctor && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="glass-panel"
                        style={{ padding: '0.8rem 1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', background: showForm ? 'rgba(255,255,255,0.1)' : 'var(--color-accent)', color: 'white', border: 'none' }}
                    >
                        {showForm ? <><ChevronLeft size={20} /> Back to List</> : <><Plus size={20} /> New Prescription</>}
                    </button>
                )}
                {!isDoctor && (
                    <button className="glass-panel" style={{ padding: '0.8rem 1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                        <Pill size={20} color="var(--color-accent)" /> {t('prescriptions.orderMedicines')}
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {showForm ? (
                    <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <PrescriptionForm onComplete={() => {
                            setShowForm(false);
                            loadData();
                        }} />
                    </motion.div>
                ) : (
                    <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {prescriptions.length === 0 && !isLoading && (
                            <div className="glass-panel flex-center" style={{ gridColumn: '1/-1', padding: '4rem', color: 'var(--color-text-muted)' }}>
                                No prescriptions found.
                            </div>
                        )}
                        {prescriptions.map((rx) => (
                            <motion.div
                                key={rx.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-panel"
                                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--color-success)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem' }}>{rx.doctorName}</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{rx.date}</p>
                                    </div>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '50px',
                                        background: 'rgba(16, 185, 129, 0.2)',
                                        color: 'var(--color-success)',
                                        fontSize: '0.8rem',
                                        fontWeight: '600'
                                    }}>
                                        Active
                                    </span>
                                </div>

                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Diagnosis: <span style={{ color: 'white' }}>{rx.diagnosis}</span></div>
                                    <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '0.5rem' }}></div>
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {rx.medicines.map((med, idx) => (
                                            <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                                                <span>{med.name}</span>
                                                <span style={{ color: 'var(--color-text-muted)' }}>{med.dosage}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                                    <button
                                        onClick={() => handleExplain(rx)}
                                        disabled={explainingId === rx.id}
                                        style={{
                                            flex: 1.5,
                                            padding: '0.6rem',
                                            background: 'linear-gradient(135deg, var(--color-accent), #6366f1)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            fontWeight: '600'
                                        }}
                                    >
                                        {explainingId === rx.id ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                                        {explainingId === rx.id ? 'Analyzing...' : 'Explain to Me'}
                                    </button>
                                    <button style={{ flex: 1, padding: '0.6rem', border: '1px solid var(--color-glass-border)', background: 'transparent', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <Download size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Explanation Modal */}
            <AnimatePresence>
                {showExplanation && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowExplanation(false)}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="glass-panel"
                            style={{
                                width: '100%',
                                maxWidth: '600px',
                                maxHieght: '80vh',
                                overflow: 'hidden',
                                position: 'relative',
                                background: '#0f172a',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ padding: '0.5rem', background: 'var(--color-accent)', borderRadius: '10px' }}>
                                        <Bot size={20} color="white" />
                                    </div>
                                    <h3 style={{ margin: 0 }}>Smart AI Explainer</h3>
                                </div>
                                <button onClick={() => setShowExplanation(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '60vh', color: '#cbd5e1', lineHeight: 1.6 }}>
                                <div style={{ whiteSpace: 'pre-wrap' }}>
                                    {explanation}
                                </div>
                            </div>
                            <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                <Activity size={14} style={{ display: 'inline', marginRight: '0.4rem' }} /> Verified AI Insights for Patient Safety
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Prescriptions;
