export default function Button({ children, className = '', variant = 'primary', ...props }) {
  const styles = {
    primary: 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-sm hover:-translate-y-0.5 hover:from-teal-700 hover:to-cyan-700 hover:shadow-md',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm',
    danger: 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm hover:-translate-y-0.5 hover:from-rose-700 hover:to-red-700 hover:shadow-md',
  };
  return <button className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`} {...props}>{children}</button>;
}
