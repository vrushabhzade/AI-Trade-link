import { Camera, Mic, PhoneOff, Settings, Maximize, MicOff, CameraOff, Video, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MedicalChat from './MedicalChat';

const VideoConsultation = ({ sessionInfo, onEnd }) => {
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [showChat, setShowChat] = useState(true);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#0a0a0a',
            zIndex: 9999,
            color: 'white',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Consultation with {sessionInfo?.partnerName || 'Specialist'}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Session ID: {sessionInfo?.id || 'RX-772'}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        ● LIVE 00:12:45
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', padding: '1rem', gap: '1rem', overflow: 'hidden' }}>

                {/* Video Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Peer Video (Main) */}
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Video size={64} color="rgba(255,255,255,0.05)" />
                        <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '6px', fontSize: '0.8rem' }}>
                            {sessionInfo?.partnerName || 'Specialist'}
                        </div>
                    </div>

                    {/* Self Video (PiP) */}
                    <div style={{ position: 'absolute', top: '2.5rem', right: showChat ? '380px' : '2.5rem', width: '220px', height: '140px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'right 0.3s ease' }}>
                        {isCamOn ? (
                            <Video size={24} color="rgba(255,255,255,0.2)" />
                        ) : (
                            <CameraOff size={24} color="#ef4444" />
                        )}
                        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', fontSize: '0.7rem' }}>You</div>
                    </div>
                </div>

                {/* Chat Column */}
                <AnimatePresence>
                    {showChat && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: '350px', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            style={{ height: '100%' }}
                        >
                            <MedicalChat />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                <button
                    onClick={() => setIsMicOn(!isMicOn)}
                    style={{
                        padding: '1rem',
                        borderRadius: '50%',
                        border: 'none',
                        background: isMicOn ? 'rgba(255,255,255,0.1)' : '#ef4444',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
                </button>

                <button
                    onClick={() => setIsCamOn(!isCamOn)}
                    style={{
                        padding: '1rem',
                        borderRadius: '50%',
                        border: 'none',
                        background: isCamOn ? 'rgba(255,255,255,0.1)' : '#ef4444',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {isCamOn ? <Camera size={24} /> : <CameraOff size={24} />}
                </button>

                <button
                    onClick={onEnd}
                    style={{
                        padding: '1rem 2rem',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#ef4444',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 'bold'
                    }}
                >
                    <PhoneOff size={24} /> End Call
                </button>

                <button
                    onClick={() => setShowChat(!showChat)}
                    style={{
                        padding: '1rem',
                        borderRadius: '50%',
                        border: 'none',
                        background: showChat ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <MessageSquare size={24} />
                </button>

                <button style={{ padding: '1rem', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>
                    <Settings size={24} />
                </button>

                <button style={{ padding: '1rem', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>
                    <Maximize size={24} />
                </button>
            </div>
        </div>
    );
};

export default VideoConsultation;
