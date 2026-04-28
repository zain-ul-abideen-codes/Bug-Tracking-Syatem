import { useEffect, useState } from "react";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import { Alert, Box, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { createUser, deleteUser, getUsers, resetPassword, updateUser } from "../api/usersApi";
import useAuth from "../hooks/useAuth";
import useModal from "../hooks/useModal";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import UserModal from "../components/modals/UserModal";
import PasswordResetModal from "../components/modals/PasswordResetModal";

export default function UsersPage() {
  const { user } = useAuth();
  const userModal = useModal();
  const passwordModal = useModal();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canManageUsers = user.role === "administrator";

  const loadUsers = async () => {
    try {
      setLoading(true);
      setUsers(await getUsers());
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = () => {
    setSelectedUser(null);
    userModal.openModal();
  };

  const handleEdit = (record) => {
    setSelectedUser(record);
    userModal.openModal();
  };

  const handlePasswordReset = (record) => {
    setSelectedUser(record);
    passwordModal.openModal();
  };

  const handleSubmitUser = async (payload) => {
    if (selectedUser) {
      await updateUser(selectedUser._id, payload);
    } else {
      await createUser(payload);
    }
    userModal.closeModal();
    await loadUsers();
  };

  const handleDelete = async (id) => {
    await deleteUser(id);
    await loadUsers();
  };

  const handleReset = async (newPassword) => {
    await resetPassword(selectedUser._id, newPassword);
    passwordModal.closeModal();
  };

  if (!canManageUsers) {
    return <Alert severity="info">User management is available to administrators only.</Alert>;
  }

  if (loading) return <LoadingSpinner label="Loading users..." />;

  return (
    <Paper
      sx={{
        p: 3,
        background: "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(244,249,255,0.96))",
      }}
    >
      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <AdminPanelSettingsRoundedIcon color="primary" />
              <Typography variant="h5">User Accounts</Typography>
            </Stack>
            <Typography color="text.secondary">Create, update, delete, and reset user accounts.</Typography>
          </Box>
          <Button onClick={handleCreate}>Create User</Button>
        </Stack>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((record) => (
              <TableRow key={record._id}>
                <TableCell>{record.name}</TableCell>
                <TableCell>{record.email}</TableCell>
                <TableCell>
                  <Chip
                    label={record.role}
                    size="small"
                    sx={{ textTransform: "capitalize" }}
                    color={record.role === "administrator" ? "secondary" : "default"}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button variant="secondary" onClick={() => handleEdit(record)}>
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => handlePasswordReset(record)}>
                    Reset Password
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(record._id)}>
                    Delete
                  </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
      {userModal.isOpen ? (
        <UserModal user={selectedUser} onClose={userModal.closeModal} onSubmit={handleSubmitUser} />
      ) : null}
      {passwordModal.isOpen ? (
        <PasswordResetModal onClose={passwordModal.closeModal} onSubmit={handleReset} />
      ) : null}
    </Paper>
  );
}
