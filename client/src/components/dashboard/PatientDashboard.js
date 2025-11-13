import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { 
  FileText, 
  Shield, 
  User, 
  Settings, 
  Bell, 
  Calendar,
  Download,
  Eye,
  Unlock,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const OTPModal = ({ show, onClose, onSubmit, otp, setOtp }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800/80 border border-slate-700 w-full max-w-sm rounded-xl shadow-lg p-6 animate-slideUp">
        <h3 className="text-lg font-semibold text-white mb-4">Enter OTP Code</h3>
        <p className="text-sm text-slate-400 mb-4">Please enter the one-time password sent to your email to approve this access request.</p>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          className="w-full bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white text-center tracking-widest text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-700/50 text-gray-300 hover:bg-slate-700 transition-colors">Cancel</button>
          <button onClick={onSubmit} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">Approve Access</button>
        </div>
      </div>
    </div>
  );
};

const PatientDashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRecords: 0,
    pendingRequests: 0,
    activeAccess: 0,
    lastLogin: null
  });
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [currentRequestId, setCurrentRequestId] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // Show login message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please login to access your patient dashboard.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const fetchDashboardData = async () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping data fetch');
      return;
    }

    setLoading(true);
    try {
      const [recordsRes, requestsRes, statsRes] = await Promise.all([
        api.get('/api/patient/medical-records'),
        api.get('/api/patient/access-requests'),
        api.get('/api/patient/stats')
      ]);

      setMedicalRecords(recordsRes.data.records || []);
      setAccessRequests(requestsRes.data.requests || []);
      const s = statsRes.data?.data || statsRes.data || {};
      setStats({
        totalRecords: s.totalRecords ?? 0,
        pendingRequests: s.pendingRequests ?? 0,
        activeAccess: s.activeAccess ?? 0,
        lastLogin: s.lastLogin ?? null
      });
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Please login to access your dashboard');
      } else {
        toast.error('Failed to fetch dashboard data');
        console.error('Dashboard data fetch error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (requestId) => {
    setCurrentRequestId(requestId);
    setShowOtpModal(true);
  };

  const handleOtpSubmit = async () => {
    if (!otpCode) {
      toast.error('OTP code is required');
      return;
    }
    try {
      await api.post(`/api/otp/verify-otp`, { 
        accessRequestId: currentRequestId,
        otpCode: otpCode 
      });
      toast.success('Access granted successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Access request error:', error);
      const errorMessage = error.response?.data?.error || `Failed to approve access request`;
      toast.error(errorMessage);
    } finally {
      setShowOtpModal(false);
      setOtpCode('');
      setCurrentRequestId(null);
    }
  };

  const handleDenyClick = async (requestId) => {
    try {
      await api.post(`/api/otp/deny-access`, { 
        accessRequestId: requestId 
      });
      toast.success('Access denied');
      fetchDashboardData();
    } catch (error) {
      console.error('Access request error:', error);
      const errorMessage = error.response?.data?.error || `Failed to deny access request`;
      toast.error(errorMessage);
    }
  };

  const downloadRecord = async (recordId) => {
    try {
      const response = await api.get(`/api/patient/medical-records/${recordId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `medical-record-${recordId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Record downloaded successfully');
    } catch (error) {
      toast.error('Failed to download record');
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-700 rounded-lg p-6 border-l-4 border-blue-400 card-glow">
        <div className="flex items-center">
          <div className="p-2 bg-blue-900/50 rounded-lg">
            <FileText className="h-6 w-6 text-blue-300" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-300">Total Records</p>
            <p className="text-2xl font-bold text-white">{stats.totalRecords}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-700 rounded-lg p-6 border-l-4 border-yellow-400 card-glow">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-900/50 rounded-lg">
            <Clock className="h-6 w-6 text-yellow-300" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-300">Pending Requests</p>
            <p className="text-2xl font-bold text-white">{stats.pendingRequests}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-700 rounded-lg p-6 border-l-4 border-green-400 card-glow">
        <div className="flex items-center">
          <div className="p-2 bg-green-900/50 rounded-lg">
            <Unlock className="h-6 w-6 text-green-300" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-300">Active Access</p>
            <p className="text-2xl font-bold text-white">{stats.activeAccess}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-700 rounded-lg p-6 border-l-4 border-purple-400 card-glow">
        <div className="flex items-center">
          <div className="p-2 bg-purple-900/50 rounded-lg">
            <Calendar className="h-6 w-6 text-purple-300" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-300">Last Login</p>
            <p className="text-sm font-medium text-white">
              {stats.lastLogin ? format(new Date(stats.lastLogin), 'MMM dd, yyyy') : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMedicalRecords = () => (
    <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-slate-700">
        <h3 className="text-lg font-medium text-white">Medical Records</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800/70">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Record
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Doctor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {medicalRecords.map((record, index) => (
              <tr key={record.id} className={`${index % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-800/50'} hover:bg-slate-700/50 transition-colors duration-200`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-white">{record.title}</div>
                    <div className="text-sm text-slate-400">{record.description}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">
                    {record.doctor ? (
                      <>
                        <div className="font-medium">Dr. {record.doctor.firstName} {record.doctor.lastName}</div>
                        <div className="text-slate-400">{record.doctor.email}</div>
                      </>
                    ) : (
                      <span className="text-slate-500">No doctor assigned</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/70 text-blue-300 border border-blue-700">
                    {record.recordType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {format(new Date(record.recordDate), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ 
                    record.isActive 
                      ? 'bg-green-900/70 text-green-300 border-green-700' 
                      : 'bg-red-900/70 text-red-300 border-red-700'
                  }`}>
                    {record.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadRecord(record.id)}
                      className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      className="text-green-400 hover:text-green-300 transition-colors duration-200"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAccessRequests = () => (
    <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-slate-700">
        <h3 className="text-lg font-medium text-white">Access Requests</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800/70">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Doctor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Request Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {accessRequests.map((request, index) => (
              <tr key={request.id} className={`${index % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-800/50'} hover:bg-slate-700/50 transition-colors duration-200`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-white">
                      Dr. {request.doctor.firstName} {request.doctor.lastName}
                    </div>
                    <div className="text-sm text-slate-400">{request.doctor.specialization}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/70 text-purple-300 border border-purple-700">
                    {request.requestType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    request.status === 'pending' ? 'bg-yellow-900/70 text-yellow-300 border-yellow-700' :
                    request.status === 'approved' ? 'bg-green-900/70 text-green-300 border-green-700' :
                    'bg-red-900/70 text-red-300 border-red-700'
                  }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {request.status === 'pending' ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveClick(request.id)}
                        className="px-3 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDenyClick(request.id)}
                        className="px-3 py-1 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 transition-colors"
                      >
                        Deny
                      </button>
                    </div>
                  ) : request.status === 'approved' ? (
                    <span className="text-green-400">Approved</span>
                  ) : (
                    <span className="text-red-400">Denied</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-medium text-white mb-6">Profile Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-300">First Name</label>
          <p className="mt-1 text-sm text-white">{user.firstName}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Last Name</label>
          <p className="mt-1 text-sm text-white">{user.lastName}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Email</label>
          <p className="mt-1 text-sm text-white">{user.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Phone Number</label>
          <p className="mt-1 text-sm text-white">{user.phoneNumber}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Date of Birth</label>
          <p className="mt-1 text-sm text-white">
            {user.dateOfBirth ? format(new Date(user.dateOfBirth), 'MMM dd, yyyy') : 'N/A'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Gender</label>
          <p className="mt-1 text-sm text-white">{user.gender}</p>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-medium text-white mb-6">Security Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-white">Two-Factor Authentication</h4>
            <p className="text-sm text-slate-400">Add an extra layer of security to your account</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200">
            Enable
          </button>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-white">Session Management</h4>
            <p className="text-sm text-slate-400">Manage active sessions and devices</p>
          </div>
          <button className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors duration-200">
            Manage
          </button>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-white">Privacy Settings</h4>
            <p className="text-sm text-slate-400">Control who can access your medical records</p>
          </div>
          <button className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors duration-200">
            Configure
          </button>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'medical-records', label: 'Medical Records', icon: FileText },
    { id: 'access-requests', label: 'Access Requests', icon: Shield },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-slate-900/70 backdrop-blur-sm border-b border-slate-700 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <a href="/" className="flex items-center cursor-pointer">
              <Shield className="h-8 w-8 text-blue-400 mr-3" />
              <h1 className="text-2xl font-bold text-gray-100">Patient Dashboard</h1>
            </a>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-slate-300 hover:text-white">
                <Bell className="h-6 w-6" />
                {stats.pendingRequests > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-900"></span>
                )}
              </button>
              <div className="flex items-center space-x-3">
                <img
                  className="h-8 w-8 rounded-full"
                  src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0D9488&color=fff`}
                  alt="Profile"
                />
                <span className="text-sm font-medium text-slate-100 text-glow-white">
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-sm text-slate-300 hover:text-white text-glow-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-slate-800/60 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-slate-300 hover:text-white hover:border-slate-500'
                  }`}
                >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'medical-records' && renderMedicalRecords()}
          {activeTab === 'access-requests' && renderAccessRequests()}
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'security' && renderSecurity()}
        </div>
      </main>

      <OTPModal 
        show={showOtpModal}
        onClose={() => {
          setShowOtpModal(false);
          setOtpCode('');
          setCurrentRequestId(null);
        }}
        onSubmit={handleOtpSubmit}
        otp={otpCode}
        setOtp={setOtpCode}
      />
    </div>
  );
};

export default PatientDashboard;

