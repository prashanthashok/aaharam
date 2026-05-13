import { useState } from 'react'
import { ScanLine, Search, X, ChevronRight } from 'lucide-react'
import BarcodeScanner from '../components/BarcodeScanner'
import { apiFetch } from '../lib/api'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const TODAY = new Date().toISOString().slice(0, 10)

export default function LogPage() {
  const [activeTab, setActiveTab] = useState('scan')

  // Scan tab
  const [scanActive, setScanActive] = useState(true)

  // Search tab
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Shared food lookup state
  const [foodLoading, setFoodLoading] = useState(false)
  const [foodError, setFoodError] = useState('')

  // Add-to-log modal
  const [modal, setModal] = useState(null) // { food: FoodDto }
  const [serving, setServing] = useState('100')
  const [mealType, setMealType] = useState('breakfast')
  const [logDate, setLogDate] = useState(TODAY)
  const [logLoading, setLogLoading] = useState(false)
  const [logSuccess, setLogSuccess] = useState(false)
  const [logError, setLogError] = useState('')

  // ── Barcode scan ──────────────────────────────────────────────────────────
  async function handleBarcodeScan(barcode) {
    setFoodError('')
    setFoodLoading(true)
    try {
      const food = await apiFetch(`/api/food/barcode/${encodeURIComponent(barcode)}`)
      openModal(food)
    } catch (err) {
      setFoodError(err.message)
      setScanActive(false) // let BarcodeScanner remount on retry
    } finally {
      setFoodLoading(false)
    }
  }

  function retryScanner() {
    setFoodError('')
    setScanActive(true)
  }

  // ── Search ────────────────────────────────────────────────────────────────
  async function handleSearch(e) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearchError('')
    setSearchResults([])
    setSearchLoading(true)
    try {
      const results = await apiFetch(`/api/food/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchResults(results)
    } catch (err) {
      setSearchError(err.message)
    } finally {
      setSearchLoading(false)
    }
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  function openModal(food) {
    setModal({ food })
    setServing('100')
    setMealType('breakfast')
    setLogDate(TODAY)
    setLogSuccess(false)
    setLogError('')
  }

  function closeModal() {
    setModal(null)
    setScanActive(true)
  }

  function computedMacros(food) {
    const s = parseFloat(serving) || 0
    const factor = s / 100
    return {
      calories: round(food.caloriesPer100g * factor),
      protein: round(food.proteinPer100g * factor),
      carbs: round(food.carbsPer100g * factor),
      fat: round(food.fatPer100g * factor),
    }
  }

  async function handleAddToLog() {
    if (!modal) return
    setLogError('')
    setLogLoading(true)
    const macros = computedMacros(modal.food)
    try {
      await apiFetch('/api/log', {
        method: 'POST',
        body: JSON.stringify({
          foodName: modal.food.name,
          brand: modal.food.brand,
          barcode: modal.food.barcode,
          servingG: parseFloat(serving),
          mealType,
          loggedDate: logDate,
          calories: macros.calories,
          proteinG: macros.protein,
          carbsG: macros.carbs,
          fatG: macros.fat,
        }),
      })
      setLogSuccess(true)
    } catch (err) {
      setLogError(err.message)
    } finally {
      setLogLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Log Food</h1>

      {/* Tab switcher */}
      <div className="flex rounded-xl bg-slate-100 p-1 mb-6 gap-1">
        <TabButton active={activeTab === 'scan'} onClick={() => { setActiveTab('scan'); setScanActive(true); setFoodError('') }}>
          <ScanLine className="w-4 h-4" /> Scan Barcode
        </TabButton>
        <TabButton active={activeTab === 'search'} onClick={() => setActiveTab('search')}>
          <Search className="w-4 h-4" /> Search Food
        </TabButton>
      </div>

      {/* ── Scan tab ── */}
      {activeTab === 'scan' && (
        <div className="space-y-4">
          {foodLoading ? (
            <div className="flex items-center justify-center h-48 rounded-2xl bg-slate-50 border border-slate-200">
              <Spinner />
            </div>
          ) : foodError ? (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-center space-y-3">
              <p className="text-sm text-rose-700">{foodError}</p>
              <button onClick={retryScanner} className={secondaryBtn}>Try again</button>
            </div>
          ) : scanActive ? (
            <BarcodeScanner onResult={handleBarcodeScan} />
          ) : null}
        </div>
      )}

      {/* ── Search tab ── */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="e.g. Greek yogurt, almonds…"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            <button type="submit" disabled={searchLoading} className={primaryBtn}>
              {searchLoading ? <Spinner small /> : 'Search'}
            </button>
          </form>

          {searchError && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{searchError}</p>
          )}

          {searchResults.length > 0 && (
            <ul className="space-y-2">
              {searchResults.map((food, i) => (
                <FoodResultCard key={food.barcode ?? i} food={food} onAdd={() => openModal(food)} />
              ))}
            </ul>
          )}

          {!searchLoading && !searchError && searchResults.length === 0 && searchQuery && (
            <p className="text-sm text-slate-400 text-center py-8">No results found.</p>
          )}
        </div>
      )}

      {/* ── Add-to-log modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90dvh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900 text-lg leading-tight">{modal.food.name}</h2>
                {modal.food.brand && <p className="text-sm text-slate-500 mt-0.5">{modal.food.brand}</p>}
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 mt-0.5 flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {logSuccess ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-slate-800">Logged!</p>
                <button onClick={closeModal} className={secondaryBtn + ' mt-2'}>Done</button>
              </div>
            ) : (
              <>
                {/* Serving size */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Serving size (g)</label>
                  <input
                    type="number"
                    min="1"
                    value={serving}
                    onChange={e => setServing(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Computed macros */}
                <MacroPreview food={modal.food} serving={serving} />

                {/* Meal type */}
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Meal</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {MEAL_TYPES.map(m => (
                      <button
                        key={m}
                        onClick={() => setMealType(m)}
                        className={`py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                          mealType === m
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={e => setLogDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>

                {logError && (
                  <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{logError}</p>
                )}

                <button
                  onClick={handleAddToLog}
                  disabled={logLoading}
                  className={primaryBtn + ' w-full py-3'}
                >
                  {logLoading ? <Spinner small /> : <>Add to Log <ChevronRight className="w-4 h-4 inline-block" /></>}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

function FoodResultCard({ food, onAdd }) {
  return (
    <li className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm hover:border-indigo-200 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{food.name}</p>
        {food.brand && <p className="text-xs text-slate-400 truncate">{food.brand}</p>}
        {food.caloriesPer100g != null && (
          <p className="text-xs text-slate-500 mt-0.5">
            <span className="font-medium">{round(food.caloriesPer100g)} kcal</span> / 100 g
          </p>
        )}
      </div>
      <button onClick={onAdd} className="flex-shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
        Add
      </button>
    </li>
  )
}

function MacroPreview({ food, serving }) {
  const s = parseFloat(serving) || 0
  const f = s / 100
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 grid grid-cols-4 gap-2 text-center">
      <MacroCell label="kcal" value={round(food.caloriesPer100g * f)} color="text-slate-700" />
      <MacroCell label="protein" value={`${round(food.proteinPer100g * f)}g`} color="text-protein" />
      <MacroCell label="carbs" value={`${round(food.carbsPer100g * f)}g`} color="text-carbs" />
      <MacroCell label="fat" value={`${round(food.fatPer100g * f)}g`} color="text-fat" />
    </div>
  )
}

function MacroCell({ label, value, color }) {
  return (
    <div>
      <p className={`text-base font-bold ${color}`}>{value ?? '—'}</p>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}

function Spinner({ small }) {
  const size = small ? 'w-4 h-4' : 'w-6 h-6'
  return (
    <div className={`${size} border-2 border-indigo-600 border-t-transparent rounded-full animate-spin`} />
  )
}

function round(v) {
  if (v == null) return null
  return Math.round(v * 10) / 10
}

const primaryBtn =
  'flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'

const secondaryBtn =
  'px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300'
