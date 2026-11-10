import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/api';
import { Loader2 } from 'lucide-react';

export default function RenewCraftPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    const renewStage = async () => {
      if (!user?.id) {
        navigate('/login');
        return;
      }

      try {
        // Update user's stage to 3 in the backend
        await api.patch(`/profiles/user/${user.id}`, { currentStage: 3 });
        
        // Update local store state
        setUser({ ...user, currentStage: 3 } as any);
        
        // Navigate to SisCraftPage
        navigate('/sis/craft');
      } catch (error) {
        console.error('Failed to renew craft stage:', error);
        // Navigate back to dashboard if something goes wrong
        navigate('/dashboard');
      }
    };

    renewStage();
  }, [user, setUser, navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
      <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
      <p className="font-medium uppercase tracking-widest text-sm opacity-50">กำลังปรับปรุงข้อมูลของคุณ...</p>
    </div>
  );
}
