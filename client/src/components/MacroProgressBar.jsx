export default function MacroProgressBar({ label, current, target, color }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const over = target > 0 && current > target

  const trackColor = {
    blue: 'bg-blue-100',
    amber: 'bg-amber-100',
    rose: 'bg-rose-100',
  }[color] ?? 'bg-slate-100'

  const fillColor = over
    ? 'bg-rose-500'
    : {
        blue: 'bg-blue-500',
        amber: 'bg-amber-400',
        rose: 'bg-rose-400',
      }[color] ?? 'bg-indigo-500'

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-medium text-slate-600 capitalize">{label}</span>
        <span className={`text-xs font-semibold ${over ? 'text-rose-600' : 'text-slate-700'}`}>
          {Math.round(current)}g
          <span className="font-normal text-slate-400"> / {target}g</span>
        </span>
      </div>
      <div className={`h-2 rounded-full ${trackColor} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${fillColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
