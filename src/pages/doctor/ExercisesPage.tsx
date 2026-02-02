import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAllExercises } from '../../services/api/exercises.api';
import type { Exercise } from '../../services/api/exercises.api';

export function ExercisesPage() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [exercises, setExercises] = useState<Exercise[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const baseUrl = 'http://localhost:5246';

const getImageSrc = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
};


	useEffect(() => {
		if (user?.id && user?.role === 'doctor') loadExercises();
	}, [user]);

	const loadExercises = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await getAllExercises();
			setExercises(data);
		} catch (err) {
			console.error(err);
			setError('Failed to load exercises');
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) return <div className="min-h-screen px-4 py-10">Loading exercises...</div>;

	return (
		<div className="min-h-screen bg-slate-50 px-4 py-10">
			<div className="mx-auto max-w-7xl">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-semibold tracking-tight">Exercises</h1>
						<p className="mt-1 text-sm text-slate-600">Browse available exercises (read-only)</p>
					</div>
					<button
						onClick={() => navigate('/doctor')}
						className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
					>
						Back to Dashboard
					</button>
				</div>

				{error && (
					<div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
				)}

				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{exercises.map((exercise) => (
						<div key={exercise.id} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md transition-all hover:shadow-lg">
							<div className="relative h-48 w-full overflow-hidden bg-slate-100">
								{exercise.imageUrl ? (
									<img src={getImageSrc(exercise.imageUrl)} alt={exercise.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
								) : exercise.assetUrl ? (
									<img src={getImageSrc(exercise.assetUrl)} alt={exercise.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
								) : (
									<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
										<svg className="h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
									</div>
								)}

								<div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
									<div className="text-sm text-white">
										<div className="font-semibold">{exercise.name}</div>
										{exercise.description && <div className="mt-1 text-xs">{exercise.description}</div>}
									</div>
								</div>
							</div>

							<div className="p-4">
								<h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{exercise.name}</h3>
								{exercise.difficulty && <span className="mt-3 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{exercise.difficulty}</span>}
							</div>
						</div>
					))}

					<div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white p-8">
						<div className="text-center">
							<svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6h6m0 0h6" />
							</svg>
							<h3 className="mt-4 text-sm font-semibold text-slate-900">More Exercises Coming Soon</h3>
							<p className="mt-2 text-xs text-slate-600">We're continuously adding new exercises to enhance your therapy programs.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ExercisesPage;

