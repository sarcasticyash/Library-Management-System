import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`card ${hoverEffect ? 'card-hover' : ''} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};
