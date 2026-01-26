import React from 'react';
import { MapPin, Star, Languages, Video, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const ProviderCard = ({ doctor, onBook }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel"
            style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'transform 0.2s',
            }}
            whileHover={{ y: -5, borderColor: 'var(--color-accent)' }}
        >
            <div style={{ display: 'flex', gap: '1rem' }}>
                <img
                    src={doctor.image}
                    alt={doctor.name}
                    style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{doctor.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24', fontWeight: 'bold' }}>
                            <Star size={16} fill="#fbbf24" /> {doctor.rating}
                        </div>
                    </div>
                    {doctor.isRecommended && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderRadius: '50px', marginBottom: '0.5rem', fontWeight: 'bold', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                            <Award size={12} /> AI Recommended
                        </div>
                    )}
                    <p style={{ color: 'var(--color-accent)', fontWeight: '500', fontSize: '0.9rem' }}>{doctor.specialty}</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{doctor.qualification}</p>
                </div>
            </div>

            {/* Equity & Info Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--color-text-secondary)' }}>
                    <MapPin size={14} /> {doctor.distance} km away
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--color-text-secondary)' }}>
                    <Languages size={14} /> {doctor.languages.join(', ')}
                </div>
                {doctor.isFemale && (
                    <div style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: 'rgba(236, 72, 153, 0.2)', borderRadius: '4px', color: '#fba6e4' }}>
                        Female Doctor
                    </div>
                )}
            </div>

            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Next Available</span>
                    <div style={{ fontWeight: '600', color: 'var(--color-success)' }}>Today, 2:00 PM</div>
                </div>
                <button
                    onClick={() => onBook(doctor)}
                    style={{
                        background: 'var(--color-accent)',
                        color: 'white',
                        border: 'none',
                        padding: '0.6rem 1.25rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    <Video size={18} /> Consult
                </button>
            </div>
        </motion.div>
    );
};

export default ProviderCard;
