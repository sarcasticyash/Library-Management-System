import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpen,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  Library,
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

// Step 1: Email Request Schema
const RequestResetSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid institutional scholar email'),
});
type RequestResetFormValues = z.infer<typeof RequestResetSchema>;

// Step 2: Code + New Password Schema
const ConfirmResetSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Please enter a valid email'),
    code: z.string().trim().min(4, 'Recovery code is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type ConfirmResetFormValues = z.infer<typeof ConfirmResetSchema>;

type ResetStep = 'REQUEST' | 'VERIFY' | 'SUCCESS';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<ResetStep>('REQUEST');
  const [targetEmail, setTargetEmail] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1 Hook Form
  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: requestErrors, isSubmitting: isSubmittingRequest },
  } = useForm<RequestResetFormValues>({
    resolver: zodResolver(RequestResetSchema),
    defaultValues: { email: '' },
  });

  // Step 2 Hook Form
  const {
    register: registerConfirm,
    handleSubmit: handleSubmitConfirm,
    setValue: setConfirmValue,
    formState: { errors: confirmErrors, isSubmitting: isSubmittingConfirm },
  } = useForm<ConfirmResetFormValues>({
    resolver: zodResolver(ConfirmResetSchema),
    defaultValues: {
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Handle Step 1 Submission
  const onRequestSubmit = async (values: RequestResetFormValues) => {
    setServerError(null);
    try {
      const res = await authApi.forgotPassword(values);
      setTargetEmail(values.email);
      setConfirmValue('email', values.email);
      if (res.simulatedCode) {
        setSimulatedCode(res.simulatedCode);
        setConfirmValue('code', res.simulatedCode);
      }
      setStep('VERIFY');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Unable to process recovery request. Please try again.');
      }
    }
  };

  // Handle Step 2 Submission
  const onConfirmSubmit = async (values: ConfirmResetFormValues) => {
    setServerError(null);
    try {
      await authApi.resetPassword({
        email: values.email,
        code: values.code,
        newPassword: values.newPassword,
      });
      setStep('SUCCESS');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Failed to reset password. Please check your verification code.');
      }
    }
  };

  return (
    <div className="auth-split-wrapper">
      <div className="auth-split-container">
        {/* Left Column: Archival Vault Showcase */}
        <div className="auth-vault-panel">
          <div className="auth-vault-pattern-overlay" />
          <div className="auth-vault-content">
            {/* National Emblem Badge */}
            <div className="auth-badge-pill">
              <span className="auth-ashoka-chakra-emblem" aria-hidden="true">
                ☸
              </span>
              <span>Grantha Archival Vault • Security Protocol</span>
            </div>

            {/* Typography Title */}
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#d4af37',
                  textTransform: 'uppercase',
                  marginBottom: 'var(--space-2)',
                  fontFamily: 'var(--font-family-mono)',
                }}
              >
                Government of India • Ministry of Education (MoE)
              </span>
              <h1
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: 'clamp(2rem, 3.2vw, 3rem)',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                }}
              >
                Nālandā National Digital Archive.
              </h1>
              <p
                style={{
                  color: '#e2dad0',
                  fontSize: 'var(--font-size-base)',
                  marginTop: 'var(--space-3)',
                  lineHeight: 1.6,
                }}
              >
                Secure credential management and identity recovery for researchers, scholars, and
                library custodians across India.
              </p>
            </div>

            {/* Archival Quote */}
            <blockquote className="auth-vault-quote">
              &ldquo;सा विद्या या विमुक्तये — Knowledge is the true liberator. Protecting
              intellectual identity through cryptographically resilient governance.&rdquo;
              <footer
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: '#d4af37',
                  marginTop: 'var(--space-2)',
                  fontStyle: 'normal',
                  fontFamily: 'var(--font-family-mono)',
                  letterSpacing: '0.04em',
                }}
              >
                — Bharatiya Granthagar Parishad • Est. 1891
              </footer>
            </blockquote>

            {/* Metric Highlights */}
            <div className="auth-vault-metrics">
              <div className="auth-metric-item">
                <span className="auth-metric-number">256-BIT</span>
                <span className="auth-metric-label">Vault Encryption</span>
              </div>
              <div className="auth-metric-item">
                <span className="auth-metric-number">NDLI / UGC</span>
                <span className="auth-metric-label">Identity Network</span>
              </div>
              <div className="auth-metric-item">
                <span className="auth-metric-number">ZERO LEAK</span>
                <span className="auth-metric-label">RFC 7807 Security</span>
              </div>
            </div>

            {/* Institutional Seal Graphic */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-4)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px dashed rgba(212, 175, 55, 0.4)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid #d4af37',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d4af37',
                  flexShrink: 0,
                }}
              >
                <Library size={22} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: '#f6f3eb',
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-family-mono)',
                  }}
                >
                  INFLIBNET &amp; National Digital Library Consortia
                </div>
                <div style={{ fontSize: '12px', color: '#c5bcb0', marginTop: '2px' }}>
                  Federated scholar identity verification with IIT Kharagpur NDLI &amp; Shodhganga
                </div>
              </div>
            </div>
          </div>

          {/* Compliance & Standards Footer */}
          <div className="auth-vault-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ShieldCheck size={14} style={{ color: '#10b981' }} />
              <span>MeitY Cyber Governance • DigiLocker / Aadhaar Authentication Ready</span>
            </div>
            <span>ISO/IEC 27001 • RFC 7807 Standardized</span>
          </div>
        </div>

        {/* Right Column: Recovery Folio Form */}
        <div className="auth-form-panel">
          {/* Top Bar: Back Link & Security Status */}
          <div className="auth-form-header-bar">
            <Link to="/login" className="auth-back-link" title="Return to Sign In">
              <ArrowLeft size={14} />
              <span>Return to Sign In</span>
            </Link>

            <div className="auth-security-status">
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#16a34a',
                  display: 'inline-block',
                }}
              />
              <span>BHARAT-NET SECURE NODE</span>
            </div>
          </div>

          {/* Main Card Folio */}
          <div className="auth-card-folio">
            {/* Brand Insignia */}
            <div style={{ textAlign: 'center' }}>
              <Link
                to="/"
                title="Nālandā National Digital Archive Home"
                aria-label="Return to Nālandā Digital Archive"
                style={{ display: 'inline-block' }}
              >
                <div className="auth-brand-emblem">
                  <BookOpen size={24} strokeWidth={2.2} />
                </div>
              </Link>

              <h2 className="auth-card-title">
                {step === 'REQUEST' && 'Reset Scholar Password'}
                {step === 'VERIFY' && 'Enter Verification Code'}
                {step === 'SUCCESS' && 'Password Updated'}
              </h2>

              <div
                style={{
                  width: '40px',
                  height: '2.5px',
                  background: 'linear-gradient(90deg, #d4af37 0%, #f14616 100%)',
                  margin: '8px auto 14px',
                  borderRadius: '2px',
                }}
              />

              <p className="auth-card-subtitle">
                {step === 'REQUEST' &&
                  'Enter your registered institutional email address. We will generate an archival verification code to recover your account.'}
                {step === 'VERIFY' &&
                  `We sent an archival verification code for ${targetEmail}. Please specify the code and set your new password.`}
                {step === 'SUCCESS' &&
                  'Your password has been successfully updated in the National Granthagar Ledger. You can now authenticate with your new credentials.'}
              </p>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <ErrorAlert title="Recovery Error" error={serverError} />
              </div>
            )}

            {/* STEP 1: REQUEST CODE */}
            {step === 'REQUEST' && (
              <form onSubmit={handleSubmitRequest(onRequestSubmit)} noValidate>
                <div className="auth-input-group">
                  <label htmlFor="recovery-email" className="auth-input-label">
                    Registered Scholar Email
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <Mail size={16} />
                    </span>
                    <input
                      id="recovery-email"
                      type="email"
                      placeholder="e.g. scholar@iitd.ac.in or patron@du.ac.in"
                      className={`auth-input-field ${requestErrors.email ? 'has-error' : ''}`}
                      aria-invalid={!!requestErrors.email}
                      {...registerRequest('email')}
                    />
                  </div>
                  {requestErrors.email && (
                    <div className="form-error" style={{ fontSize: '12px', marginTop: '4px' }}>
                      {requestErrors.email.message}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-primary-btn"
                  disabled={isSubmittingRequest}
                  aria-label="Send Archival Recovery Code"
                >
                  {isSubmittingRequest ? (
                    <>
                      <span
                        className="animate-spin"
                        style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#ffffff',
                          borderRadius: '50%',
                        }}
                      />
                      <span>Dispatching Token...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Token</span>
                      <KeyRound size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY CODE & SET NEW PASSWORD */}
            {step === 'VERIFY' && (
              <form onSubmit={handleSubmitConfirm(onConfirmSubmit)} noValidate>
                {/* Simulated Token Banner for Sandbox & Fast Verification */}
                {simulatedCode && (
                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(212, 175, 55, 0.1)',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--space-4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: '#171412' }}>Simulated OTP: </span>
                      <code
                        style={{
                          background: '#171412',
                          color: '#d4af37',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                        }}
                      >
                        {simulatedCode}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmValue('code', simulatedCode)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f14616',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '11px',
                        textDecoration: 'underline',
                      }}
                    >
                      Use code
                    </button>
                  </div>
                )}

                {/* Email (Readonly Display) */}
                <div className="auth-input-group">
                  <label htmlFor="confirm-email" className="auth-input-label">
                    Scholar Account Email
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <Mail size={16} />
                    </span>
                    <input
                      id="confirm-email"
                      type="email"
                      readOnly
                      className="auth-input-field"
                      style={{ backgroundColor: '#f5f1e9', color: '#5c554b' }}
                      {...registerConfirm('email')}
                    />
                  </div>
                </div>

                {/* Verification Code */}
                <div className="auth-input-group">
                  <label htmlFor="reset-code" className="auth-input-label">
                    Verification Code (OTP)
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <KeyRound size={16} />
                    </span>
                    <input
                      id="reset-code"
                      type="text"
                      placeholder="e.g. GRANTHA-8821"
                      className={`auth-input-field ${confirmErrors.code ? 'has-error' : ''}`}
                      aria-invalid={!!confirmErrors.code}
                      {...registerConfirm('code')}
                    />
                  </div>
                  {confirmErrors.code && (
                    <div className="form-error" style={{ fontSize: '12px', marginTop: '4px' }}>
                      {confirmErrors.code.message}
                    </div>
                  )}
                </div>

                {/* New Password */}
                <div className="auth-input-group">
                  <label htmlFor="reset-new-password" className="auth-input-label">
                    New Password
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <Lock size={16} />
                    </span>
                    <input
                      id="reset-new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 8 chars (Uppercase, Lowercase, Number)"
                      className={`auth-input-field ${confirmErrors.newPassword ? 'has-error' : ''}`}
                      aria-invalid={!!confirmErrors.newPassword}
                      {...registerConfirm('newPassword')}
                    />
                    <button
                      type="button"
                      className="auth-input-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmErrors.newPassword && (
                    <div className="form-error" style={{ fontSize: '12px', marginTop: '4px' }}>
                      {confirmErrors.newPassword.message}
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="auth-input-group">
                  <label htmlFor="reset-confirm-password" className="auth-input-label">
                    Confirm New Password
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <Lock size={16} />
                    </span>
                    <input
                      id="reset-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-type new password"
                      className={`auth-input-field ${confirmErrors.confirmPassword ? 'has-error' : ''}`}
                      aria-invalid={!!confirmErrors.confirmPassword}
                      {...registerConfirm('confirmPassword')}
                    />
                    <button
                      type="button"
                      className="auth-input-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmErrors.confirmPassword && (
                    <div className="form-error" style={{ fontSize: '12px', marginTop: '4px' }}>
                      {confirmErrors.confirmPassword.message}
                    </div>
                  )}
                </div>

                {/* Submit Reset */}
                <button
                  type="submit"
                  className="auth-primary-btn"
                  disabled={isSubmittingConfirm}
                  aria-label="Update Password"
                >
                  {isSubmittingConfirm ? (
                    <>
                      <span
                        className="animate-spin"
                        style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#ffffff',
                          borderRadius: '50%',
                        }}
                      />
                      <span>Updating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password &amp; Update Ledger</span>
                      <ShieldCheck size={16} />
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
                  <button
                    type="button"
                    onClick={() => setStep('REQUEST')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#7d7568',
                      fontSize: 'var(--font-size-xs)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    &larr; Request a different email or resend code
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS STATE */}
            {step === 'SUCCESS' && (
              <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    border: '2px solid #16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                    color: '#16a34a',
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>

                <h3
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 700,
                    color: '#171412',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Credentials Successfully Updated
                </h3>

                <p
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: '#5c554b',
                    lineHeight: 1.6,
                    maxWidth: '380px',
                    margin: '0 auto var(--space-6)',
                  }}
                >
                  Your institutional password has been securely synchronized across the National
                  Digital Library network. You can now access your scholar dashboard.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="auth-primary-btn"
                  style={{ marginTop: 0 }}
                  aria-label="Proceed to Sign In"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                </button>
              </div>
            )}

            {/* Switcher back to Sign In */}
            <div className="auth-switch-box">
              <span>Remembered your institutional credentials? </span>
              <Link to="/login" className="auth-switch-link">
                Sign In to Granthagar &rarr;
              </Link>
            </div>
          </div>

          {/* Micro Legal Footer */}
          <footer className="auth-legal-footer">
            <p>
              Bharatiya Granthagar Network • Governed by MeitY Guidelines &amp; RFC 7807 Protocols.
            </p>
            <p style={{ marginTop: '2px', color: '#a8a196' }}>
              &copy; 2026 National Library of India &amp; Cloud-Native LMS Consortium. All rights
              reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};
