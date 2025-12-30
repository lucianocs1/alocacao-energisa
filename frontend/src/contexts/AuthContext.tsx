import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserDto, authService, LoginRequest } from '@/services/authService';

interface AuthContextType {
  usuario: UserDto | null;
  estaAutenticado: boolean;
  carregando: boolean;
  entrar: (credentials: LoginRequest) => Promise<{ success: boolean; message?: string }>;
  sair: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UserDto | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Verificar se há usuário armazenado ao carregar
    const usuarioArmazenado = authService.obterUsuarioArmazenado();
    if (usuarioArmazenado) {
      setUsuario(usuarioArmazenado);
    }
    setCarregando(false);
  }, []);

  const entrar = async (credentials: LoginRequest) => {
    try {
      const response = await authService.entrar(credentials);
      
      if (response.success && response.user) {
        setUsuario(response.user);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: 'Erro ao conectar com o servidor' };
    }
  };

  const sair = () => {
    authService.sair();
    setUsuario(null);
  };

  const value: AuthContextType = {
    usuario,
    estaAutenticado: !!usuario,
    carregando,
    entrar,
    sair,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
