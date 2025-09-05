import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';

const SettingsTab = ({ user, handleProfileUpdate, handlePasswordChange }) => {
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    specialization: user?.specialization || ''
  });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const onProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const onPasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const onProfileSubmit = (e) => {
    e.preventDefault();
    handleProfileUpdate(profileData);
  };

  const onPasswordSubmit = (e) => {
    e.preventDefault();
    handlePasswordChange(passwordData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Profile Settings */}
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center"><User className="mr-2 h-5 w-5"/> Update Profile</h3>
        <form onSubmit={onProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-300">First Name</label>
              <input type="text" name="firstName" id="firstName" value={profileData.firstName} onChange={onProfileChange} className="mt-1 w-full pl-3 pr-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-300">Last Name</label>
              <input type="text" name="lastName" id="lastName" value={profileData.lastName} onChange={onProfileChange} className="mt-1 w-full pl-3 pr-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email Address</label>
            <input type="email" name="email" id="email" value={profileData.email} disabled className="mt-1 w-full pl-3 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-md cursor-not-allowed" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-300">Phone Number</label>
              <input type="text" name="phoneNumber" id="phoneNumber" value={profileData.phoneNumber} onChange={onProfileChange} className="mt-1 w-full pl-3 pr-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" />
            </div>
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-slate-300">Specialization</label>
              <input type="text" name="specialization" id="specialization" value={profileData.specialization} onChange={onProfileChange} className="mt-1 w-full pl-3 pr-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" />
            </div>
          </div>
          <div className="text-right">
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">Save Changes</button>
          </div>
        </form>
      </div>

      {/* Password Settings */}
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center"><Lock className="mr-2 h-5 w-5"/> Change Password</h3>
        <form onSubmit={onPasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" class="block text-sm font-medium text-slate-300">Current Password</label>
            <input type="password" name="currentPassword" id="currentPassword" value={passwordData.currentPassword} onChange={onPasswordChange} className="mt-1 w-full pl-3 pr-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
          <div>
            <label htmlFor="newPassword" class="block text-sm font-medium text-slate-300">New Password</label>
            <input type="password" name="newPassword" id="newPassword" value={passwordData.newPassword} onChange={onPasswordChange} className="mt-1 w-full pl-3 pr-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
          <div>
            <label htmlFor="confirmPassword" class="block text-sm font-medium text-slate-300">Confirm New Password</label>
            <input type="password" name="confirmPassword" id="confirmPassword" value={passwordData.confirmPassword} onChange={onPasswordChange} className="mt-1 w-full pl-3 pr-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
          <div className="text-right">
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">Update Password</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsTab;
