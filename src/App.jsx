import { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabase'
import * as api from './lib/api'
import Login from './components/Login'
import RegisterForm from './components/RegisterForm'
import Queue from './components/Queue'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [visits, setVisits] = useState([])
  const [doctors, setDoctors] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setProfile(null); return }
    api.getProfile(session.user.id).then(setProfile).catch(e => setError(e.message))
  }, [session])

  const refresh = useCallback(async () => {
    try { const [v, d] = await Promise.all([api.getQueue(), api.getDoctors()]); setVisits(v); setDoctors(d) }
    catch (e) { setError(e.message) }
  }, [])

  useEffect(() => {
    if (!profile?.hospital_id) return
    refresh()
    const ch = supabase.channel('queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, refresh)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile, refresh])

  const act = (fn) => async (...a) => { try { setError(''); await fn(...a); refresh() } catch (e) { setError(e.message) } }

  if (session === undefined) return null
  if (!session) return <main><Login /></main>
  return (
    <main>
      <header>
        <div><h1>CareLane</h1><p className="sub">{profile?.hospitals?.name || 'No hospital linked'} · {profile?.role}</p></div>
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </header>
      {error && <p className="hint err">{error}</p>}
      {!profile?.hospital_id
        ? <p className="panel">Your account isn’t linked to a hospital yet. Ask an admin to link it.</p>
        : <div className="grid">
            <RegisterForm onAdd={act((f) => api.registerVisit(f, profile.hospital_id))} />
            <Queue visits={visits} doctors={doctors} onCall={act(api.callIn)} onDone={act(api.finishVisit)} />
          </div>}
    </main>
  )
}
