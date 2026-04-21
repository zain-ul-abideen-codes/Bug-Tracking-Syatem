export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}
