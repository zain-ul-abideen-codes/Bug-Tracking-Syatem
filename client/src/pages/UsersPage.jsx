import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import { DataGrid } from "@mui/x-data-grid";
import { createUser, deleteUser, getUsers, resetPassword, updateUser } from "../api/usersApi";
import { getProjects } from "../api/projectsApi";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import PageHeader from "../components/common/PageHeader";
import PageSkeleton from "../components/common/PageSkeleton";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import UserModal from "../components/modals/UserModal";
import PasswordResetModal from "../components/modals/PasswordResetModal";
import { useSearchParams } from "react-router-dom";

const roleColorMap = {
  administrator: "secondary",
  manager: "primary",
  qa: "warning",
  developer: "success",
};

export default function UsersPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const { notify } = useNotification();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialog, setDialog] = useState("");
  const [pageError, setPageError] = useState("");
  const [searchParams] = useSearchParams();

  const canManageUsers = user.role === "administrator";
  const searchQuery = searchParams.get("search")?.trim().toLowerCase() || "";

  const loadUsers = async () => {
    try {
      setLoading(true);
      setPageError("");
      const [usersData, projectsData] = await Promise.all([
        getUsers(accessToken),
        getProjects(accessToken),
      ]);
      setUsers(usersData);
      setProjects(projectsData);
    } catch (error) {
      const message = error.response?.data?.message || "Unable to load users.";
      setPageError(message);
      if (error.response?.status !== 401 && message !== "Authentication required.") {
        notify(message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return undefined;
    }

    if (!accessToken) {
      setLoading(false);
      setPageError("Authentication required.");
      return undefined;
    }

    loadUsers();
    return undefined;
  }, [accessToken, authLoading]);

  const projectMapByUser = useMemo(() => {
    return projects.reduce((accumulator, project) => {
      const links = [
        project.manager ? { userId: String(project.manager._id || project.manager), role: "manager" } : null,
        ...(project.qaEngineers || []).map((member) => ({
          userId: String(member._id || member),
          role: "qa",
        })),
        ...(project.developers || []).map((member) => ({
          userId: String(member._id || member),
          role: "developer",
        })),
      ].filter(Boolean);

      links.forEach(({ userId, role }) => {
        if (!accumulator[userId]) {
          accumulator[userId] = [];
        }
        accumulator[userId].push({
          _id: project._id,
          title: project.title,
          role,
        });
      });

      return accumulator;
    }, {});
  }, [projects]);

  const rows = useMemo(
    () =>
      users
        .filter((record) =>
          !searchQuery ||
          [record.name, record.email, record.role]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(searchQuery),
        )
        .map((record) => ({
        id: record._id,
        ...record,
        assignedProjects: record.assignedProjects || projectMapByUser[String(record._id)] || [],
      })),
    [projectMapByUser, searchQuery, users],
  );

  const columns = [
    {
      field: "avatar",
      headerName: "",
      width: 80,
      sortable: false,
      renderCell: ({ row }) => <Avatar sx={{ bgcolor: "primary.main" }}>{row.name?.charAt(0)}</Avatar>,
    },
    { field: "name", headerName: "Name", flex: 1, minWidth: 160 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 220 },
    {
      field: "role",
      headerName: "Role",
      minWidth: 150,
      renderCell: ({ value }) => <Chip label={value} color={roleColorMap[value] || "default"} sx={{ textTransform: "capitalize" }} />,
    },
    {
      field: "assignedProjects",
      headerName: "Assigned Projects",
      flex: 1.4,
      minWidth: 280,
      sortable: false,
      renderCell: ({ value }) => (
        <Box sx={{ width: "100%", py: 1 }}>
          {value?.length ? (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {value.map((project) => (
                <Chip
                  key={`${project._id}-${project.role}`}
                  label={project.title}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{
                    maxWidth: 180,
                    "& .MuiChip-label": {
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  }}
                />
              ))}
            </Stack>
          ) : (
            <Chip label="No assignments" size="small" variant="outlined" />
          )}
        </Box>
      ),
    },
    {
      field: "createdAt",
      headerName: "Created At",
      minWidth: 160,
      valueFormatter: (value) => (value ? new Date(value).toLocaleDateString() : "-"),
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 180,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton onClick={() => { setSelectedUser(row); setDialog("user"); }}>
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Password">
            <IconButton onClick={() => { setSelectedUser(row); setDialog("password"); }}>
              <KeyRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => { setSelectedUser(row); setDialog("delete"); }}>
              <DeleteRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const handleUserSubmit = async (payload) => {
    try {
      setSubmitLoading(true);
      if (selectedUser) {
        await updateUser(selectedUser.id, payload);
        notify("User updated successfully.", "success");
      } else {
        await createUser(payload);
        notify("User created successfully.", "success");
      }
      setDialog("");
      setSelectedUser(null);
      await loadUsers();
    } catch (error) {
      notify(error.response?.data?.message || "Unable to save user.", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePasswordReset = async (newPassword) => {
    try {
      setSubmitLoading(true);
      await resetPassword(selectedUser.id, newPassword);
      notify("Password reset successfully.", "success");
      setDialog("");
      setSelectedUser(null);
    } catch (error) {
      notify(error.response?.data?.message || "Unable to reset password.", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await deleteUser(selectedUser.id);
      notify("User deleted successfully.", "success");
      setDialog("");
      setSelectedUser(null);
      await loadUsers();
    } catch (error) {
      notify(error.response?.data?.message || "Unable to delete user.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!canManageUsers) {
    return <EmptyState icon={GroupRoundedIcon} title="Admin access required" subtitle="User management is only available to administrators." />;
  }

  if (loading || authLoading) return <PageSkeleton cards={2} rows={6} />;

  return (
    <Stack spacing={3} className="page-fade-in">
      <PageHeader
        eyebrow="Administration"
        title="Team members and access control"
        subtitle="Create accounts, manage roles, reset passwords, and keep permissions clean."
        action={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => { setSelectedUser(null); setDialog("user"); }}
            sx={{
              alignSelf: { xs: "stretch", md: "center" },
              minHeight: 52,
              px: 3,
              borderRadius: 3,
              fontWeight: 700,
              whiteSpace: "nowrap",
              boxShadow: (theme) => theme.shadows[6],
            }}
          >
            Add User
          </Button>
        }
      />

      {pageError ? (
        <EmptyState icon={GroupRoundedIcon} title="Users unavailable" subtitle={pageError} />
      ) : !rows.length ? (
        <EmptyState
          icon={GroupRoundedIcon}
          title={searchQuery ? "No matching users" : "No users yet"}
          subtitle={
            searchQuery
              ? "Try another name, email, or role to find the team member you need."
              : "Create the first user account to start assigning roles and projects."
          }
        />
      ) : (
      <Paper sx={{ p: 2, overflow: "hidden" }}>
        <Box sx={{ width: "100%" }}>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            sx={{
              width: "100%",
              border: "none",
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "action.hover",
              },
              "& .MuiDataGrid-main": {
                minWidth: 0,
              },
              "& .MuiDataGrid-cell": {
                alignItems: "center",
              },
            }}
          />
        </Box>
      </Paper>
      )}

      <UserModal
        open={dialog === "user"}
        user={selectedUser}
        loading={submitLoading}
        onClose={() => setDialog("")}
        onSubmit={handleUserSubmit}
      />
      <PasswordResetModal
        open={dialog === "password"}
        loading={submitLoading}
        onClose={() => setDialog("")}
        onSubmit={handlePasswordReset}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        loading={deleteLoading}
        title="Delete user"
        description={`Delete ${selectedUser?.name || "this user"}? This action cannot be undone.`}
        confirmLabel="Delete"
        onClose={() => setDialog("")}
        onConfirm={handleDelete}
      />
    </Stack>
  );
}
