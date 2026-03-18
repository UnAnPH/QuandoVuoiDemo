import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { databases, DB_ID, USERS_COL, ID, Query } from '../lib/appwrite';
import { User, Credentials } from '../types';

const VALID_CREDENTIALS = {
  employee: { company: 'Demo', email: 'user@gmail.com', password: 'demo123' },
  hr: { company: 'Demo', email: 'hr@gmail.com', password: 'demo123' }
};

interface AuthContextType {
  user: User | null;
  login: (credentials: Credentials) => Promise<boolean>;
  logout: () => void;
  completeOnboarding: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toUser = (doc: any): User => ({
  id: doc.$id,
  email: doc.email,
  company_name: doc.company_name,
  user_type: doc.user_type,
  onboarding_completed: doc.onboarding_completed,
  created_at: doc.$createdAt,
  updated_at: doc.$updatedAt
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('quandovuoi_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (credentials: Credentials): Promise<boolean> => {
    const normalizedCompany = credentials.company.trim().toLowerCase();
    const normalizedEmail = credentials.email.trim().toLowerCase();

    const isEmployee =
      normalizedEmail === VALID_CREDENTIALS.employee.email &&
      credentials.password === VALID_CREDENTIALS.employee.password &&
      normalizedCompany === VALID_CREDENTIALS.employee.company.toLowerCase();

    const isHR =
      normalizedEmail === VALID_CREDENTIALS.hr.email &&
      credentials.password === VALID_CREDENTIALS.hr.password &&
      normalizedCompany === VALID_CREDENTIALS.hr.company.toLowerCase();

    if (!isEmployee && !isHR) return false;

    const userType = isEmployee ? 'employee' : 'hr';
    const canonicalCompany = isEmployee ? VALID_CREDENTIALS.employee.company : VALID_CREDENTIALS.hr.company;
    const canonicalEmail = isEmployee ? VALID_CREDENTIALS.employee.email : VALID_CREDENTIALS.hr.email;

    try {
      const existing = await databases.listDocuments(DB_ID, USERS_COL, [
        Query.equal('email', canonicalEmail),
        Query.equal('company_name', canonicalCompany)
      ]);

      let userData: User;

      if (existing.documents.length > 0) {
        userData = toUser(existing.documents[0]);
      } else {
        const newDoc = await databases.createDocument(DB_ID, USERS_COL, ID.unique(), {
          email: canonicalEmail,
          company_name: canonicalCompany,
          user_type: userType,
          onboarding_completed: false
        });
        userData = toUser(newDoc);
      }

      setUser(userData);
      localStorage.setItem('quandovuoi_user', JSON.stringify(userData));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('quandovuoi_user');
  };

  const completeOnboarding = async () => {
    if (!user) return;
    const updated = await databases.updateDocument(DB_ID, USERS_COL, user.id, {
      onboarding_completed: true
    });
    const updatedUser = toUser(updated);
    setUser(updatedUser);
    localStorage.setItem('quandovuoi_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, completeOnboarding, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
