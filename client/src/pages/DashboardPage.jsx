import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Trash2, Plus, AlertTriangle, X } from 'lucide-react'
import MacroProgressBar from '../components/MacroProgressBar'
import { apiFetch } from '../lib/api'
import { useToast } from '../context/ToastContext'

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function toIso(date) {
  return date.toISOString().slice(0, 10)
}
function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
function isToday(date) {
  return toIso(date) === toIso(new Date())
}
function formatDisplay(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Calorie ring ──────────────────────────────────────────────────────────────
function CalorieRing({ current, target }) {
  const R = 54
  const C = 2 * Math.PI * R
  const pct = target > 0 ? Math.min(current / target, 1) : 0
  const over = target > 0 && current > target
  const dash = pct * C

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={R} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={R} fill="none"
          stroke={over ? '#f43f5e' : '#4f46e5'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${over ? 'text-rose-500' : 'text-slate-900'}`}>
          {Math.round(current).toLocaleString()}
        </span>
        <span className="text-[11px] text-slate-400">/ {target.toLocaleString()} kcal</span>
      </div>
    </div>
  )
}

// ── Summary skeleton ──────────────────────────────────────────────────────────
function SummarySkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5 animate-pulse">
      <div className="w-36 h-36 rounded-full bg-slate-200 mx-auto" />
      <div className="space-y-3">
        <div className="h-3 rounded bg-slate-200" />
        <div className="h-3 rounded bg-slate-200 w-4/5" />
        <div className="h-3 rounded bg-slate-200 w-3/5" />
      </div>
    </div>
  )
}

// ── Meal section skeleton ─────────────────────────────────────────────────────
function MealSkeleton() {
  return (
    <div className="animate-pulse space-y-1.5">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-14 rounded-xl bg-slate-200" />
      ))}
    </div>
  )
}

// ── Food detail drawer ────────────────────────────────────────────────────────
function FoodDrawer({ entry, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Slide-up panel */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl shadow-2xl px-6 pt-5 pb-8 max-w-lg mx-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight">{entry.foodName}</h3>
            {entry.brand && <p className="text-sm text-slate-500 mt-0.5">{entry.brand}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-3">Serving: {entry.servingG}g</p>

        {/* 4-cell macro grid */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <MacroCell label="Calories" value={Math.round(entry.calories)} unit="kcal" color="text-slate-800" bg="bg-slate-50" />
          <MacroCell label="Protein"  value={+Number(entry.proteinG).toFixed(1)} unit="g" color="text-blue-600"  bg="bg-blue-50" />
          <MacroCell label="Carbs"    value={+Number(entry.carbsG).toFixed(1)}   unit="g" color="text-amber-500" bg="bg-amber-50" />
          <MacroCell label="Fat"      value={+Number(entry.fatG).toFixed(1)}     unit="g" color="text-rose-500"  bg="bg-rose-50" />
        </div>
      </div>
    </>
  )
}

function MacroCell({ label, value, unit, color, bg }) {
  return (
    <div className={`${bg} rounded-xl py-3 px-1`}>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{unit}</p>
      <p className="text-[10px] font-medium text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [date, setDate] = useState(new Date())
  const [meals, setMeals] = useState(null)   // null = loading
  const [goals, setGoals] = useState(null)
  const [hasGoals, setHasGoals] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [drawerEntry, setDrawerEntry] = useState(null)

  const fetchData = useCallback(async (d) => {
    setMeals(null)
    try {
      const [mealData, goalsData] = await Promise.all([
        apiFetch(`/api/log?date=${toIso(d)}`),
        apiFetch('/api/goals'),
      ])
      setMeals(mealData)
      setGoals(goalsData)
      setHasGoals(true)
    } catch (err) {
      setMeals({})
      setHasGoals(false)
      showToast(err.message || 'Could not load data', 'error')
    }
  }, [showToast])

  useEffect(() => {
    fetchData(date)
  }, [date, fetchData])

  async function handleDelete(id) {
    setDeletingId(id)
    if (drawerEntry?.id === id) setDrawerEntry(null)
    try {
      await apiFetch(`/api/log/${id}`, { method: 'DELETE' })
      showToast('Entry deleted', 'info')
      await fetchData(date)
    } catch (err) {
      showToast(err.message || 'Could not delete entry', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Totals ──
  const allEntries = meals ? Object.values(meals).flat() : []
  const totals = allEntries.reduce(
    (acc, e) => ({
      calories: acc.calories + Number(e.calories),
      protein:  acc.protein  + Number(e.proteinG),
      carbs:    acc.carbs    + Number(e.carbsG),
      fat:      acc.fat      + Number(e.fatG),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const g = goals ?? { calories: 2000, proteinG: 150, carbsG: 200, fatG: 65 }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* ── Date navigator ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setDate(d => addDays(d, -1))}
          className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-500"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900">
            {isToday(date) ? 'Today' : formatDisplay(date)}
          </p>
          {!isToday(date) && (
            <button
              onClick={() => setDate(new Date())}
              className="text-xs text-indigo-600 hover:underline"
            >
              Back to today
            </button>
          )}
        </div>

        <button
          onClick={() => setDate(d => addDays(d, 1))}
          disabled={isToday(date)}
          className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── No-goals banner ── */}
      {!hasGoals && (
        <Link
          to="/goals"
          className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          Set your daily goals to track progress →
        </Link>
      )}

      {/* ── Summary card ── */}
      {meals === null ? (
        <SummarySkeleton />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
          <CalorieRing current={totals.calories} target={g.calories} />
          <div className="space-y-3">
            <MacroProgressBar label="Protein" current={totals.protein} target={g.proteinG} color="blue" />
            <MacroProgressBar label="Carbs"   current={totals.carbs}   target={g.carbsG}   color="amber" />
            <MacroProgressBar label="Fat"     current={totals.fat}     target={g.fatG}     color="rose" />
          </div>
        </div>
      )}

      {/* ── Meal sections ── */}
      {Object.entries(MEAL_LABELS).map(([key, label]) => {
        const entries = meals?.[key] ?? []
        const mealKcal = entries.reduce((s, e) => s + Number(e.calories), 0)

        return (
          <section key={key}>
            <div className="flex items-baseline justify-between mb-2 px-0.5">
              <h2 className="text-sm font-semibold text-slate-700">{label}</h2>
              {mealKcal > 0 && (
                <span className="text-xs text-slate-400">{Math.round(mealKcal)} kcal</span>
              )}
            </div>

            {meals === null ? (
              <MealSkeleton />
            ) : entries.length === 0 ? (
              <div className="text-xs text-slate-400 bg-slate-100 rounded-xl px-4 py-3 italic">
                Nothing logged yet
              </div>
            ) : (
              <ul className="space-y-1.5">
                {entries.map(entry => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3 gap-3 shadow-sm"
                  >
                    <button
                      className="min-w-0 text-left"
                      onClick={() => setDrawerEntry(entry)}
                    >
                      <p className="text-sm font-medium text-slate-800 truncate hover:text-indigo-600 transition-colors">
                        {entry.foodName}
                      </p>
                      <p className="text-xs text-slate-400">{entry.servingG}g</p>
                    </button>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold text-slate-700">
                        {Math.round(entry.calories)} kcal
                      </span>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        className="text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-40"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}

      {/* ── Floating log button ── */}
      <button
        onClick={() => navigate('/log')}
        className="fixed bottom-20 right-4 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3 rounded-full shadow-lg shadow-indigo-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <Plus className="w-5 h-5" />
        Log Food
      </button>

      {/* ── Food detail drawer ── */}
      {drawerEntry && (
        <FoodDrawer entry={drawerEntry} onClose={() => setDrawerEntry(null)} />
      )}
    </div>
  )
}
