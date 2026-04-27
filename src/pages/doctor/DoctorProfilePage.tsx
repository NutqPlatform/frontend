import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDoctorProfile, updateDoctorProfile, updateDoctorPassword } from '../../services/api/doctor.api';
import type { DoctorProfile } from '../../services/api/doctor.api';
import { Camera, FileText, Lock, User, Check, X, Upload, Shield } from 'lucide-react';

export function DoctorProfilePage() {
  const { user } = useAuth();
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
      const base64Image = photoPreview.startsWith('data:') 
        ? photoPreview 
        : `data:image/jpeg;base64,${photoPreview}`;
      
      await updateDoctorProfile(user.id, { profilePicture: base64Image });
      setProfile({ ...profile!, profilePicture: base64Image });
      setIsEditingPhoto(false);
      setPhotoFile(null);
      setSuccess('Profile picture updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
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
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a PDF, JPEG, or PNG file');
        return;
      }
      setCvFile(file);
    }
  };

  const handleUpdateCV = async () => {
    if (!user?.id || !cvFile) return;

    setIsUpdatingCV(true);
    setError(null);
    setSuccess(null);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        updateDoctorProfile(user.id, { cv: base64 })
          .then(() => {
            setProfile({ ...profile!, cv: base64 });
            setIsEditingCV(false);
            setCvFile(null);
            setSuccess('CV updated successfully');
            setTimeout(() => setSuccess(null), 3000);
          })
          .catch((err) => {
            setError('Failed to update CV');
            console.error(err);
          })
          .finally(() => {
            setIsUpdatingCV(false);
          });
      };
      reader.readAsDataURL(cvFile);
    } catch (err) {
      setError('Failed to update CV');
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
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to update password';
      setError(errorMessage);
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
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <X className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h3>
        <p className="text-gray-600">Failed to load profile data</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Doctor Profile</h1>
            <p className="mt-2 text-gray-600">Manage your profile information and settings</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <X className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-900">{error}</p>
              <button 
                onClick={loadProfile}
                className="text-sm text-red-600 hover:text-red-800 mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Picture */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Picture Card */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Profile Picture</h2>
                <p className="text-sm text-gray-600 mt-1">Update your profile image</p>
              </div>
              {!isEditingPhoto && (
                <button
                  onClick={() => setIsEditingPhoto(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
                >
                  <Camera size={16} />
                  Edit
                </button>
              )}
            </div>

            <div className="flex items-center gap-8">
              <div className="flex-shrink-0">
                <div className="relative">
                  {(photoPreview || profile.profilePicture) ? (
                    <img
                      src={photoPreview || profile.profilePicture}
                      alt={profile.name}
                      className="h-32 w-32 rounded-2xl object-cover ring-4 ring-gray-100"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ring-4 ring-gray-100">
                      <User className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  {isEditingPhoto && photoPreview && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {isEditingPhoto ? (
                <div className="flex-1 space-y-4">
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 mb-2 block">Upload Image</span>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-gray-400 transition-colors">
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label className="relative cursor-pointer rounded-md font-medium text-gray-900 hover:text-gray-700 focus-within:outline-none">
                              <span>Upload a file</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoFileChange}
                                className="sr-only"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                      </div>
                    </label>
                    {photoFile && (
                      <p className="text-sm text-gray-600">Selected: {photoFile.name}</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdatePhoto}
                      disabled={isUpdatingPhoto || !photoFile}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isUpdatingPhoto ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingPhoto(false);
                        setPhotoFile(null);
                        setPhotoPreview(profile.profilePicture || null);
                      }}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <p className="text-gray-600">
                    {profile.profilePicture 
                      ? 'Your profile picture is visible to your patients. Use a professional, clear image.'
                      : 'Add a profile picture to help patients recognize you. Use a professional, clear image.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CV Card */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">CV / Resume</h2>
                <p className="text-sm text-gray-600 mt-1">Upload your professional CV</p>
              </div>
              {!isEditingCV && (
                <button
                  onClick={() => setIsEditingCV(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
                >
                  <FileText size={16} />
                  {profile.cv ? 'Update CV' : 'Add CV'}
                </button>
              )}
            </div>

            {isEditingCV ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 mb-2 block">Upload CV</span>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-gray-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer rounded-md font-medium text-gray-900 hover:text-gray-700 focus-within:outline-none">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleCVFileChange}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                      </div>
                    </div>
                  </label>
                  {cvFile && (
                    <p className="text-sm text-gray-600">Selected: {cvFile.name}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateCV}
                    disabled={isUpdatingCV || !cvFile}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isUpdatingCV ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Save CV
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingCV(false);
                      setCvFile(null);
                    }}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.cv ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">CV Uploaded</p>
                        <p className="text-sm text-gray-600">Your CV is available for reference</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-lg border-2 border-dashed border-gray-300">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-600">No CV uploaded yet</p>
                    <p className="text-sm text-gray-500 mt-1">Add your CV to complete your profile</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Info & Security */}
        <div className="space-y-6">
          {/* Basic Information Card */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Full Name</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Email Address</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Password Security Card */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Security</h2>
                <p className="text-sm text-gray-600 mt-1">Manage your password</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
            </div>

            {isEditingPassword ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        Update Password
                      </>
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
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Password Protected</p>
                      <p className="text-sm text-gray-600">Your account is secured with a password</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingPassword(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                >
                  <Lock size={16} />
                  Change Password
                </button>
              </div>
            )}
          </div>

          {/* Account Status Card */}
          <div className="rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Account Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Profile Completion</span>
                <span className="px-3 py-1 rounded-full text-xs bg-green-500 text-white font-medium">
                  {profile.profilePicture && profile.cv ? '100%' : profile.profilePicture ? '50%' : '0%'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Last Updated</span>
                <span className="text-sm font-medium">Today</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Member Since</span>
                <span className="text-sm font-medium">2024</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}