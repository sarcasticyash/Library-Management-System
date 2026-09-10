import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpen,
  UserPlus,
  Lock,
  Mail,
  User,
  Phone,
  CheckCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  BookmarkCheck,
  Award,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

const RegisterSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required').max(50, 'Max 50 characters'),
    lastName: z.string().trim().min(1, 'Last name is required').max(50, 'Max 50 characters'),
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        'Must contain uppercase, lowercase, number, and special character (@$!%*?&)',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phoneNumber: z.string().trim().max(20, 'Max 20 characters').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof RegisterSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerUser, login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber || null,
      });

      // Auto-authenticate newly accredited scholar
      try {
        await login({
          email: values.email,
          password: values.password,
        });
      } catch {
        // Fallback gracefully
      }

      setRegistrationSuccess(true);
      setTimeout(() => {
        navigate('/books', { replace: true });
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
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
        {/* Left Column: Curatorial Archival Showcase */}
        <div className="auth-vault-panel">
          <div className="auth-vault-content">
            {/* Patron Admission Tier Badge */}
            <div className="auth-vault-badge-strip">
              <Sparkles size={13} style={{ color: '#d4af37' }} />
              <span>राष्ट्रीय सदस्यता • National Scholar Accreditation</span>
            </div>

            {/* Editorial Main Title */}
            <div>
              <h1 className="auth-vault-title">
                Join the Bharatiya Research &amp; Scholar Circle.
              </h1>
              <p
                style={{
                  color: '#e2dad0',
                  fontSize: 'var(--font-size-base)',
                  marginTop: 'var(--space-3)',
                  lineHeight: 1.6,
                }}
              >
                Accredited patrons enjoy privileged borrowing across premier Indian central
                universities, digitised Indic codices, and automated circulation.
              </p>
            </div>

            {/* Archival Privileges List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <BookmarkCheck
                  size={18}
                  style={{ color: '#d4af37', flexShrink: 0, marginTop: '2px' }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f6f3eb' }}>
                    Pan-India Inter-Library Loans
                  </div>
                  <div style={{ fontSize: '12px', color: '#c5bcb0' }}>
                    Borrow across participating IITs, IIMs, Central Universities, and National
                    Library Kolkata.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <Award size={18} style={{ color: '#d4af37', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f6f3eb' }}>
                    Rare Indic Codices &amp; Manuscripts
                  </div>
                  <div style={{ fontSize: '12px', color: '#c5bcb0' }}>
                    Access digitized Sanskrit, Pali, Persian, and Regional manuscripts from historic
                    repositories.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <ShieldCheck
                  size={18}
                  style={{ color: '#d4af37', flexShrink: 0, marginTop: '2px' }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f6f3eb' }}>
                    DigiLocker &amp; NAD Verified Privacy
                  </div>
                  <div style={{ fontSize: '12px', color: '#c5bcb0' }}>
                    Zero-leak cryptographic patron privacy governed by MeitY cyber standards and ISO
                    27001.
                  </div>
                </div>
              </div>
            </div>

            {/* Metric Highlights */}
            <div className="auth-vault-metrics">
              <div className="auth-metric-item">
                <span className="auth-metric-number">5 VOLUMES</span>
                <span className="auth-metric-label">Concurrent Quota</span>
              </div>
              <div className="auth-metric-item">
                <span className="auth-metric-number">28 DAYS</span>
                <span className="auth-metric-label">Circulation Term</span>
              </div>
              <div className="auth-metric-item">
                <span className="auth-metric-number">PAN-INDIA</span>
                <span className="auth-metric-label">Inter-Library Node</span>
              </div>
            </div>
          </div>

          {/* Compliance & Standards Footer */}
          <div className="auth-vault-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ShieldCheck size={14} style={{ color: '#10b981' }} />
              <span>MeitY Cyber Governance • DigiLocker / NAD Verified</span>
            </div>
            <span>WCAG 2.2 AA • RFC 7807 Standardized</span>
          </div>
        </div>

        {/* Right Column: Interactive Registration Folio */}
        <div className="auth-form-panel">
          {/* Top Bar: Back Link & Security Status */}
          <div className="auth-form-header-bar" style={{ maxWidth: '540px' }}>
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
              <span>BHARAT-NET ADMISSION NODE</span>
            </div>
          </div>

          {/* The Main Authentication Card */}
          <div className="auth-card-folio register-width">
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

              <h2 className="auth-card-title">Create Scholar &amp; Patron Account</h2>
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
                Register your academic profile to unlock national library circulation and reading
                lists.
              </p>
            </div>

            {/* Success Notification State */}
            {registrationSuccess ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-8) var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(22, 163, 74, 0.15)',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(22, 163, 74, 0.3)',
                  }}
                >
                  <CheckCircle size={32} />
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-family-display)',
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 700,
                    color: '#171412',
                  }}
                >
                  Patron Card Issued Successfully
                </h3>
                <p style={{ fontSize: 'var(--font-size-sm)', color: '#6e675e', maxWidth: '340px' }}>
                  Your scholar credentials have been accredited. Accessing the National Digital
                  Library catalog...
                </p>
              </div>
            ) : (
              <>
                {/* Server Error Alert */}
                {serverError && (
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <ErrorAlert title="Registration Failed" error={serverError} />
                  </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  {/* First & Last Name (2 columns) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div className="auth-input-group">
                      <label htmlFor="reg-first-name" className="auth-input-label">
                        First Name
                      </label>
                      <div className="auth-input-wrapper">
                        <span className="auth-input-icon">
                          <User size={16} />
                        </span>
                        <input
                          id="reg-first-name"
                          type="text"
                          placeholder="e.g. Arjun"
                          className={`auth-input-field ${errors.firstName ? 'has-error' : ''}`}
                          {...register('firstName')}
                        />
                      </div>
                      {errors.firstName && (
                        <div className="form-error" style={{ fontSize: '11px', marginTop: '3px' }}>
                          {errors.firstName.message}
                        </div>
                      )}
                    </div>

                    <div className="auth-input-group">
                      <label htmlFor="reg-last-name" className="auth-input-label">
                        Last Name
                      </label>
                      <div className="auth-input-wrapper">
                        <span className="auth-input-icon">
                          <User size={16} />
                        </span>
                        <input
                          id="reg-last-name"
                          type="text"
                          placeholder="e.g. Sharma"
                          className={`auth-input-field ${errors.lastName ? 'has-error' : ''}`}
                          {...register('lastName')}
                        />
                      </div>
                      {errors.lastName && (
                        <div className="form-error" style={{ fontSize: '11px', marginTop: '3px' }}>
                          {errors.lastName.message}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="auth-input-group">
                    <label htmlFor="reg-email" className="auth-input-label">
                      Institutional Email
                    </label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">
                        <Mail size={16} />
                      </span>
                      <input
                        id="reg-email"
                        type="email"
                        placeholder="e.g. scholar@iitd.ac.in or patron@du.ac.in"
                        className={`auth-input-field ${errors.email ? 'has-error' : ''}`}
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <div className="form-error" style={{ fontSize: '11px', marginTop: '3px' }}>
                        {errors.email.message}
                      </div>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="auth-input-group">
                    <label htmlFor="reg-phone" className="auth-input-label">
                      Phone Number{' '}
                      <span style={{ textTransform: 'none', fontWeight: 400, color: '#8c8577' }}>
                        (Optional)
                      </span>
                    </label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">
                        <Phone size={16} />
                      </span>
                      <input
                        id="reg-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        className={`auth-input-field ${errors.phoneNumber ? 'has-error' : ''}`}
                        {...register('phoneNumber')}
                      />
                    </div>
                    {errors.phoneNumber && (
                      <div className="form-error" style={{ fontSize: '11px', marginTop: '3px' }}>
                        {errors.phoneNumber.message}
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div className="auth-input-group">
                    <label htmlFor="reg-password" className="auth-input-label">
                      Password
                    </label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">
                        <Lock size={16} />
                      </span>
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 chars (upper, lower, num, symbol)"
                        className={`auth-input-field ${errors.password ? 'has-error' : ''}`}
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
                      <div className="form-error" style={{ fontSize: '11px', marginTop: '3px' }}>
                        {errors.password.message}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="auth-input-group">
                    <label htmlFor="reg-confirm-password" className="auth-input-label">
                      Confirm Password
                    </label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">
                        <Lock size={16} />
                      </span>
                      <input
                        id="reg-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-type password"
                        className={`auth-input-field ${errors.confirmPassword ? 'has-error' : ''}`}
                        {...register('confirmPassword')}
                      />
                      <button
                        type="button"
                        className="auth-input-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label="Toggle confirm visibility"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <div className="form-error" style={{ fontSize: '11px', marginTop: '3px' }}>
                        {errors.confirmPassword.message}
                      </div>
                    )}
                  </div>

                  {/* Submit CTA Button */}
                  <button
                    type="submit"
                    className="auth-primary-btn"
                    disabled={isSubmitting}
                    aria-label="Create Patron Account"
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
                        <span>Enrolling Scholar Profile...</span>
                      </>
                    ) : (
                      <>
                        <span>Enroll &amp; Issue Scholar Card</span>
                        <UserPlus size={16} />
                      </>
                    )}
                  </button>
                </form>

                {/* Switcher to Login */}
                <div className="auth-switch-box">
                  <span>Already an accredited scholar? </span>
                  <Link to="/login" className="auth-switch-link">
                    Sign In &rarr;
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Micro Legal Footer */}
          <footer className="auth-legal-footer" style={{ maxWidth: '540px' }}>
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
