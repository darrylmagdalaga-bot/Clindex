import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, ShieldCheck } from 'lucide-react';

interface LoadingOverlayProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  statusMessages?: string[];
  onComplete?: () => void;
}

const DEFAULT_MESSAGES = [
  'Authenticating credentials...',
  'Loading profile...',
  'Loading permissions...',
  'Preparing dashboard...',
  'Building workspace...',
  'Synchronizing modules...',
  'Finalizing interface...',
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  title = 'CLINDEX 2.0',
  subtitle = 'Legislative Records Management System',
  statusMessages = DEFAULT_MESSAGES,
  onComplete,
}) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setMsgIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMsgIndex((prev) => {
        if (prev < statusMessages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete?.();
          }, 400);
          return prev;
        }
      });
    }, 800);

    return () => clearInterval(interval);
  }, [visible, statusMessages, onComplete]);

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)', filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Centered Content Container */}
          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            {/* Logo Badge */}
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '20px',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.12)',
                border: '1px solid #BFDBFE',
              }}
            >
              <Building2 size={32} color="#2563eb" />
            </motion.div>

            {/* Title & Subtitle */}
            <h2
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.5px',
                margin: '0 0 4px 0',
              }}
            >
              {title}
            </h2>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#3B82F6',
                margin: '0 0 28px 0',
                letterSpacing: '0.2px',
              }}
            >
              {subtitle}
            </p>

            {/* Animated Premium Line */}
            <div
              style={{
                width: '100%',
                maxWidth: '280px',
                height: '3px',
                backgroundColor: 'rgba(226, 232, 240, 0.8)',
                borderRadius: '2px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '20px',
              }}
            >
              <motion.div
                initial={{ left: '-100%', width: '50%' }}
                animate={{ left: '100%' }}
                transition={{
                  repeat: Infinity,
                  duration: 1.4,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{
                  position: 'absolute',
                  height: '100%',
                  backgroundColor: '#2563EB',
                  borderRadius: '2px',
                  boxShadow: '0 0 14px rgba(37, 99, 235, 0.8)',
                }}
              />
            </div>

            {/* Rotating Status Messages with Crossfade */}
            <div
              style={{
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={msgIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#64748B',
                    margin: 0,
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
                marginTop: '36px',
                backgroundColor: 'rgba(241, 245, 249, 0.8)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
              }}
            >
              <ShieldCheck size={14} color="#2563eb" />
              <span
                style={{
                  fontSize: '11px',
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
