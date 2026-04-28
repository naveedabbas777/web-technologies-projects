import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import AdminTopbar from '../components/AdminTopbar.jsx';
import { apiService } from '../api/apiService.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminProfile() {
  const { showAlert } = useAuth();
  const [profile, setProfile] = useState({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@freshgrocery.com',
    phone: '',
    address: '',
    avatar: null
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    apiService.getCurrentUser().then((me) => {
      if (me && me.status === 'success') {
        const user = me.data?.user || me.user || me;
        const parts = (user.name || '').split(' ');
        setProfile({
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' '),
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          avatar: user.avatar || null
        });
      }
    }).catch(() => {});
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        e.target.value = '';
        return;
      }
      if (file.size > 1 * 1024 * 1024) {
        setMessage('Image size must be less than 1MB');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        uploadProfileImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async (file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await apiService.post('/auth/upload-avatar', formData);
      if (response.status !== 'success') {
        throw new Error(response.message || 'Image upload failed');
      }
      setProfile((prev) => ({ ...prev, avatar: response.user.avatar }));
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...savedUser, avatar: response.user.avatar }));
      setMessage('Profile image updated successfully!');
      showAlert('Profile image updated successfully!', 'success', 'Upload complete');
      setImagePreview('');
    } catch (error) {
      setMessage(error.message || 'Failed to upload image');
      showAlert(error.message || 'Failed to upload image', 'error', 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    const response = await apiService.put('/auth/profile', {
      name: `${profile.firstName} ${profile.lastName}`.trim(),
      phone: profile.phone,
      address: profile.address
    });
    if (response.status !== 'success') {
      setMessage(response.message || 'Failed to update profile');
      showAlert(response.message || 'Failed to update profile', 'error', 'Save failed');
      return;
    }
    setMessage('Profile updated successfully.');
    showAlert('Profile updated successfully.', 'success', 'Saved');
  };

  const updatePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setMessage('Please fill all password fields.');
      showAlert('Please fill all password fields.', 'error', 'Missing input');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage('New passwords do not match.');
      showAlert('New passwords do not match.', 'error', 'Check passwords');
      return;
    }
    const response = await apiService.post('/auth/change-password', {
      oldPassword: passwords.currentPassword,
      newPassword: passwords.newPassword
    });
    if (response.status !== 'success') {
      setMessage(response.message || 'Failed to change password');
      showAlert(response.message || 'Failed to change password', 'error', 'Security error');
      return;
    }
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setMessage('Password changed successfully.');
    showAlert('Password changed successfully.', 'success', 'Security');
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      <div className="admin-content">
        <AdminTopbar title="Admin Profile" iconClass="fas fa-user-circle" />
        <div className="admin-page-content">
          {message && (
            <div className="alert alert-info" role="alert">
              {message}
            </div>
          )}

          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar-container-admin">
                <div className="profile-avatar profile-avatar--large">
                  {(profile.avatar || imagePreview) ? (
                    <img src={imagePreview || profile.avatar} alt="Profile" />
                  ) : (
                    <span>{((profile.firstName || profile.lastName || profile.email || 'U').charAt ? (profile.firstName || profile.lastName || profile.email || 'U').charAt(0) : 'U')}</span>
                  )}
                </div>
                <label htmlFor="adminAvatarUpload" className="avatar-upload-btn-admin" title="Click to change profile picture">
                  <i className="fas fa-camera"></i>
                </label>
                <input
                  type="file"
                  id="adminAvatarUpload"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="profile-info">
                <h2>{profile.firstName} {profile.lastName}</h2>
                <p>{profile.email}</p>
                <p><span className="badge bg-success">Active</span></p>
              </div>
            </div>
          </div>

          <div className="profile-card">
            <div className="form-section">
              <h4><i className="fas fa-user"></i> Personal Information</h4>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile.firstName}
                    onChange={(e) => setProfile((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile.lastName}
                    onChange={(e) => setProfile((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Email</label>
                  <input type="email" className="form-control" value={profile.email} disabled />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={profile.phone}
                    onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Address</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={profile.address}
                  onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))}
                ></textarea>
              </div>
              <button className="btn btn-primary" onClick={saveProfile}>
                Save Changes
              </button>
            </div>
          </div>

          <div className="profile-card">
            <div className="form-section">
              <h4><i className="fas fa-shield-alt"></i> Security</h4>
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
              </div>
              <button className="btn btn-warning" onClick={updatePassword}>
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
