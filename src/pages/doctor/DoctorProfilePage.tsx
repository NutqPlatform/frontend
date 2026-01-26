import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDoctorProfile, updateDoctorProfile, updateDoctorPassword } from '../../services/api/doctor.api';
import type { DoctorProfile } from '../../services/api/doctor.api';

export function DoctorProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Profile editing states
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  
  const [isEditingCV, setIsEditingCV] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvPreview, setCvPreview] = useState<string | null>(null);
  const [isUpdatingCV, setIsUpdatingCV] = useState(false);
  
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user?.id && user?.role === 'doctor') {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const profileData = await getDoctorProfile(user.id);
      setProfile(profileData);
      setPhotoPreview(profileData.profilePicture || null);
      setCvPreview(profileData.cv || null);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to load profile';
      setError(errorMessage);
      console.error('Error loading profile:', err);
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
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePhoto = async () => {
    if (!user?.id || !photoFile || !photoPreview) return;

    setIsUpdatingPhoto(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert to base64 if not already
      const base64Image = photoPreview.startsWith('data:') 
        ? photoPreview 
        : `data:image/jpeg;base64,${photoPreview}`;
      
      await updateDoctorProfile(user.id, { profilePicture: base64Image });
      setProfile({ ...profile!, profilePicture: base64Image });
      setIsEditingPhoto(false);
      setPhotoFile(null);
      setSuccess('Profile picture updated successfully');
    } catch (err) {
      setError('Failed to update profile picture');
      console.error(err);
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  const handleCVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setCvFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCvPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateCV = async () => {
    if (!user?.id || !cvFile || !cvPreview) return;

    setIsUpdatingCV(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert to base64 if not already
      const base64Image = cvPreview.startsWith('data:') 
        ? cvPreview 
        : `data:image/jpeg;base64,${cvPreview}`;
      
      await updateDoctorProfile(user.id, { cv: base64Image });
      setProfile({ ...profile!, cv: base64Image });
      setIsEditingCV(false);
      setCvFile(null);
      setSuccess('CV updated successfully');
    } catch (err) {
      setError('Failed to update CV');
      console.error(err);
    } finally {
      setIsUpdatingCV(false);
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
      await updateDoctorPassword(user.id, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setIsEditingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setSuccess('Password updated successfully');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to update password';
      setError(errorMessage);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">Failed to load profile</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Doctor Profile</h1>
            <p className="mt-1 text-sm text-slate-600">Manage your profile information</p>
          </div>
          <button
            onClick={() => navigate('/doctor')}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Picture Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Profile Picture</h2>
              {!isEditingPhoto && (
                <button
                  onClick={() => setIsEditingPhoto(true)}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                {(photoPreview || profile.profilePicture) ? (
                  <img
                    src={photoPreview || profile.profilePicture}
                    alt={profile.name}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-3xl">
                    👤
                  </div>
                )}
              </div>
              {isEditingPhoto ? (
                <div className="flex-1 space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                  />
                  {photoPreview && (
                    <div className="text-xs text-slate-500">Preview loaded. Click Save to update.</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdatePhoto}
                      disabled={isUpdatingPhoto || !photoFile}
                      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isUpdatingPhoto ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingPhoto(false);
                        setPhotoFile(null);
                        setPhotoPreview(profile.profilePicture || null);
                      }}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-600">
                  {profile.profilePicture ? 'Click Edit to change your profile picture' : 'No profile picture set'}
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 text-xl font-semibold">Basic Information</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-slate-600">Name</div>
                <div className="text-base text-slate-900">{profile.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600">Email</div>
                <div className="text-base text-slate-900">{profile.email}</div>
              </div>
            </div>
          </div>

          {/* CV Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">CV / Resume</h2>
              {!isEditingCV && (
                <button
                  onClick={() => setIsEditingCV(true)}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  {profile.cv ? 'Edit' : 'Add CV'}
                </button>
              )}
            </div>
            {isEditingCV ? (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCVFileChange}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                />
                {cvPreview && (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-500">Preview:</div>
                    <img
                      src={cvPreview}
                      alt="CV Preview"
                      className="max-h-64 w-full rounded border border-slate-200 object-contain"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateCV}
                    disabled={isUpdatingCV || !cvFile}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isUpdatingCV ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingCV(false);
                      setCvFile(null);
                      setCvPreview(profile.cv || null);
                    }}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {profile.cv ? (
                  <img
                    src={profile.cv}
                    alt="CV"
                    className="max-h-96 w-full rounded border border-slate-200 object-contain"
                  />
                ) : (
                  <div className="text-sm text-slate-400">No CV added yet</div>
                )}
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Password</h2>
              {!isEditingPassword && (
                <button
                  onClick={() => setIsEditingPassword(true)}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Change Password
                </button>
              )}
            </div>
            {isEditingPassword ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
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
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-sm text-slate-600">Click "Change Password" to update your password</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
