import React from 'react';
import { FileText, XCircle } from 'lucide-react';

const RecordDetailModal = ({ record, onClose, isAttachmentLoading, handleOpenAttachment }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden animate-slideUp">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 dark:bg-gradient-to-r dark:from-blue-900 dark:to-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-700 bg-opacity-20 p-2 rounded-lg dark:bg-opacity-30">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Medical Record</h2>
                <p className="text-blue-100 text-sm">Confidential Patient Information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-slate-900/70 backdrop-blur-sm border border-slate-700 bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-all duration-200 dark:bg-opacity-30 dark:hover:bg-opacity-40"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {/* Patient and Record Info will go here */}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700">
          <button onClick={onClose} className="w-full py-2 px-4 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-slate-700 mt-2">Close</button>
        </div>
      </div>
    </div>
  );
};

export default RecordDetailModal;
