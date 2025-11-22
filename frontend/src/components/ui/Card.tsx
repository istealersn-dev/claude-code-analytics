import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface CardProps {
  className?: string;
  children: ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-black/50 border border-primary-500/20 rounded-lg backdrop-blur-sm',
        'hover:border-primary-500/40 transition-colors',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  className?: string;
  children: ReactNode;
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return <div className={clsx('p-6 pb-4', className)}>{children}</div>;
}

interface CardContentProps {
  className?: string;
  children: ReactNode;
}

export function CardContent({ className, children }: CardContentProps) {
  return <div className={clsx('px-6 pb-6', className)}>{children}</div>;
}

interface CardTitleProps {
  className?: string;
  children: ReactNode;
}

export function CardTitle({ className, children }: CardTitleProps) {
  return <h3 className={clsx('text-lg font-semibold text-white', className)}>{children}</h3>;
}

interface CardDescriptionProps {
  className?: string;
  children: ReactNode;
}

export function CardDescription({ className, children }: CardDescriptionProps) {
  return <p className={clsx('text-sm text-gray-400', className)}>{children}</p>;
}
