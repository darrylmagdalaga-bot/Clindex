import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, useWindowDimensions } from 'react-native';
import { Lock, Building2, Check, ArrowRight, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { UserCombobox } from '@/components/ui/UserCombobox';
import { loginUser, AuthUser } from '@/services/authApi';

interface RNLoginScreenProps {
  onLoginSuccess?: (user: AuthUser) => void;
}

export const RNLoginScreen: React.FC<RNLoginScreenProps> = ({ onLoginSuccess }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const handleSubmit = async () => {
    if (isAuthenticating || showOverlay) return;
    setErrorMessage('');

    if (!username) {
      setErrorMessage('Please select your account.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    setIsAuthenticating(true);

    try {
      const result = await loginUser(username, password);
      if (result.success && result.user) {
        setAuthUser(result.user);
        // Step 1: Button morphs (300ms) then LoadingOverlay fades in
        setTimeout(() => {
          setShowOverlay(true);
        }, 300);
      } else {
        setIsAuthenticating(false);
        setErrorMessage(result.message || 'Invalid username or password.');
      }
    } catch (err: any) {
      setIsAuthenticating(false);
      setErrorMessage('Unable to connect to the server.');
    }
  };

  const handleOverlayComplete = () => {
    setShowOverlay(false);
    setIsAuthenticating(false);
    onLoginSuccess?.(
      authUser || {
        UserID: 1,
        Username: username || 'admin',
        FullName: 'Juan Dela Cruz',
        RoleID: 1,
        RoleName: 'Administrator',
      }
    );
  };

  return (
    <View style={styles.pageContainer}>
      {/* Fullscreen Reusable Loading Overlay */}
      <LoadingOverlay
        visible={showOverlay}
        onComplete={handleOverlayComplete}
      />

      {/* LEFT BRANDING PANEL (~55%) - Hidden on mobile */}
      {!isMobile && (
        <View style={styles.leftPanel}>
          <View style={styles.watermarkContainer}>
            <Building2 size={360} color="#2563eb" style={{ opacity: 0.04 }} />
          </View>

          <View style={styles.leftContent}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>🏛</Text>
            </View>

            <Text style={styles.brandTitle}>CLINDEX 2.0</Text>
            <Text style={styles.brandSubtitle}>Digital & Paper Legislative Records</Text>
            <Text style={styles.brandTagline}>Modern Legislative Records Management System</Text>

            <View style={styles.dividerLine} />

            <Text style={styles.singleSentence}>
              Securely manage legislative records in one unified platform.
            </Text>

            <View style={styles.securityPill}>
              <ShieldCheck size={14} color="#2563eb" />
              <Text style={styles.securityText}>Enterprise Azure SQL Encryption Active</Text>
            </View>
          </View>
        </View>
      )}

      {/* RIGHT LOGIN FORM PANEL (~45%) */}
      <View style={styles.rightPanel}>
        <View style={styles.loginCard}>
          <View style={styles.cardHeaderIconBox}>
            <Building2 size={24} color="#2563eb" />
          </View>

          <Text style={styles.welcomeHeading}>Welcome Back</Text>
          <Text style={styles.welcomeSubheading}>Sign in to continue</Text>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.formGroup}>
            {/* Username Searchable Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Account Name</Text>
              <UserCombobox
                selectedUsername={username}
                onSelectUser={(u) => {
                  setUsername(u);
                  setErrorMessage('');
                }}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  isPasswordFocused && styles.inputWrapperFocused,
                ]}
              >
                <Lock size={18} color={isPasswordFocused ? '#2563eb' : '#9ca3af'} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setErrorMessage('');
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  style={styles.textInput}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                />
              </View>
            </View>

            {/* Remember Me Checkbox */}
            <Pressable
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.checkboxRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Check size={12} color="#ffffff" />}
              </View>
              <Text style={styles.checkboxLabel}>Remember Me</Text>
            </Pressable>

            {/* Primary Sign In Button with Morphing Animation */}
            <Pressable
              onPress={handleSubmit}
              disabled={isAuthenticating}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && !isAuthenticating && styles.submitButtonPressed,
                isAuthenticating && styles.submitButtonLoading,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sign In"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 size={18} color="#ffffff" style={styles.spinnerIcon} />
                  <Text style={styles.submitButtonText}>Authenticating...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Sign In</Text>
                  <ArrowRight size={18} color="#ffffff" />
                </>
              )}
            </Pressable>
          </View>

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>Need Help?</Text>
            <Pressable style={styles.contactLink}>
              <Text style={styles.contactLinkText}>Contact Administrator</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100vh' as any,
    backgroundColor: '#F8FAFC',
  },
  leftPanel: {
    flex: 55,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    paddingHorizontal: 64,
    paddingVertical: 48,
    position: 'relative',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  watermarkContainer: {
    position: 'absolute',
    right: -40,
    bottom: -40,
    pointerEvents: 'none',
  },
  leftContent: {
    maxWidth: 520,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  logoIcon: {
    fontSize: 24,
  },
  brandTitle: {
    fontSize: 44,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 8,
  },
  brandTagline: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 28,
    width: 80,
  },
  singleSentence: {
    fontSize: 18,
    color: '#1E293B',
    lineHeight: 28,
    fontWeight: '500',
    marginBottom: 24,
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  securityText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  rightPanel: {
    flex: 45,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  loginCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 48,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeaderIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeHeading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  welcomeSubheading: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '500',
  },
  formGroup: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    outlineStyle: 'none' as any,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitButtonPressed: {
    backgroundColor: '#1D4ED8',
  },
  submitButtonLoading: {
    backgroundColor: '#1d4ed8',
    opacity: 0.9,
  },
  spinnerIcon: {
    animationDuration: '1s',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  contactLink: {
    paddingVertical: 2,
  },
  contactLinkText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
