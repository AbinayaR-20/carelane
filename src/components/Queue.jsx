const mins = (t) => Math.max(0, Math.round((Date.now() - new Date(t)) / 60000))

function Row({ v, children }) {
  return (
    <div className={`item p-${v.priority}`}>
      <div className="bar" />
      <div>
        <span className="name">{v.patients?.name}</span><span className="tag">{v.priority}</span>
        <div className="meta">{v.patients?.age ? `${v.patients.age} yrs · ` : ''}{v.complaint} · {v.status === 'waiting' ? `waiting ${mins(v.arrived_at)} min` : `with ${v.doctors?.name}`}</div>
      </div>
      {children}
    </div>
  )
}
export default function Queue({ visits, doctors, onCall, onDone }) {
  const waiting = visits.filter(v => v.status === 'waiting')
  const busy = visits.filter(v => v.status === 'in_consult')
  const free = doctors.filter(d => d.available).length
  return (
    <section className="panel">
      <div className="docs">{doctors.map(d => (
        <div key={d.id} className={`doc ${d.available ? '' : 'busy'}`}>{d.name}<small>{d.specialty} · {d.available ? 'free' : 'busy'}</small></div>))}</div>
      <h2>Waiting ({waiting.length})</h2>
      {waiting.length ? waiting.map(v => <Row key={v.id} v={v}><button disabled={!free} title={free ? '' : 'All doctors are busy'} onClick={() => onCall(v.id)}>Call in</button></Row>)
        : <p className="empty">No one is waiting. Register a patient to start the queue.</p>}
      <div className="sect">In consultation</div>
      {busy.length ? busy.map(v => <Row key={v.id} v={v}><button onClick={() => onDone(v.id)}>Mark done</button></Row>)
        : <p className="empty">No consultations in progress.</p>}
    </section>
  )
}
