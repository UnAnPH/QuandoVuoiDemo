import { useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import EmployeeOnboarding from './components/EmployeeOnboarding';
import EmployeeHome from './components/EmployeeHome';
import HROnboarding from './components/HROnboarding';
import HRDashboard from './components/HRDashboard';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.user_type === 'employee') {
    if (!user.onboarding_completed) {
      return <EmployeeOnboarding />;
    }
    return <EmployeeHome />;
  }

  if (user.user_type === 'hr') {
    if (!user.onboarding_completed) {
      return <HROnboarding />;
    }
    return <HRDashboard />;
  }

  return null;
}

export default App;
