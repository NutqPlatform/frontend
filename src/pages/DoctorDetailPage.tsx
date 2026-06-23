import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getSingleDoctor,
  getDoctorReviews,
  createDoctorReview,
  updateDoctorReview,
  deleteDoctorReview,
  type DoctorWithCommunications,
  type DoctorRatingData,
  type DoctorReview
} from '../services/api/doctor.api';
import { useAuth } from '../hooks/useAuth';
import { resolveMediaUrl } from '../utils/mediaUrl';
import {
  ArrowLeft,
  Users,
  FileText,
  Mail,
  Stethoscope,
  Phone,
  MapPin,
  Star,
  Trash2,
  Edit2,
  MessageSquare
} from 'lucide-react';

export function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<DoctorWithCommunications | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewsData, setReviewsData] = useState<DoctorRatingData | null>(null);
  const [userReview, setUserReview] = useState<DoctorReview | null>(null);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>('');
  const [isEditingReview, setIsEditingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const doctorId = parseInt(id, 10);
        const data = await getSingleDoctor(doctorId);
        setDoctor(data);

        // Load reviews
        const reviews = await getDoctorReviews(doctorId);
        setReviewsData(reviews);

        if (user && user.role === 'patient') {
          const existing = reviews.reviews.find((r) => r.patientId === user.id);
          if (existing) {
            setUserReview(existing);
            setRatingInput(existing.rating);
            setCommentInput(existing.comment ?? '');
          }
        }
      } catch (err: any) {
        console.error(err);
        setError('Failed to load doctor information');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id, user]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || user.role !== 'patient') return;

    setIsSubmittingReview(true);
    setReviewError(null);

    const docId = parseInt(id, 10);

    try {
      if (userReview) {
        // Update review
        const updated = await updateDoctorReview(docId, user.id, ratingInput, commentInput);
        setUserReview(updated);
        setIsEditingReview(false);
      } else {
        // Create review
        const created = await createDoctorReview({
          doctorId: docId,
          patientId: user.id,
          rating: ratingInput,
          comment: commentInput
        });
        setUserReview(created);
      }

      // Reload reviews data
      const data = await getDoctorReviews(docId);
      setReviewsData(data);
    } catch (err: any) {
      console.error(err);
      setReviewError(err.response?.data?.message || 'Failed to submit review. You can only review a doctor you have been assigned to.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReviewDelete = async () => {
    if (!id || !user || user.role !== 'patient' || !userReview) return;

    if (!window.confirm('Are you sure you want to delete your review?')) return;

    setIsSubmittingReview(true);
    setReviewError(null);

    const docId = parseInt(id, 10);

    try {
      await deleteDoctorReview(docId, user.id);
      setUserReview(null);
      setRatingInput(5);
      setCommentInput('');
      setIsEditingReview(false);

      // Reload reviews data
      const data = await getDoctorReviews(docId);
      setReviewsData(data);
    } catch (err: any) {
      console.error(err);
      setReviewError(err.response?.data?.message || 'Failed to delete review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    const stars = [];
    const maxStars = 5;
    for (let i = 1; i <= maxStars; i++) {
      stars.push(
        <Star
          key={i}
          size={interactive ? 24 : 16}
          className={`${
            i <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-300'
          } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => interactive && onSelect && onSelect(i)}
        />
      );
    }
    return <div className="flex gap-1 items-center">{stars}</div>;
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="animate-fade-in">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="rounded-xl bg-red-50 border border-red-200 p-6">
          <p className="text-red-700 font-medium">{error || 'Doctor not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Header Section */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-8">
          <div className="flex items-start gap-6">
            {doctor.profilePicture ? (
              <img
                src={resolveMediaUrl(doctor.profilePicture)}
                alt={doctor.name}
                className="w-24 h-24 rounded-xl object-cover flex-shrink-0 ring-4 ring-blue-50"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Stethoscope className="w-12 h-12" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{doctor.name}</h1>
              {reviewsData && reviewsData.totalReviews > 0 ? (
                <div className="flex items-center gap-2 mt-2">
                  {renderStars(Math.round(reviewsData.averageRating))}
                  <span className="text-sm font-semibold text-gray-700">
                    {reviewsData.averageRating.toFixed(1)} / 5.0
                  </span>
                  <span className="text-sm text-gray-500">
                    ({reviewsData.totalReviews} {reviewsData.totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  {renderStars(0)}
                  <span className="text-sm text-gray-500">No reviews yet</span>
                </div>
              )}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-500" />
                  <span className="text-gray-700">{doctor.email}</span>
                </div>
                {doctor.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-gray-500" />
                    <span className="text-gray-700">{doctor.phoneNumber}</span>
                  </div>
                )}
                {doctor.address && (
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-gray-500 mt-0.5" />
                    <span className="text-gray-700">{doctor.address}</span>
                  </div>
                )}
                {doctor.age != null && (
                  <div className="text-sm text-gray-600">Age: {doctor.age}</div>
                )}
                {doctor.communicationInfo && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Communication Info</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{doctor.communicationInfo}</p>
                  </div>
                )}
                {doctor.cvText && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">CV Summary</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{doctor.cvText}</p>
                  </div>
                )}
                {doctor.cv && (
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-gray-500" />
                    <a
                      href={resolveMediaUrl(doctor.cv)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      View CV File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Patients Section - Doctor Self Only */}
        {user && user.role === 'doctor' && user.id === doctor.id && (
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Patients ({doctor.patients?.length ?? 0})</h2>
            </div>
            {doctor.patients && doctor.patients.length > 0 ? (
              <div className="space-y-3">
                {doctor.patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                        <Users size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-600">{patient.email}</p>
                        {patient.age && <p className="text-sm text-gray-600">Age: {patient.age}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No patients assigned yet.</p>
            )}
          </div>
        )}

        {/* Weekly Reports Section - Doctor Self Only */}
        {user && user.role === 'doctor' && user.id === doctor.id && (
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Weekly Reports ({doctor.weeklyReports?.length ?? 0})</h2>
            </div>
            {doctor.weeklyReports && doctor.weeklyReports.length > 0 ? (
              <div className="space-y-3">
                {doctor.weeklyReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Patient</p>
                        <p className="text-gray-900">{report.patientName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Period</p>
                        <p className="text-gray-900">
                          {formatDate(report.startDate)} - {formatDate(report.endDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Total Hours</p>
                        <p className="text-gray-900">{report.totalHours} hours</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Status</p>
                        <p className="text-green-600 font-medium">Completed</p>
                      </div>
                    </div>
                    {report.doctorNotes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-600">Doctor Notes</p>
                        <p className="text-gray-700">{report.doctorNotes}</p>
                      </div>
                    )}
                    {report.aiSummary && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-600">AI Summary</p>
                        <p className="text-gray-700">{report.aiSummary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No weekly reports available.</p>
            )}
          </div>
        )}

        {/* Reviews Section */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 font-sans">
                Reviews & Comments ({reviewsData?.totalReviews ?? 0})
              </h2>
            </div>
            {reviewsData && reviewsData.totalReviews > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                <span className="text-lg font-bold text-amber-600">
                  {reviewsData.averageRating.toFixed(1)}
                </span>
                {renderStars(Math.round(reviewsData.averageRating))}
              </div>
            )}
          </div>

          {/* User's Review Input / Form (Only for Patients) */}
          {user && user.role === 'patient' && (
            <div className="mb-8 p-6 bg-blue-50/40 border border-blue-100 rounded-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4 font-sans">
                {userReview ? 'Your Review' : 'Share Your Experience'}
              </h3>

              {reviewError && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                  {reviewError}
                </div>
              )}

              {userReview && !isEditingReview ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {renderStars(userReview.rating)}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingReview(true)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Edit2 size={16} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleReviewDelete}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                  {userReview.comment && (
                    <p className="text-gray-700 bg-white p-4 rounded-lg border border-blue-50 italic">
                      "{userReview.comment}"
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Reviewed on {formatDate(userReview.createdAt)}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Rating:
                    </label>
                    <div className="flex items-center gap-2">
                      {renderStars(ratingInput, true, setRatingInput)}
                      <span className="text-sm font-semibold text-gray-600">
                        {ratingInput} out of 5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Comment (Optional):
                    </label>
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Describe your experience with this doctor..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                      {isSubmittingReview ? 'Submitting...' : userReview ? 'Save Changes' : 'Submit Review'}
                    </button>
                    {userReview && isEditingReview && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingReview(false);
                          setRatingInput(userReview.rating);
                          setCommentInput(userReview.comment ?? '');
                          setReviewError(null);
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* List of Reviews */}
          {reviewsData && reviewsData.reviews.length > 0 ? (
            <div className="space-y-4 divide-y divide-gray-100">
              {reviewsData.reviews
                .filter((r) => r.patientId !== user?.id) // Don't duplicate user's review in the main list
                .map((review) => (
                  <div key={review.id} className="pt-4 first:pt-0">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                        {review.patientName ? review.patientName.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-2">
                          <div>
                            <p className="font-semibold text-gray-900 truncate">
                              {review.patientName || 'Anonymous Patient'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(review.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        {review.comment ? (
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">
                            {review.comment}
                          </p>
                        ) : (
                          <p className="text-gray-400 text-sm italic">No comment left.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              {reviewsData.reviews.filter((r) => r.patientId !== user?.id).length === 0 && (
                <p className="text-sm text-gray-500">No other reviews yet.</p>
              )}
            </div>
          ) : (
            <p className="text-gray-600">No reviews available yet for this doctor.</p>
          )}
        </div>
      </div>
    </div>
  );
}
