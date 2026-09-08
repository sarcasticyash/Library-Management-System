import React from 'react';

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
  className = '',
  style,
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()} style={style}>
      {icon}
      <span>{children}</span>
    </span>
  );
};
