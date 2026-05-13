import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'

// ── Helpers ───────────────────────────────────────────────────────────────────
function toIso(date) {
  return date.toISOString().slice(0, 10)
}

function nDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function shortLabel(isoDate) {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
}

function fullLabel(isoDate) {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

// ── Custom tooltips ───────────────────────────────────────────────────────────
function KcalTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-indigo-600">{Math.round(payload[0]?.value ?? 0)} kcal</p>
    </div>
  )
}

function MacroTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow px-3 py-2 text-xs space-y-0.5">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.name}: {Math.round(p.value)}g
        </p>
      ))}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-52 bg-slate-200 rounded-2xl" />
      <div className="h-52 bg-slate-200 rounded-2xl" />
      {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-200 rounded-xl" />)}
    </div>
  )
}

// ── Expandable day row ────────────────────────────────────────────────────────
function DayRow({ dateStr, dayData, goal }) {
  const [open, setOpen] = useState(false)
  const kcal = Math.round(dayData.calories)
  const over = goal > 0 && dayData.calories > goal

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-medium text-slate-700 flex-shrink-0 w-32">
            {fullLabel(dateStr)}
          </span>
          <div className="flex gap-1 flex-wrap">
            <MacroPill value={Math.round(dayData.protein)} color="bg-blue-100 text-blue-700"  label="P" />
            <MacroPill value={Math.round(dayData.carbs)}   color="bg-amber-100 text-amber-700" label="C" />
            <MacroPill value={Math.round(dayData.fat)}     color="bg-rose-100 text-rose-600"   label="F" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className={`text-sm font-bold ${over ? 'text-rose-500' : 'text-slate-800'}`}>
            {kcal.toLocaleString()} kcal
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? `${(dayData.entries.length || 1) * 56 + 8}px` : '0px' }}
      >
        {dayData.entries.length === 0 ? (
          <p className="px-4 py-3 text-xs text-slate-400 italic border-t border-slate-100">
            Nothing logged
          </p>
        ) : (
          <ul className="border-t border-slate-100 divide-y divide-slate-100">
            {dayData.entries.map(e => (
              <li key={e.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 truncate">{e.food_name}</p>
                  <p className="text-xs text-slate-400 capitalize">{e.meal_type} · {e.serving_g}g</p>
                </div>
                <span className="text-sm font-medium text-slate-600 flex-shrink-0">
                  {Math.round(e.calories)} kcal
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function MacroPill({ value, color, label }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${color}`}>
      {label} {value}g
    </span>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{title}</p>
      {children}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const { user } = useAuth()
  const [chartData, setChartData]       = useState(null)  // null = loading
  const [dayMap, setDayMap]             = useState({})
  const [goalCalories, setGoalCalories] = useState(0)

  useEffect(() => {
    if (!user) return

    async function load() {
      const fourteenDaysAgo = toIso(nDaysAgo(13))

      const [{ data: logs }, goalsData] = await Promise.all([
        supabase
          .from('meal_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('logged_date', fourteenDaysAgo)
          .order('logged_date', { ascending: true }),
        apiFetch('/api/goals').catch(() => null),
      ])

      if (goalsData) setGoalCalories(goalsData.calories)

      // Seed all 14 days (oldest → newest) so the chart has a full x-axis
      const map = {}
      for (let i = 13; i >= 0; i--) {
        map[toIso(nDaysAgo(i))] = { calories: 0, protein: 0, carbs: 0, fat: 0, entries: [] }
      }

      for (const row of logs ?? []) {
        const key = row.logged_date
        if (!map[key]) continue
        map[key].calories += Number(row.calories)
        map[key].protein  += Number(row.protein_g)
        map[key].carbs    += Number(row.carbs_g)
        map[key].fat      += Number(row.fat_g)
        map[key].entries.push(row)
      }

      setDayMap(map)
      setChartData(
        Object.entries(map).map(([date, d]) => ({
          date,
          label:    shortLabel(date),
          calories: Math.round(d.calories),
          protein:  Math.round(d.protein),
          carbs:    Math.round(d.carbs),
          fat:      Math.round(d.fat),
        }))
      )
    }

    load()
  }, [user])

  const last7 = chartData ? chartData.slice(-7).reverse() : []

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">History</h1>

      {chartData === null ? (
        <Skeleton />
      ) : (
        <>
          {/* ── Daily Calorie bar chart ── */}
          <ChartCard title="Daily Calories — last 14 days">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<KcalTooltip />} cursor={{ fill: '#f1f5f9' }} />
                {goalCalories > 0 && (
                  <ReferenceLine
                    y={goalCalories}
                    stroke="#4f46e5"
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                    label={{ value: 'Goal', position: 'insideTopRight', fontSize: 10, fill: '#4f46e5' }}
                  />
                )}
                <Bar dataKey="calories" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* ── Stacked macro chart ── */}
          <ChartCard title="Daily Macros — last 14 days">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<MacroTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
                <Bar dataKey="protein" name="Protein" stackId="a" fill="#3b82f6" maxBarSize={22} />
                <Bar dataKey="carbs"   name="Carbs"   stackId="a" fill="#fbbf24" maxBarSize={22} />
                <Bar
                  dataKey="fat"
                  name="Fat"
                  stackId="a"
                  fill="#fb7185"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* ── Last 7 days expandable list ── */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-600 px-0.5">Last 7 Days</h2>
            {last7.map(({ date }) => (
              <DayRow
                key={date}
                dateStr={date}
                dayData={dayMap[date]}
                goal={goalCalories}
              />
            ))}
          </section>
        </>
      )}
    </div>
  )
}
