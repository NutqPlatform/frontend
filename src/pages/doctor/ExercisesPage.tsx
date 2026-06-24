import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getAllExercises } from '../../services/api/exercises.api';
import type { Exercise } from '../../services/api/exercises.api';
import { motion } from 'framer-motion';
import { Search, Filter, Play, Heart } from 'lucide-react';

export function ExercisesPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favorites, setFavorites] = useState<number[]>([]);

  const baseUrl = 'http://localhost:5246';

  const getImageSrc = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${encodeURI(path)}`;
  };

  useEffect(() => {
    if (user?.id && user?.role === 'doctor') loadExercises();
  }, [user]);
  useEffect(() => {
    let results = exercises;
    
    if (searchTerm) {
      results = results.filter(exercise =>
        (exercise.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      results = results.filter(exercise => exercise.difficulty === selectedCategory);
    }
    
    setFilteredExercises(results);
  }, [exercises, searchTerm, selectedCategory]);

  const loadExercises = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllExercises();
      setExercises(data);
      setFilteredExercises(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load exercises');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Exercises' },
   
  
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1 }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Exercise Library
        </h1>
        <p className="mt-2 text-slate-600">Browse and manage therapy exercises for your patients</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <span className="text-rose-600">⚠️</span>
            </div>
            <div>
              <p className="font-medium text-rose-900">{error}</p>
              <button 
                onClick={loadExercises}
                className="text-sm text-rose-600 hover:text-rose-800 mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition-colors">
            <Filter size={18} />
            <span>Filters</span>
          </button>
         
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {filteredExercises.map((exercise) => (
          <motion.div
            key={exercise.id}
            variants={item}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="group relative overflow-hidden rounded-2xl bg-white shadow-lg border border-slate-200/60 hover:shadow-2xl transition-all duration-300"
          >
            {/* Favorite Button */}
            <button
              onClick={() => {
                setFavorites(prev =>
                  prev.includes(exercise.id)
                    ? prev.filter(id => id !== exercise.id)
                    : [...prev, exercise.id]
                );
              }}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <Heart
                size={18}
                className={`${
                  favorites.includes(exercise.id)
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-slate-400'
                }`}
              />
            </button>

            {/* Image Container */}
            <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
              {exercise.imageUrl || exercise.assetUrl ? (
                <img
                  src={getImageSrc(exercise.imageUrl || exercise.assetUrl)}
                  alt={exercise.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-200 to-purple-200 flex items-center justify-center">
                    <Play size={32} className="text-blue-500" />
                  </div>
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Difficulty Badge */}
              {exercise.difficulty && (
                <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${
                  exercise.difficulty === 'beginner'
                    ? 'bg-emerald-500 text-white'
                    : exercise.difficulty === 'intermediate'
                    ? 'bg-amber-500 text-white'
                    : 'bg-rose-500 text-white'
                }`}>
                  {exercise.difficulty}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="font-bold text-slate-900 line-clamp-2 mb-2">
                {exercise.name}
              </h3>
              {exercise.description && (
                <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                  {exercise.description}
                </p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {exercise.difficulty && (
                  <span className="px-2 py-1 text-xs rounded-lg bg-slate-100 text-slate-700">
                    {exercise.difficulty}
                  </span>
                )}
                <span className="px-2 py-1 text-xs rounded-lg bg-blue-100 text-blue-700">
                  Therapy
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <button className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors text-sm">
                  Preview
                </button>
                <button className="flex-1 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all text-sm">
                  Assign
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        
      </motion.div>

      {/* Empty State */}
      {filteredExercises.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
            <Search size={32} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No exercises found</h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Try adjusting your search or filter criteria to find what you're looking for.
          </p>
        </div>
      )}
    </motion.div>
  );
}