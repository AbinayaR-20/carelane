import { useState } from 'react'
const CRIT = ['chest pain', 'breath', 'unconscious', 'bleeding heavily', 'stroke', 'seizure', 'faint']
const URG = ['fracture', 'high fever', 'vomit', 'burn', 'severe', 'head injury', 'pain']
const suggest = (t) => { t = t.toLowerCase(); return CRIT.some(k => t.includes(k)) ? 'critical' : URG.some(k => t.includes(k)) ? 'urgent' : 'standard' }

export default function RegisterForm({ onAdd }) {
  const empty = { name: '', age: '', complaint: '', priority: 'standard' }
  const [f, setF] = useState(empty)
  async function submit(e) { e.preventDefault(); await onAdd(f); setF(empty) }
  return (
    <form className="panel" onSubmit={submit}>
      <h2>Register a patient</h2>
      <label>Name</label><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required />
      <div className="row2">
        <div><label>Age</label><input type="number" min="0" max="120" value={f.age} onChange={e => setF({ ...f, age: e.target.value })} /></div>
        <div><label>Priority</label>
          <select value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })}>
            <option value="standard">Standard</option><option value="urgent">Urgent</option><option value="critical">Critical</option>
          </select></div>
      </div>
      <label>Main complaint</label>
      <input value={f.complaint} onChange={e => setF({ ...f, complaint: e.target.value, priority: e.target.value ? suggest(e.target.value) : 'standard' })} placeholder="e.g. chest pain, fever" />
      {f.complaint && <p className="hint">Suggested priority: {f.priority}. You can change it.</p>}
      <button className="main">Add to queue</button>
    </form>
  )
}
