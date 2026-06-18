const statusCopy = {
  new: {
    label: "Developer has not started yet",
    detail:
      "This issue is still in the new queue. Changing it as an admin can skip the developer's normal workflow.",
  },
  started: {
    label: "Developer is currently working",
    detail:
      "This issue is already in progress. Changing it now may interrupt the assigned developer's work.",
  },
};

export default function StatusChangeWarning({
  isOpen,
  currentStatus,
  newStatus,
  developerName,
  bugTitle,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const copy = statusCopy[currentStatus] || {
    label: "Confirm status change",
    detail: "Please confirm before changing this issue status.",
  };

  return (
    <div className="status-warning-backdrop" role="presentation">
      <div className="status-warning-modal" role="dialog" aria-modal="true" aria-labelledby="status-warning-title">
        <div className="status-warning-icon">!</div>
        <div className="status-warning-content">
          <p className="status-warning-kicker">Admin status change</p>
          <h3 id="status-warning-title">{copy.label}</h3>
          <p>{copy.detail}</p>
          <div className="status-warning-summary">
            <span>{bugTitle || "Selected issue"}</span>
            <strong>
              {currentStatus} to {newStatus}
            </strong>
          </div>
          <p className="status-warning-developer">
            Assigned developer: <strong>{developerName || "Unassigned"}</strong>
          </p>
          <div className="status-warning-actions">
            <button className="status-warning-secondary" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="status-warning-primary" type="button" onClick={onConfirm}>
              Yes, change status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
