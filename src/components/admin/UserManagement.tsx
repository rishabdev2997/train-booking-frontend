import { useEffect, useState } from 'react';
import API from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  role?: string;
};

export default function UserManagement({
  role = "ADMIN",            // "ADMIN" or "USER"
  currentUserId              // required for USER role
}: {
  role?: "ADMIN" | "USER";
  currentUserId?: string;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [selfId, setSelfId] = useState<string | undefined>(currentUserId);

  // Only fetch /auth/me if role=USER and userId not provided
  useEffect(() => {
    if (role === "USER" && !currentUserId) {
      API.get('/auth/me')
        .then(res => setSelfId(res.data.id))
        .catch(() => setSelfId(undefined));
    }
  }, [role, currentUserId]);

  // Fetch all users (admin) or just self (user)
  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (role === "USER") {
        // Fetch only current user
        const userRes = selfId
          ? await API.get(`/users/${selfId}`)
          : null;
        setUsers(userRes?.data ? [userRes.data] : []);
      } else {
        const res = await API.get('/users');
        setUsers(res.data);
      }
    } catch (err) {
      toast.error('Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "USER" && !selfId) return;
    fetchUsers();
    // eslint-disable-next-line
  }, [role, selfId]);

  // Simple search (admin only; users can't search others)
  const filteredUsers = (role === "USER"
    ? users
    : users.filter(u => {
        const query = search.trim().toLowerCase();
        return (
          u.firstName?.toLowerCase().includes(query) ||
          u.lastName?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.phone?.toLowerCase().includes(query) ||
          (u.address?.toLowerCase() || '').includes(query) ||
          (u.role?.toLowerCase() || '').includes(query) ||
          u.id?.toLowerCase().includes(query)
        );
      }));

  // Edit logic
  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditForm({ ...user });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm(f => ({
      ...f,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    try {
      const res = await API.put(`/users/${editingId}`, editForm);
      setUsers(users => users.map(u => u.id === editingId ? res.data : u));
      toast.success('User updated');
      setEditingId(null);
    } catch {
      toast.error('Update failed');
    }
  };

  const handleEditCancel = () => setEditingId(null);

  // Delete user from user-service (admin only)
  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await API.delete(`/users/${userId}`);
      setUsers(users => users.filter(u => u.id !== userId));
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  // Role change goes through auth service (admin only)
  const handleChangeRole = async (user: User) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await API.patch(`/auth/users/${user.id}/role`, { role: newRole });
      setUsers(users =>
        users.map(u =>
          u.id === user.id ? { ...u, role: newRole } : u
        )
      );
      toast.success(`Role changed to ${newRole}`);
    } catch {
      toast.error('Role change failed');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">
        User Management {role === "USER" ? "(My Profile)" : ""}
      </h2>
      {/* Search users (admins only) */}
      {role === "ADMIN" && (
        <div className="mb-4 flex items-center gap-2 max-w-md">
          <Input
            placeholder="Search by name, email, phone, address, role"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search Users"
          />
          <Button variant="outline" onClick={() => setSearch('')}>Clear</Button>
        </div>
      )}
      {loading ? (
        <div>Loading users...</div>
      ) : (
        <ul className="space-y-2">
          {filteredUsers.length === 0 ? (
            <li className="text-gray-400">No users found.</li>
          ) : (
            filteredUsers.map(user => (
              <li
                key={user.id}
                className="border p-2 rounded flex flex-col md:flex-row md:items-center md:justify-between gap-2"
              >
                {editingId === user.id ? (
                  <div>
                    <p>
                      <span className="font-semibold">Name:</span>
                      <Input
                        name="firstName"
                        value={editForm.firstName ?? ''}
                        onChange={handleEditChange}
                        className="inline-block w-24 mx-1"
                        disabled={role === "USER" && user.id !== selfId}
                      />
                      <Input
                        name="lastName"
                        value={editForm.lastName ?? ''}
                        onChange={handleEditChange}
                        className="inline-block w-24 mx-1"
                        disabled={role === "USER" && user.id !== selfId}
                      />
                    </p>
                    <p>
                      <span className="font-semibold">Email:</span>
                      <Input
                        name="email"
                        value={editForm.email ?? ''}
                        onChange={handleEditChange}
                        className="inline-block w-48 mx-1"
                        disabled={role === "USER" && user.id !== selfId}
                      />
                    </p>
                    <p>
                      <span className="font-semibold">Phone:</span>
                      <Input
                        name="phone"
                        value={editForm.phone ?? ''}
                        onChange={handleEditChange}
                        className="inline-block w-32 mx-1"
                        disabled={role === "USER" && user.id !== selfId}
                      />
                    </p>
                    <p>
                      <span className="font-semibold">Address:</span>
                      <Input
                        name="address"
                        value={editForm.address ?? ''}
                        onChange={handleEditChange}
                        className="inline-block w-64 mx-1"
                        disabled={role === "USER" && user.id !== selfId}
                      />
                    </p>
                  </div>
                ) : (
                  <div>
                    <p>
                      <span className="font-semibold">Name:</span> {user.firstName} {user.lastName}
                    </p>
                    <p>
                      <span className="font-semibold">Email:</span> {user.email}
                    </p>
                    {user.phone && (
                      <p>
                        <span className="font-semibold">Phone:</span> {user.phone}
                      </p>
                    )}
                    {user.address && (
                      <p>
                        <span className="font-semibold">Address:</span> {user.address}
                      </p>
                    )}
                    {user.role && (
                      <p>
                        <span className="font-semibold">Role:</span> {user.role}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">UserId: {user.id}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  {editingId === user.id ? (
                    <>
                      <Button
                        variant="default"
                        onClick={handleEditSave}
                        disabled={role === "USER" && user.id !== selfId}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleEditCancel}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Edit allowed if admin, or user is self */}
                      {(role === "ADMIN" || user.id === selfId) && (
                        <Button
                          variant="secondary"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </Button>
                      )}
                      {/* Promote/Demote admin: admin only, can't change self */}
                      {role === "ADMIN" && user.id !== selfId && (
                        <Button
                          variant={user.role === 'ADMIN' ? 'secondary' : 'default'}
                          onClick={() => handleChangeRole(user)}
                        >
                          {user.role === 'ADMIN' ? 'Demote to USER' : 'Promote to ADMIN'}
                        </Button>
                      )}
                      {/* Delete: admin only, can't delete self */}
                      {role === "ADMIN" && user.id !== selfId && (
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(user.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
