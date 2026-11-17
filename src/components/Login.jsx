import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('in')
  const [f, setF] = useState({ email: '', password: '', name: '' })
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault(); setMsg('')
    const { error } = mode === 'in'
      ? await supabase.auth.signInWithPassword({ email: f.email, password: f.password })
      : await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.name } } })
    if (error) setMsg(error.message)
    else if (mode === 'up') setMsg('Account created. Check your email to confirm, then sign in.')
  }
  return (
    <form className="panel login" onSubmit={submit}>
      <h1>CareLane</h1>
      <p className="sub">{mode === 'in' ? 'Sign in to your hospital queue.' : 'Create a staff account.'}</p>
      {mode === 'up' && <><label>Full name</label><input value={f.name} onChange={set('name')} required /></>}
      <label>Email</label><input type="email" value={f.email} onChange={set('email')} required />
      <label>Password</label><input type="password" minLength={6} value={f.password} onChange={set('password')} required />
      {msg && <p className="hint">{msg}</p>}
      <button className="main">{mode === 'in' ? 'Sign in' : 'Create account'}</button>
      <button type="button" className="link" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
        {mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
      </button>
    </form>
  )
}
