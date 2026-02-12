import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo-nova-era-3d.png';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const emailSchema = z.string().email('Email inválido');

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) {
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setEmailSent(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 animate-auth-field opacity-0"
            style={{ animationDelay: '0.25s' }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>

          {emailSent ? (
            <div className="text-center space-y-4 animate-auth-field opacity-0" style={{ animationDelay: '0.3s' }}>
              <CheckCircle className="h-12 w-12 mx-auto text-success" />
              <h2 className="text-lg font-semibold" style={{ color: 'hsl(220 25% 20%)' }}>
                Email enviado!
              </h2>
              <p className="text-sm text-muted-foreground">
                Enviamos um link de redefinição para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full auth-btn-minimal mt-4"
              >
                <span>Voltar ao login</span>
              </button>
            </div>
          ) : (
            <>
              <p
                className="text-center text-sm tracking-wide text-muted-foreground mb-2 animate-auth-field opacity-0"
                style={{ animationDelay: '0.3s' }}
              >
                Esqueceu sua senha?
              </p>
              <p
                className="text-center text-xs text-muted-foreground mb-6 animate-auth-field opacity-0"
                style={{ animationDelay: '0.35s' }}
              >
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="animate-auth-field opacity-0" style={{ animationDelay: '0.4s' }}>
                  <div className="relative">
                    <div className={cn(
                      "absolute left-3.5 top-1/2 -translate-y-1/2 auth-icon-minimal transition-colors duration-200",
                      focusedField === 'email' && "auth-icon-active"
                    )}>
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "w-full auth-input-minimal",
                        error && "border-destructive/40"
                      )}
                    />
                  </div>
                  {error && (
                    <p className="text-xs text-destructive mt-1.5 pl-1">{error}</p>
                  )}
                </div>

                <div className="pt-2 animate-auth-field opacity-0" style={{ animationDelay: '0.45s' }}>
                  <button
                    type="submit"
                    className="w-full auth-btn-minimal"
                    disabled={isSubmitting}
                  >
                    <span>{isSubmitting ? 'Enviando...' : 'Enviar link'}</span>
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
