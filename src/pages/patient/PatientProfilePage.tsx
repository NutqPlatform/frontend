import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getPatientProfile,
  updatePatientProfile,
  updatePatientPassword,
  getAttendingDoctor,
} from '../../services/api/patient.api';
import { leaveDoctor } from '../../services/api/transfer.api';
import type { PatientProfile, AttendingDoctor } from '../../services/api/patient.api';
import { User, Camera, Lock, AlertCircle } from 'lucide-react';

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

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    phoneNumber: '',
    dateOfBirth: '',
  });
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const [leavingDoctor, setLeavingDoctor] = useState(false);

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
      setInfoForm({
        phoneNumber: profileData.phoneNumber || '',
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
      });
      if (doctorData?.patients) {
        // Store peer patients list
        doctorData.patients.filter((p: any) => p.id !== user.id);
      }
      if (doctorData?.weeklyReports) {
        // Store reports
        doctorData.weeklyReports.filter((r: any) => r.patientId === user.id);
      }
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
      const base64Image = photoPreview.startsWith('data:') ? photoPreview : `data:image/jpeg;base64,${photoPreview}`;
      await updatePatientProfile(user.id, {
        profilePicture: base64Image,
        phoneNumber: profile?.phoneNumber,
        dateOfBirth: profile?.dateOfBirth,
      });
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
      await updatePatientPassword(user.id, passwordForm.currentPassword, passwordForm.newPassword);
      setIsEditingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Password updated successfully');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsUpdatingInfo(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updatePatientProfile(user.id, {
        phoneNumber: infoForm.phoneNumber,
        dateOfBirth: infoForm.dateOfBirth || undefined,
      });
      setProfile(updated);
      setInfoForm({
        phoneNumber: updated.phoneNumber || '',
        dateOfBirth: updated.dateOfBirth ? updated.dateOfBirth.split('T')[0] : '',
      });
      setIsEditingInfo(false);
      setSuccess('Profile information updated successfully');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update profile information');
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
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
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h3>
        <p className="text-gray-600">Failed to load profile information</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-600">Manage age, phone, and password</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="font-medium text-red-900">{error}</p>
          <button onClick={() => setError(null)} className="text-sm text-red-600 hover:text-red-800 mt-1">
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4">
          <p className="font-medium text-green-900">{success}</p>
          <button onClick={() => setSuccess(null)} className="text-sm text-green-600 hover:text-green-800 mt-1">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
              <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 border-4 border-gray-100">
                {photoPreview || profile.profilePicture ? (
                  <img src={photoPreview || profile.profilePicture} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={48} className="text-gray-400" />
                  </div>
                )}
                <button onClick={() => setIsEditingPhoto(true)} className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50">
                  <Camera size={18} className="text-gray-700" />
                </button>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-gray-600">{profile.email}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    {!isEditingInfo ? (
                      <div className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                        {profile.dateOfBirth
                          ? new Date(profile.dateOfBirth).toLocaleDateString()
                          : 'Not set'}
                        {profile.age != null && (
                          <p className="text-sm text-gray-600 mt-1">Age: {profile.age} years</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <input type="date" value={infoForm.dateOfBirth} onChange={(e) => setInfoForm({ ...infoForm, dateOfBirth: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        {infoForm.dateOfBirth && (
                          <p className="text-xs text-gray-500 mt-1">
                            Age will be calculated automatically from date of birth.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    {!isEditingInfo ? (
                      <div className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                        {profile.phoneNumber || 'Not set'}
                      </div>
                    ) : (
                      <input type="tel" value={infoForm.phoneNumber} onChange={(e) => setInfoForm({ ...infoForm, phoneNumber: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis (Doctor only)</label>
                    <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 min-h-[44px]">
                      {profile.diagnosis || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!isEditingInfo && (
              <div className="pt-6 border-t border-gray-200">
                <button onClick={() => setIsEditingInfo(true)} className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50">
                  Edit Age & Phone
                </button>
              </div>
            )}

            {isEditingInfo && (
              <form onSubmit={handleUpdateInfo} className="pt-6 border-t border-gray-200 space-y-4">
                <input type="date" value={infoForm.dateOfBirth} onChange={(e) => setInfoForm({ ...infoForm, dateOfBirth: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input type="tel" value={infoForm.phoneNumber} onChange={(e) => setInfoForm({ ...infoForm, phoneNumber: e.target.value })} placeholder="Phone" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <button type="submit" disabled={isUpdatingInfo} className="px-4 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50">
                    {isUpdatingInfo ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => { setIsEditingInfo(false); setInfoForm({ phoneNumber: profile?.phoneNumber || '', dateOfBirth: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '', }); }} className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {isEditingPhoto && (
              <div className="pt-6 border-t border-gray-200">
                <div className="space-y-3">
                  <input type="file" accept="image/*" onChange={handlePhotoFileChange} className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-white" />
                  <div className="flex gap-2">
                    <button onClick={handleUpdatePhoto} disabled={isUpdatingPhoto || !photoFile} className="px-4 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50">
                      {isUpdatingPhoto ? 'Saving...' : 'Save Photo'}
                    </button>
                    <button onClick={() => { setIsEditingPhoto(false); setPhotoFile(null); setPhotoPreview(profile.profilePicture || null); }} className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Lock size={20} className="text-gray-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Password</h3>
                  <p className="text-sm text-gray-600">Update your password</p>
                </div>
              </div>
              {!isEditingPassword && (
                <button onClick={() => setIsEditingPassword(true)} className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50">
                  Change
                </button>
              )}
            </div>

            {isEditingPassword ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <input type="password" placeholder="Current Password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" required />
                <input type="password" placeholder="New Password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" required minLength={6} />
                <input type="password" placeholder="Confirm Password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" required minLength={6} />
                <div className="flex gap-2">
                  <button type="submit" disabled={isUpdatingPassword} className="px-4 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50">
                    {isUpdatingPassword ? 'Updating...' : 'Update'}
                  </button>
                  <button type="button" onClick={() => { setIsEditingPassword(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-gray-600">Your password is secure</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {doctor ? (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Your Physician</h3>
              <p className="font-medium text-gray-900">{doctor.name}</p>
              <p className="text-sm text-gray-600">{doctor.email}</p>
              <div className="flex flex-col gap-2 mt-4">
                <button onClick={() => navigate(`/patient/doctor/${doctor.id}/profile`)} className="w-full py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-medium hover:bg-blue-100 text-sm">
                  View Doctor Profile
                </button>
                <button
                  onClick={async () => {
                    if (!user?.id || !confirm('Leave your doctor? Plans will be archived.')) return;
                    setLeavingDoctor(true);
                    try {
                      await leaveDoctor(user.id);
                      await loadProfile();
                    } catch (err: any) {
                      setError(err?.response?.data?.error || 'Failed to leave doctor');
                    } finally {
                      setLeavingDoctor(false);
                    }
                  }}
                  disabled={leavingDoctor}
                  className="w-full py-2 rounded-lg border border-red-200 text-red-700 font-medium hover:bg-red-50 text-sm disabled:opacity-50"
                >
                  {leavingDoctor ? 'Leaving...' : 'Leave Doctor'}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 p-6 border border-amber-200">
              <h3 className="font-semibold text-gray-900 mb-2">No Assigned Doctor</h3>
              <p className="text-sm text-gray-600 mb-4">Find a new doctor and submit transfer request</p>
              <button onClick={() => navigate('/patient/find-doctor')} className="w-full py-2 rounded-lg bg-gray-900 text-white font-medium text-sm">
                Find Doctor
              </button>
            </div>
          )}
          {!doctor && profile.formerDoctorId && (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Review Former Doctor</h3>
              <button onClick={() => navigate(`/patient/doctor/${profile.formerDoctorId}/review`)} className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">
                Leave Review
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
