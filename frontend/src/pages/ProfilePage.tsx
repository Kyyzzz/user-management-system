import { useState, } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import type { UpdateUserDto } from '../types/index.ts';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Validate password fields if changing password
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('New passwords do not match');
          setIsSubmitting(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          setError('Password must be at least 6 characters long');
          setIsSubmitting(false);
          return;
        }
      }

      const updateData: UpdateUserDto = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      };

      // Only include password if user is changing it
      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      await userService.updateUser(currentUser.id, updateData);
      
      // Update local storage with new user data
      const updatedUser = await userService.getUserById(currentUser.id);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear password fields
      setFormData({
        ...formData,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Reload page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    setFormData({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleLogout = () => {
    void authService.logout();
    navigate('/login', { replace: true });
  };

  const getInitials = () => {
    if (!currentUser) return '';
    return `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase();
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const fieldBase =
    'mt-1 block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition ' +
    'placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50';
  const fieldBorderOk = 'border-gray-300';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-12">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold shadow-lg">
                {getInitials()}
              </div>
              <div className="text-white">
                <h2 className="text-3xl font-bold">
                  {currentUser?.firstName} {currentUser?.lastName}
                </h2>
                <p className="text-indigo-100 mt-1">{currentUser?.email}</p>
                <span className="inline-block mt-3 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                  {currentUser?.role === 'admin' ? 'Administrator' : 'User'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-6 py-6 sm:px-8">
            {/* Account Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-4 rounded-lg ring-1 ring-gray-100">
                  <p className="text-gray-600 mb-1 text-sm">Account Created</p>
                  <p className="text-gray-900 font-medium">
                    {currentUser?.createdAt && formatDate(currentUser.createdAt)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg ring-1 ring-gray-100">
                  <p className="text-gray-600 mb-1 text-sm">Last Updated</p>
                  <p className="text-gray-900 font-medium">
                    {currentUser?.updatedAt && formatDate(currentUser.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {success && (
              <div role="alert" className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                {success}
              </div>
            )}

            {/* Edit Profile Form */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900">Profile Details</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                      autoComplete="given-name"
                      className={`${fieldBase} ${fieldBorderOk}`}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                      autoComplete="family-name"
                      className={`${fieldBase} ${fieldBorderOk}`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    inputMode="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                    autoComplete="email"
                    className={`${fieldBase} ${fieldBorderOk}`}
                  />
                </div>

                {/* Password Change Section - Only shown when editing */}
                {isEditing && (
                  <div className="border-t border-gray-200 pt-6 mt-2">
                    <h4 className="text-md font-semibold tracking-tight text-gray-900 mb-5">Change Password (Optional)</h4>
                    <div className="space-y-5">
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                          New Password
                        </label>
                        <input
                          id="newPassword"
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          autoComplete="new-password"
                          placeholder="Leave blank to keep current password"
                          className={`${fieldBase} ${fieldBorderOk}`}
                        />
                      </div>
                      {formData.newPassword && (
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirm New Password
                          </label>
                          <input
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            autoComplete="new-password"
                            placeholder="Confirm your new password"
                            className={`${fieldBase} ${fieldBorderOk}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
