import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Users,
  FileText,
  BarChart3,
  Bell,
  Clock,
  XCircle,
  Settings
} from 'lucide-react';
import PatientsTab from './doctor/PatientsTab';
import MedicalRecordsTab from './doctor/MedicalRecordsTab';
import AccessRequestsTab from './doctor/AccessRequestsTab';
import SettingsTab from './doctor/SettingsTab';
import MobileNavigation from '../MobileNavigation';

const RequestAccessReasonModal = ({ show, onClose, onSubmit, reason, setReason }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800/80 border border-slate-700 w-full max-w-sm mx-4 rounded-xl shadow-lg p-4 sm:p-6 animate-slideUp">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Reason for Access Request</h3>
        <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">
          Please provide a clear and concise reason for requesting access to this patient's records. This will be sent to the patient.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="E.g., Follow-up consultation regarding recent lab results..."
          className="w-full h-20 sm:h-24 bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-700/50 text-gray-300 hover:bg-slate-700 transition-colors w-full sm:w-auto">Cancel</button>
          <button onClick={onSubmit} className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors w-full sm:w-auto">Submit Request</button>
        </div>
      </div>
    </div>
  );
};

const MedicalRecordModal = ({ show, record, onClose }) => {
  const [attachmentUrl, setAttachmentUrl] = useState(null);
  const [isAttachmentLoading, setIsAttachmentLoading] = useState(false);

  if (!show || !record) return null;

  const handleClose = () => {
    setAttachmentUrl(null);
    onClose();
  };

  const viewAttachment = async () => {
    if (!record.filePath) {
      toast.error('Attachment not found.');
      return;
    }
    const requestUrl = `/api/doctor/attachment/${record.id}`;
    try {
      setIsAttachmentLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(requestUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
      setAttachmentUrl(fileURL);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load attachment.');
    } finally {
      setIsAttachmentLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800/80 border border-slate-700 w-full max-w-2xl mx-4 rounded-xl shadow-lg p-4 sm:p-6 animate-slideUp">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-white text-glow-green">Medical Record Details</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors"><XCircle className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 sm:space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 bg-slate-900/50 rounded-lg">
            <div><strong className="text-slate-400">Patient:</strong> <span className="text-white">{record.patient?.firstName} {record.patient?.lastName}</span></div>
            <div><strong className="text-slate-400">Email:</strong> <span className="text-white">{record.patient?.email}</span></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 bg-slate-900/50 rounded-lg">
            <div><strong className="text-slate-400">Record Type:</strong> <span className="text-white">{record.recordType}</span></div>
            <div><strong className="text-slate-400">Date:</strong> <span className="text-white">{format(new Date(record.recordDate), 'PP')}</span></div>
          </div>
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <strong className="text-slate-400">Title:</strong>
            <p className="text-white mt-1">{record.title}</p>
          </div>
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <strong className="text-slate-400">Description:</strong>
            <p className="text-white mt-1 whitespace-pre-wrap">{record.description}</p>
          </div>
          {record.filePath && (
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <strong className="text-slate-400">Attachment:</strong>
              <button
                onClick={viewAttachment}
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
                <img src={attachmentUrl} alt="Attachment preview" className="w-full h-auto object-contain max-h-64" />
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 sm:mt-6 text-right">
          <button onClick={handleClose} className="px-4 py-2 rounded-md bg-slate-700/50 text-gray-300 hover:bg-slate-700 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};

const DoctorDashboardMobile = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [patients, setPatients] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [accessReason, setAccessReason] = useState('');
  const [requestingPatientId, setRequestingPatientId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [viewedRequests, setViewedRequests] = useState(new Set());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [patientsRes, recordsRes, requestsRes] = await Promise.all([
        api.get('/api/doctor/patients'),
        api.get('/api/doctor/medical-records'),
        api.get('/api/doctor/access-requests'),
      ]);

      setPatients(patientsRes.data.patients || []);
      setMedicalRecords(recordsRes.data.records || []);
      setAccessRequests(requestsRes.data.requests || []);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
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
      await api.post('/api/otp/request-access', {
        patientId: requestingPatientId,
        requestType: 'view_records',
        reason: accessReason,
        urgency: 'routine'
      });
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

  const viewApprovedRecord = async (requestId, patientId) => {
    try {
      const res = await api.get(`/api/doctor/patient/${patientId}/medical-records`);
      const record = res.data.records?.[0];
      if (record) {
        setSelectedRecord(record);
        setShowRecordModal(true);
        setViewedRequests(prev => new Set([...prev, requestId]));
      } else {
        toast.error('No medical records found for this patient');
      }
    } catch (error) {
      toast.error('Failed to access medical record');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'medical-records', label: 'Medical Records', icon: FileText },
    { id: 'access-requests', label: 'Access Requests', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-transparent text-white font-sans">
      <MobileNavigation
        currentTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
        user={user}
        onLogout={logout}
        showNotifications={true}
        notificationCount={accessRequests.length}
      />

      <MedicalRecordModal
        show={showRecordModal}
        record={selectedRecord}
        onClose={() => setShowRecordModal(false)}
      />

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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'patients' && <PatientsTab patients={patients} handleRequestAccess={handleRequestAccess} />}
        {activeTab === 'medical-records' && <MedicalRecordsTab medicalRecords={medicalRecords} />}
        {activeTab === 'access-requests' && <AccessRequestsTab accessRequests={accessRequests} viewApprovedRecord={viewApprovedRecord} viewedRequests={viewedRequests} />}
        {activeTab === 'settings' && <SettingsTab user={user} />}
      </main>
    </div>
  );
};

export default DoctorDashboardMobile;
