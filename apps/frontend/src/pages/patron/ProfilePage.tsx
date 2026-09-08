import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, Calendar, Shield, Lock, Layers, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { userApi } from '../../api/user.api';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        'Must contain uppercase, lowercase, digit, and special character (@$!%*?&)',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof ChangePasswordSchema>;

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmitPassword = async (values: ChangePasswordFormValues) => {
    setPasswordSuccess(null);
    setPasswordError(null);

    try {
      const res = await userApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setPasswordSuccess(res.message);
      reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      setPasswordError(msg);
    }
  };

  if (!user) {
    return null;
  }

  const isSuspended = user.status === 'SUSPENDED';

  return (
    <div className="container page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Profile</h1>
          <p className="page-subtitle">View your membership details and update security settings</p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {/* Profile Card */}
        <Card style={{ padding: 'var(--space-6)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-full)',
                background:
                  'linear-gradient(135deg, var(--color-primary-600), var(--color-secondary-600))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <User size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                {user.firstName} {user.lastName}
              </h2>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                {user.email}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Shield size={14} />
                <span>Account Role</span>
              </span>
              <Badge variant="info">{user.role}</Badge>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Shield size={14} />
                <span>Account Status</span>
              </span>
              <Badge variant={isSuspended ? 'danger' : 'success'}>{user.status}</Badge>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Layers size={14} />
                <span>Active Loans</span>
              </span>
              <strong style={{ color: 'var(--color-text-primary)' }}>
                {user.activeBorrowCount} / 5 Checked Out
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Phone size={14} />
                <span>Phone Number</span>
              </span>
              <span>{user.phoneNumber || 'Not provided'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Calendar size={14} />
                <span>Member Since</span>
              </span>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card style={{ padding: 'var(--space-6)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <Lock size={18} style={{ color: 'var(--color-primary-400)' }} />
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Update Password</h2>
          </div>

          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Updating your password will revoke all other active sessions across devices.
          </p>

          {passwordSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--color-success-400)',
                fontSize: 'var(--font-size-sm)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <CheckCircle size={16} />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <ErrorAlert title="Password Update Failed" error={passwordError} />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmitPassword)} noValidate>
            <Input
              label="Current Password"
              type="password"
              leftIcon={<Lock size={16} />}
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />

            <Input
              label="New Password"
              type="password"
              leftIcon={<Lock size={16} />}
              error={errors.newPassword?.message}
              helperText="Min 8 chars, uppercase, lowercase, digit, & symbol"
              {...register('newPassword')}
            />

            <Input
              label="Confirm New Password"
              type="password"
              leftIcon={<Lock size={16} />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <div style={{ marginTop: 'var(--space-4)' }}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Save New Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
