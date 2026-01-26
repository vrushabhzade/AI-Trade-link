import React, { useState } from 'react';
import { Send, User, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MedicalChat = () => {
    const [messages, setMessages] = useState([
        { id: 1, sender: 'Doctor', text: 'Hello, how are you feeling today?', time: '10:05' },
        { id: 2, sender: 'You', text: 'I have a slight fever and headache.', time: '10:06' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        const newMessage = {
            id: Date.now(),
            sender: 'You',
            text: input,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([...messages, newMessage]);
        setInput('');
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} color="var(--color-accent)" />
                <h4 style={{ margin: 0 }}>Consultation Chat</h4>
            </div>

            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((msg) => (
                    <div key={msg.id} style={{
                        alignSelf: msg.sender === 'You' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%'
                    }}>
                        <div style={{
                            fontSize: '0.7rem',
                            color: '#94a3b8',
                            marginBottom: '0.2rem',
                            textAlign: msg.sender === 'You' ? 'right' : 'left'
                        }}>
                            {msg.sender} • {msg.time}
                        </div>
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '12px',
                            background: msg.sender === 'You' ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '0.9rem'
                        }}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSend} style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '0.6rem',
                        color: 'white',
                        outline: 'none'
                    }}
                />
                <button
                    type="submit"
                    style={{
                        background: 'var(--color-accent)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.6rem',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default MedicalChat;
