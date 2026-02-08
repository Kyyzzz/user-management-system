import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { UserRole } from '../types/index.ts';

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Redirect based on user role
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === UserRole.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/user/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
};

export default MainPage;
