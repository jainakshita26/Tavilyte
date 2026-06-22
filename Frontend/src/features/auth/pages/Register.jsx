import React, { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../hook/useAuth'
import { resendVerificationEmail } from '../service/auth.api'  // ← add import

const Register = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [showResend, setShowResend] = useState(false)   // ← new
  const [resendStatus, setResendStatus] = useState('')  // ← new
  const { handleRegister } = useAuth()

  const submitForm = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    setShowResend(false)
    setResendStatus('')

    try {
      await handleRegister({ username, email, password })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      // Handle validator errors array format
      const validatorErrors = err?.response?.data?.errors
      const msg = validatorErrors
        ? validatorErrors[0]?.msg
        : err?.response?.data?.message || 'Something went wrong. Please try again.'
      setErrorMsg(msg)
      if (msg.toLowerCase().includes('already exists')) {
        setShowResend(true)
      }
    }
  }

  const handleResend = async () => {
    setResendStatus('loading')
    try {
      await resendVerificationEmail({ email })
      setResendStatus('sent')
      setStatus('success')  // ← switch to success screen
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to resend'
      if (msg.toLowerCase().includes('already verified')) {
        setResendStatus('already_verified')
      } else {
        setResendStatus('error')
      }
    }
  }

  // ── Success state ──
  if (status === 'success') {
    return (
      <section className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[85vh] w-full max-w-5xl items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-[#31b8c6]/40 bg-zinc-900/70 p-8 shadow-2xl shadow-black/50 backdrop-blur text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#31b8c6]/10 border border-[#31b8c6]/30">
              <svg className="w-8 h-8 fill-[#31b8c6]" viewBox="0 0 16 16">
                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#31b8c6] mb-2">Check your inbox!</h2>
            <p className="text-zinc-300 text-sm mb-1">We sent a verification link to</p>
            <p className="text-white font-semibold text-sm mb-5">{email}</p>
            <div className="rounded-xl bg-zinc-800/60 border border-zinc-700 px-4 py-4 text-left space-y-2 mb-6">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-2">What to do next</p>
              <div className="flex items-start gap-2">
                <span className="text-[#31b8c6] font-bold text-sm">1.</span>
                <p className="text-zinc-300 text-sm">Open the email from Tavilyte</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#31b8c6] font-bold text-sm">2.</span>
                <p className="text-zinc-300 text-sm">Click the <strong className="text-white">Verify Email</strong> button</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#31b8c6] font-bold text-sm">3.</span>
                <p className="text-zinc-300 text-sm">You'll be redirected to login automatically</p>
              </div>
            </div>
            <p className="text-zinc-500 text-xs mb-5">
              Can't find it? Check your <span className="text-zinc-300">Spam</span> or <span className="text-zinc-300">Promotions</span> folder.
            </p>
            <Link to="/login" className="block w-full rounded-lg bg-[#31b8c6] px-4 py-3 font-semibold text-zinc-950 transition hover:bg-[#45c7d4] text-center text-sm">
              Go to Login
            </Link>
            <p className="mt-4 text-xs text-zinc-500">
              Wrong email?{' '}
              <button onClick={() => setStatus('idle')} className="text-[#31b8c6] hover:text-[#45c7d4] transition">
                Register again
              </button>
            </p>
          </div>
        </div>
      </section>
    )
  }

  // ── Register form ──
  return (
    <section className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[85vh] w-full max-w-5xl items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-[#31b8c6]/40 bg-zinc-900/70 p-8 shadow-2xl shadow-black/50 backdrop-blur">
          <h1 className="text-3xl font-bold text-[#31b8c6]">Create Account</h1>
          <p className="mt-2 text-sm text-zinc-300">Register with your username, email, and password.</p>

          {/* Error banner */}
          {status === 'error' && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <p>{errorMsg}</p>

              {/* ← Resend option when user already exists */}
              {showResend && (
                <div className="mt-3 pt-3 border-t border-red-500/20">
                  {resendStatus === '' && (
                    <p className="text-zinc-400 text-xs mb-2">
                      Already registered but didn't get the email?
                    </p>
                  )}
                  {resendStatus === 'already_verified' && (
                    <p className="text-green-400 text-xs mb-2">
                      ✅ This email is already verified — just login!
                    </p>
                  )}
                  {resendStatus === 'error' && (
                    <p className="text-red-400 text-xs mb-2">
                      Failed to resend. Try again.
                    </p>
                  )}
                  {resendStatus !== 'already_verified' && (
                    <button
                      onClick={handleResend}
                      disabled={resendStatus === 'loading'}
                      className="text-[#31b8c6] text-xs hover:text-[#45c7d4] transition disabled:opacity-50 flex items-center gap-1"
                    >
                      {resendStatus === 'loading' ? (
                        <>
                          <span className="w-3 h-3 border border-[#31b8c6]/30 border-t-[#31b8c6] rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        '→ Resend verification email'
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={submitForm} className="mt-8 space-y-5">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-zinc-200">Username</label>
              <input
                id="username" type="text" value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username" required
                disabled={status === 'loading'}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 outline-none ring-0 transition focus:border-[#31b8c6] focus:shadow-[0_0_0_3px_rgba(49,184,198,0.25)] disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-200">Email</label>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                disabled={status === 'loading'}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 outline-none ring-0 transition focus:border-[#31b8c6] focus:shadow-[0_0_0_3px_rgba(49,184,198,0.25)] disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-200">Password</label>
              <input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password" required
                disabled={status === 'loading'}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 outline-none ring-0 transition focus:border-[#31b8c6] focus:shadow-[0_0_0_3px_rgba(49,184,198,0.25)] disabled:opacity-50"
              />
            </div>
            <button
              type="submit" disabled={status === 'loading'}
              className="w-full rounded-lg bg-[#31b8c6] px-4 py-3 font-semibold text-zinc-950 transition hover:bg-[#45c7d4] focus:outline-none focus:shadow-[0_0_0_3px_rgba(49,184,198,0.35)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <span className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                  Sending verification email...
                </>
              ) : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-300">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#31b8c6] transition hover:text-[#45c7d4]">Login</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Register