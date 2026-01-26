import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, FileText, Download, Mic, MicOff } from 'lucide-react';
import { analyzeSymptoms } from '../services/ai';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

const SymptomChecker = () => {
    const { language, t } = useLanguage();
    const { user } = useAuth();

    // Check if greeting has already been added to avoid duplicates on re-renders if not handled
    const [messages, setMessages] = useState([
        { role: 'ai', content: t('symptomChecker.greeting', { name: user ? user.name : 'there' }) }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showReferral, setShowReferral] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';

            recognitionRef.current.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                setInput(transcript);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech Recognition Error:", event.error);
                setIsListening(false);
            };
        }
    }, [language]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleSend = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        if (trimmedInput.length < 3) {
            alert('Please provide more detail about your symptoms.');
            return;
        }

        const userMessage = { role: 'user', content: trimmedInput };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Map UI language to AI prompt language
            const aiLang = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
            const aiResponseText = await analyzeSymptoms(trimmedInput, aiLang, user);

            const aiMessage = { role: 'ai', content: aiResponseText };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("AI Symptom Analysis Error:", error);
            setMessages(prev => [...prev, {
                role: 'ai',
                content: "I'm having trouble connecting to my medical database. If this is an emergency, please use the SOS button or visit the nearest PHC."
            }]);
        } finally {
            setIsLoading(false);
        }

        // Show referral button if analysis is substantial
        if (trimmedInput.length > 5) {
            setShowReferral(true);
        }
    };

    return (
        <div className="glass-panel" style={{ height: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-glass-border)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '10px', height: '10px', background: 'var(--color-success)', borderRadius: '50%', boxShadow: '0 0 10px var(--color-success)' }}></div>
                <h3 style={{ margin: 0 }}>{t('symptomChecker.title')}</h3>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'flex',
                            gap: '0.75rem',
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%'
                        }}
                    >
                        {msg.role === 'ai' && (
                            <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-accent), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Bot size={18} color="white" />
                            </div>
                        )}

                        <div style={{
                            background: msg.role === 'user' ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)',
                            padding: '1rem',
                            borderRadius: '12px',
                            borderTopLeftRadius: msg.role === 'ai' ? '2px' : '12px',
                            borderTopRightRadius: msg.role === 'user' ? '2px' : '12px',
                            color: 'white',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap'
                        }}>
                            {msg.content}
                        </div>

                        {msg.role === 'user' && (
                            <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={18} color="white" />
                            </div>
                        )}
                    </motion.div>
                ))}
                {isLoading && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: 'var(--color-text-muted)' }}>
                        <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-accent), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bot size={18} color="white" />
                        </div>
                        <div className="glass-panel" style={{ padding: '0.5rem 1rem' }}>Thinking... <Loader2 className="spin" size={14} style={{ display: 'inline', animation: 'spin 1s linear infinite' }} /></div>
                    </div>
                )}

                {showReferral && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ padding: '1rem', background: 'rgba(14, 165, 233, 0.1)', border: '1px dashed var(--color-accent)', borderRadius: '12px', textAlign: 'center' }}
                    >
                        <FileText size={24} color="var(--color-accent)" style={{ marginBottom: '0.5rem' }} />
                        <h4 style={{ marginBottom: '0.5rem' }}>{t('symptomChecker.referralTitle')}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>{t('symptomChecker.referralNote')}</p>
                        <button
                            style={{ background: 'var(--color-accent)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
                            onClick={() => window.print()}
                        >
                            <Download size={16} /> {t('symptomChecker.referralButton')}
                        </button>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--color-glass-border)', background: 'rgba(255,255,255,0.05)', display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    placeholder={t('symptomChecker.placeholder')}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.3)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        color: 'white',
                        outline: 'none'
                    }}
                />
                <button
                    onClick={toggleListening}
                    style={{
                        background: isListening ? '#ef4444' : 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--color-glass-border)',
                        borderRadius: '8px',
                        width: '45px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {isListening ? <MicOff color="white" size={20} /> : <Mic color="var(--color-text-secondary)" size={20} />}
                </button>
                <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    style={{
                        background: 'var(--color-accent)',
                        border: 'none',
                        borderRadius: '8px',
                        width: '45px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        opacity: (!input.trim() || isLoading) ? 0.5 : 1
                    }}
                >
                    <Send color="white" size={20} />
                </button>
            </div>
        </div>
    );
};

export default SymptomChecker;
