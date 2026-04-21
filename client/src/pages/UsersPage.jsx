import { useEffect, useState } from "react";
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
    return <section className="panel">User management is available to administrators only.</section>;
  }

  if (loading) return <LoadingSpinner label="Loading users..." />;

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>User Accounts</h2>
          <p>Create, update, delete, and reset user accounts.</p>
        </div>
        <Button onClick={handleCreate}>Create User</Button>
      </div>
      {error ? <p className="server-error">{error}</p> : null}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((record) => (
              <tr key={record._id}>
                <td>{record.name}</td>
                <td>{record.email}</td>
                <td>{record.role}</td>
                <td className="actions-cell">
                  <Button variant="secondary" onClick={() => handleEdit(record)}>
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => handlePasswordReset(record)}>
                    Reset Password
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(record._id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {userModal.isOpen ? (
        <UserModal user={selectedUser} onClose={userModal.closeModal} onSubmit={handleSubmitUser} />
      ) : null}
      {passwordModal.isOpen ? (
        <PasswordResetModal onClose={passwordModal.closeModal} onSubmit={handleReset} />
      ) : null}
    </section>
  );
}
