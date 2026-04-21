import useAuth from "../../hooks/useAuth";
import Button from "../common/Button";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div>
        <h1>Welcome back, {user.name}</h1>
        <p>{user.role.replace("-", " ")}</p>
      </div>
      <Button variant="secondary" onClick={logout}>
        Sign out
      </Button>
    </header>
  );
}
