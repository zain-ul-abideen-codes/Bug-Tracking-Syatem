import { useEffect, useState } from "react";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { getResolutionCopilot } from "../../api/aiApi";
import { updateBug } from "../../api/bugsApi";
import StatusChangeWarning from "../StatusChangeWarning";

const confidenceColor = {
  high: "#22c55e",
  medium: "#eab308",
  low: "#ef4444",
};

const complexityColor = {
  simple: "#22c55e",
  moderate: "#eab308",
  complex: "#ef4444",
};

const priorityLabel = {
  check_first: "Check first",
  check_second: "Check second",
  check_if_needed: "If needed",
};

const normalizeRole = (role = "") => role.toString().trim().toLowerCase();
const isAdminRole = (role = "") => ["admin", "administrator"].includes(normalizeRole(role));
const ADMIN_WARNING_STATUSES = ["new", "started"];

const tabs = [
  { id: "rootcause", label: "Root Cause" },
  { id: "files", label: "Files" },
  { id: "code", label: "Code Fixes" },
  { id: "plan", label: "Fix Plan" },
  { id: "status", label: "Status" },
];

function LoadingAnimation() {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    "Reading bug report...",
    "Analyzing root cause...",
    "Scanning affected files...",
    "Generating code fixes...",
    "Building fix roadmap...",
    "Almost ready...",
  ];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentStep((previous) => (previous < steps.length - 1 ? previous + 1 : previous));
    }, 800);
    return () => window.clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="copilot-loading-advanced">
      <div className="loading-brain">
        <AutoFixHighRoundedIcon fontSize="inherit" />
      </div>
      <div className="loading-steps-list">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`loading-step-item ${index < currentStep ? "done" : ""} ${
              index === currentStep ? "active" : ""
            } ${index > currentStep ? "pending" : ""}`}
          >
            <span className="step-icon">{index + 1}</span>
            <span className="step-text">{step}</span>
            <span className="step-check">{index < currentStep ? "Done" : index === currentStep ? "Now" : "Wait"}</span>
          </div>
        ))}
      </div>
      <div className="loading-progress-bar">
        <div className="loading-progress-fill" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
      </div>
    </div>
  );
}

function ConfidenceMeter({ confidence }) {
  const levels = {
    high: { value: 92, color: "#22c55e", label: "High Confidence" },
    medium: { value: 65, color: "#eab308", label: "Medium Confidence" },
    low: { value: 35, color: "#ef4444", label: "Low Confidence" },
  };
  const level = levels[confidence] || levels.medium;

  return (
    <div className="confidence-meter">
      <div className="confidence-header">
        <span className="confidence-label">AI Confidence</span>
        <span className="confidence-value" style={{ color: level.color }}>
          {level.value}% - {level.label}
        </span>
      </div>
      <div className="confidence-bar-bg">
        <div className="confidence-bar-fill" style={{ width: `${level.value}%`, background: level.color }} />
      </div>
    </div>
  );
}

function SeverityGauge({ severityScore }) {
  if (!severityScore) return null;

  const score = Math.max(0, Math.min(100, Number(severityScore.score) || 0));
  const getColor = (value) => {
    if (value >= 80) return "#ef4444";
    if (value >= 60) return "#f97316";
    if (value >= 40) return "#eab308";
    return "#22c55e";
  };

  return (
    <div className="severity-gauge">
      <h4 className="severity-title">Bug Severity Score</h4>
      <div className="severity-main">
        <div className="severity-circle" style={{ borderColor: getColor(score) }}>
          <span className="severity-number" style={{ color: getColor(score) }}>
            {score}
          </span>
          <span className="severity-out-of">/100</span>
        </div>
        <div className="severity-breakdown">
          {Object.entries(severityScore.breakdown || {}).map(([key, value]) => {
            const metric = Math.max(1, Math.min(10, Number(value) || 1));
            return (
              <div key={key} className="severity-metric">
                <span className="metric-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <div className="metric-bar-bg">
                  <div className="metric-bar-fill" style={{ width: `${metric * 10}%`, background: getColor(metric * 10) }} />
                </div>
                <span className="metric-value">{metric}/10</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="severity-label-badge" style={{ background: getColor(score) }}>
        {severityScore.label || "Medium"} Severity
      </div>
    </div>
  );
}

const createReportText = ({ bugId, copilot }) =>
  `AI BUG RESOLUTION REPORT
Generated: ${new Date().toLocaleString()}
Bug ID: ${bugId}

ROOT CAUSE ANALYSIS
Summary: ${copilot.rootCause?.summary || "Not available"}
Details: ${copilot.rootCause?.details || "Not available"}
AI Confidence: ${copilot.rootCause?.confidence || "medium"}
Severity: ${copilot.severityScore?.score || "N/A"}/100 (${copilot.severityScore?.label || "N/A"})
Estimated Fix Time: ${copilot.estimatedTime?.minutes || 30} minutes
Complexity: ${copilot.estimatedTime?.complexity || "moderate"}

AFFECTED FILES
${(copilot.affectedFiles || [])
  .map((file) => `[${file.priority || "check"}] ${file.filename}\nLocation: ${file.location}\nReason: ${file.reason}`)
  .join("\n\n")}

STEP BY STEP FIX PLAN
${(copilot.fixPlan || [])
  .map((step) => `Step ${step.step}: ${step.action}\nHow: ${step.detail}\nTool: ${step.tool}`)
  .join("\n\n")}

CODE FIXES
${(copilot.codeFixes || [])
  .map((fix) => `[${fix.title}]\nApply in: ${fix.applyIn}\n${fix.description}\n\n${fix.code}`)
  .join("\n\n")}

WARNINGS
${copilot.warnings?.length ? copilot.warnings.join("\n") : "No warnings"}

Generated by AI Bug Resolution Copilot
BugTracker Pro - FYP Project`;

const ResolutionCopilot = ({ bugId, bugStatus, bugType, userRole, developerName, bugTitle, onStatusUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [copilot, setCopilot] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("rootcause");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [statusWarning, setStatusWarning] = useState(null);

  const progressPercent = copilot?.fixPlan?.length
    ? Math.round((completedSteps.length / copilot.fixPlan.length) * 100)
    : 0;

  useEffect(() => {
    if (!copilot?.statusSuggestion || !bugStatus) return;
    setCopilot((current) =>
      current
        ? {
            ...current,
            statusSuggestion: {
              ...current.statusSuggestion,
              currentStatus: bugStatus,
              updateNow: current.statusSuggestion.suggestedStatus !== bugStatus,
            },
          }
        : current
    );
  }, [bugStatus, copilot?.statusSuggestion?.suggestedStatus]);

  const fetchCopilot = async () => {
    try {
      setLoading(true);
      setError("");
      setStatusUpdateSuccess(false);
      setCompletedSteps([]);
      const response = await getResolutionCopilot(bugId);
      setCopilot(response.copilot);
      setActiveTab("rootcause");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load Resolution Copilot.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async (code, index) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1800);
    } catch (err) {
      setError("Could not copy the code snippet.");
    }
  };

  const toggleStep = (stepIndex) => {
    setCompletedSteps((previous) =>
      previous.includes(stepIndex) ? previous.filter((item) => item !== stepIndex) : [...previous, stepIndex]
    );
  };

  const exportFixReport = () => {
    if (!copilot) return;
    const blob = new Blob([createReportText({ bugId, copilot })], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fix-report-${bugId}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const executeStatusUpdate = async (nextStatus) => {
    try {
      setStatusUpdating(true);
      setError("");
      const optimisticBug = { _id: bugId, status: nextStatus, type: bugType };
      onStatusUpdate?.(optimisticBug);
      setCopilot((current) =>
        current
          ? {
              ...current,
              statusSuggestion: {
                ...current.statusSuggestion,
                currentStatus: nextStatus,
                suggestedStatus: nextStatus,
                reason: `Status updated to ${nextStatus}.`,
                updateNow: false,
              },
            }
          : current
      );
      const response = await updateBug(bugId, { status: nextStatus });
      onStatusUpdate?.(response.bug || { status: nextStatus });
      setStatusUpdateSuccess(true);
      window.setTimeout(() => setStatusUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update issue status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleStatusUpdate = async (nextStatus) => {
    if (!nextStatus || nextStatus === bugStatus) {
      return;
    }

    if (isAdminRole(userRole) && ADMIN_WARNING_STATUSES.includes(bugStatus)) {
      setStatusWarning({ currentStatus: bugStatus, newStatus: nextStatus });
      return;
    }

    await executeStatusUpdate(nextStatus);
  };

  return (
    <>
    <section className="copilot-container">
      <div className="copilot-header">
        <div className="copilot-title">
          <span className="copilot-icon">
            <AutoFixHighRoundedIcon fontSize="inherit" />
          </span>
          <div>
            <h3>AI Bug Resolution Copilot</h3>
            <p>Advanced fix guidance, severity scoring, export report, and workflow help.</p>
          </div>
        </div>

        {!copilot ? (
          <button className="copilot-launch-btn-advanced" type="button" onClick={fetchCopilot} disabled={loading}>
            {loading ? <span className="spinner-small" /> : <span className="launch-btn-icon">AI</span>}
            <span>{loading ? "Analyzing..." : "Launch Copilot"}</span>
            <span className="launch-btn-shine" />
          </button>
        ) : (
          <div className="copilot-meta">
            <span style={{ color: complexityColor[copilot.estimatedTime?.complexity] || "#94a3b8" }}>
              {copilot.estimatedTime?.complexity || "moderate"}
            </span>
            <span className="time-estimate">~{copilot.estimatedTime?.minutes || 30} min</span>
            <button className="export-report-btn" type="button" onClick={exportFixReport} title="Download Fix Report">
              <DownloadRoundedIcon fontSize="small" />
              Export Report
            </button>
            <button className="copilot-refresh-btn" type="button" onClick={fetchCopilot} aria-label="Refresh Copilot">
              <RefreshRoundedIcon fontSize="small" />
            </button>
          </div>
        )}
      </div>

      {error ? <div className="copilot-error">{error}</div> : null}

      {loading ? <LoadingAnimation /> : null}

      {copilot && !loading ? (
        <>
          {copilot.warnings?.length ? (
            <div className="copilot-warnings">
              {copilot.warnings.map((warning, index) => (
                <div key={`${warning}-${index}`} className="warning-item">
                  {warning}
                </div>
              ))}
            </div>
          ) : null}

          <div className="copilot-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`copilot-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="copilot-tab-content">
            <div key={activeTab} className="tab-content-animated">
              {activeTab === "rootcause" ? (
                <div>
                  <SeverityGauge severityScore={copilot.severityScore} />
                  <div className="rootcause-card">
                    <ConfidenceMeter confidence={copilot.rootCause?.confidence} />
                    <h4 className="rootcause-summary">{copilot.rootCause?.summary}</h4>
                    <p className="rootcause-details">{copilot.rootCause?.details}</p>
                  </div>
                  <div className="estimate-card">
                    <div className="estimate-item">
                      <span className="estimate-label">Fix Time</span>
                      <span className="estimate-value">~{copilot.estimatedTime?.minutes || 30} min</span>
                    </div>
                    <div className="estimate-item">
                      <span className="estimate-label">Complexity</span>
                      <span
                        className="estimate-value"
                        style={{ color: complexityColor[copilot.estimatedTime?.complexity] || "#eab308" }}
                      >
                        {copilot.estimatedTime?.complexity || "moderate"}
                      </span>
                    </div>
                    <p>{copilot.estimatedTime?.explanation}</p>
                  </div>
                </div>
              ) : null}

              {activeTab === "files" ? (
                <div>
                  <p className="tab-subtitle">Files most likely involved in this issue:</p>
                  {copilot.affectedFiles?.map((file, index) => (
                    <div key={`${file.filename}-${index}`} className="file-card">
                      <div className="file-card-header">
                        <div>
                          <span className="file-name">{file.filename}</span>
                          <span className="file-location">{file.location}</span>
                        </div>
                        <span className="file-priority">{priorityLabel[file.priority] || "Check"}</span>
                      </div>
                      <p className="file-reason">{file.reason}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeTab === "code" ? (
                <div>
                  <p className="tab-subtitle">Suggested fixes you can review and adapt:</p>
                  {copilot.codeFixes?.map((fix, index) => (
                    <div key={`${fix.title}-${index}`} className="code-fix-card">
                      <div className="code-fix-header">
                        <div>
                          <h4>{fix.title}</h4>
                          <span className="apply-in">Apply in: {fix.applyIn}</span>
                        </div>
                      </div>
                      <p>{fix.description}</p>
                      <div className="code-diff-view">
                        <div className="diff-line diff-before">- Current behavior: missing or mismatched logic causes the issue.</div>
                        <div className="diff-line diff-after">+ Suggested behavior: apply the validated fix below and retest.</div>
                      </div>
                      <div className="code-block-wrapper">
                        <div className="code-block-header">
                          <span className="code-language">{fix.language}</span>
                          <button className="copy-code-btn" type="button" onClick={() => copyCode(fix.code, index)}>
                            <ContentCopyRoundedIcon fontSize="inherit" />
                            {copiedIndex === index ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <pre className="code-block">
                          <code>{fix.code}</code>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeTab === "plan" ? (
                <div>
                  <p className="tab-subtitle">Follow this checklist to fix and verify the issue:</p>
                  <div className="fix-progress-header">
                    <span className="fix-progress-label">
                      Fix Progress: {completedSteps.length}/{copilot.fixPlan?.length || 0} steps
                    </span>
                    <span className="fix-progress-percent" style={{ color: progressPercent === 100 ? "#22c55e" : "#7c3aed" }}>
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="fix-progress-bar-bg">
                    <div className="fix-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                  {progressPercent === 100 ? (
                    <div className="all-steps-done">All steps completed. You can update the status when testing passes.</div>
                  ) : null}
                  {copilot.fixPlan?.map((step, index) => {
                    const completed = completedSteps.includes(index);
                    return (
                      <button
                        key={step.step}
                        type="button"
                        className={`plan-step-card plan-step-button ${completed ? "step-completed" : ""}`}
                        onClick={() => toggleStep(index)}
                      >
                        <div className={`plan-step-number ${completed ? "step-num-done" : ""}`}>
                          {completed ? "OK" : step.step}
                        </div>
                        <div>
                          <div className={`plan-step-action ${completed ? "step-text-done" : ""}`}>{step.action}</div>
                          <div className="plan-step-detail">{step.detail}</div>
                          <div className="plan-step-tool">{step.tool}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {activeTab === "status" && copilot.statusSuggestion ? (
                <div className="status-suggestion-card">
                  <h4>AI Status Recommendation</h4>
                  <div className="status-flow">
                    <div>
                      <span className="status-label">Current</span>
                      <span className="status-badge current">{copilot.statusSuggestion.currentStatus}</span>
                    </div>
                    <span className="status-arrow">to</span>
                    <div>
                      <span className="status-label">Suggested</span>
                      <span className="status-badge suggested">{copilot.statusSuggestion.suggestedStatus}</span>
                    </div>
                  </div>
                  <p>{copilot.statusSuggestion.reason}</p>
                  {copilot.statusSuggestion.updateNow ? (
                    <button
                      className="update-status-btn"
                      type="button"
                      onClick={() => handleStatusUpdate(copilot.statusSuggestion.suggestedStatus)}
                      disabled={statusUpdating}
                    >
                      {statusUpdating ? "Updating..." : `Update to ${copilot.statusSuggestion.suggestedStatus}`}
                    </button>
                  ) : null}
                  {statusUpdateSuccess ? (
                    <div className="status-success-animation">
                      <span className="success-emoji">OK</span>
                      <span>Status updated successfully.</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </section>
    <StatusChangeWarning
      isOpen={Boolean(statusWarning)}
      currentStatus={statusWarning?.currentStatus || ""}
      newStatus={statusWarning?.newStatus || ""}
      developerName={developerName || "Unassigned"}
      bugTitle={bugTitle || "Selected issue"}
      onCancel={() => setStatusWarning(null)}
      onConfirm={async () => {
        const pending = statusWarning;
        setStatusWarning(null);
        await executeStatusUpdate(pending?.newStatus);
      }}
    />
    </>
  );
};

export default ResolutionCopilot;
