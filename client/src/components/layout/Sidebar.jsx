import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const roleLinks = {
  administrator: [
    { to: "/", label: "Dashboard" },
    { to: "/users", label: "Users" },
    { to: "/projects", label: "Projects" },
    { to: "/bugs", label: "Issues" },
  ],
  manager: [
    { to: "/", label: "Dashboard" },
    { to: "/projects", label: "Projects" },
    { to: "/bugs", label: "Issues" },
  ],
  qa: [
    { to: "/", label: "Dashboard" },
    { to: "/projects", label: "Projects" },
    { to: "/bugs", label: "Issues" },
  ],
  developer: [
    { to: "/", label: "Dashboard" },
    { to: "/bugs", label: "Assigned Issues" },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const links = roleLinks[user.role] || [];

  return (
    <aside className="sidebar">
      <div className="brand">
        <p>Issue Pilot</p>
        <span>Bug Tracking System</span>
      </div>
      <nav className="nav-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
