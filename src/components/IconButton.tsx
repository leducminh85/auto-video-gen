import React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: React.ReactNode;
}
export function IconButton({ label, children, className = '', ...props }: Props) {
  return <button type="button" {...props} className={`icon-button ${className}`} aria-label={label} title={label}>{children}</button>;
}
