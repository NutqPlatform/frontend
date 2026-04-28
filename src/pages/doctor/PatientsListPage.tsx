import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDoctorPatients } from '../../services/api/dashboard.api';
import type { Patient } from '../../services/api/dashboard.api';
import { Users, UserPlus, Search, Filter, Calendar, Activity, ChevronRight, Mail, User as UserIcon, MoreVertical, AlertCircle } from 'lucide-react'; // Removed Phone import

export function PatientsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  useEffect(() => {
    if (user?.id && user?.role === 'doctor') {
      loadPatients();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortPatients();
  }, [patients, searchTerm, statusFilter, sortBy]);

  const loadPatients = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const patientsData = await getDoctorPatients(user.id);
      setPatients(patientsData);
    } catch (err) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortPatients = () => {
    let filtered = [...patients];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.age && patient.age.toString().includes(searchTerm))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      // Filter logic if status field exists
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return 0;
        case 'activity':
          return 0;
        default:
          return 0;
      }
    });

    setFilteredPatients(filtered);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Remove unused variable filter function
  const shouldShowActive = (_patient: Patient) => {
    // This is a placeholder - adjust based on your Patient type
    return true;
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 rounded mt-2 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
            <p className="mt-2 text-gray-600">Manage and monitor all your patients in one place</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/doctor/patients/invitation-code')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-3 text-white font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <UserPlus size={18} />
              Invite Patient
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{patients.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
            <span className="text-green-600">↑ 12%</span>
            <span>from last month</span>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Plans</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {patients.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">Currently ongoing</div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">78%</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">Across all patients</div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Satisfaction</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">4.8</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">Out of 5.0</div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-900">{error}</p>
              <button 
                onClick={loadPatients}
                className="text-sm text-red-600 hover:text-red-800 mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patients by name, email, or age..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 appearance-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-10 pr-8 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 appearance-none"
              >
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
                <option value="activity">Sort by Activity</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Patients List */}
      {filteredPatients.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          {searchTerm ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching patients</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search criteria</p>
              <button
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-white font-medium hover:bg-gray-800 transition-all"
              >
                Clear Search
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No patients yet</h3>
              <p className="text-gray-600 mb-6">Start by inviting your first patient</p>
              <button
                onClick={() => navigate('/doctor/patients/invitation-code')}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-white font-medium hover:bg-gray-800 transition-all"
              >
                <UserPlus size={18} />
                Invite First Patient
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="group rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/doctor/patients/${patient.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="relative">
                    {/* Removed profilePicture condition since it doesn't exist in Patient type */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {getInitials(patient.name)}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor('active')}`}>
                        Active
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        <span>{patient.email}</span>
                      </div>
                      {patient.age && (
                        <div className="flex items-center gap-2">
                          <UserIcon size={14} />
                          <span>{patient.age} years</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-semibold text-gray-900">65%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-gradient-to-r from-gray-900 to-gray-700 rounded-full transition-all duration-500"
                          style={{ width: '65%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/doctor/patients/${patient.id}`);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical size={20} />
                  </button>
                  <ChevronRight className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Stats */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <div className="font-medium text-gray-900">{filteredPatients.length}</div>
          <div className="text-gray-600">Patients</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <div className="font-medium text-gray-900">
            {filteredPatients.filter(shouldShowActive).length}
          </div>
          <div className="text-gray-600">Active</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <div className="font-medium text-gray-900">78%</div>
          <div className="text-gray-600">Avg Progress</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <div className="font-medium text-gray-900">24h</div>
          <div className="text-gray-600">Last Updated</div>
        </div>
      </div>
    </div>
  );
}