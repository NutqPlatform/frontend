import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Lock, Mail, User, Eye, EyeOff, Heart } from 'lucide-react';

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
    return 'Invalid email or password. Please try again.';
  }

  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return 'Something went wrong. Please try again.';
}

export function LoginPage() {
  const { loginDoctor, loginPatient } = useAuth();

  const [role, setRole] = useState<Role>('doctor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (role === 'doctor') {
        await loginDoctor(email, password);
      } else {
        await loginPatient(email, password);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
              <span className="text-white text-2xl font-bold tracking-tight">N</span>
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-900">Nutq</h1>
              <p className="text-sm text-gray-600">Therapy Intelligence Platform</p>
            </div>
          </div>
          <p className="text-gray-600">Welcome back! Please sign in to continue.</p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl bg-white p-8 shadow-lg border border-gray-200">
          {/* Role Selection */}
          <div className="mb-8">
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Sign in as:
            </label>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`flex-1 py-3 rounded-md font-medium transition-all ${
                  role === 'doctor'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <User size={18} className={role === 'doctor' ? 'text-white' : 'text-gray-500'} />
                  Doctor
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`flex-1 py-3 rounded-md font-medium transition-all ${
                  role === 'patient'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Heart size={18} className={role === 'patient' ? 'text-white' : 'text-gray-500'} />
                  Patient
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-500" />
                  Email Address
                </div>
              </label>
              <div className="relative">
                <input
                  id="email"
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
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-gray-500" />
                  Password
                </div>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden rounded-lg bg-gray-900 px-6 py-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Sign in as {role === 'doctor' ? 'Doctor' : 'Patient'}
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-300" />
            <span className="mx-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-gray-900 hover:text-gray-700 hover:underline transition-all"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}