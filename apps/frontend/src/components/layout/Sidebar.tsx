import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, Layers, ClipboardList, ShieldCheck } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside
      aria-label="Administrative Console Navigation"
      style={{
        width: '240px',
        backgroundColor: 'var(--color-bg-surface)',
        borderRight: '1px solid var(--color-border-subtle)',
        padding: 'var(--space-6) var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: '0 var(--space-2) var(--space-4)',
          borderBottom: '1px solid var(--color-border-subtle)',
          marginBottom: 'var(--space-2)',
          color: 'var(--color-primary-400)',
          fontWeight: 600,
          fontSize: 'var(--font-size-xs)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        <ShieldCheck size={16} />
        <span>Admin Console</span>
      </div>

      <NavLink
        to="/admin/dashboard"
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      >
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </NavLink>

      <NavLink
        to="/admin/books"
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      >
        <BookOpen size={18} />
        <span>Manage Books</span>
      </NavLink>

      <NavLink
        to="/admin/users"
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      >
        <Users size={18} />
        <span>User Directory</span>
      </NavLink>

      <NavLink
        to="/admin/circulation"
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      >
        <Layers size={18} />
        <span>Circulation</span>
      </NavLink>

      <NavLink
        to="/admin/audit-logs"
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      >
        <ClipboardList size={18} />
        <span>Audit Logs</span>
      </NavLink>
    </aside>
  );
};
