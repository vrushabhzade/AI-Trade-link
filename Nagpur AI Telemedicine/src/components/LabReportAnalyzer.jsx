import React, { useState } from 'react';
import { Activity, Beaker, ChevronRight, AlertTriangle, CheckCircle2, Loader2, Info, History } from 'lucide-react';
import { analyzeLabResults } from '../services/ai';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const LabReportAnalyzer = () => {
    const { language } = useLanguage();
    const [metrics, setMetrics] = useState({
        glucose: '',
        systolic: '',
        diastolic: '',
        hemoglobin: ''
    });
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleInputChange = (e) => {
        setMetrics({ ...metrics, [e.target.name]: e.target.value });
    };

    const saveLabResult = async (metrics, diagnosis) => {
        try {
            await fetch('http://localhost:5000/api/lab-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Fallback if AuthContext isn't used
                },
                body: JSON.stringify({ metrics, diagnosis })
            });
        } catch (error) {
            console.error('Failed to save lab result:', error);
        }
    };

    const analyzeData = async () => {
        const glucoseValue = parseInt(metrics.glucose);
        const systolicValue = parseInt(metrics.systolic);

        if (metrics.glucose && (isNaN(glucoseValue) || glucoseValue < 0 || glucoseValue > 1000)) {
            alert('Please enter a valid glucose value.');
            return;
        }
        if (metrics.systolic && (isNaN(systolicValue) || systolicValue < 0 || systolicValue > 300)) {
            alert('Please enter a valid systolic BP.');
            return;
        }

        setIsAnalyzing(true);
        try {
            const aiLang = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
            const aiResponse = await analyzeLabResults(metrics, aiLang);

            const results = [];
            if (glucoseValue) {
                results.push({
                    label: 'Glucose',
                    status: glucoseValue > 140 ? 'high' : glucoseValue < 70 ? 'low' : 'normal',
                    note: aiResponse
                });
            }
            if (systolicValue) {
                results.push({
                    label: 'Blood Pressure',
                    status: systolicValue > 140 ? 'high' : 'normal',
                    note: 'BP interpretation based on clinical standards for the Nagpur region.'
                });
            }

            setAnalysis(results);

            // Save to history
            saveLabResult(metrics, aiResponse);

        } catch (error) {
            console.error("Analysis failed:", error);
            alert("AI analysis currently unavailable. Please try again later.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '8px' }}>
                        <Beaker size={20} color="#a78bfa" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem' }}>Smart Health Insights</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>AI-powered lab interpretation</p>
                    </div>
                </div>
                <button style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }} title="View History">
                    <History size={18} />
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Glucose (mg/dL)</label>
                    <input
                        type="number"
                        name="glucose"
                        value={metrics.glucose}
                        onChange={handleInputChange}
                        placeholder="e.g. 110"
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.4rem' }}>BP (Systolic)</label>
                        <input
                            type="number"
                            name="systolic"
                            value={metrics.systolic}
                            onChange={handleInputChange}
                            placeholder="120"
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Diastolic</label>
                        <input
                            type="number"
                            name="diastolic"
                            value={metrics.diastolic}
                            onChange={handleInputChange}
                            placeholder="80"
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={analyzeData}
                disabled={isAnalyzing || (!metrics.glucose && !metrics.systolic)}
                style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--color-accent)',
                    color: 'white',
                    fontWeight: '600',
                    cursor: (isAnalyzing || (!metrics.glucose && !metrics.systolic)) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: (isAnalyzing || (!metrics.glucose && !metrics.systolic)) ? 0.6 : 1
                }}
            >
                {isAnalyzing ? <Loader2 size={18} className="spin" /> : <ChevronRight size={18} />}
                {isAnalyzing ? 'Analyzing Labs...' : 'Get AI Analysis'}
            </button>

            <AnimatePresence mode="wait">
                {analysis && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                    >
                        {analysis.map((res, i) => (
                            <div key={i} style={{
                                padding: '1rem',
                                borderRadius: '12px',
                                background: res.status === 'normal' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                border: res.status === 'normal' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                                display: 'flex',
                                gap: '0.75rem'
                            }}>
                                {res.status === 'normal' ?
                                    <CheckCircle2 size={18} color="#22c55e" /> :
                                    <AlertTriangle size={18} color="#ef4444" />
                                }
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{res.label}: <span style={{ color: res.status === 'normal' ? '#22c55e' : '#ef4444' }}>{res.status.toUpperCase()}</span></div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{res.note}</div>
                                </div>
                            </div>
                        ))}

                        <div style={{
                            marginTop: '0.5rem',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px dashed rgba(59, 130, 246, 0.3)',
                            fontSize: '0.75rem',
                            color: '#60a5fa',
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center'
                        }}>
                            <Info size={14} />
                            AI advice is for guidance only. Results saved to your health profile.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LabReportAnalyzer;
