const inferTextMinLength = (labelText, type) => {
  if (type === 'email') return 5;
  if (type === 'password') return 8;
  if (labelText.includes('first name') || labelText.includes('last name') || labelText === 'name') return 2;
  if (labelText.includes('title')) return 3;
  if (labelText.includes('description')) return 10;
  if (labelText.includes('learning goal')) return 10;
  if (labelText.includes('subject') || labelText.includes('style')) return 2;
  if (labelText.includes('question')) return 5;
  if (labelText.includes('answer')) return 1;
  return 1;
};

const inferTextMaxLength = (labelText, type) => {
  if (type === 'email') return 120;
  if (type === 'password') return 128;
  if (labelText.includes('first name') || labelText.includes('last name') || labelText === 'name') return 50;
  if (labelText.includes('title')) return 200;
  if (labelText.includes('description')) return 2000;
  if (labelText.includes('learning goal')) return 500;
  if (labelText.includes('subject') || labelText.includes('style')) return 100;
  if (labelText.includes('question')) return 1000;
  if (labelText.includes('answer')) return 2000;
  if (labelText.includes('tags')) return 200;
  return 255;
};

export default function Input({ label, className = '', onChange, minLength, maxLength, min, max, pattern, title, inputMode, ...props }) {
  const labelText = String(label || '').trim().toLowerCase();
  const type = props.type || 'text';
  const isNameField = labelText.includes('first name') || labelText.includes('last name') || labelText === 'name';
  const isNumberField = type === 'number';

  const resolvedInputMode = inputMode
    || (type === 'email' ? 'email' : undefined)
    || (isNumberField ? 'numeric' : undefined)
    || undefined;

  const resolvedPattern = pattern || (isNameField ? '^[A-Za-z ]+$' : undefined);
  const resolvedTitle = title || (isNameField ? 'Use letters and spaces only.' : undefined);
  const resolvedMinLength = minLength ?? (!isNumberField ? inferTextMinLength(labelText, type) : undefined);
  const resolvedMaxLength = maxLength ?? (!isNumberField ? inferTextMaxLength(labelText, type) : undefined);
  const resolvedMin = min ?? (labelText.includes('weekly goal') ? 1 : (isNumberField ? 0 : undefined));
  const resolvedMax = max ?? (labelText.includes('weekly goal') ? 168 : (isNumberField ? 100000 : undefined));

  const handleChange = (event) => {
    if (isNameField) {
      const sanitized = event.target.value.replace(/[^A-Za-z\s]/g, '').replace(/\s{2,}/g, ' ');
      if (sanitized !== event.target.value) {
        event.target.value = sanitized;
      }
    }

    if (typeof onChange === 'function') {
      onChange(event);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
      <input
        className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100 ${className}`}
        minLength={resolvedMinLength}
        maxLength={resolvedMaxLength}
        min={resolvedMin}
        max={resolvedMax}
        pattern={resolvedPattern}
        title={resolvedTitle}
        inputMode={resolvedInputMode}
        onChange={handleChange}
        {...props}
      />
    </div>
  );
}
