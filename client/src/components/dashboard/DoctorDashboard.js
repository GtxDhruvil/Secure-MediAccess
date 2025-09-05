import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { 
  Stethoscope, 
  Users, 
  FileText, 
  BarChart3, 
  Bell, 
  Calendar,
  Plus,
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Legend, Cell } from 'recharts';
import PatientsTab from './doctor/PatientsTab';
import MedicalRecordsTab from './doctor/MedicalRecordsTab';
import AccessRequestsTab from './doctor/AccessRequestsTab';
import SettingsTab from './doctor/SettingsTab';

const RequestAccessReasonModal = ({ show, onClose, onSubmit, reason, setReason }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800/80 border border-slate-700 w-full max-w-md rounded-xl shadow-lg p-6 animate-slideUp">
        <h3 className="text-lg font-semibold text-white mb-4">Reason for Access Request</h3>
        <p className="text-sm text-slate-400 mb-4">Please provide a clear and concise reason for requesting access to this patient's records. This will be sent to the patient.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="E.g., Follow-up consultation regarding recent lab results..."
          className="w-full h-24 bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-700/50 text-gray-300 hover:bg-slate-700 transition-colors">Cancel</button>
          <button onClick={onSubmit} className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors">Submit Request</button>
        </div>
      </div>
    </div>
  );
};

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [patients, setPatients] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalRecords: 0,
    pendingRequests: 0,
    activeAccess: 0,
    monthlyRecords: [],
    patientGrowth: [],
    recordTypes: []
  });
  const [newPatient, setNewPatient] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', dateOfBirth: '', gender: '' });  const [newRecord, setNewRecord] = useState({ patientId: '', recordType: 'medical_note', title: '', description: '', recordDate: '', file: null });
  const [formErrors, setFormErrors] = useState({});
  const [viewedRequests, setViewedRequests] = useState(new Set());
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isAttachmentLoading, setIsAttachmentLoading] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showCreateRecord, setShowCreateRecord] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [accessReason, setAccessReason] = useState('');
  const [requestingPatientId, setRequestingPatientId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [patientsRes, recordsRes, requestsRes, statsRes] = await Promise.all([
        api.get('/api/doctor/patients'),
        api.get('/api/doctor/medical-records'),
        api.get('/api/doctor/access-requests'),
        api.get('/api/doctor/stats')
      ]);

      setPatients(patientsRes.data.patients || []);
      setMedicalRecords(recordsRes.data.records || []);
      setAccessRequests(requestsRes.data.requests || []);
      setStats({
        totalPatients: statsRes.data?.data?.totalPatients ?? 0,
        totalRecords: statsRes.data?.data?.totalRecords ?? 0,
        pendingRequests: statsRes.data?.data?.pendingRequests ?? 0,
        activeAccess: statsRes.data?.data?.activeAccess ?? 0,
        monthlyRecords: statsRes.data?.data?.monthlyRecords ?? [],
        patientGrowth: statsRes.data?.data?.patientGrowth ?? [],
        recordTypes: statsRes.data?.data?.recordTypes ?? []
      });
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestAccess = async (patientId, recordType, reason) => {
    try {
      // Backend expects specific enums for requestType/urgency
      const payload = {
        patientId,
        requestType: 'view_records',
        reason: reason && reason.length >= 10 ? reason : 'Routine checkup request',
        urgency: 'routine'
      };
      await api.post('/api/otp/request-access', payload);
      toast.success('Access request sent successfully');
      fetchDashboardData();
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to send access request';
      toast.error(msg);
    }
  };

  const viewApprovedRecord = async (requestId, patientId) => {
    try {
      console.log('Viewing record for request:', requestId, 'patient:', patientId);
      
      // Fetch the medical record for this patient
      const response = await api.get(`/api/doctor/patient/${patientId}/medical-records`);
      
      console.log('API Response:', response.data);
      
      if (response.data?.records?.length > 0) {
        // Show the medical record in a modal or new window
        const record = response.data.records[0]; // Get the latest record
        
        console.log('Record found:', record);
        
        
        // Show the record in a professional modal
        setSelectedRecord(record);
        setShowRecordModal(true);
        // Mark this request as viewed (one-time access)
        setViewedRequests(prev => new Set([...prev, requestId]));
        
        // Log the access (don't await to avoid blocking UI)
        try {
          await api.post('/api/doctor/log-record-access', { 
            requestId, 
            patientId,
            action: 'viewed_approved_record'
          });
        } catch (err) {
          console.error('Failed to log access:', err);
          // Don't show error to user for logging failures
        }
        
        toast.success('Medical record accessed successfully');
      } else {
        console.log('No records found in response');
        toast.error('No medical records found for this patient');
      }
    } catch (error) {
      console.error('Error viewing medical record:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`Failed to access medical record: ${error.response?.data?.error || error.message}`);
    }
  };

  const createMedicalRecord = async (patientId, recordData) => {
    try {
      const formData = new FormData();
      formData.append('patientId', patientId);
      formData.append('recordType', recordData.recordType);
      formData.append('title', recordData.title);
      formData.append('description', recordData.description);
      formData.append('recordDate', recordData.recordDate);
      if (recordData.file) {
        formData.append('file', recordData.file);
      }

      const response = await api.post('/api/doctor/medical-records', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data?.success) {
        toast.success('Medical record created successfully');
        fetchDashboardData();
      } else {
        throw new Error(response.data?.message || 'Failed to create medical record');
      }
    } catch (error) {
      console.error('Create medical record error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create medical record';
      toast.error(errorMessage);
      throw error; // Re-throw so the modal can handle it
    }
  };

  const handleProfileUpdate = async (formData) => {
    try {
      const { data } = await api.put('/api/doctor/profile', formData);
      toast.success('Profile updated successfully');
      // NOTE: We don't have a setUser in AuthContext, so a page refresh might be needed for avatar/name changes
      // For now, we can update the user state locally if needed, but the token won't reflect it.
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
      throw error;
    }
  };

  const handlePasswordChange = async (formData) => {
    try {
      await api.put('/api/auth/change-password', formData);
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
      throw error;
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await api.put(`/api/doctor/access-requests/${requestId}/approve`);
      toast.success('Access request approved');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to approve access request');
    }
  };

  const handleDeny = async (requestId) => {
    try {
      await api.put(`/api/doctor/access-requests/${requestId}/deny`);
      toast.success('Access request denied');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to deny access request');
    }
  };

  const handleRequestAccess = (patientId) => {
    setRequestingPatientId(patientId);
    setShowReasonModal(true);
  };

  const submitAccessRequest = async () => {
    if (!accessReason || accessReason.length < 10) {
      toast.error('A reason of at least 10 characters is required.');
      return;
    }

    try {
      const payload = {
        patientId: requestingPatientId,
        requestType: 'view_records',
        reason: accessReason,
        urgency: 'routine'
      };

      await api.post('/api/otp/request-access', payload);
      toast.success('Access request sent successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send access request');
    } finally {
      setShowReasonModal(false);
      setAccessReason('');
      setRequestingPatientId(null);
    }
  };

  const handleDeleteMedicalRecord = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this medical record? This action is permanent.')) {
      try {
        await api.delete(`/api/doctor/medical-records/${recordId}`);
        toast.success('Medical record deleted successfully');
        fetchDashboardData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete medical record');
      }
    }
  };

  const handleDeletePatient = async (patientId) => {
    try {
      await api.delete(`/api/doctor/patients/${patientId}`);
      toast.success('Patient removed successfully');
      fetchDashboardData(); // Refresh data after deletion
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove patient');
    }
  };


  // Medical Record Modal Component
    const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Stat Cards */}
      <div className="bg-slate-800/50 backdrop-blur-md border border-green-500/30 rounded-xl shadow-lg shadow-green-500/10 p-6 flex items-center space-x-4 transition-all duration-300 hover:border-green-500/70 hover:shadow-green-500/20">
        <div className="bg-green-500/20 p-3 rounded-full"><Users className="h-6 w-6 text-green-400" /></div>
        <div>
          <p className="text-sm text-slate-400">Total Patients</p>
          <p className="text-2xl font-bold text-white">{stats.totalPatients}</p>
        </div>
      </div>
      <div className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-xl shadow-lg shadow-blue-500/10 p-6 flex items-center space-x-4 transition-all duration-300 hover:border-blue-500/70 hover:shadow-blue-500/20">
        <div className="bg-blue-500/20 p-3 rounded-full"><FileText className="h-6 w-6 text-blue-400" /></div>
        <div>
          <p className="text-sm text-slate-400">Total Records</p>
          <p className="text-2xl font-bold text-white">{stats.totalRecords}</p>
        </div>
      </div>
      <div className="bg-slate-800/50 backdrop-blur-md border border-yellow-500/30 rounded-xl shadow-lg shadow-yellow-500/10 p-6 flex items-center space-x-4 transition-all duration-300 hover:border-yellow-500/70 hover:shadow-yellow-500/20">
        <div className="bg-yellow-500/20 p-3 rounded-full"><Clock className="h-6 w-6 text-yellow-400" /></div>
        <div>
          <p className="text-sm text-slate-400">Pending Requests</p>
          <p className="text-2xl font-bold text-white">{stats.pendingRequests}</p>
        </div>
      </div>
      <div className="bg-slate-800/50 backdrop-blur-md border border-red-500/30 rounded-xl shadow-lg shadow-red-500/10 p-6 flex items-center space-x-4 transition-all duration-300 hover:border-red-500/70 hover:shadow-red-500/20">
        <div className="bg-red-500/20 p-3 rounded-full"><AlertTriangle className="h-6 w-6 text-red-400" /></div>
        <div>
          <p className="text-sm text-slate-400">Active Access</p>
          <p className="text-2xl font-bold text-white">{stats.activeAccess}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="md:col-span-2 lg:col-span-2 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Monthly New Records</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.monthlyRecords}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
            <Line type="monotone" dataKey="records" stroke="#34d399" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="md:col-span-2 lg:col-span-2 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Patient Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.patientGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
            <Bar dataKey="patients" fill="#34d399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>


      {/* Record Types Pie Chart */}
      <div className="md:col-span-2 lg:col-span-4 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Record Types Distribution</h3>
        {stats.recordTypes && stats.recordTypes.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stats.recordTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                {stats.recordTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 5]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', color: 'black' }} />
              <Legend wrapperStyle={{ fontSize: '14px', color: '#94a3b8' }}/>
            </PieChart>
          </ResponsiveContainer>
        ) : <div className="text-center text-slate-400 py-12">No record types data available.</div>}
      </div>
    </div>
  );

  const MedicalRecordModal = () => {
    const [attachmentUrl, setAttachmentUrl] = useState(null);
    if (!showRecordModal || !selectedRecord) return null;

    const handleClose = () => {
      setShowRecordModal(false);
      setSelectedRecord(null);
      setAttachmentUrl(null); // Reset attachment URL on close
    };

    const viewAttachment = async (record) => {
      if (!record || !record.filePath) {
        toast.error('Attachment not found.');
        return;
      }

      const requestUrl = `/api/doctor/attachment/${record.id}`;

      console.log('--- Viewing Attachment ---');
      console.log('Record:', record);
      console.log('Request URL:', requestUrl);

      try {
        setIsAttachmentLoading(true);
        const token = localStorage.getItem('token');
        // Use the correct doctor-specific endpoint and encode the filename
        const response = await axios.get(requestUrl,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
          }
        );
        const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
        setAttachmentUrl(fileURL);
      } catch (error) {
        console.error('Error fetching attachment:', error);
        toast.error(error.response?.data?.error || 'Failed to load attachment.');
      } finally {
        setIsAttachmentLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-slate-800/80 border border-slate-700 w-full max-w-2xl rounded-xl shadow-lg p-6 animate-slideUp">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white text-glow-green">Medical Record Details</h3>
            <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors"><XCircle /></button>
          </div>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-900/50 rounded-lg">
              <div><strong className="text-slate-400">Patient:</strong> <span className="text-white">{selectedRecord.patient?.firstName} {selectedRecord.patient?.lastName}</span></div>
              <div><strong className="text-slate-400">Email:</strong> <span className="text-white">{selectedRecord.patient?.email}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-900/50 rounded-lg">
              <div><strong className="text-slate-400">Record Type:</strong> <span className="text-white">{selectedRecord.recordType}</span></div>
              <div><strong className="text-slate-400">Date:</strong> <span className="text-white">{format(new Date(selectedRecord.recordDate), 'PP')}</span></div>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <strong className="text-slate-400">Title:</strong>
              <p className="text-white mt-1">{selectedRecord.title}</p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <strong className="text-slate-400">Description:</strong>
              <p className="text-white mt-1 whitespace-pre-wrap">{selectedRecord.description}</p>
            </div>
            {selectedRecord.filePath && (
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <strong className="text-slate-400">Attachment:</strong>
                <button 
                  onClick={() => viewAttachment(selectedRecord)}
                  disabled={isAttachmentLoading}
                  className="ml-4 px-3 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors disabled:bg-slate-600"
                >
                  {isAttachmentLoading ? 'Loading...' : 'View Attachment'}
                </button>
              </div>
            )}
            {attachmentUrl && (
              <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
                <strong className="text-slate-400">Attachment Preview:</strong>
                <div className="mt-2 border border-slate-700 rounded-lg overflow-hidden">
                  <img src={attachmentUrl} alt="Attachment preview" className="w-full h-auto object-contain" />
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 text-right">
            <button onClick={handleClose} className="px-4 py-2 rounded-md bg-slate-700/50 text-gray-300 hover:bg-slate-700 transition-colors">Close</button>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'medical-records', label: 'Medical Records', icon: FileText },
    { id: 'access-requests', label: 'Access Requests', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white font-sans">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <a href="/" className="flex items-center">
              <Stethoscope className="h-8 w-8 text-green-400 mr-3" />
              <h1 className="text-2xl font-bold text-white text-glow-white">Doctor Dashboard</h1>
            </a>
            <div className="flex items-center space-x-6">
              <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <Bell className="h-6 w-6" />
                {stats.pendingRequests > 0 && (
                  <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </button>
              <div className="relative group">
                <div className="flex items-center space-x-2 cursor-pointer">
                  <img
                    className="h-9 w-9 rounded-full border-2 border-slate-600 group-hover:border-green-400 transition-colors"
                    src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=22c55e&color=fff`}
                    alt=""
                  />
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Dr. {user?.firstName} {user?.lastName}</span>
                </div>
              </div>
              <button onClick={logout} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { name: 'Overview', icon: BarChart3, key: 'overview' },
              { name: 'Patients', icon: Users, key: 'patients' },
              { name: 'Medical Records', icon: FileText, key: 'medical-records' },
              { name: 'Access Requests', icon: Bell, key: 'access-requests' },
              { name: 'Settings', icon: Settings, key: 'settings' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-1 py-4 text-sm font-medium border-b-2 transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'border-green-400 text-white glow-green'
                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Modals */}
      <MedicalRecordModal />
      <RequestAccessReasonModal 
        show={showReasonModal}
        onClose={() => {
          setShowReasonModal(false);
          setAccessReason('');
        }}
        onSubmit={submitAccessRequest}
        reason={accessReason}
        setReason={setAccessReason}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 bg-transparent">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'patients' && <PatientsTab patients={patients} setIsAddPatientModalOpen={setShowAddPatient} handleDeletePatient={handleDeletePatient} />}
          {activeTab === 'medical-records' && <MedicalRecordsTab 
                medicalRecords={medicalRecords} 
                setIsCreateRecordModalOpen={setShowCreateRecord}
                handleDeleteRecord={handleDeleteMedicalRecord}
                handleRequestAccess={handleRequestAccess}
              />}
          {activeTab === 'access-requests' && <AccessRequestsTab accessRequests={accessRequests} handleApprove={handleApprove} handleDeny={handleDeny} viewApprovedRecord={viewApprovedRecord} viewedRequests={viewedRequests} />}
          {activeTab === 'settings' && <SettingsTab user={user} handleProfileUpdate={handleProfileUpdate} handlePasswordChange={handlePasswordChange} />}
        </div>
      </main>

      {/* Add Patient Modal */}
      {showAddPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800/80 border border-slate-700 w-full max-w-md rounded-xl shadow-lg p-6 animate-slideUp">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Patient</h3>
            <div className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <input value={newPatient.firstName} onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })} placeholder="First name" className="w-full bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500" />
      {formErrors.firstName && <p className="mt-1 text-xs text-red-400">{formErrors.firstName}</p>}
    </div>
    <div>
      <input value={newPatient.lastName} onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })} placeholder="Last name" className="w-full bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500" />
      {formErrors.lastName && <p className="mt-1 text-xs text-red-400">{formErrors.lastName}</p>}
    </div>
  </div>
  <div>
    <input value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} placeholder="Email" type="email" className="w-full bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500" />
    {formErrors.email && <p className="mt-1 text-xs text-red-400">{formErrors.email}</p>}
  </div>
  <div>
    <input value={newPatient.phoneNumber} onChange={(e) => setNewPatient({ ...newPatient, phoneNumber: e.target.value })} placeholder="Phone" className="w-full bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500" />
    {formErrors.phoneNumber && <p className="mt-1 text-xs text-red-400">{formErrors.phoneNumber}</p>}
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <input type="date" value={newPatient.dateOfBirth} onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })} placeholder="Date of Birth" className="w-full bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 date-picker-fix" />
      {formErrors.dateOfBirth && <p className="mt-1 text-xs text-red-400">{formErrors.dateOfBirth}</p>}
    </div>
    <div>
      <select value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })} className="w-full bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500">
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>
      {formErrors.gender && <p className="mt-1 text-xs text-red-400">{formErrors.gender}</p>}
    </div>
  </div>
</div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowAddPatient(false)} className="px-4 py-2 rounded-md bg-slate-700/50 text-gray-300 hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={async () => {
  const errs = {};
  if (!newPatient.firstName || newPatient.firstName.length < 2) errs.firstName = 'First name required (min 2)';
  if (!newPatient.lastName || newPatient.lastName.length < 2) errs.lastName = 'Last name required (min 2)';
  if (!newPatient.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPatient.email)) errs.email = 'Valid email required';
  if (!newPatient.phoneNumber || !/^\+?[\d\s\-\(\)]+$/.test(newPatient.phoneNumber)) errs.phoneNumber = 'Valid phone required';
  if (!newPatient.dateOfBirth) errs.dateOfBirth = 'Date of birth required';
  if (!newPatient.gender) errs.gender = 'Gender required';
  setFormErrors(errs);
  if (Object.keys(errs).length) return;

  const base = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@$!%*?&';
  let pwd = '';
  for (let i = 0; i < 8; i++) pwd += base[Math.floor(Math.random() * base.length)];
  pwd += 'Aa1!Zz9@';
  try {
    // The date picker seems to be providing a DD-MM-YYYY value, which needs to be converted.
    const dateParts = newPatient.dateOfBirth.split('-');
    const formattedDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);

    const payload = { 
      ...newPatient, 
      dateOfBirth: format(formattedDate, 'yyyy-MM-dd'),
      role: 'patient', 
      password: pwd 
    };
    const res = await api.post('/api/auth/register', payload);
    if (!res.data?.user) throw new Error('Registration failed');
    toast.success('Patient added');
    setShowAddPatient(false);
    setNewPatient({ firstName: '', lastName: '', email: '', phoneNumber: '', dateOfBirth: '', gender: '' });
    fetchDashboardData();
                } catch (e) {
                  const details = e.response?.data?.details;
                  if (Array.isArray(details)) {
                    toast.error(details.map(d => d.msg || d.param).join(', '));
                  } else {
                    toast.error(e.response?.data?.error || 'Failed to add patient');
                  }
                }
              }} className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors">Save Patient</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Record Modal */}
      {showCreateRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800/80 border border-slate-700 w-full max-w-lg rounded-xl shadow-lg p-6 animate-slideUp">
            <h3 className="text-lg font-semibold text-white mb-4">Create Medical Record</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <select 
                  value={newRecord.patientId} 
                  onChange={(e) => setNewRecord({ ...newRecord, patientId: e.target.value })} 
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} ({patient.email})
                    </option>
                  ))}
                </select>
                {formErrors.patientId && <p className="mt-1 text-xs text-red-400">{formErrors.patientId}</p>}
              </div>
              <select value={newRecord.recordType} onChange={(e) => setNewRecord({ ...newRecord, recordType: e.target.value })} className="w-full bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500">
                 <option value="medical_note">Medical Note</option>
                 <option value="lab_report">Lab Report</option>
                 <option value="prescription">Prescription</option>
                 <option value="scan_result">Scan Result</option>
                 <option value="surgery_record">Surgery Record</option>
                 <option value="dental_record">Dental Record</option>
                 <option value="vaccination_record">Vaccination Record</option>
                 <option value="allergy_info">Allergy Info</option>
                 <option value="medication_history">Medication History</option>
                 <option value="other">Other</option>
               </select>
              <div className="md:col-span-2">
                <input value={newRecord.title} onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })} placeholder="Title" className="w-full bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                {formErrors.title && <p className="mt-1 text-xs text-red-400">{formErrors.title}</p>}
              </div>
              <div className="md:col-span-2">
                <textarea value={newRecord.description} onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })} placeholder="Description" className="w-full bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                {formErrors.description && <p className="mt-1 text-xs text-red-400">{formErrors.description}</p>}
              </div>
              <div>
                <input type="date" value={newRecord.recordDate} onChange={(e) => setNewRecord({ ...newRecord, recordDate: e.target.value })} className="w-full bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                {formErrors.recordDate && <p className="mt-1 text-xs text-red-400">{formErrors.recordDate}</p>}
              </div>
              <input type="file" onChange={(e) => setNewRecord({ ...newRecord, file: e.target.files?.[0] || null })} className="w-full bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-500/20 file:text-green-300 hover:file:bg-green-500/30" />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowCreateRecord(false)} className="px-4 py-2 rounded-md bg-slate-700/50 text-gray-300 hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={async () => {
                const errs = {};
                if (!newRecord.patientId) errs.patientId = 'Patient ID required';
                if (!newRecord.title) errs.title = 'Title required';
                if (!newRecord.description) errs.description = 'Description required';
                if (!newRecord.recordDate) errs.recordDate = 'Record date required';
                setFormErrors(errs);
                if (Object.keys(errs).length) return;
                try {
                  await createMedicalRecord(newRecord.patientId, newRecord);
                  setShowCreateRecord(false);
                  setNewRecord({ patientId: '', recordType: 'medical_note', title: '', description: '', recordDate: '', file: null });
                } catch (e) {
                  // error toasts are handled in createMedicalRecord
                }
              }} className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors">Create Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;


