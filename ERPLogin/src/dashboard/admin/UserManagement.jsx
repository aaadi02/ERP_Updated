import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaUserShield, FaUserGraduate, FaUserTie } from 'react-icons/fa';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@college.edu',
      role: 'student',
      contact: '9876543210'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@college.edu',
      role: 'faculty',
      contact: '9876543211'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike@college.edu',
      role: 'conductor',
      contact: '9876543212'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    contact: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentUser) {
      // Update existing user
      setUsers(users.map(user => 
        user.id === currentUser.id ? { ...user, ...formData } : user
      ));
    } else {
      // Add new user
      const newUser = { ...formData, id: users.length + 1 };
      setUsers([...users, newUser]);
    }
    setIsModalOpen(false);
    setCurrentUser(null);
    setFormData({ name: '', email: '', role: 'student', contact: '' });
  };

  const handleEdit = (user) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      contact: user.contact
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setUsers(users.filter(user => user.id !== id));
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <FaUserShield className="role-icon admin" />;
      case 'faculty': return <FaUserTie className="role-icon faculty" />;
      case 'conductor': return <FaUserShield className="role-icon conductor" />;
      default: return <FaUserGraduate className="role-icon student" />;
    }
  };

  return (
    <div className="user-management">
      <div className="header">
        <h2>User Management</h2>
        <button 
          className="add-btn"
          onClick={() => {
            setCurrentUser(null);
            setIsModalOpen(true);
          }}
        >
          <FaPlus /> Add User
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>
                <div className="user-info">
                  {getRoleIcon(user.role)}
                  <span>{user.name}</span>
                </div>
              </td>
              <td>{user.email}</td>
              <td>
                <span className={`role-badge ${user.role}`}>
                  {user.role}
                </span>
              </td>
              <td>{user.contact}</td>
              <td>
                <button className="edit-btn" onClick={() => handleEdit(user)}>
                  <FaEdit />
                </button>
                <button className="delete-btn" onClick={() => handleDelete(user.id)}>
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>{currentUser ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="student">student</option>
                  <option value="faculty">Faculty</option>
                  <option value="conductor">Conductor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;