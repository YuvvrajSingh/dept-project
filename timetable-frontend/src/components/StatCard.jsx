export default function StatCard({ label, count, icon, onClick }) {
  return (
    <button type="button" className="stat-card" onClick={onClick}>
      <div className="icon">{icon}</div>
      <div className="count">{count}</div>
      <div className="label">{label}</div>
    </button>
  );
}
