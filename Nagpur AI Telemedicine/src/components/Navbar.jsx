import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, HeartPulse, User, Video, LayoutDashboard, FileText, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

import { useAuth } from '../context/AuthContext';
import ProfileSwitcher from './ProfileSwitcher';

const Navbar = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { language, setLanguage, t } = useLanguage();
    const navLinks = [
        { name: t('nav.home'), path: '/', icon: HeartPulse },
        { name: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
        { name: t('nav.findDoctors'), path: '/find-doctors', icon: Video },
        { name: t('nav.prescriptions'), path: '/prescriptions', icon: FileText },
        { name: t('nav.profile'), path: '/profile', icon: User },
    ];

    if (user?.role === 'admin') {
        navLinks.push({ name: t('nav.admin'), path: '/admin', icon: LayoutDashboard });
    }

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed w-full z-50 transition-all duration-300" style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '80px' }}>
                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
                    <div style={{
                        width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--color-accent), #3b82f6)',
                        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(14, 165, 233, 0.4)'
                    }}>
                        <HeartPulse color="white" size={24} />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
                        Health<span className="gradient-text">Bridge</span>
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="desktop-menu" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    {navLinks.map((link) => (
                        <Link key={link.path} to={link.path} style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            color: isActive(link.path) ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                            fontWeight: isActive(link.path) ? '600' : '500',
                            transition: 'color 0.2s ease', position: 'relative'
                        }}>
                            {link.name}
                            {isActive(link.path) && (
                                <motion.div layoutId="nav-underline" style={{
                                    position: 'absolute', bottom: '-28px', left: 0, right: 0, height: '3px',
                                    background: 'var(--color-accent)', borderRadius: '2px 2px 0 0', boxShadow: '0 -2px 10px var(--color-accent)'
                                }} />
                            )}
                        </Link>
                    ))}

                    {/* Language Toggle */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Globe size={16} color="var(--color-text-secondary)" style={{ marginLeft: '0.5rem' }} />
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                outline: 'none'
                            }}
                        >
                            <option value="en" style={{ color: 'black' }}>EN</option>
                            <option value="hi" style={{ color: 'black' }}>HI</option>
                            <option value="mr" style={{ color: 'black' }}>MR</option>
                        </select>
                    </div>

                    {user ? (
                        <ProfileSwitcher />
                    ) : (
                        <Link to="/login">
                            <button style={{
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white', padding: '0.6rem 1.25rem', borderRadius: '50px', fontWeight: '600',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                                {t('nav.login')}
                            </button>
                        </Link>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'none' }} className="mobile-toggle">
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ background: 'var(--color-bg-secondary)', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem 0' }}>
                            {navLinks.map((link) => (
                                <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.1rem',
                                    color: isActive(link.path) ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                                }}>
                                    <link.icon size={20} /> {link.name}
                                </Link>
                            ))}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
                                <Globe size={20} color="var(--color-text-secondary)" />
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontSize: '1rem',
                                        padding: '0.5rem',
                                        flex: 1
                                    }}
                                >
                                    <option value="en" style={{ color: 'black' }}>English</option>
                                    <option value="hi" style={{ color: 'black' }}>Hindi (हिंदी)</option>
                                    <option value="mr" style={{ color: 'black' }}>Marathi (मराठी)</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <style>{`
                @media (max-width: 768px) {
                    .desktop-menu { display: none !important; }
                    .mobile-toggle { display: block !important; }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
