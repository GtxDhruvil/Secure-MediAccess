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
  Clock,
  Settings,
  XCircle
} from 'lucide-react';
import PatientsTab from './doctor/PatientsTab';
import MedicalRecordsTab from './doctor/MedicalRecordsTab';
import AccessRequestsTab from './doctor/AccessRequestsTab';
import SettingsTab from './doctor/SettingsTab';
import MobileNavigation from '../MobileNavigation';

const RequestAccessReasonModal = ({ show, onClose, onSubmit, reason, setReason }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800/80 border border-slate-700 w-full max-w-sm mx-4 rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Reason for Access Request</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="E.g., Follow-up consultation..."
          className="w-full h-20 bg-slate-900/50 border border-slate-600 rounded-md px-3 py-2 text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-700/50 text-gray-300 w-full sm:w-auto">Cancel</button>
          <button onClick={onSubmit} className="px-4 py-2 rounded-md bg-green-600 text-white w-full sm:w-auto">Submit</button>
        </div>
      </div>
    </div>
  );
};

const MedicalRecordModal = ({ show, record, onClose }) => {
  const [attachmentUrl, setAttachmentUrl] = useState(null);
  const [isAttachmentLoading, setIsAttachmentLoading] = useState(false);

  if (!show || !record) return null;

  const viewAttachment = async () => {
    if (!record.filePath) return toast.error('Attachment not found.');
    try {
      setIsAttachmentLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/doctor/attachment/${record.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const fileURL = window.URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] }));
      setAttachmentUrl(fileURL);
    } catch (err) {
      toast.error('Failed to load attachment.');
    } finally {
      setIsAttachmentLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800/80 border border-slate-700 w-full max-w-2xl mx-4 rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-white">Medical Record Details</h3>
          <button onClick={onClose}><XCircle className="h-5 w-5 text-slate-400 hover:text-white" /></button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/50 rounded-lg">
            <div><strong className="text-slate-400">Patient:</strong> <span className="text-white">{record.patient?.firstName} {record.patient?.lastName}</span></div>
            <div><strong className="text-slate-400">Email:</strong> <span className="text-white">{record.patient?.email}</span></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/50 rounded-lg">
            <div><strong className="text-slate-400">Record Type:</strong> <span className="text-white">{record.recordType}</span></div>
            <div><strong className="text-slate-400">Date:</strong> <span className="text-white">{format(new Date(record.recordDate), 'PP')}</span></div>
          </div>
          <div className="p-3 bg-slate-900/50 rounded-lg"><strong className="text-slate-400">Title:</strong><p className="text-white mt-1">{record.title}</p></div>
          <div className="p-3 bg-slate-900/50 rounded-lg"><strong className="text-slate-400">Description:</strong><p className="text-white mt-1 whitespace-pre-wrap">{record.description}</p></div>
          {record.filePath && (
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <strong className="text-slate-400">Attachment:</strong>
              <button onClick={viewAttachment} disabled={isAttachmentLoading} className="ml-2 px-3 py-1 rounded-md bg-green-600 text-white text-xs">{isAttachmentLoading ? 'Loading...' : 'View Attachment'}</button>
            </div>
          )}
          {attachmentUrl && <img src={attachmentUrl} alt="Attachment preview" className="w-full h-auto mt-2 max-h-64 object-contain rounded-lg" />}
        </div>
        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-700/50 text-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
};

const DoctorDashboardMobile = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('patients');
  const [patients, setPatients] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [accessReason, setAccessReason] = useState('');
  const [requestingPatientId, setRequestingPatientId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);

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
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = (patientId) => {
    setRequestingPatientId(patientId);
    setShowReasonModal(true);
  };

  const submitAccessRequest = async () => {
    if (!accessReason || accessReason.length < 10) return toast.error('Provide a valid reason.');
    try {
      await api.post('/api/otp/request-access', { patientId: requestingPatientId, reason: accessReason });
      toast.success('Access request sent');
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to send access request');
    } finally {
      setShowReasonModal(false);
      setAccessReason('');
      setRequestingPatientId(null);
    }
  };

  const viewApprovedRecord = (record) => {
    setSelectedRecord(record);
    setShowRecordModal(true);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-green-600 border-t-transparent rounded-full"></div></div>;

  const tabs = [
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'medical-records', label: 'Medical Records', icon: FileText },
    { id: 'access-requests', label: 'Access Requests', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-transparent text-white">
      <MobileNavigation currentTab={activeTab} onTabChange={setActiveTab} tabs={tabs} user={user} onLogout={logout} notificationCount={accessRequests.length} />

      <RequestAccessReasonModal show={showReasonModal} onClose={() => setShowReasonModal(false)} onSubmit={submitAccessRequest} reason={accessReason} setReason={setAccessReason} />
      <MedicalRecordModal show={showRecordModal} record={selectedRecord} onClose={() => setShowRecordModal(false)} />

      <main className="p-4">
        {activeTab === 'patients' && <PatientsTab patients={patients} handleRequestAccess={handleRequestAccess} />}
        {activeTab === 'medical-records' && <MedicalRecordsTab medicalRecords={medicalRecords} />}
        {activeTab === 'access-requests' && <AccessRequestsTab accessRequests={accessRequests} viewApprovedRecord={viewApprovedRecord} />}
        {activeTab === 'settings' && <SettingsTab user={user} />}
      </main>
    </div>
  );
};

export default DoctorDashboardMobile;
