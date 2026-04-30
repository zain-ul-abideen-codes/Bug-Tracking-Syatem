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
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import PageHeader from "../components/common/PageHeader";
import PageSkeleton from "../components/common/PageSkeleton";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import UserModal from "../components/modals/UserModal";
import PasswordResetModal from "../components/modals/PasswordResetModal";

const roleColorMap = {
  administrator: "secondary",
  manager: "primary",
  qa: "warning",
  developer: "success",
};

export default function UsersPage() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialog, setDialog] = useState("");

  const canManageUsers = user.role === "administrator";

  const loadUsers = async () => {
    try {
      setLoading(true);
      setUsers(await getUsers());
    } catch (error) {
      notify(error.response?.data?.message || "Unable to load users.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const rows = useMemo(
    () => users.map((record) => ({ id: record._id, ...record })),
    [users],
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

  if (loading) return <PageSkeleton cards={2} rows={6} />;

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

      <Paper sx={{ p: 2 }}>
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            sx={{
              minWidth: 900,
              border: "none",
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "action.hover",
              },
            }}
          />
        </Box>
      </Paper>

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
