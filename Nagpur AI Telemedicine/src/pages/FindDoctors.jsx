/* eslint-disable */
import { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import ProviderCard from '../components/ProviderCard';
import BookingModal from '../components/BookingModal';
import { CardSkeleton } from '../components/Skeletons';
import { fetchDoctors } from '../services/api';

const FindDoctors = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [languageFilter, setLanguageFilter] = useState('All');
    const [genderFilter, setGenderFilter] = useState('All');
    const [doctors, setDoctors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Booking Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    useEffect(() => {
        const loadDoctors = async () => {
            setIsLoading(true);
            const data = await fetchDoctors();
            // Mock AI Recommendation: Flag doctors with rating >= 4.8
            const enrichedData = data.map(doc => ({
                ...doc,
                isRecommended: parseFloat(doc.rating) >= 4.8
            }));

            // Artificial delay for skeleton demonstration
            setTimeout(() => {
                setDoctors(enrichedData);
                setIsLoading(false);
            }, 800);
        };
        loadDoctors();
    }, []);

    const filteredDoctors = doctors.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.specialty.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLang = languageFilter === 'All' || doc.languages.includes(languageFilter);
        const matchesGender = genderFilter === 'All' || (genderFilter === 'Female' ? doc.isFemale : !doc.isFemale);

        return matchesSearch && matchesLang && matchesGender;
    });

    const handleBook = (doctor) => {
        setSelectedDoctor(doctor);
        setIsModalOpen(true);
    };

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                doctor={selectedDoctor || {}}
            />

            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1>{t('findDoctors.title').split(' ')[0]} <span className="gradient-text">{t('findDoctors.title').split(' ').slice(1).join(' ')}</span></h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>{t('findDoctors.subtitle')}</p>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Sidebar Filters - Desktop */}
                <aside className="glass-panel" style={{ padding: '1.5rem', width: '300px', height: 'fit-content', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <Filter size={20} color="var(--color-accent)" />
                        <h3>{t('findDoctors.filters')}</h3>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('findDoctors.filters')}</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
                            <input
                                type="text"
                                placeholder={t('findDoctors.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 0.6rem 0.6rem 2.2rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-glass-border)',
                                    background: 'rgba(0,0,0,0.2)',
                                    color: 'white'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('findDoctors.language')}</label>
                        <select
                            value={languageFilter}
                            onChange={(e) => setLanguageFilter(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-glass-border)', color: 'white' }}
                        >
                            <option value="All">{t('findDoctors.allLanguages')}</option>
                            <option value="Marathi">Marathi</option>
                            <option value="Hindi">Hindi</option>
                            <option value="English">English</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('findDoctors.gender')}</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[
                                { id: 'All', label: t('findDoctors.allGenders') },
                                { id: 'Female', label: t('findDoctors.female') },
                                { id: 'Male', label: t('findDoctors.male') }
                            ].map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => setGenderFilter(g.id)}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        borderRadius: '6px',
                                        border: genderFilter === g.id ? '1px solid var(--color-accent)' : '1px solid var(--color-glass-border)',
                                        background: genderFilter === g.id ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                                        color: genderFilter === g.id ? 'white' : 'var(--color-text-secondary)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {g.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Results Grid */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem' }}>{t('findDoctors.availableCount', { count: filteredDoctors.length })}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            <SlidersHorizontal size={16} /> Sort by: <span style={{ color: 'var(--color-accent)' }}>Equity Score (Recommended)</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {isLoading ? (
                            [1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)
                        ) : (
                            filteredDoctors.map(doctor => (
                                <ProviderCard key={doctor.id} doctor={doctor} onBook={handleBook} />
                            ))
                        )}
                    </div>
                </div>
            </div>
            <style>{`
        @media(max-width: 768px) {
          .glass-panel { width: 100% !important; margin-bottom: 2rem; }
        }
            `}</style>
        </div >
    );
};

export default FindDoctors;
