import { cx } from '../../utils/format';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return <section className={cx('min-w-0 overflow-hidden rounded-lg border border-line bg-panel shadow-card', className)}>{children}</section>;
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cx('border-b border-line px-5 py-4', className)}>{children}</div>;
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cx('p-5', className)}>{children}</div>;
}
