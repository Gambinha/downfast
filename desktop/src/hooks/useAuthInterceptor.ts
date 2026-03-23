import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/userData';
import { onAuthLogout } from '../services/authEvents';

export function useAuthInterceptor() {
  const navigate = useNavigate();
  const { addUserData } = useContext(UserContext);

  useEffect(() => {
    const unsubscribe = onAuthLogout((message: string) => {
      localStorage.removeItem('user');
      localStorage.removeItem('x-access-token');
      addUserData({
        id: '',
        name: '',
        email: '',
        username: '',
        likedsPlaylists: [''],
        role: '',
      });
      alert(message);
      navigate('/');
    });
    return unsubscribe;
  }, [navigate, addUserData]);
}
