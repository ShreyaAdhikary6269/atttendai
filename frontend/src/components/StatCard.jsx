export default function StatCard({ icon: Icon, label, value, note, tone = 'blue' }) {
  return (
    <div className="card stat-card">
      <div className={'stat-icon tone-' + tone}><Icon size={26} /></div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-note">{note}</div>
      </div>
    </div>
  );
}
