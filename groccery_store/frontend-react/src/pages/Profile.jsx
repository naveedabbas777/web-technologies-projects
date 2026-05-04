import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiService } from '../api/apiService.js';

export default function Profile() {
  const { user, setUser, logout, showAlert } = useAuth();
  const [profile, setProfile] = useState(user || {});
  const [message, setMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  useEffect(() => {
    if (!user) return;
    apiService
      .getCurrentUser()
      .then((me) => {
        if (me.status === 'success' && me.user) {
          const updated = {
            ...profile,
            name: me.user.name,
            email: me.user.email,
            phone: me.user.phone || '',
            address: me.user.address || '',
            default_address: me.user.default_address || '',
            loyalty_points: me.user.loyalty_points || 0
          };
          setProfile(updated);
          localStorage.setItem('user', JSON.stringify(updated));
          setUser(updated);
          showAlert('Profile loaded successfully.', 'success', 'Profile');
        }
      })
      .catch(() => showAlert('Could not load your profile.', 'error', 'Profile error'));
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.put('/auth/profile', {
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        default_address: profile.default_address
      });
      if (response.status !== 'success') {
        throw new Error(response.message || 'Profile update failed');
      }
      localStorage.setItem('user', JSON.stringify(profile));
      setUser(profile);
      setEditMode(false);
      setMessage('Profile updated successfully.');
      showAlert('Profile updated successfully.', 'success', 'Saved');
    } catch (error) {
      setMessage(error.message || 'Profile update failed.');
      showAlert(error.message || 'Profile update failed.', 'error', 'Save failed');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    try {
      const response = await apiService.post('/auth/change-password', {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });
      if (response.status !== 'success') {
        throw new Error(response.message || 'Password change failed');
      }
      setPasswords({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
      setMessage('Password changed successfully.');
      showAlert('Password changed successfully.', 'success', 'Security');
    } catch (error) {
      setMessage(error.message || 'Password change failed.');
      showAlert(error.message || 'Password change failed.', 'error', 'Security error');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        showAlert('Please select a valid image file.', 'error', 'Invalid file');
        e.target.value = '';
        return;
      }
      
      // Validate file size (1MB)
      if (file.size > 1 * 1024 * 1024) {
        setMessage('Image size must be less than 1MB');
        showAlert('Image size must be less than 1MB.', 'error', 'File too large');
        e.target.value = '';
        return;
      }

      // Create preview
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

      // Update profile and user context
      const updatedUser = response.user;
      setProfile(updatedUser);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
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

  return (
    <>
      <Navbar />
      <section className="profile-hero">
        <div className="container">
            <div className="profile-hero-content">
            <div>
              <div className="profile-chip">
                <i className="fas fa-id-card"></i> Account Center
              </div>
              <h1>Profile Overview</h1>
              <p>Manage your personal details, delivery info, and security settings.</p>
            </div>
            <div className="profile-actions">
              <button className="btn btn-outline-light" type="button" onClick={logout}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container profile-shell">
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="profile-avatar-container">
                  <div className="profile-avatar profile-avatar--medium">
                    {(profile.avatar || imagePreview) ? (
                      <img src={imagePreview || profile.avatar} alt="Profile" />
                    ) : (
                      <span>{(profile.name || profile.email || 'U').charAt(0)}</span>
                    )}
                  </div>
                  <label htmlFor="avatarUpload" className="avatar-upload-btn" title="Click to change profile picture">
                    <i className="fas fa-camera"></i>
                  </label>
                  <input
                    type="file"
                    id="avatarUpload"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </div>
                <div>
                  <h3>{profile.name || 'User'}</h3>
                  <p>{profile.email || 'email@example.com'}</p>
                  <div className="profile-status">
                    <span className="status-dot"></span> Active account
                  </div>
                </div>
              </div>
                <div className="profile-card-body">
                  <div className="profile-card-actions">
                    <button className="btn profile-logout-btn" type="button" onClick={logout}>
                      <i className="fas fa-sign-out-alt"></i> Sign Out
                    </button>
                  </div>
                </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="profile-card profile-card-glass">
              <div className="profile-card-body">
                <div className="profile-section-head">
                  <div>
                    <h4>Account Information</h4>
                    <p>Keep your contact information up to date.</p>
                  </div>
                </div>
                {message && (
                  <div className="alert alert-info alert-dismissible fade show" role="alert">
                    {message}
                    <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                  </div>
                )}
                <div className="profile-summary-grid">
                  <div>
                    <span className="label">Full Name</span>
                    <strong>{profile.name || 'Not set'}</strong>
                  </div>
                  <div>
                    <span className="label">Email</span>
                    <strong>{profile.email || 'Not set'}</strong>
                  </div>
                  <div>
                    <span className="label">Phone</span>
                    <strong>{profile.phone || 'Not set'}</strong>
                  </div>
                  <div>
                    <span className="label">Address</span>
                    <strong>{profile.address || 'Not set'}</strong>
                  </div>
                  <div>
                    <span className="label">Default Address</span>
                    <strong>{profile.default_address || 'Not set'}</strong>
                  </div>
                  <div>
                    <span className="label">Loyalty Points</span>
                    <strong>{profile.loyalty_points ?? 0}</strong>
                  </div>
                </div>
                <div className="profile-form-actions">
                  <button type="button" className="btn btn-primary" onClick={() => setEditMode(true)}>
                    <i className="fas fa-edit"></i> Edit Details
                  </button>
                </div>
              </div>
            </div>

            <div className="profile-card profile-card-glass mt-4">
              <div className="profile-card-body">
                <div className="profile-section-head">
                  <div>
                    <h4>Security</h4>
                    <p>Change your password regularly to keep your account safe.</p>
                  </div>
                </div>
                <form onSubmit={changePassword}>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Current Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwords.oldPassword}
                        onChange={(e) => setPasswords((prev) => ({ ...prev, oldPassword: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwords.confirmNewPassword}
                        onChange={(e) => setPasswords((prev) => ({ ...prev, confirmNewPassword: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="profile-form-actions">
                    <button type="submit" className="btn btn-warning">
                      <i className="fas fa-key"></i> Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {editMode && (
        <div className="profile-edit-overlay" role="dialog" aria-modal="true">
          <div className="profile-edit-panel">
            <div className="profile-edit-header">
              <div>
                <h4>Edit Profile</h4>
                <p>Update your account details below.</p>
              </div>
              <button
                type="button"
                className="btn btn-light btn-sm"
                onClick={() => setEditMode(false)}
              >
                Close
              </button>
            </div>
            <form onSubmit={saveProfile}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={profile.name || ''}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={profile.email || ''}
                    disabled
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={profile.phone || ''}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address"
                    value={profile.address || ''}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Default Address</label>
                  <input
                    type="text"
                    className="form-control"
                    name="default_address"
                    value={profile.default_address || ''}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>
              <div className="profile-edit-actions">
                <button type="submit" className="btn btn-success">
                  <i className="fas fa-save"></i> Save Changes
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
