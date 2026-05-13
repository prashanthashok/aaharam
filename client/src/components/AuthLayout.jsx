import { Leaf } from 'lucide-react'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Wordmark */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <Leaf className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Aaharam
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/60 border border-slate-100 px-8 py-10">
          {children}
        </div>
      </div>
    </div>
  )
}
