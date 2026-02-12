import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo-nova-era-3d.png';
import { z } from 'zod';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true);
      }
    });

    // Also check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) {
      newErrors.password = passResult.error.errors[0].message;
    }

    if (password !== confirmPassword) {
      newErrors.confirm = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center auth-bg p-4">
        <div className="auth-spotlight" />
        <div className="auth-ambient" />
        <div className="auth-noise" />
        <div className="w-full max-w-[380px] relative z-10">
          <div className="ne-logo-wrap animate-auth-logo">
            <div className="ne-logo-glow" />
            <img src={logo} alt="Nova Era" className="ne-logo" />
          </div>
          <div className="auth-card-minimal rounded-2xl p-7 sm:p-9 animate-auth-card text-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Verificando link de redefinição...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center auth-bg p-4 sm:p-6">
      <div className="auth-spotlight" />
      <div className="auth-ambient" />
      <div className="auth-noise" />

      <div className="w-full max-w-[380px] relative z-10">
        <div className="ne-logo-wrap animate-auth-logo">
          <div className="ne-logo-glow" />
          <img src={logo} alt="Nova Era" className="ne-logo" />
        </div>

        <div className="auth-card-minimal rounded-2xl p-7 sm:p-9 animate-auth-card">
          {success ? (
            <div className="text-center space-y-4 animate-auth-field opacity-0" style={{ animationDelay: '0.3s' }}>
              <CheckCircle className="h-12 w-12 mx-auto text-success" />
              <h2 className="text-lg font-semibold" style={{ color: 'hsl(220 25% 20%)' }}>
                Senha redefinida!
              </h2>
              <p className="text-sm text-muted-foreground">
                Sua senha foi alterada com sucesso. Redirecionando...
              </p>
            </div>
          ) : (
            <>
              <p
                className="text-center text-sm tracking-wide text-muted-foreground mb-2 animate-auth-field opacity-0"
                style={{ animationDelay: '0.3s' }}
              >
                Nova senha
              </p>
              <p
                className="text-center text-xs text-muted-foreground mb-6 animate-auth-field opacity-0"
                style={{ animationDelay: '0.35s' }}
              >
                Digite sua nova senha abaixo.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="animate-auth-field opacity-0" style={{ animationDelay: '0.4s' }}>
                  <div className="relative">
                    <div className={cn(
                      "absolute left-3.5 top-1/2 -translate-y-1/2 auth-icon-minimal transition-colors duration-200",
                      focusedField === 'password' && "auth-icon-active"
                    )}>
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Nova senha"
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

                <div className="animate-auth-field opacity-0" style={{ animationDelay: '0.45s' }}>
                  <div className="relative">
                    <div className={cn(
                      "absolute left-3.5 top-1/2 -translate-y-1/2 auth-icon-minimal transition-colors duration-200",
                      focusedField === 'confirm' && "auth-icon-active"
                    )}>
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirmar nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirm')}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "w-full auth-input-minimal",
                        errors.confirm && "border-destructive/40"
                      )}
                    />
                  </div>
                  {errors.confirm && (
                    <p className="text-xs text-destructive mt-1.5 pl-1">{errors.confirm}</p>
                  )}
                </div>

                <div className="pt-2 animate-auth-field opacity-0" style={{ animationDelay: '0.5s' }}>
                  <button
                    type="submit"
                    className="w-full auth-btn-minimal"
                    disabled={isSubmitting}
                  >
                    <span>{isSubmitting ? 'Redefinindo...' : 'Redefinir senha'}</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
