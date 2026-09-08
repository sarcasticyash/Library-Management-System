import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, LogIn, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/user';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

export const LoginPage: React.FC = () => {
  const { login, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

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
      await login(values);

      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(redirect, { replace: true });
      } else {
        const dest = role === UserRole.ADMIN ? '/admin/dashboard' : '/books';
        navigate(dest, { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
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
      <div style={{ width: '100%', maxWidth: '440px' }}>
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
            Welcome Back
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Sign in to access your borrowed books and patron services
          </p>
        </div>

        <Card style={{ padding: 'var(--space-6)' }}>
          {serverError && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <ErrorAlert title="Sign In Failed" error={serverError} />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. patron@university.edu"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div style={{ marginTop: 'var(--space-6)' }}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                style={{ width: '100%' }}
                rightIcon={<LogIn size={18} />}
              >
                Sign In
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
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ fontWeight: 600 }}>
              Register as Patron
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
