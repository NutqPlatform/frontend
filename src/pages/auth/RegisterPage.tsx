import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { registerDoctor, registerPatient } from '../../services/api/auth.api';
import { User, Mail, Lock, Calendar, Key, Eye, EyeOff, Heart, ArrowRight } from 'lucide-react';

type Role = 'doctor' | 'patient';

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as unknown;

    if (typeof data === 'string' && data.trim().length > 0) return data;
    if (data && typeof data === 'object' && 'message' in data) {
      const msg = (data as { message?: unknown }).message;
      if (typeof msg === 'string' && msg.trim().length > 0) return msg;
    }

    if (typeof error.message === 'string' && error.message.trim().length > 0) return error.message;
    return 'Registration failed. Please try again.';
  }

  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return 'Something went wrong. Please try again.';
}

export function RegisterPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>('doctor');
  const [invitationCode, setInvitationCode] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const isPatient = role === 'patient';
  const totalSteps = 3;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!invitationCode.trim()) {
        setError('Invitation code is required');
        return false;
      }
      if (!name.trim()) {
        setError('Name is required');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!email.trim()) {
        setError('Email is required');
        return false;
      }
      if (!password.trim()) {
        setError('Password is required');
        return false;
      }
    }
    return true;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (currentStep < totalSteps) {
      if (validateStep()) {
        nextStep();
        setError(null);
      }
      return;
    }

    // Final submission
    if (!validateStep()) return;

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (role === 'doctor') {
        await registerDoctor({
          invitationCode,
          name,
          email,
          password,
        });
      } else {
        const ageNumber = Number(age) || 0;
        await registerPatient({
          invitationCode,
          name,
          age: ageNumber,
          email,
          password,
        });
      }

      setSuccessMessage('Registration successful! Redirecting to login...');

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
              <span className="text-white text-2xl font-bold tracking-tight">N</span>
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-900">Nutq</h1>
              <p className="text-sm text-gray-600">Therapy Intelligence Platform</p>
            </div>
          </div>
          <p className="text-gray-600">Create your account to start your therapy journey</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    currentStep >= step
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step}
                </div>
                <span className="mt-2 text-xs text-gray-600">
                  {step === 1 ? 'Account' : step === 2 ? 'Details' : 'Complete'}
                </span>
              </div>
            ))}
          </div>
          <div className="relative mt-2">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-gray-900 -translate-y-1/2 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Registration Card */}
        <div className="rounded-xl bg-white p-8 shadow-lg border border-gray-200">
          {/* Role Selection */}
          <div className="mb-8">
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`rounded-lg p-4 border-2 transition-all ${
                  role === 'doctor'
                    ? 'border-gray-900 bg-gray-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    role === 'doctor' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <User size={24} />
                  </div>
                  <span className="font-medium text-gray-900">Doctor</span>
                  <span className="text-xs text-gray-600">Healthcare provider</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`rounded-lg p-4 border-2 transition-all ${
                  role === 'patient'
                    ? 'border-gray-900 bg-gray-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    role === 'patient' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Heart size={24} />
                  </div>
                  <span className="font-medium text-gray-900">Patient</span>
                  <span className="text-xs text-gray-600">Therapy recipient</span>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Step 1: Account Information */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Key size={16} className="text-gray-500" />
                      Invitation Code
                    </div>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value)}
                    required
                    disabled={isSubmitting}
                    placeholder="Enter your unique invitation code"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Get this code from your {role === 'doctor' ? 'administrator' : 'physician'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      Full Name
                    </div>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isSubmitting}
                    placeholder="Enter your full name"
                  />
                </div>

                {isPatient && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-500" />
                        Age
                      </div>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required={isPatient}
                      disabled={isSubmitting}
                      placeholder="Enter your age"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Login Details */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      Email Address
                    </div>
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Lock size={16} className="text-gray-500" />
                      Password
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      disabled={isSubmitting}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Must be at least 6 characters long
                  </p>
                </div>

                {/* Password Strength Indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Password Strength</span>
                    <span className={`font-medium ${
                      password.length >= 8 ? 'text-green-600' : 
                      password.length >= 6 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {password.length >= 8 ? 'Strong' : 
                       password.length >= 6 ? 'Medium' : 
                       'Weak'}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full transition-all duration-300 ${
                        password.length >= 8 ? 'bg-green-500' : 
                        password.length >= 6 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((password.length / 8) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Review Your Information</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Role</p>
                        <p className="font-medium text-gray-900">{role === 'doctor' ? 'Doctor' : 'Patient'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Invitation Code</p>
                        <p className="font-medium text-gray-900">{invitationCode}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium text-gray-900">{name}</p>
                    </div>
                    {isPatient && (
                      <div>
                        <p className="text-sm text-gray-600">Age</p>
                        <p className="font-medium text-gray-900">{age}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{email}</p>
                    </div>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start gap-3 rounded-lg bg-gray-50 border border-gray-200 p-4">
                  <div className="mt-0.5">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                  </div>
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the Terms of Service and Privacy Policy. I understand that my 
                    personal information will be managed according to healthcare privacy standards.
                  </label>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600">⚠️</span>
                  </div>
                  <p className="text-sm font-medium text-red-900">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600">✓</span>
                  </div>
                  <p className="text-sm font-medium text-green-900">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 px-6 py-3.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
                  disabled={isSubmitting}
                >
                  Back
                </button>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-6 py-3.5 rounded-lg bg-gray-900 text-white font-semibold shadow-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
                  currentStep < totalSteps ? '' : 'flex items-center justify-center gap-2'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {currentStep < totalSteps ? 'Processing...' : 'Creating Account...'}
                  </>
                ) : currentStep < totalSteps ? (
                  <>
                    Continue
                    <ArrowRight size={18} className="inline ml-2" />
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-300" />
            <span className="mx-4 text-sm text-gray-500">Already have an account?</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Login Link */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
            >
              <ArrowRight size={18} className="rotate-180" />
              Back to Sign In
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Secure registration • HIPAA compliant • Your data is protected
          </p>
        </div>
      </div>
    </div>
  );
}