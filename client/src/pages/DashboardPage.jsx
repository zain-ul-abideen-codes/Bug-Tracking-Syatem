import { useEffect, useState } from "react";
import { getDashboard } from "../api/dashboardApi";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatCard from "../components/common/StatCard";
import DashboardCharts from "../components/charts/DashboardCharts";
import useAuth from "../hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await getDashboard();
        setDashboard(data);
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error) return <div className="panel">{error}</div>;

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Delivery Command Center</p>
          <h2>Track delivery health, unblock teams, and keep every release visible.</h2>
          <p className="hero-copy">
            Personalized analytics for {user.role} with issue movement, completion pressure, and project distribution.
          </p>
        </div>
        <div className="hero-chip-row">
          <span className="hero-chip">Role-based insights</span>
          <span className="hero-chip">Live issue distribution</span>
          <span className="hero-chip">Project workload visibility</span>
        </div>
      </section>
      <section className="stats-grid">
        <StatCard label="Projects" value={dashboard.metrics.projectCount} tone="default" helper="Active delivery spaces" />
        <StatCard label="All Issues" value={dashboard.metrics.issueCount} tone="accent" helper="Total visible issues" />
        <StatCard label="Open Work" value={dashboard.metrics.openCount} tone="warning" helper="New and in progress" />
        <StatCard label="Done" value={dashboard.metrics.completedCount} tone="success" helper="Resolved and completed" />
        <StatCard label="Overdue" value={dashboard.metrics.overdueCount} tone="danger" helper="Need attention now" />
        <StatCard label="Assigned To Me" value={dashboard.metrics.assignedToMeCount} tone="teal" helper="Personal ownership" />
      </section>
      <DashboardCharts charts={dashboard.charts} />
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Recent Issues</h2>
            <p>Latest work items visible to your role.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Project</th>
                <th>Assignee</th>
                <th>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentIssues.map((issue) => (
                <tr key={issue._id}>
                  <td>{issue.title}</td>
                  <td>{issue.type}</td>
                  <td>{issue.status}</td>
                  <td>{issue.project?.title || "Unknown"}</td>
                  <td>{issue.assignedDeveloper?.name || "Unassigned"}</td>
                  <td>{issue.deadline ? new Date(issue.deadline).toLocaleDateString() : "No deadline"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
