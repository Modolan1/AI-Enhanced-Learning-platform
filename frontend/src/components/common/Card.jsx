export default function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.45)] backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}
