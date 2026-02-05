import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getPatientProfile,
  updatePatientProfile,
  updatePatientPassword,
  getAttendingDoctor,
} from '../../services/api/patient.api';
import type { PatientProfile, AttendingDoctor } from '../../services/api/patient.api';
import { User, Mail, Calendar, Stethoscope, Camera, Lock, Shield, Info, AlertCircle, CheckCircle } from 'lucide-react';

export function PatientProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [doctor, setDoctor] = useState<AttendingDoctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user?.role && user.role !== 'patient') {
      navigate('/dashboard');
      return;
    }
    if (user?.id && user?.role === 'patient') {
      loadProfile();
    }
  }, [user, navigate]);

  const loadProfile = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const [profileData, doctorData] = await Promise.all([
        getPatientProfile(user.id),
        getAttendingDoctor(user.id),
      ]);
      setProfile(profileData);
      setDoctor(doctorData);
      setPhotoPreview(profileData.profilePicture || null);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePhoto = async () => {
    if (!user?.id || !photoFile || !photoPreview) return;

    setIsUpdatingPhoto(true);
    setError(null);
    setSuccess(null);

    try {
      const base64Image = photoPreview.startsWith('data:')
        ? photoPreview
        : `data:image/jpeg;base64,${photoPreview}`;
      await updatePatientProfile(user.id, { profilePicture: base64Image });
      setProfile({ ...profile!, profilePicture: base64Image });
      setIsEditingPhoto(false);
      setPhotoFile(null);
      setSuccess('Profile picture updated successfully');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update photo');
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsUpdatingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      await updatePatientPassword(
        user.id,
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      setIsEditingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Password updated successfully');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 rounded mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h3>
        <p className="text-gray-600">Failed to load profile information</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-2 text-gray-600">Manage your profile picture and account security</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm">
            <Shield size={16} />
            <span>Limited Edit Mode</span>
          </div>
        </div>
      </div>

      {/* Information Notice */}
      <div className="mb-6 rounded-xl bg-gray-50 border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Info size={18} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Note:</span> You can only update your profile picture and password. 
              Personal information (name, age, diagnosis) can only be modified by your attending physician.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-900">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-800 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">{success}</p>
              <button 
                onClick={() => setSuccess(null)}
                className="text-sm text-green-600 hover:text-green-800 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
              {/* Profile Photo */}
              <div className="relative">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 border-4 border-gray-100">
                  {photoPreview || profile.profilePicture ? (
                    <img
                      src={photoPreview || profile.profilePicture}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      <User size={48} className="text-gray-400" />
                    </div>
                  )}
                  <button
                    onClick={() => setIsEditingPhoto(true)}
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Camera size={18} className="text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Profile Info - Read Only */}
              <div className="flex-1">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-gray-600">{profile.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        Age
                      </div>
                    </label>
                    <div className="text-gray-900 p-2 rounded-lg bg-gray-50 border border-gray-200">
                      {profile.age || 'Not specified'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center gap-2">
                        <Stethoscope size={14} />
                        Diagnosis
                      </div>
                    </label>
                    <div className="text-gray-900 p-2 rounded-lg bg-gray-50 border border-gray-200 min-h-[44px]">
                      {profile.diagnosis || 'Not specified'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                  <Info size={14} />
                  <span>Personal information managed by your physician</span>
                </div>
              </div>
            </div>

            {/* Photo Edit Section */}
            {isEditingPhoto && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Update Profile Photo</h3>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-800"
                  />
                  {photoPreview && (
                    <div className="text-xs text-gray-500">Preview loaded. Click Save to update.</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdatePhoto}
                      disabled={isUpdatingPhoto || !photoFile}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isUpdatingPhoto ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Photo'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingPhoto(false);
                        setPhotoFile(null);
                        setPhotoPreview(profile.profilePicture || null);
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Lock size={20} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Password & Security</h3>
                  <p className="text-sm text-gray-600">Update your password for security</p>
                </div>
              </div>
              {!isEditingPassword && (
                <button
                  onClick={() => setIsEditingPassword(true)}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
                >
                  Change Password
                </button>
              )}
            </div>

            {isEditingPassword ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPassword(false);
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Lock size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-600">Your password is securely stored</p>
                <button
                  onClick={() => setIsEditingPassword(true)}
                  className="mt-4 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Change Password
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Doctor Information Sidebar */}
        <div className="space-y-6">
          {/* Attending Physician */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Stethoscope size={20} className="text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Attending Physician</h3>
            </div>

            {!doctor ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-600">No attending physician assigned</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                    {doctor.profilePicture ? (
                      <img
                        src={doctor.profilePicture}
                        alt={doctor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{doctor.name}</h4>
                    <p className="text-sm text-gray-600">{doctor.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                      Physician
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Contact:</span>
                    <span className="font-medium text-gray-900">{doctor.email}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">
                    Contact your physician to update personal information
                  </p>
                  <button
                    onClick={() => navigate('/patient/reports')}
                    className="w-full py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    View Reports
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Account Info */}
          <div className="rounded-xl bg-gray-900 p-6 text-white">
            <h3 className="font-semibold mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Account Status</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-green-500 text-white">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Member Since</span>
                <span className="text-sm font-medium">2024</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Last Login</span>
                <span className="text-sm font-medium">Today</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Patient ID</span>
                <span className="font-medium">{profile.id}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/20">
              <button
                onClick={() => {
                  // Handle logout
                  navigate('/logout');
                }}
                className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Help Card */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <span className="text-yellow-600">❓</span>
              </div>
              <h3 className="font-semibold text-gray-900">Need Help?</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Contact your physician or our support team for assistance.
            </p>
            <button 
              className="w-full py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
              onClick={() => {
                if (doctor?.email) {
                  window.location.href = `mailto:${doctor.email}?subject=Patient%20Support%20Request&body=Patient%20ID:%20${profile.id}%0AName:%20${profile.name}%0A%0A`;
                } else {
                  alert('Contact your physician for support.');
                }
              }}
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}