import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Shield,
  Key,
  Calendar,
  CheckCircle2,
  Lock,
  LogOut,
  Edit3,
  Camera,
  X,
  AlertCircle,
  Upload,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';

import {
  getUserAvatarColor,
  setUserAvatarColor,
  getUserProfilePhoto,
  setUserProfilePhoto,
} from '../utils/userProfileStorage';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = usePreferences();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passError, setPassError] = useState('');

  // Avatar selector state — isolated per user / role
  const [selectedAvatar, setSelectedAvatar] = useState<string>(() => getUserAvatarColor(user));
  const [profilePhoto, setProfilePhoto] = useState<string>(() => getUserProfilePhoto(user));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfileDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/profile-details');
      setProfile(res.data);
      setEditName(res.data.user_name || '');
      setEditMobile(res.data.mobile || '');
    } catch (err: any) {
      console.error('Error fetching profile details', err);
      // Fallback from auth user
      setProfile({
        user_name: user?.user_name || 'ERP User',
        user_email: user?.user_email || 'user@example.com',
        type: user?.type || 'packing',
        user_role: user?.type || 'packing',
        employee_id: `EMP-${1000 + (user?.id || 1)}`,
        mobile: '+91 98220 44890',
        department: 'Plant Operations',
        status: 'Active',
        last_login: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      });
      setEditName(user?.user_name || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, [user]);

  useEffect(() => {
    const activeUser = profile || user;
    setSelectedAvatar(getUserAvatarColor(activeUser));
    setProfilePhoto(getUserProfilePhoto(activeUser));
  }, [profile, user]);

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await api.put('/auth/profile', {
        user_name: editName,
        mobile: editMobile,
      });
      setShowEditModal(false);
      setSuccessMsg('Profile information updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchProfileDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');

    if (newPass !== confirmPass) {
      setPassError('New password and confirmation do not match');
      return;
    }

    if (newPass.length < 3) {
      setPassError('New password must be at least 3 characters long');
      return;
    }

    setChangingPass(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: currentPass,
        newPassword: newPass,
      });
      setShowPasswordModal(false);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setSuccessMsg('Password changed successfully! Please use your new password next time you login.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setPassError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setChangingPass(false);
    }
  };

  const handleAvatarColorChange = (color: string) => {
    setSelectedAvatar(color);
    const activeUser = profile || user;
    setUserAvatarColor(activeUser, color);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo size should be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProfilePhoto(result);
      const activeUser = profile || user;
      setUserProfilePhoto(activeUser, result);
      setSuccessMsg('Profile photo updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfilePhoto('');
    const activeUser = profile || user;
    setUserProfilePhoto(activeUser, '');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSuccessMsg('Profile photo removed.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const userRole = (profile?.type || user?.type || 'packing').toLowerCase();

  const roleBadgeMap: Record<string, { title: string; color: string; bg: string }> = {
    admin: { title: 'System Administrator', color: '#dc2626', bg: '#fee2e2' },
    packing: { title: 'Finished Goods Packing Operator', color: '#16a34a', bg: '#dcfce7' },
    box: { title: 'Master Box Packing Operator', color: '#d97706', bg: '#fef3c7' },
    invoice: { title: 'Commercial Invoicing & Dispatch Officer', color: '#dc2626', bg: '#fee2e2' },
    gate: { title: 'Security & Outward Gate Officer', color: '#7c3aed', bg: '#ede9fe' },
  };

  const roleInfo = roleBadgeMap[userRole] || roleBadgeMap.admin;

  return (
    <div className="content-body" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 28px 48px', boxSizing: 'border-box' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          {t('profile')}
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
          View and manage your personal details and login credentials
        </p>
      </div>

      {successMsg && (
        <div
          style={{
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontWeight: 600,
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} color="#16a34a" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: '16px',
          border: '1px solid var(--card-border)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          marginBottom: '24px',
          transition: 'background 0.2s ease, border-color 0.2s ease',
        }}
      >
        {/* Top Banner Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '32px 32px 28px',
            color: '#ffffff',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* Avatar with Color Accent or Photo */}
          <div style={{ position: 'relative' }}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: selectedAvatar,
                color: '#ffffff',
                fontSize: '32px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '4px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                profile?.user_name ? profile.user_name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            {/* Quick Upload Icon Badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Change Profile Photo"
              style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#0284c7',
                border: '2px solid #ffffff',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              <Camera size={14} />
            </button>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
                {loading ? '...' : profile?.user_name}
              </h2>
              <span
                style={{
                  background: '#dcfce7',
                  color: '#166534',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '99px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={12} /> Active
              </span>
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              <span>{roleInfo.title}</span>
              <span>•</span>
              <span>{profile?.department || 'Plant Operations'}</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontWeight: 600, fontSize: '13px' }}
              onClick={() => setShowEditModal(true)}
            >
              <Edit3 size={15} /> Edit Profile
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontWeight: 600, fontSize: '13px' }}
              onClick={() => setShowPasswordModal(true)}
            >
              <Key size={15} /> Change Password
            </button>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 20px' }}>
            Personal & Employee Information
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Full Name */}
            <div style={{ background: 'var(--card-sub-bg)', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                <User size={15} color="#0284c7" /> Full Name
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                {loading ? '...' : profile?.user_name}
              </div>
            </div>

            {/* Employee ID */}
            <div style={{ background: 'var(--card-sub-bg)', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                <Shield size={15} color="#0284c7" /> Employee ID
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                {loading ? '...' : profile?.employee_id}
              </div>
            </div>

            {/* Email */}
            <div style={{ background: 'var(--card-sub-bg)', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                <Mail size={15} color="#0284c7" /> Email Address
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                {loading ? '...' : profile?.user_email}
              </div>
            </div>

            {/* Mobile Number */}
            <div style={{ background: 'var(--card-sub-bg)', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                <Phone size={15} color="#0284c7" /> Mobile Number
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                {loading ? '...' : profile?.mobile || '+91 98765 43210'}
              </div>
            </div>

            {/* Assigned Role (Protected) */}
            <div style={{ background: 'var(--card-sub-bg)', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: 600 }}>
                  <Shield size={15} color="#dc2626" /> Assigned Role
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Lock size={11} /> Admin Controlled
                </span>
              </div>
              <div>
                <span
                  style={{
                    background: roleInfo.bg,
                    color: roleInfo.color,
                    fontSize: '12.5px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '6px',
                    display: 'inline-block',
                  }}
                >
                  {roleInfo.title}
                </span>
              </div>
            </div>

            {/* Department */}
            <div style={{ background: 'var(--card-sub-bg)', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                <Briefcase size={15} color="#0284c7" /> Assigned Department
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                {loading ? '...' : profile?.department}
              </div>
            </div>

            {/* Last Login Date */}
            <div style={{ background: 'var(--card-sub-bg)', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                <Calendar size={15} color="#0284c7" /> Active Session / Last Login
              </div>
              <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-main)' }}>
                {loading ? '...' : profile?.last_login}
              </div>
            </div>

            {/* Account Status */}
            <div style={{ background: 'var(--card-sub-bg)', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                <CheckCircle2 size={15} color="#16a34a" /> Account Verification Status
              </div>
              <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#16a34a' }}>
                ✓ Authenticated &amp; Active
              </div>
            </div>
          </div>

          {/* Avatar & Photo Personalization */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Camera size={15} color="#0284c7" /> Avatar Accent Color
                </span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {['#0284c7', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0f172a'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleAvatarColorChange(c)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: c,
                        border: selectedAvatar === c ? '3px solid #38bdf8' : '2px solid var(--card-border)',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                      title="Select avatar color"
                    />
                  ))}
                </div>
              </div>

              {/* Profile Photo Upload / Remove Buttons */}
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <ImageIcon size={15} color="#0284c7" /> Profile Photo
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-outline"
                    style={{ fontSize: '12.5px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Upload size={14} /> Upload Photo
                  </button>
                  {profilePhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="btn btn-outline"
                      style={{ fontSize: '12.5px', padding: '6px 12px', color: '#ef4444', borderColor: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Trash2 size={14} /> Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn-danger"
          style={{ padding: '10px 20px', fontWeight: 600, fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onClick={logout}
        >
          <LogOut size={16} /> Logout from ERP Session
        </button>
      </div>

      {/* ── EDIT PROFILE MODAL ── */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h5 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="#0284c7" /> Edit Profile Details
              </h5>
              <button type="button" onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditProfileSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Mobile Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={profile?.user_email || ''}
                    disabled
                    style={{ background: 'var(--card-sub-bg)', cursor: 'not-allowed', color: 'var(--text-muted)' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Email address is locked and tied to your login account.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updatingProfile}>
                  {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {showPasswordModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h5 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="#0284c7" /> Change Password
              </h5>
              <button type="button" onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit}>
              <div className="modal-body">
                {passError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={15} color="#dc2626" />
                    <span>{passError}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Minimum 3 characters"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Re-type new password"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={changingPass}>
                  {changingPass ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default ProfilePage;
