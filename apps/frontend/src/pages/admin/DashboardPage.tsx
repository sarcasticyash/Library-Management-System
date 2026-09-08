import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Layers, Users, AlertTriangle, CheckCircle2, Clock, UserX } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-kpis'],
    queryFn: () => adminApi.getDashboardKpis(),
  });

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Executive Operations Dashboard</h1>
          <p className="page-subtitle">Real-time operational KPIs aggregated from MongoDB Atlas</p>
        </div>

        {data && (
          <Badge variant="neutral" icon={<Clock size={12} />}>
            Calculated: {new Date(data.calculatedAt).toLocaleTimeString()}
          </Badge>
        )}
      </div>

      {isLoading && <LoadingSpinner message="Calculating system telemetry..." />}

      {error && (
        <ErrorAlert
          title="Failed to Load Operational KPIs"
          error={error instanceof Error ? error.message : 'Error fetching telemetry'}
          onRetry={() => void refetch()}
        />
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          {/* Catalog Metrics */}
          <div>
            <h2
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 600,
                color: 'var(--color-primary-400)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <BookOpen size={16} />
              <span>Catalog Holdings</span>
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              <Card hoverEffect>
                <span
                  style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}
                >
                  Total Catalog Titles
                </span>
                <div
                  style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 700,
                    marginTop: 'var(--space-1)',
                  }}
                >
                  {data.catalog.totalTitles}
                </div>
              </Card>

              <Card hoverEffect>
                <span
                  style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}
                >
                  Total Physical Volumes
                </span>
                <div
                  style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 700,
                    marginTop: 'var(--space-1)',
                  }}
                >
                  {data.catalog.totalCopies}
                </div>
              </Card>

              <Card hoverEffect>
                <span
                  style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}
                >
                  Available Copies On Shelf
                </span>
                <div
                  style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 700,
                    color: 'var(--color-success-400)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  {data.catalog.availableCopies}
                </div>
              </Card>
            </div>
          </div>

          {/* Circulation Volume */}
          <div>
            <h2
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 600,
                color: 'var(--color-secondary-400)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Layers size={16} />
              <span>Circulation Volume</span>
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              <Card hoverEffect>
                <span
                  style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}
                >
                  Active Borrowings
                </span>
                <div
                  style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 700,
                    color: 'var(--color-primary-400)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  {data.circulation.activeLoans}
                </div>
              </Card>

              <Card
                hoverEffect
                style={{
                  borderColor:
                    data.circulation.overdueLoans > 0 ? 'rgba(239, 68, 68, 0.4)' : undefined,
                }}
              >
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger-400)' }}>
                  Overdue Obligations
                </span>
                <div
                  style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 700,
                    color: 'var(--color-danger-400)',
                    marginTop: 'var(--space-1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <span>{data.circulation.overdueLoans}</span>
                  {data.circulation.overdueLoans > 0 && <AlertTriangle size={24} />}
                </div>
              </Card>
            </div>
          </div>

          {/* Patron Community */}
          <div>
            <h2
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Users size={16} />
              <span>Patron Directory</span>
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              <Card hoverEffect>
                <span
                  style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}
                >
                  Total Registered Accounts
                </span>
                <div
                  style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 700,
                    marginTop: 'var(--space-1)',
                  }}
                >
                  {data.users.totalRegisteredUsers}
                </div>
              </Card>

              <Card hoverEffect>
                <span
                  style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success-400)' }}
                >
                  Active Patrons in Good Standing
                </span>
                <div
                  style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 700,
                    color: 'var(--color-success-400)',
                    marginTop: 'var(--space-1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <span>{data.users.activePatrons}</span>
                  <CheckCircle2 size={24} />
                </div>
              </Card>

              <Card hoverEffect>
                <span
                  style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-warning-400)' }}
                >
                  Suspended Accounts
                </span>
                <div
                  style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 700,
                    color: 'var(--color-warning-400)',
                    marginTop: 'var(--space-1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <span>{data.users.suspendedPatrons}</span>
                  <UserX size={24} />
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
