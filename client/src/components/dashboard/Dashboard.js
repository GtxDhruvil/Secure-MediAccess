import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PatientDashboard from './PatientDashboard';
import DoctorDashboard from './DoctorDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'patient':
      return <PatientDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'admin':
      // TODO: Create AdminDashboard component
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
            <p className="text-gray-600">Admin dashboard coming soon...</p>
          </div>
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Unknown Role</h1>
            <p className="text-gray-600">Please contact support for assistance.</p>
          </div>
        </div>
      );
  }
};

export default Dashboard;




