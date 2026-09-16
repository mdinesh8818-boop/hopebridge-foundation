export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div>
      {label ? (
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <span className="text-[#4d6359]">{label}</span>
          <span className="font-semibold text-[#0d5f44]">{clamped}%</span>
        </div>
      ) : null}
      <div
        className="pub-progress"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <span style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
