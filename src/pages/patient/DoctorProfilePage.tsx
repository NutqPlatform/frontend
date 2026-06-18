import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDoctorProfile } from '../../services/api/doctor.api';
import type { DoctorProfile } from '../../services/api/doctor.api';
import { getPatientProfile } from '../../services/api/patient.api';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import doctorReviewAPI from '../../services/api/doctor-review.api';
import type { DoctorRatingDto } from '../../services/api/doctor-review.api';
import { Mail, Phone, MapPin, FileText, User, ArrowLeft } from 'lucide-react';

export default function DoctorProfilePage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [rating, setRating] = useState<DoctorRatingDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [myRating, setMyRating] = useState<number>(5);
  const [myComment, setMyComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    if (!doctorId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const id = parseInt(doctorId, 10);
        const [profileData, reviewData, patientProfile] = await Promise.all([
          getDoctorProfile(id),
          doctorReviewAPI.getDoctorReviews(id),
          user?.role === 'patient' && user.id ? getPatientProfile(user.id) : Promise.resolve(null),
        ]);
        setDoctor(profileData);
        setRating(reviewData);
        if (patientProfile) {
          setCanReview(patientProfile.doctorId === id || patientProfile.formerDoctorId === id);
        }
        if (user && reviewData) {
          const mine = reviewData.reviews.find(r => r.patientId === user.id);
          if (mine) {
            setMyRating(mine.rating);
            setMyComment(mine.comment || '');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [doctorId, user]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>;
  if (!rating || !doctor) return <div className="text-center py-8">Doctor not found</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={18} /> Back
      </button>
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-start gap-6 mb-6">
          {doctor.profilePicture ? (
            <img
              src={resolveMediaUrl(doctor.profilePicture)}
              alt={doctor.name}
              className="w-24 h-24 rounded-xl object-cover ring-4 ring-indigo-50"
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-indigo-50 flex items-center justify-center">
              <User className="w-12 h-12 text-indigo-400" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{doctor.name}</h1>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-500" />
                <span>{doctor.email}</span>
              </div>
              {doctor.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-500" />
                  <span>{doctor.phoneNumber}</span>
                </div>
              )}
              {doctor.address && (
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-gray-500 mt-0.5" />
                  <span>{doctor.address}</span>
                </div>
              )}
              {doctor.cv && (
                <a
                  href={resolveMediaUrl(doctor.cv)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 underline"
                >
                  <FileText size={16} />
                  View CV File
                </a>
              )}
            </div>
            {doctor.cvText && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-1">Professional Summary</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{doctor.cvText}</p>
              </div>
            )}
            {doctor.communicationInfo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-1">Communication Info</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{doctor.communicationInfo}</p>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">Ratings & Reviews</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-indigo-50 rounded-lg p-4 text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">{rating.averageRating.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{'⭐'.repeat(Math.floor(rating.averageRating))}</div>
            <div className="text-sm text-gray-600">Stars</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">{rating.totalReviews}</div>
            <div className="text-sm text-gray-600">Total Reviews</div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = rating.reviews.filter(r => r.rating === stars).length;
            const percentage = rating.totalReviews > 0 ? (count / rating.totalReviews) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3">
                <span className="w-8 text-sm font-medium">{stars}⭐</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all" style={{ width: `${percentage}%` }} />
                </div>
                <span className="w-12 text-right text-sm text-gray-600">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews */}
      <div>
        {user?.role === 'patient' && canReview && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2">Your Review</h2>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm text-gray-600">Rating</label>
              <select value={myRating} onChange={(e) => setMyRating(parseInt(e.target.value, 10))} className="rounded border-gray-200" disabled={isSubmitting}>
                {[5, 4, 3, 2, 1].map(v => (<option key={v} value={v}>{v} ⭐</option>))}
              </select>
            </div>
            <textarea value={myComment} onChange={(e) => setMyComment(e.target.value)} className="w-full rounded border-gray-200 p-2 mb-2" placeholder="Leave a comment (optional)" disabled={isSubmitting} />
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={isSubmitting} onClick={async () => {
                if (!user || !doctorId) return;
                setIsSubmitting(true);
                try {
                  const existing = rating.reviews.find(r => r.patientId === user.id);
                  if (existing) {
                    await doctorReviewAPI.updateReview(parseInt(doctorId, 10), user.id, { rating: myRating, comment: myComment || undefined });
                  } else {
                    await doctorReviewAPI.createReview({ doctorId: parseInt(doctorId, 10), patientId: user.id, rating: myRating, comment: myComment || undefined });
                  }
                  const updated = await doctorReviewAPI.getDoctorReviews(parseInt(doctorId, 10));
                  setRating(updated);
                } catch (err) {
                  console.error(err);
                  setError(err instanceof Error ? err.message : 'Failed to submit review');
                } finally {
                  setIsSubmitting(false);
                }
              }}>Submit</button>
              {user && rating.reviews.find(r => r.patientId === user.id) && (
                <button className="px-4 py-2 bg-red-50 text-red-700 rounded border border-red-100" disabled={isSubmitting} onClick={async () => {
                  if (!user || !doctorId) return; if (!confirm('Delete your review?')) return; setIsSubmitting(true);
                  try {
                    await doctorReviewAPI.deleteReview(parseInt(doctorId, 10), user.id);
                    const updated = await doctorReviewAPI.getDoctorReviews(parseInt(doctorId, 10));
                    setRating(updated);
                    setMyRating(5);
                    setMyComment('');
                  } catch (err) {
                    console.error(err);
                    setError(err instanceof Error ? err.message : 'Failed to delete review');
                  } finally { setIsSubmitting(false); }
                }}>Delete</button>
              )}
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-4">Patient Reviews</h2>
        {rating.reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No reviews yet</div>
        ) : (
          <div className="space-y-4">
            {rating.reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{review.patientName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg">{'⭐'.repeat(review.rating)}</span>
                      <span className="text-sm text-gray-600">{review.rating}/5</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                {review.comment && (<p className="text-gray-700 mt-3">{review.comment}</p>)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
