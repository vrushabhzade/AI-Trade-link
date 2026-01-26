import React, { useState } from 'react';
import { Plus, Trash2, Send, Save, CheckCircle } from 'lucide-react';
import { createPrescription } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const PrescriptionForm = ({ onComplete }) => {
    const [formData, setFormData] = useState({
        patientName: '',
        doctorName: 'Dr. Anjali Deshmukh', // Default for demo
        diagnosis: '',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        medicines: [{ name: '', dosage: '' }]
    });
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleAddMedicine = () => {
        setFormData({ ...formData, medicines: [...formData.medicines, { name: '', dosage: '' }] });
    };

    const handleRemoveMedicine = (index) => {
        const updated = formData.medicines.filter((_, i) => i !== index);
        setFormData({ ...formData, medicines: updated });
    };

    const handleMedicineChange = (index, field, value) => {
        const updated = [...formData.medicines];
        updated[index][field] = value;
        setFormData({ ...formData, medicines: updated });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await createPrescription(formData);
            setSuccess(true);
            setTimeout(() => {
                if (onComplete) onComplete();
                setSuccess(false);
            }, 2000);
        } catch (error) {
            alert('Error saving prescription');
        } finally {
            setIsSaving(false);
        }
    };

    if (success) {
        return (
            <div className="glass-panel flex-center" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                    <CheckCircle size={64} color="var(--color-success)" />
                </motion.div>
                <h3>Prescription Issued Successfully</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>Digital copy sent to patient.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Create Digital Prescription</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{formData.date}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Patient Name</label>
                    <input
                        required
                        type="text"
                        value={formData.patientName}
                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                        className="glass-panel"
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                        placeholder="Full Name"
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Diagnosis</label>
                    <input
                        required
                        type="text"
                        value={formData.diagnosis}
                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                        className="glass-panel"
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                        placeholder="e.g. Type 2 Diabetes"
                    />
                </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-glass-border)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>Medicines</h4>
                    <button
                        type="button"
                        onClick={handleAddMedicine}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        <Plus size={16} /> Add More
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {formData.medicines.map((med, index) => (
                        <div key={index} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                required
                                value={med.name}
                                onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                className="glass-panel"
                                style={{ flex: 2, padding: '0.6rem', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                placeholder="Medicine Name"
                            />
                            <input
                                required
                                value={med.dosage}
                                onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                                className="glass-panel"
                                style={{ flex: 1, padding: '0.6rem', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                placeholder="1-0-1 (5 days)"
                            />
                            {formData.medicines.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMedicine(index)}
                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                disabled={isSaving}
                style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'var(--color-accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                }}
            >
                {isSaving ? 'Processing...' : <><Save size={18} /> Finalize & Issue Prescription</>}
            </button>
        </form>
    );
};

export default PrescriptionForm;
