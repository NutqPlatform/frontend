export type UserRole = 'doctor' | 'patient' | 'admin';

export interface User {
  id: number;
  email: string;
  name?: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  loginDoctor: (email: string, password: string) => Promise<void>;
  loginPatient: (email: string, password: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
