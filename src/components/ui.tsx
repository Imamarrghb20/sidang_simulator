import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

type IconName = 'home' | 'file' | 'chat' | 'target' | 'arrow' | 'plus' | 'menu' | 'close' | 'refresh' | 'check' | 'alert' | 'book';
const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></>,
  file: <><path d="M14 3H5v18h14V8Z" /><path d="M14 3v5h5M8 12h8M8 16h6" /></>,
  chat: <><path d="M21 11a8 8 0 0 1-8 8H7l-4 3V5a2 2 0 0 1 2-2h8a8 8 0 0 1 8 8Z" /><path d="M7 8h9M7 12h6" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="m12 12 7-7M16 3h5v5" /></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  refresh: <><path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6m0 3h.01" /></>,
  book: <><path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z" /></>,
};
export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`icon ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; loading?: boolean }>(function Button({ variant = 'primary', loading = false, className = '', children, disabled, type = 'button', ...props }, ref) {
  return <button {...props} ref={ref} type={type} className={`button button-${variant} ${className}`} disabled={disabled || loading}>{loading && <span className="spinner" aria-hidden="true" />}{children}</button>;
});
export function Card({ as: Tag = 'section', className = '', children, ...props }: HTMLAttributes<HTMLElement> & { as?: 'section' | 'article' | 'div' }) {
  return <Tag {...props} className={`card ${className}`}>{children}</Tag>;
}
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) { return <span className={`badge badge-${tone}`}>{children}</span>; }
export function Alert({ tone = 'info', title, children, action }: { tone?: Tone; title?: string; children?: ReactNode; action?: ReactNode }) {
  return <div className={`notice notice-${tone}`} role={tone === 'danger' ? 'alert' : 'status'}><Icon name={tone === 'success' ? 'check' : 'alert'} /><div className="notice-content">{title && <strong>{title}</strong>}{children && <div>{children}</div>}{action && <div className="notice-action">{action}</div>}</div></div>;
}
export function EmptyState({ title, children, action, icon = 'book' }: { title: string; children: ReactNode; action?: ReactNode; icon?: IconName }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} /></span><h3>{title}</h3><p>{children}</p>{action}</div>;
}
export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action && <div className="page-action">{action}</div>}</header>;
}
export function Field({ id, label, hint, error, required, count, children }: { id: string; label: string; hint?: string; error?: string; required?: boolean; count?: string; children: ReactNode }) {
  return <div className={`field${error ? ' field-invalid' : ''}`}><label htmlFor={id}>{label}{required && <span className="required-mark"> *</span>}</label>{hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}{children}<div className="field-meta">{error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}{count && <span className="character-count">{count}</span>}</div></div>;
}
export function describedBy(id: string, hint?: string, error?: string) { return [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined; }
export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput({ className = '', ...props }, ref) { return <input {...props} ref={ref} className={`control ${className}`} />; });
export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea({ className = '', ...props }, ref) { return <textarea {...props} ref={ref} className={`control ${className}`} />; });
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className = '', ...props }, ref) { return <select {...props} ref={ref} className={`control ${className}`} />; });

export const modeLabel = (mode: string) => mode === 'latihan' ? 'Latihan' : 'Simulasi';
export const sessionStatus = (status: string) => status === 'completed' ? 'Selesai' : status === 'ending' ? 'Menunggu evaluasi akhir' : 'Aktif';
export const weaknessTone = (status: string): Tone => status === 'sudah dilatih ulang' ? 'success' : status === 'sedang diperbaiki' ? 'info' : 'warning';
export const formatDate = (value: string) => new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
