import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { useToast } from '../context/ToastContext'

const DEFAULTS = { calories: 2000, proteinG: 150, carbsG: 200, fatG: 65 }

export default function GoalsPage() {
  const { showToast } = useToast()
  const [form, setForm] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch('/api/goals')
      .then(data => setForm({
        calories: data.calories,
        proteinG: data.proteinG,
        carbsG:   data.carbsG,
        fatG:     data.fatG,
      }))
      .catch(() => showToast('Could not load goals', 'error'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: Number(e.target.value) || 0 }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('/api/goals', {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      showToast('Goals saved!', 'success')
    } catch (err) {
      showToast(err.message || 'Could not save goals', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Live macro-to-calorie calculation ──
  const macroKcal = form.proteinG * 4 + form.carbsG * 4 + form.fatG * 9
  const kcalDiff  = Math.abs(macroKcal - form.calories)
  const showMacroWarning = kcalDiff > 50

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="h-7 w-32 bg-slate-200 rounded" />
        {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-slate-200 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Daily Goals</h1>
      <p className="text-sm text-slate-500 mb-6">Set your nutrition targets for each day.</p>

      <form onSubmit={handleSave} className="space-y-5">
        <GoalField
          label="Daily Calories"
          unit="kcal"
          value={form.calories}
          onChange={set('calories')}
        />
        <GoalField
          label="Protein"
          unit="g"
          value={form.proteinG}
          onChange={set('proteinG')}
          accent="text-blue-500"
        />
        <GoalField
          label="Carbohydrates"
          unit="g"
          value={form.carbsG}
          onChange={set('carbsG')}
          accent="text-amber-500"
        />
        <GoalField
          label="Fat"
          unit="g"
          value={form.fatG}
          onChange={set('fatG')}
          accent="text-rose-400"
        />

        {/* ── Macro breakdown helper ── */}
        <div className={`rounded-xl border px-4 py-3 text-sm space-y-1 ${
          showMacroWarning
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <p>
            Protein ({form.proteinG}g × 4) + Carbs ({form.carbsG}g × 4) + Fat ({form.fatG}g × 9)
            {' '}= <span className="font-semibold">{macroKcal.toLocaleString()} kcal</span>
          </p>
          {showMacroWarning && (
            <p className="text-amber-700">
              Your macros add up to {macroKcal.toLocaleString()} kcal, but your calorie goal
              is {form.calories.toLocaleString()}. Consider adjusting.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {saving ? 'Saving…' : 'Save Goals'}
        </button>
      </form>
    </div>
  )
}

function GoalField({ label, unit, value, onChange, accent }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between gap-4">
      <label className={`text-sm font-medium ${accent ?? 'text-slate-700'}`}>{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          value={value}
          onChange={onChange}
          className="w-24 text-right rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
        <span className="text-xs text-slate-400 w-8">{unit}</span>
      </div>
    </div>
  )
}
