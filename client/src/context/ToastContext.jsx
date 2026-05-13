import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
  error:   <XCircle    className="w-4 h-4 text-rose-500    flex-shrink-0" />,
  info:    <Info       className="w-4 h-4 text-indigo-500  flex-shrink-0" />,
}

const BORDER = {
  success: 'border-l-emerald-500',
  error:   'border-l-rose-500',
  info:    'border-l-indigo-500',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    setToasts(ts => ts.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(ts => [...ts, { id, message, type }])
    timers.current[id] = setTimeout(() => dismiss(id), 3000)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast stack — fixed bottom-center, above bottom nav */}
      <div className="fixed bottom-20 inset-x-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto w-full max-w-sm bg-white rounded-xl shadow-lg
              border border-slate-200 border-l-4 ${BORDER[toast.type]}
              flex items-center gap-3 px-4 py-3
              animate-in fade-in slide-in-from-bottom-2 duration-200
            `}
          >
            {ICONS[toast.type]}
            <p className="flex-1 text-sm text-slate-700">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
