import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Shield, ShieldAlert, CheckCircle } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { UserStatus } from '../../types/user';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

export const UserManagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [targetUserId, setTargetUserId] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const statusMutation = useMutation({
    mutationFn: ({
      userId,
      status,
      reason,
    }: {
      userId: string;
      status: UserStatus;
      reason?: string;
    }) => adminApi.updateUserStatus(userId, { status, suspensionReason: reason }),
    onSuccess: (updatedUser) => {
      setIsSuspendModalOpen(false);
      setSuspensionReason('');
      setActionSuccess(`User ${updatedUser.email} status changed to ${updatedUser.status}.`);
      void queryClient.invalidateQueries({ queryKey: ['admin-kpis'] });
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Status update failed');
    },
  });

  const handleOpenSuspend = (userId: string) => {
    setTargetUserId(userId);
    setSuspensionReason('');
    setActionError(null);
    setActionSuccess(null);
    setIsSuspendModalOpen(true);
  };

  const handleReactivate = (userId: string) => {
    setActionError(null);
    setActionSuccess(null);
    statusMutation.mutate({ userId, status: UserStatus.ACTIVE });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Patron Account Directory</h1>
          <p className="page-subtitle">
            Inspect registered patron accounts and enforce operational status controls
          </p>
        </div>
      </div>

      {actionSuccess && (
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
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <ErrorAlert title="User Status Action Failed" error={actionError} />
        </div>
      )}

      {/* Lookup Card */}
      <Card style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-6)' }}>
        <h2
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 600,
            marginBottom: 'var(--space-3)',
          }}
        >
          Manage Patron Status by Identifier
        </h2>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Enter an operational MongoDB User ID to update account status (Suspend or Reactivate).
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-3)', maxWidth: '540px' }}>
          <Input
            placeholder="e.g. 66dbc91f8a84a0c81ef40d12"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            leftIcon={<User size={16} />}
          />
          <Button
            variant="danger"
            disabled={!targetUserId.trim()}
            onClick={() => handleOpenSuspend(targetUserId.trim())}
            leftIcon={<ShieldAlert size={16} />}
          >
            Suspend
          </Button>
          <Button
            variant="secondary"
            disabled={!targetUserId.trim()}
            onClick={() => handleReactivate(targetUserId.trim())}
            leftIcon={<Shield size={16} />}
          >
            Reactivate
          </Button>
        </div>
      </Card>

      {/* Directory Information Card */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <h3
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 600,
            marginBottom: 'var(--space-2)',
          }}
        >
          Account Status Rules & Governance (FR-ADMIN-005)
        </h3>
        <ul
          style={{
            paddingLeft: 'var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <li>
            <Badge variant="success">ACTIVE</Badge>: Patron can browse catalog, checkout books (up
            to 5 active loans), and perform self-service returns.
          </li>
          <li>
            <Badge variant="danger">SUSPENDED</Badge>: Patron is barred from new checkouts and
            profile modifications. Active sessions are revoked. Return workflows remain active so
            patrons can resolve loan debt.
          </li>
          <li>
            Account suspension requires a mandatory audit trail explanation string (5 to 500
            characters) for regulatory non-repudiation.
          </li>
        </ul>
      </Card>

      {/* Suspension Modal */}
      <Modal
        isOpen={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        title="Confirm Account Suspension"
        footer={
          <>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setIsSuspendModalOpen(false)}
              disabled={statusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              disabled={suspensionReason.trim().length < 5}
              isLoading={statusMutation.isPending}
              onClick={() => {
                statusMutation.mutate({
                  userId: targetUserId,
                  status: UserStatus.SUSPENDED,
                  reason: suspensionReason.trim(),
                });
              }}
            >
              Confirm Suspension
            </Button>
          </>
        }
      >
        <div>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            You are suspending account <code>{targetUserId}</code>. This action immediately revokes
            active refresh tokens and prevents new borrowing.
          </p>

          <div className="form-group">
            <label className="form-label">Mandatory Suspension Reason (5–500 chars)</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Provide justification for audit log (e.g. Delinquent overdue books exceeding 30 days)..."
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
