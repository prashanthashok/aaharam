import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/AuthLayout'

const MIN_PASSWORD_LENGTH = 8

export default function RegisterPage() {
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function validate() {
    const errs = {}
    if (!form.displayName.trim()) errs.displayName = 'Display name is required.'
    if (!form.email.trim()) errs.email = 'Email is required.'
    if (!form.password) errs.password = 'Password is required.'
    else if (form.password.length < MIN_PASSWORD_LENGTH)
      errs.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    if (!form.confirm) errs.confirm = 'Please confirm your password.'
    else if (form.password !== form.confirm) errs.confirm = 'Passwords do not match.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { display_name: form.displayName.trim() } },
    })

    setLoading(false)

    if (error) {
      setErrors({ form: error.message })
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            We sent a confirmation link to{' '}
            <span className="font-medium text-slate-700">{form.email}</span>.
            Click it to activate your account.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
      <p className="text-sm text-slate-500 mb-8">Start tracking your nutrition today.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field label="Display Name" htmlFor="displayName" error={errors.displayName}>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            required
            value={form.displayName}
            onChange={set('displayName')}
            className={inputClass(errors.displayName)}
            placeholder="Jane Doe"
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={set('email')}
            className={inputClass(errors.email)}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={set('password')}
            className={inputClass(errors.password)}
            placeholder="Min. 8 characters"
          />
        </Field>

        <Field label="Confirm Password" htmlFor="confirm" error={errors.confirm}>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirm}
            onChange={set('confirm')}
            className={inputClass(errors.confirm)}
            placeholder="••••••••"
          />
        </Field>

        {errors.form && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {errors.form}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

function Field({ label, htmlFor, error, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  )
}

function inputClass(hasError) {
  const base =
    'w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors'
  return hasError
    ? `${base} border-rose-400 focus:ring-rose-400 focus:border-rose-400`
    : `${base} border-slate-200 focus:ring-indigo-500 focus:border-indigo-500`
}
