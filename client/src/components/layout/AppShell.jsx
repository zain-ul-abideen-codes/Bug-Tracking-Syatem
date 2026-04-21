import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content-area">
        <Header />
        <Outlet />
      </main>
    </div>
  );
}
