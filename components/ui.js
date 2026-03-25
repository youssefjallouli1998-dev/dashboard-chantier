// Shared UI components

export function Badge({ children, color = 'gray' }) {
  const colors = {
    blue: { bg: 'var(--blue-light)', text: '#1D4ED8' },
    green: { bg: 'var(--green-light)', text: '#15803D' },
    red: { bg: '#FEE2E2', text: '#B91C1C' },
    amber: { bg: 'var(--amber-light)', text: '#B45309' },
    gray: { bg: 'var(--gray-100)', text: 'var(--gray-500)' },
    violet: { bg: '#F3E8FF', text: '#7C3AED' },
    yellow: { bg: '#FEF9C3', text: '#A16207' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '6px',
      fontSize: '11px', fontWeight: 600,
      background: c.bg, color: c.text,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

export function StatutBadge({ statut }) {
  const map = {
    'En cours': { color: 'blue', label: 'En cours' },
    'En attente': { color: 'gray', label: 'En attente' },
    'Bloqué': { color: 'red', label: 'Bloqué' },
    'Terminé': { color: 'green', label: 'Terminé' },
    'À faire': { color: 'gray', label: 'À faire' },
  };
  const s = map[statut] || { color: 'gray', label: statut };
  return <Badge color={s.color}>{s.label}</Badge>;
}

export function ProgressBar({ value, size = 'md' }) {
  const color = value >= 80 ? '#22C55E' : value >= 40 ? '#0055FF' : '#F59E0B';
  const height = size === 'sm' ? '4px' : '8px';
  return (
    <div style={{ background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden', height }}>
      <div style={{
        height: '100%', width: `${Math.min(100, value || 0)}%`,
        background: color, borderRadius: '4px',
        transition: 'width 0.4s ease',
      }} />
    </div>
  );
}

export function KpiCard({ label, value, sub, color = 'var(--gray-900)' }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--gray-200)',
      borderRadius: '12px', padding: '16px 20px',
    }}>
      <div style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 500, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color, fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = '560px' }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '16px', width, maxWidth: '100%',
          maxHeight: '90vh', overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '20px', color: 'var(--gray-900)' }}>{title}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '20px', color: 'var(--gray-400)', cursor: 'pointer', lineHeight: 1, padding: '4px' }}>×</button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function FormField({ label, required, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '6px' }}>
        {label}{required && <span style={{ color: 'var(--red)', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export const inputStyle = {
  width: '100%', padding: '8px 12px',
  border: '1px solid var(--gray-300)', borderRadius: '8px',
  fontSize: '14px', color: 'var(--gray-900)',
  background: '#fff', outline: 'none',
  fontFamily: 'Public Sans, sans-serif',
};

export const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
};

export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', style: extraStyle = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    border: 'none', borderRadius: '8px', fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontFamily: 'Public Sans, sans-serif',
    transition: 'background 0.15s',
  };
  const sizes = {
    sm: { padding: '5px 12px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '14px' },
    lg: { padding: '10px 20px', fontSize: '15px' },
  };
  const variants = {
    primary: { background: 'var(--blue)', color: '#fff' },
    secondary: { background: 'var(--gray-100)', color: 'var(--gray-700)' },
    danger: { background: 'var(--red)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--gray-500)', border: '1px solid var(--gray-200)' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...extraStyle }}
    >
      {children}
    </button>
  );
}

export function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 700, color: 'var(--gray-400)',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      marginBottom: '12px', marginTop: '4px',
    }}>
      {children}
    </div>
  );
}

export function formatEuro(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0);
}

export function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('fr-FR');
}
