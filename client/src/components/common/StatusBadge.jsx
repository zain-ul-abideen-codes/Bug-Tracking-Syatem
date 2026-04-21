export default function StatusBadge({ value }) {
  return <span className={`status-badge status-${value}`}>{value}</span>;
}
