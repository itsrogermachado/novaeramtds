import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen flex items-center justify-center bg-background p-3 sm:p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
      
      <div 
        className="w-full max-w-md relative z-10"
        style={{ animationDelay: '0.1s' }}
      >
        {/* Glass Card */}
        <div 
          className={cn(
            "glass-card gradient-border rounded-2xl p-6 sm:p-8 md:p-10",
            "shadow-premium-lg animate-slide-up-fade"
          )}
        >
          {/* Logo with glow */}
          <div 
            className="flex justify-center mb-6 sm:mb-8 animate-slide-up-fade"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl scale-150" />
              <img 
                src={logo} 
                alt="Nova Era" 
                className="h-20 sm:h-24 md:h-28 w-auto object-contain relative z-10 drop-shadow-lg"
              />
            </div>
          </div>

          {/* Title */}
          <div 
            className="text-center mb-6 sm:mb-8 animate-slide-up-fade"
            style={{ animationDelay: '0.3s' }}
          >
            <h1 className="text-xl sm:text-2xl font-display font-semibold text-foreground mb-1.5 sm:mb-2">
              {isLogin ? 'Entrar na sua conta' : 'Criar conta'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isLogin ? 'Bem-vindo de volta!' : 'Preencha os dados abaixo'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {!isLogin && (
              <div 
                className="space-y-2 animate-slide-up-fade"
                style={{ animationDelay: '0.35s' }}
              >
                <label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Nome Completo
                </label>
                <div className="relative group">
                  <div className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200",
                    focusedField === 'fullName' ? "text-gold" : "text-muted-foreground"
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
                      "w-full h-12 pl-11 pr-4 rounded-xl border bg-secondary/50 backdrop-blur-sm",
                      "text-foreground placeholder:text-muted-foreground",
                      "transition-all duration-300 ease-out",
                      "focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50",
                      "hover:border-border/80 hover:bg-secondary/70",
                      errors.fullName ? "border-destructive" : "border-border"
                    )}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive animate-slide-up-fade">{errors.fullName}</p>
                )}
              </div>
            )}

            <div 
              className="space-y-2 animate-slide-up-fade"
              style={{ animationDelay: isLogin ? '0.35s' : '0.4s' }}
            >
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative group">
                <div className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200",
                  focusedField === 'email' ? "text-gold" : "text-muted-foreground"
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
                    "w-full h-12 pl-11 pr-4 rounded-xl border bg-secondary/50 backdrop-blur-sm",
                    "text-foreground placeholder:text-muted-foreground",
                    "transition-all duration-300 ease-out",
                    "focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50",
                    "hover:border-border/80 hover:bg-secondary/70",
                    errors.email ? "border-destructive" : "border-border"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive animate-slide-up-fade">{errors.email}</p>
              )}
            </div>

            <div 
              className="space-y-2 animate-slide-up-fade"
              style={{ animationDelay: isLogin ? '0.4s' : '0.45s' }}
            >
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Senha
              </label>
              <div className="relative group">
                <div className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200",
                  focusedField === 'password' ? "text-gold" : "text-muted-foreground"
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
                    "w-full h-12 pl-11 pr-12 rounded-xl border bg-secondary/50 backdrop-blur-sm",
                    "text-foreground placeholder:text-muted-foreground",
                    "transition-all duration-300 ease-out",
                    "focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50",
                    "hover:border-border/80 hover:bg-secondary/70",
                    errors.password ? "border-destructive" : "border-border"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md",
                    "text-muted-foreground hover:text-foreground",
                    "transition-all duration-200 hover:bg-muted/50"
                  )}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive animate-slide-up-fade">{errors.password}</p>
              )}
            </div>

            <div 
              className="animate-slide-up-fade pt-2"
              style={{ animationDelay: isLogin ? '0.45s' : '0.5s' }}
            >
              <Button
                type="submit"
                className={cn(
                  "w-full h-12 text-base font-medium rounded-xl",
                  "btn-premium transition-all duration-300",
                  "hover:shadow-glow hover:scale-[1.02]",
                  "active:scale-[0.98]"
                )}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}
              </Button>
            </div>
          </form>

          {/* Toggle */}
          <div 
            className="mt-6 sm:mt-8 text-center animate-slide-up-fade"
            style={{ animationDelay: '0.55s' }}
          >
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className={cn(
                "text-sm text-muted-foreground transition-all duration-200",
                "hover:text-foreground"
              )}
            >
              {isLogin ? (
                <>Não tem uma conta? <span className="font-semibold text-gold hover:text-gold/80 transition-colors">Cadastre-se</span></>
              ) : (
                <>Já tem uma conta? <span className="font-semibold text-gold hover:text-gold/80 transition-colors">Entrar</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}