import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, UserPlus, Lock, Mail, User, Phone, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
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
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

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

      setRegistrationSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <div
      className="container page-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 200px)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background:
                'linear-gradient(135deg, var(--color-primary-600), var(--color-secondary-600))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              marginBottom: 'var(--space-3)',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
            }}
          >
            <BookOpen size={24} />
          </div>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Create Patron Account
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Join the library to borrow books and access circulation history
          </p>
        </div>

        <Card style={{ padding: 'var(--space-6)' }}>
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
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: 'var(--color-success-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={32} />
              </div>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                Account Created Successfully!
              </h2>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Redirecting you to the sign-in screen...
              </p>
            </div>
          ) : (
            <>
              {serverError && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <ErrorAlert title="Registration Failed" error={serverError} />
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}
                >
                  <Input
                    label="First Name"
                    placeholder="John"
                    leftIcon={<User size={16} />}
                    error={errors.firstName?.message}
                    {...register('firstName')}
                  />
                  <Input
                    label="Last Name"
                    placeholder="Doe"
                    leftIcon={<User size={16} />}
                    error={errors.lastName?.message}
                    {...register('lastName')}
                  />
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="patron@university.edu"
                  leftIcon={<Mail size={16} />}
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  label="Phone Number (Optional)"
                  type="tel"
                  placeholder="+1 (555) 012-3456"
                  leftIcon={<Phone size={16} />}
                  error={errors.phoneNumber?.message}
                  {...register('phoneNumber')}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock size={16} />}
                  helperText="Min 8 chars with uppercase, lowercase, digit, & special character"
                  error={errors.password?.message}
                  {...register('password')}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock size={16} />}
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />

                <div style={{ marginTop: 'var(--space-6)' }}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    style={{ width: '100%' }}
                    rightIcon={<UserPlus size={18} />}
                  >
                    Create Account
                  </Button>
                </div>
              </form>

              <div
                style={{
                  marginTop: 'var(--space-6)',
                  paddingTop: 'var(--space-4)',
                  borderTop: '1px solid var(--color-border-subtle)',
                  textAlign: 'center',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Already have an account?{' '}
                <Link to="/login" style={{ fontWeight: 600 }}>
                  Sign In
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
