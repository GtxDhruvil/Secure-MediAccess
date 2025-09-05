import React, { useState, useMemo } from 'react';
import { Search, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const PatientsTab = ({ patients, setIsAddPatientModalOpen, handleDeletePatient }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = useMemo(() =>
    (patients || []).filter(patient =>
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [patients, searchTerm]
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Patients</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={() => setIsAddPatientModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Add Patient</span>
          </button>
        </div>
      </div>
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Contact</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date of Birth</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Gender</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredPatients.map((patient) => (
              <tr key={patient.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-white">
                      {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{patient.firstName} {patient.lastName}</div>
                      <div className="text-sm text-slate-400">{patient.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{patient.phoneNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'PP') : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{patient.gender}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to remove this patient? This action cannot be undone.')) {
                        handleDeletePatient(patient.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientsTab;
