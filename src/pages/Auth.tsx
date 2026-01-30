import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo-nova-era-3d.png';
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
      
      <div className="w-full max-w-[380px] relative z-10">
        
        {/* Floating Logo - NO container */}
        <div className="ne-logo-wrap animate-auth-logo">
          <div className="ne-logo-glow" />
          <img 
            src={logo} 
            alt="Nova Era" 
            className="ne-logo"
          />
        </div>

        {/* Glass Card - more minimal */}
        <div className="auth-card-minimal rounded-2xl p-7 sm:p-9 animate-auth-card">
          
          {/* Title - elegant silver */}
          <p 
            className="text-center text-sm tracking-wide text-muted-foreground mb-7 animate-auth-field opacity-0"
            style={{ animationDelay: '0.3s' }}
          >
            {isLogin ? 'Acesse sua conta' : 'Crie sua conta'}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Sign up only) */}
            {!isLogin && (
              <div 
                className="animate-auth-field opacity-0"
                style={{ animationDelay: '0.35s' }}
              >
                <div className="relative">
                  <div className={cn(
                    "absolute left-3.5 top-1/2 -translate-y-1/2 auth-icon-minimal transition-colors duration-200",
                    focusedField === 'fullName' && "auth-icon-active"
                  )}>
                    <User className="h-4 w-4" />
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
                    "w-full auth-input-minimal",
                    errors.fullName && "border-destructive/40"
                  )}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-destructive mt-1.5 pl-1">{errors.fullName}</p>
              )}
            </div>
            )}

            {/* Email */}
            <div 
              className="animate-auth-field opacity-0"
              style={{ animationDelay: isLogin ? '0.35s' : '0.4s' }}
            >
              <div className="relative">
                <div className={cn(
                  "absolute left-3.5 top-1/2 -translate-y-1/2 auth-icon-minimal transition-colors duration-200",
                  focusedField === 'email' && "auth-icon-active"
                )}>
                  <Mail className="h-4 w-4" />
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
                    "w-full auth-input-minimal",
                    errors.email && "border-destructive/40"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive mt-1.5 pl-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div 
              className="animate-auth-field opacity-0"
              style={{ animationDelay: isLogin ? '0.4s' : '0.45s' }}
            >
              <div className="relative">
                <div className={cn(
                  "absolute left-3.5 top-1/2 -translate-y-1/2 auth-icon-minimal transition-colors duration-200",
                  focusedField === 'password' && "auth-icon-active"
                )}>
                  <Lock className="h-4 w-4" />
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
                    "w-full auth-input-minimal pr-11",
                    errors.password && "border-destructive/40"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md auth-toggle-minimal"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1.5 pl-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <div 
              className="pt-2 animate-auth-field opacity-0"
              style={{ animationDelay: isLogin ? '0.45s' : '0.5s' }}
            >
              <button
                type="submit"
                className="w-full auth-btn-minimal"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}</span>
              </button>
            </div>
          </form>

          {/* Toggle link */}
          <div 
            className="mt-6 text-center animate-auth-field opacity-0"
            style={{ animationDelay: '0.55s' }}
          >
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? (
                <>Não tem conta? <span className="font-semibold text-foreground">Cadastre-se</span></>
              ) : (
                <>Já tem conta? <span className="font-semibold text-foreground">Entrar</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
