import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

interface InlineLoginPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InlineLoginPanel({ isOpen, onClose }: InlineLoginPanelProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // Check if click is on the trigger button (parent handles this)
        const target = event.target as HTMLElement;
        if (!target.closest('[data-login-trigger]')) {
          onClose();
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset form when panel closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setErrors({});
      setAuthError(null);
      setShowPassword(false);
    }
  }, [isOpen]);

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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setAuthError('Email ou senha incorretos.');
        } else {
          setAuthError(error.message);
        }
      } else {
        navigate('/dashboard');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={panelRef}
      className={cn(
        "w-full overflow-hidden transition-all duration-300 ease-out",
        isOpen 
          ? "max-h-[400px] opacity-100 mt-4" 
          : "max-h-0 opacity-0 mt-0"
      )}
    >
      <div 
        className={cn(
          "auth-card-minimal rounded-xl p-5 sm:p-6 transition-all duration-300",
          isOpen ? "translate-y-0" : "-translate-y-4"
        )}
      >
        {/* Error Message */}
        {authError && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{authError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email */}
          <div>
            <div className="relative">
              <div className={cn(
                "absolute left-3.5 top-1/2 -translate-y-1/2 auth-icon-minimal transition-colors duration-200",
                focusedField === 'email' && "auth-icon-active"
              )}>
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="inline-email"
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
          <div>
            <div className="relative">
              <div className={cn(
                "absolute left-3.5 top-1/2 -translate-y-1/2 auth-icon-minimal transition-colors duration-200",
                focusedField === 'password' && "auth-icon-active"
              )}>
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="inline-password"
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
          <div className="pt-1">
            <button
              type="submit"
              className="w-full auth-btn-minimal"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Entrando...' : 'Entrar'}</span>
            </button>
          </div>
        </form>

        {/* Forgot Password Link */}
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => navigate('/esqueci-senha')}
            className="text-xs transition-colors hover:underline"
            style={{ color: 'hsl(220 15% 40%)' }}
          >
            Esqueceu sua senha?
          </button>
        </div>

        {/* Create Account Link */}
        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={() => navigate('/cadastro')}
            className="text-sm transition-colors"
            style={{ color: 'hsl(220 15% 40%)' }}
          >
            Não tem conta?{' '}
            <span className="font-bold underline" style={{ color: 'hsl(220 25% 20%)' }}>
              Cadastre-se
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
