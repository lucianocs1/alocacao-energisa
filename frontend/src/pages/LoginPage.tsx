import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificacao } from '@/hooks/useNotificacao';

const LoginPage = () => {
  const navigate = useNavigate();
  const { entrar } = useAuth();
  const { sucesso, erro } = useNotificacao();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Carregar email salvo
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('remember_me') === 'true';
    const savedEmail = localStorage.getItem('remembered_email');
    
    if (savedRememberMe && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    processarLogin();
  };

  const processarLogin = async () => {
    setIsLoading(true);

    try {
      if (!email || !password) {
        erro('Campos obrigatórios', 'Por favor, preencha todos os campos');
        setIsLoading(false);
        return;
      }

      if (!email.includes('@')) {
        erro('Email inválido', 'Por favor, insira um email válido');
        setIsLoading(false);
        return;
      }

      const response = await entrar({ email, password });
      
      if (response.success) {
        if (rememberMe) {
          localStorage.setItem('remember_me', 'true');
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remember_me');
          localStorage.removeItem('remembered_email');
        }
        
        sucesso('Login realizado', 'Bem-vindo ao Resource Flow!');
        setTimeout(() => navigate('/projetos'), 300);
      } else {
        erro('Falha na autenticação', response.message || 'Email ou senha incorretos');
        setIsLoading(false);
      }
    } catch (err) {
      erro('Erro', 'Erro ao conectar com o servidor');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground mb-4">
            <div className="text-xl font-bold">RF</div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Resource Flow
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema de Gestão de Recursos
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Bem-vindo</CardTitle>
            <CardDescription>
              Faça login com sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={isLoading}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    Lembrar-me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Implementar recuperação de senha
                  }}
                  className="text-primary hover:text-primary/90 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Esqueci a senha
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Autenticando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          © 2025 Luciano Filho. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
