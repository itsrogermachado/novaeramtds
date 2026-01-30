import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo-nova-era-elegant.jpg';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');
const nameSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres');

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (!isLogin) {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.fullName = nameResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Erro ao entrar',
              description: 'Email ou senha incorretos.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro ao entrar',
              description: error.message,
              variant: 'destructive',
            });
          }
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: 'Erro ao cadastrar',
              description: 'Este email já está cadastrado. Tente fazer login.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro ao cadastrar',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Conta criada!',
            description: 'Você será redirecionado automaticamente.',
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center auth-bg p-4 sm:p-6">
      {/* Background effects */}
      <div className="auth-spotlight" />
      <div className="auth-ambient" />
      <div className="auth-noise" />
      
      <div className="w-full max-w-[400px] relative z-10">
        {/* Glass Card */}
        <div className="auth-card rounded-2xl p-8 sm:p-10 animate-auth-card">
          
          {/* Logo with glow */}
          <div className="flex justify-center mb-8 animate-auth-logo">
            <div className="relative">
              <div className="auth-logo-glow" />
              <img 
                src={logo} 
                alt="Nova Era" 
                className="auth-logo h-28 sm:h-32 w-auto object-contain rounded-xl"
              />
            </div>
          </div>

          {/* Title - minimal */}
          <h1 
            className="text-center text-lg font-medium text-[hsl(220,15%,70%)] mb-8 animate-auth-field opacity-0"
            style={{ animationDelay: '0.3s' }}
          >
            {isLogin ? 'Acesse sua conta' : 'Criar conta'}
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name (Sign up only) */}
            {!isLogin && (
              <div 
                className="space-y-2 animate-auth-field opacity-0"
                style={{ animationDelay: '0.35s' }}
              >
                <div className="relative">
                  <div className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 auth-icon transition-colors duration-200",
                    focusedField === 'fullName' && "auth-icon-active"
                  )}>
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedField('fullName')}
                    onBlur={() => setFocusedField(null)}
                    className={cn(
                      "w-full h-13 pl-12 pr-4 rounded-xl auth-input text-sm",
                      errors.fullName && "border-red-500/50"
                    )}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-400 pl-1">{errors.fullName}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div 
              className="space-y-2 animate-auth-field opacity-0"
              style={{ animationDelay: isLogin ? '0.35s' : '0.4s' }}
            >
              <div className="relative">
                <div className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 auth-icon transition-colors duration-200",
                  focusedField === 'email' && "auth-icon-active"
                )}>
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    "w-full h-13 pl-12 pr-4 rounded-xl auth-input text-sm",
                    errors.email && "border-red-500/50"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 pl-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div 
              className="space-y-2 animate-auth-field opacity-0"
              style={{ animationDelay: isLogin ? '0.4s' : '0.45s' }}
            >
              <div className="relative">
                <div className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 auth-icon transition-colors duration-200",
                  focusedField === 'password' && "auth-icon-active"
                )}>
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    "w-full h-13 pl-12 pr-12 rounded-xl auth-input text-sm",
                    errors.password && "border-red-500/50"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg auth-toggle"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 pl-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <div 
              className="pt-3 animate-auth-field opacity-0"
              style={{ animationDelay: isLogin ? '0.45s' : '0.5s' }}
            >
              <button
                type="submit"
                className="w-full h-13 rounded-xl auth-btn text-sm"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}</span>
              </button>
            </div>
          </form>

          {/* Toggle link */}
          <div 
            className="mt-8 text-center animate-auth-field opacity-0"
            style={{ animationDelay: '0.55s' }}
          >
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm auth-link"
            >
              {isLogin ? (
                <>Não tem uma conta? <span className="auth-link-gold">Cadastre-se</span></>
              ) : (
                <>Já tem uma conta? <span className="auth-link-gold">Entrar</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
