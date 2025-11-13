import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, User, Mail, Lock, Phone, Calendar, MapPin, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('patient');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        address: data.address,
        role: selectedRole,
        ...(selectedRole === 'doctor' && {
          specialization: data.specialization,
          licenseNumber: data.licenseNumber,
          hospital: data.hospital
        })
      };

      await registerUser(userData);
      toast.success('Registration successful! Please check your email for verification.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'patient', label: 'Patient', icon: User, description: 'Access your medical records and manage access permissions' },
    { id: 'doctor', label: 'Doctor', icon: Shield, description: 'Manage patients and medical records with secure access' }
  ];

  const inputClasses = "pl-10 pr-3 py-2 block w-full bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500";
  const labelClasses = "block text-sm font-medium text-slate-300";
  const iconClasses = "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400";

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-900/70 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-500/80 rounded-full flex items-center justify-center border-2 border-blue-400">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Join our secure medical record system
          </p>
        </div>

        {/* Role Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">
            Select your role
          </label>
          <div className="grid grid-cols-2 gap-3">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={`relative p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                  selectedRole === role.id
                    ? 'border-blue-500 bg-slate-800/50 ring-2 ring-blue-500/50'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedRole === role.id ? 'bg-blue-500/20' : 'bg-slate-700/50'
                  }`}>
                    <role.icon className={`h-5 w-5 ${
                      selectedRole === role.id ? 'text-blue-400' : 'text-slate-400'
                    }`} />
                  </div>
                  <div>
                    <div className={`font-medium ${
                      selectedRole === role.id ? 'text-white' : 'text-slate-200'
                    }`}>
                      {role.label}
                    </div>
                    <div className={`text-xs ${
                      selectedRole === role.id ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      {role.description}
                    </div>
                  </div>
                </div>
                {selectedRole === role.id && (
                  <div className="absolute top-2 right-2">
                    <div className="h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                      <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={labelClasses}>First Name</label>
                <div className="mt-1 relative">
                  <User className={iconClasses} />
                  <input {...register('firstName', { required: 'First name is required' })} type="text" className={inputClasses} placeholder="John" />
                </div>
                {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className={labelClasses}>Last Name</label>
                <div className="mt-1 relative">
                  <User className={iconClasses} />
                  <input {...register('lastName', { required: 'Last name is required' })} type="text" className={inputClasses} placeholder="Doe" />
                </div>
                {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClasses}>Email Address</label>
              <div className="mt-1 relative">
                <Mail className={iconClasses} />
                <input {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }})} type="email" className={inputClasses} placeholder="john@example.com" />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className={labelClasses}>Phone Number</label>
              <div className="mt-1 relative">
                <Phone className={iconClasses} />
                <input {...register('phoneNumber', { required: 'Phone number is required', pattern: { value: /^[+]?[1-9][\d]{0,15}$/, message: 'Invalid phone number' }})} type="tel" className={inputClasses} placeholder="+1234567890" />
              </div>
              {errors.phoneNumber && <p className="mt-1 text-sm text-red-500">{errors.phoneNumber.message}</p>}
            </div>

            {/* Date of Birth and Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOfBirth" className={labelClasses}>Date of Birth</label>
                <div className="mt-1 relative">
                  <Calendar className={iconClasses} />
                  <input {...register('dateOfBirth', { required: 'Date of birth is required' })} type="date" className={`${inputClasses} date-picker-fix`} />
                </div>
                {errors.dateOfBirth && <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth.message}</p>}
              </div>
              <div>
                <label htmlFor="gender" className={labelClasses}>Gender</label>
                <select {...register('gender', { required: 'Gender is required' })} className={`${inputClasses} !pl-3`}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                {errors.gender && <p className="mt-1 text-sm text-red-500">{errors.gender.message}</p>}
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className={labelClasses}>Address</label>
              <div className="mt-1 relative">
                <MapPin className={iconClasses} />
                <input {...register('address', { required: 'Address is required' })} type="text" className={inputClasses} placeholder="123 Main St, City, State" />
              </div>
              {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>}
            </div>

            {/* Doctor-specific fields */}
            {selectedRole === 'doctor' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="specialization" className={labelClasses}>Specialization</label>
                    <input {...register('specialization', { required: 'Specialization is required' })} type="text" className={`${inputClasses} !pl-3`} placeholder="Cardiology" />
                    {errors.specialization && <p className="mt-1 text-sm text-red-500">{errors.specialization.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="licenseNumber" className={labelClasses}>License Number</label>
                    <input {...register('licenseNumber', { required: 'License number is required' })} type="text" className={`${inputClasses} !pl-3`} placeholder="MD123456" />
                    {errors.licenseNumber && <p className="mt-1 text-sm text-red-500">{errors.licenseNumber.message}</p>}
                  </div>
                </div>
                <div>
                  <label htmlFor="hospital" className={labelClasses}>Hospital/Clinic</label>
                  <input {...register('hospital', { required: 'Hospital/Clinic is required' })} type="text" className={`${inputClasses} !pl-3`} placeholder="City General Hospital" />
                  {errors.hospital && <p className="mt-1 text-sm text-red-500">{errors.hospital.message}</p>}
                </div>
              </>
            )}

            {/* Password Fields */}
            <div>
              <label htmlFor="password" className={labelClasses}>Password</label>
              <div className="mt-1 relative">
                <Lock className={iconClasses} />
                <input {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' }, pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, message: 'Password must contain uppercase, lowercase, number and special character' }})} type={showPassword ? 'text' : 'password'} className={inputClasses} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelClasses}>Confirm Password</label>
              <div className="mt-1 relative">
                <Lock className={iconClasses} />
                <input {...register('confirmPassword', { required: 'Please confirm your password', validate: value => value === password || 'Passwords do not match' })} type={showConfirmPassword ? 'text' : 'password'} className={inputClasses} placeholder="••••••••" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-all duration-200">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;



