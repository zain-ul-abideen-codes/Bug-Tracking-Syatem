import { Box, Drawer } from "@mui/material";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const drawerWidth = 300;

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", p: { xs: 1.5, md: 2.5 }, gap: 2.5 }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: drawerWidth, borderRadius: 4, m: 1.5 } }}
      >
        <Sidebar />
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { width: drawerWidth, position: "relative", borderRadius: 6 } }}
      >
        <Sidebar />
      </Drawer>
      <Box sx={{ flex: 1, minWidth: 0, display: "grid", alignContent: "start", gap: 2.5 }}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <Outlet />
      </Box>
    </Box>
  );
}
