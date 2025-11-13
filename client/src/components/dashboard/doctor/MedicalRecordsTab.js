import React, { useState, useMemo } from 'react';
import { Filter, PlusCircle, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const MedicalRecordsTab = ({ medicalRecords, setIsCreateRecordModalOpen, handleDeleteRecord, handleRequestAccess }) => {
  const [filterType, setFilterType] = useState('all');

  const filteredRecords = useMemo(() =>
    (medicalRecords || []).filter(record => {
      if (filterType === 'all') return true;
      return record.recordType === filterType;
    }),
    [medicalRecords, filterType]
  );

  const recordTypes = [
    'lab_report',
    'prescription',
    'medical_note',
    'scan_result',
    'vaccination_record',
    'allergy_info',
    'medication_history',
    'surgery_record',
    'dental_record',
    'other'
  ];

  const recordTypeLabels = {
    lab_report: 'Lab Report',
    prescription: 'Prescription',
    medical_note: 'Medical Note',
    scan_result: 'Scan Result',
    vaccination_record: 'Vaccination Record',
    allergy_info: 'Allergy Info',
    medication_history: 'Medication History',
    surgery_record: 'Surgery Record',
    dental_record: 'Dental Record',
    other: 'Other'
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Medical Records</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
            >
              <option value="all">All Types</option>
              {recordTypes.map(type => (
                <option key={type} value={type}>{recordTypeLabels[type]}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsCreateRecordModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Create Record</span>
          </button>
        </div>
      </div>
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Patient</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Record Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date Created</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{record.patient.firstName} {record.patient.lastName}</div>
                  <div className="text-sm text-slate-400">{record.patient.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {record.recordType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {format(new Date(record.createdAt), 'PPpp')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                  <button onClick={() => handleRequestAccess(record.patient.id)} className="text-blue-400 hover:text-blue-300"><Eye className="h-5 w-5" /></button>
                  <button onClick={() => handleDeleteRecord(record.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-5 w-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicalRecordsTab;
