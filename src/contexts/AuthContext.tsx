import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Credentials } from '../types';

const VALID_CREDENTIALS = {
  employee: { company: 'Acme', email: 'mario@acme.it', password: 'demo123' },
  hr: { company: 'Acme', email: 'hr@acme.it', password: 'hr2024' }
};

interface AuthContextType {
  user: User | null;
  login: (credentials: Credentials) => Promise<boolean>;
  logout: () => void;
  completeOnboarding: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('quandovuoi_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials: Credentials): Promise<boolean> => {
    const isEmployee = credentials.email === VALID_CREDENTIALS.employee.email &&
                      credentials.password === VALID_CREDENTIALS.employee.password &&
                      credentials.company === VALID_CREDENTIALS.employee.company;

    const isHR = credentials.email === VALID_CREDENTIALS.hr.email &&
                credentials.password === VALID_CREDENTIALS.hr.password &&
                credentials.company === VALID_CREDENTIALS.hr.company;

    if (!isEmployee && !isHR) {
      return false;
    }

    const userType = isEmployee ? 'employee' : 'hr';

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', credentials.email)
      .eq('company_name', credentials.company)
      .maybeSingle();

    let userData: User;

    if (existingUser) {
      userData = existingUser as User;
    } else {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: credentials.email,
          company_name: credentials.company,
          user_type: userType,
          onboarding_completed: false
        })
        .select()
        .single();

      if (error || !newUser) {
        return false;
      }

      userData = newUser as User;
    }

    setUser(userData);
    localStorage.setItem('quandovuoi_user', JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('quandovuoi_user');
  };

  const completeOnboarding = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('users')
      .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      const updatedUser = data as User;
      setUser(updatedUser);
      localStorage.setItem('quandovuoi_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, completeOnboarding, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
