import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import doctorReviewAPI from '../../services/api/doctor-review.api';

export default function ReviewDoctorPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!doctorId || !user) {
      setError('Missing required information');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await doctorReviewAPI.createReview({
        doctorId: parseInt(doctorId),
        patientId: user.id,
        rating,
        comment: comment || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(`/patient/doctor/${doctorId}/profile`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
        >
          ← Go Back
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rate Your Doctor</h1>
          <p className="text-gray-600 mb-6">
            Share your experience to help other patients make informed decisions
          </p>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              ✓ Review submitted successfully! Redirecting...
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Your Rating
              </label>
              <div className="flex gap-4 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-5xl transition transform hover:scale-110 ${
                      star <= rating
                        ? 'text-yellow-400 drop-shadow-lg'
                        : 'text-gray-300 opacity-50'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <p className="text-center text-lg font-medium text-indigo-600 mt-4">
                {rating === 5 && 'Excellent!'}
                {rating === 4 && 'Good!'}
                {rating === 3 && 'Average'}
                {rating === 2 && 'Poor'}
                {rating === 1 && 'Very Poor'}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 mb-2">
                Your Comment (Optional)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this doctor..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {comment.length} / 500 characters
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
