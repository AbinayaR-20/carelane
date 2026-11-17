import { supabase } from './supabase'
const fail = (error) => { if (error) throw new Error(error.message) }

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('full_name, role, hospital_id, hospitals(name)').eq('id', userId).single()
  fail(error); return data
}
export async function getQueue() {
  const { data, error } = await supabase.from('visits')
    .select('id, complaint, priority, status, arrived_at, patients(name, age), doctors(name)')
    .neq('status', 'done').order('arrived_at')
  fail(error)
  const rank = { critical: 0, urgent: 1, standard: 2 }
  return data.sort((a, b) => rank[a.priority] - rank[b.priority] || new Date(a.arrived_at) - new Date(b.arrived_at))
}
export async function getDoctors() {
  const { data, error } = await supabase.from('doctors').select('id, name, specialty, available').order('name')
  fail(error); return data
}
export async function registerVisit({ name, age, complaint, priority }, hospitalId) {
  const { data: p, error: e1 } = await supabase.from('patients')
    .insert({ name, age: age || null, hospital_id: hospitalId }).select('id').single()
  fail(e1)
  const { error: e2 } = await supabase.from('visits')
    .insert({ patient_id: p.id, hospital_id: hospitalId, complaint: complaint || 'Not given', priority })
  fail(e2)
}
export async function callIn(visitId)   { const { error } = await supabase.rpc('call_in', { p_visit: visitId }); fail(error) }
export async function finishVisit(id)   { const { error } = await supabase.rpc('complete_visit', { p_visit: id }); fail(error) }
