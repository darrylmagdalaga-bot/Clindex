import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, ShieldCheck } from 'lucide-react';

interface LoadingOverlayProps {
  visible: boolean;
  statusMessages?: string[];
  onComplete?: () => void;
}

const FAST_ADAPTIVE_MESSAGES = [
  'Authenticating credentials...',
  'Preparing workspace...',
  'Synchronizing records...',
  'Ready',
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  statusMessages = FAST_ADAPTIVE_MESSAGES,
  onComplete,
}) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setMsgIndex(0);
      return;
    }

    // Adaptive rapid progression - 350ms per step so total overlay duration is ~1.2s max
    const interval = setInterval(() => {
      setMsgIndex((prev) => {
        if (prev < statusMessages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete?.();
          }, 150);
          return prev;
        }
      });
    }, 350);

    return () => clearInterval(interval);
  }, [visible, statusMessages, onComplete]);

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(255, 255, 255, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            pointerEvents: 'none',
          }}
        >
          {/* Centered Content Container */}
          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            {/* Logo Badge */}
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '16px',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.12)',
                border: '1px solid #BFDBFE',
              }}
            >
              <Building2 size={28} color="#2563eb" />
            </motion.div>

            {/* Title & Subtitle */}
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.5px',
                margin: '0 0 4px 0',
              }}
            >
              CLINDEX 2.0
            </h2>
            <p
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#3B82F6',
                margin: '0 0 20px 0',
                letterSpacing: '0.2px',
              }}
            >
              Legislative Records Management System
            </p>

            {/* GPU Accelerated Progress Line */}
            <div
              style={{
                width: '100%',
                maxWidth: '240px',
                height: '3px',
                backgroundColor: 'rgba(226, 232, 240, 0.8)',
                borderRadius: '2px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '16px',
              }}
            >
              <motion.div
                initial={{ transform: 'translateX(-100%)', width: '50%' }}
                animate={{ transform: 'translateX(250%)' }}
                transition={{
                  repeat: Infinity,
                  duration: 1.1,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{
                  position: 'absolute',
                  height: '100%',
                  backgroundColor: '#2563EB',
                  borderRadius: '2px',
                  boxShadow: '0 0 12px rgba(37, 99, 235, 0.8)',
                  willChange: 'transform',
                }}
              />
            </div>

            {/* Rotating Status Messages with GPU Crossfade */}
            <div
              style={{
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={msgIndex}
                  initial={{ opacity: 0, transform: 'translateY(4px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  exit={{ opacity: 0, transform: 'translateY(-4px)' }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#475569',
                    margin: 0,
                    willChange: 'opacity, transform',
                  }}
                >
                  {statusMessages[msgIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Security Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '24px',
                backgroundColor: 'rgba(241, 245, 249, 0.85)',
                padding: '4px 10px',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
              }}
            >
              <ShieldCheck size={12} color="#2563eb" />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#475569',
                }}
              >
                Encrypted Session Handshake
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
