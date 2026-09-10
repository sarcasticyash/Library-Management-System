import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpen,
  LogIn,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Library,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

import { getSafeRedirectDestination } from '../../utils/redirect.util';

type LoginFormValues = z.infer<typeof LoginSchema>;

export const LoginPage: React.FC = () => {
  const { login, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const loggedInUser = await login(values);
      const rawRedirect = searchParams.get('redirect');
      const destination = getSafeRedirectDestination(rawRedirect, loggedInUser?.role || role);
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <div
      className="auth-portal-wrapper animate-fade-in"
      style={{
        backgroundImage: "url('/indian-heritage-library.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="auth-portal-grid">
        {/* Left Column: Curatorial Archival Vault Showcase */}
        <div className="auth-vault-panel">
          <div className="auth-vault-content">
            {/* Accession Tier Badge */}
            <div className="auth-vault-badge-strip">
              <Sparkles size={13} style={{ color: '#d4af37' }} />
              <span>राष्ट्रीय अभिलेखागार • National Digital Library Node</span>
            </div>

            {/* Editorial Main Title */}
            <div>
              <h1 className="auth-vault-title">The National Digital Library of India.</h1>
              <p
                style={{
                  color: '#e2dad0',
                  fontSize: 'var(--font-size-base)',
                  marginTop: 'var(--space-3)',
                  lineHeight: 1.6,
                }}
              >
                Federated digital repository connecting premier Indian universities, IITs, Central
                Archives, and rare Indic manuscripts.
              </p>
            </div>

            {/* Archival Quote */}
            <blockquote className="auth-vault-quote">
              &ldquo;सा विद्या या विमुक्तये — That which liberates is knowledge. Preserving the
              intellectual heritage from Nalanda and Takshashila to modern Indian academia.&rdquo;
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
                — Bharatiya Granthagar Parishad • National Library of India Est. 1891
              </footer>
            </blockquote>

            {/* Metric Highlights */}
            <div className="auth-vault-metrics">
              <div className="auth-metric-item">
                <span className="auth-metric-number">148,000+</span>
                <span className="auth-metric-label">Rare Manuscripts</span>
              </div>
              <div className="auth-metric-item">
                <span className="auth-metric-number">NDLI / UGC</span>
                <span className="auth-metric-label">Federated Network</span>
              </div>
              <div className="auth-metric-item">
                <span className="auth-metric-number">DIGILOCKER</span>
                <span className="auth-metric-label">Verified Access</span>
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
                  Federated with IIT Kharagpur NDLI, Saraswathi Mahal &amp; Shodhganga
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

        {/* Right Column: Sign-In Folio Form */}
        <div className="auth-form-panel">
          {/* Top Bar: Back Link & Security Status */}
          <div className="auth-form-header-bar">
            <Link to="/" className="auth-back-link" title="Return to National Archive">
              <ArrowLeft size={14} />
              <span>Return to Archive</span>
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

          {/* The Main Authentication Card */}
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

              <h2 className="auth-card-title">Scholar &amp; Patron Sign In</h2>
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
                Enter your verified institutional credentials (e.g. .ac.in, .edu.in, or .gov.in) to
                access circulation records.
              </p>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <ErrorAlert title="Authentication Error" error={serverError} />
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Email Address */}
              <div className="auth-input-group">
                <label htmlFor="login-email" className="auth-input-label">
                  Email Address
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="e.g. scholar@iitd.ac.in or patron@du.ac.in"
                    className={`auth-input-field ${errors.email ? 'has-error' : ''}`}
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <div className="form-error" style={{ fontSize: '12px', marginTop: '4px' }}>
                    {errors.email.message}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="auth-input-group">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  <label
                    htmlFor="login-password"
                    className="auth-input-label"
                    style={{ margin: 0 }}
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: '#f14616',
                      textDecoration: 'none',
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                      transition: 'color var(--transition-fast)',
                    }}
                    className="auth-forgot-link"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    className={`auth-input-field ${errors.password ? 'has-error' : ''}`}
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="auth-input-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle visibility"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <div className="form-error" style={{ fontSize: '12px', marginTop: '4px' }}>
                    {errors.password.message}
                  </div>
                )}
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                className="auth-primary-btn"
                disabled={isSubmitting}
                aria-label="Sign In"
              >
                {isSubmitting ? (
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
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Granthagar</span>
                    <LogIn size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Switcher to Register */}
            <div className="auth-switch-box">
              <span>Don&apos;t have an institutional account? </span>
              <Link to="/register" className="auth-switch-link">
                Register as Patron (Indian &amp; Global Scholars) &rarr;
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
