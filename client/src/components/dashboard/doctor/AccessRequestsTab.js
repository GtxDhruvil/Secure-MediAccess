import React from 'react';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';

const AccessRequestsTab = ({ accessRequests, handleApprove, handleDeny, viewApprovedRecord, viewedRequests }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Access Requests</h2>
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Patient</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Requested At</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {accessRequests.map((request) => (
              <tr key={request.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{request.patient.firstName} {request.patient.lastName}</div>
                  <div className="text-sm text-slate-400">{request.patient.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {format(new Date(request.createdAt), 'PPpp')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${{
                    pending: 'bg-yellow-500/20 text-yellow-400',
                    approved: 'bg-green-500/20 text-green-400',
                    denied: 'bg-red-500/20 text-red-400',
                  }[request.status.toLowerCase()]}`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {request.status.toLowerCase() === 'pending' && null}
                  {request.status.toLowerCase() === 'approved' && (
                    <button 
                      onClick={() => viewApprovedRecord(request.id, request.patient.id)}
                      disabled={viewedRequests.has(request.id)}
                      className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 font-bold py-2 px-3 rounded-lg flex items-center space-x-2 transition-colors disabled:bg-slate-600/20 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      <Eye className="h-4 w-4" />
                      <span>{viewedRequests.has(request.id) ? 'Viewed' : 'View'}</span>
                    </button>
                  )}
                  {request.status.toLowerCase() === 'denied' && (
                     <span className="text-slate-500 italic">Denied</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccessRequestsTab;
