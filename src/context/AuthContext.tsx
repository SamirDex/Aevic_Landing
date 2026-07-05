import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type TeamRecord = {
  captain_contact: string;
  captain_name: string;
  email: string;
  id?: number | string;
  logo_url?: string | null;
  password_hash?: string | null;
  player1_ign: string;
  player2_ign: string;
  player3_ign: string;
  player4_ign: string;
  player5_ign?: string | null;
  room_id?: string | null;
  room_password?: string | null;
  status?: string | null;
  team_name: string;
  rejection_reason?: string | null;
  match_results?: Array<{
    image_url?: string | null;
    match_number?: number | null;
    match_type?: string | null;
    placement?: number | null;
    kills?: number | null;
    total_points?: number | null;
  }> | null;
};

interface AuthContextType {
  user: TeamRecord | null;
  login: (user: TeamRecord) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const SESSION_KEY = 'aevic_team';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TeamRecord | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const login = (userData: TeamRecord) => {
    const { password_hash, ...safeUser } = userData;
    setUser(safeUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
