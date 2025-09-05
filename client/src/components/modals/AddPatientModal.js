import React from 'react';

const AddPatientModal = ({ 
  show, 
  onClose, 
  newPatient, 
  setNewPatient, 
  formErrors, 
  handleAddPatient 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-lg shadow-xl p-6 animate-slideUp">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Patient</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input value={newPatient.firstName} onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })} placeholder="First Name" className="w-full px-4 py-2 border rounded-md bg-slate-700 text-white border-slate-600 focus:ring-green-500 focus:border-green-500" />
              {formErrors.firstName && <p className="mt-1 text-xs text-red-500">{formErrors.firstName}</p>}
            </div>
            <div>
              <input value={newPatient.lastName} onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })} placeholder="Last Name" className="w-full px-4 py-2 border rounded-md bg-slate-700 text-white border-slate-600 focus:ring-green-500 focus:border-green-500" />
              {formErrors.lastName && <p className="mt-1 text-xs text-red-500">{formErrors.lastName}</p>}
            </div>
          </div>
          <div>
            <input type="email" value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} placeholder="Email Address" className="w-full px-4 py-2 border rounded-md bg-slate-700 text-white border-slate-600 focus:ring-green-500 focus:border-green-500" />
            {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
          </div>
          <div>
            <input type="tel" value={newPatient.phoneNumber} onChange={(e) => setNewPatient({ ...newPatient, phoneNumber: e.target.value })} placeholder="Phone Number" className="w-full px-4 py-2 border rounded-md bg-slate-700 text-white border-slate-600 focus:ring-green-500 focus:border-green-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input type="date" value={newPatient.dateOfBirth} onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })} placeholder="Date of Birth" className="w-full px-4 py-2 border rounded-md bg-slate-700 text-white border-slate-600 focus:ring-green-500 focus:border-green-500 date-picker-fix" />
              {formErrors.dateOfBirth && <p className="mt-1 text-xs text-red-500">{formErrors.dateOfBirth}</p>}
            </div>
            <div>
              <select value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })} className="w-full px-4 py-2 border rounded-md bg-slate-700 text-white border-slate-600 focus:ring-green-500 focus:border-green-500">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {formErrors.gender && <p className="mt-1 text-xs text-red-500">{formErrors.gender}</p>}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-700">Cancel</button>
          <button onClick={handleAddPatient} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Add Patient</button>
        </div>
      </div>
    </div>
  );
};

export default AddPatientModal;
