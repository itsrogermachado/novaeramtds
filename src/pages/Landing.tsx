import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo-nova-era-3d.png';
import { BarChart3, FileText, Shield, ArrowRight, ChevronUp, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import InlineLoginPanel from '@/components/landing/InlineLoginPanel';
import { StoreCategoriesSection } from '@/components/store/StoreCategoriesSection';

export default function Landing() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleAccessDashboard = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setIsLoginOpen(!isLoginOpen);
    }
  };

  const benefits = [
    {
      icon: BarChart3,
      title: 'Visão geral em tempo real',
      description: 'Acompanhe suas operações e métricas ao vivo'
    },
    {
      icon: FileText,
      title: 'Relatórios organizados',
      description: 'Dados estruturados para análise rápida'
    },
    {
      icon: Shield,
      title: 'Acesso seguro',
      description: 'Proteção completa dos seus dados'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center auth-bg">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen auth-bg">
      {/* Background effects */}
      <div className="auth-spotlight" />
      <div className="auth-ambient" />
      <div className="auth-noise" />

      {/* Main Two-Column Layout */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        
        {/* LEFT SIDE - Dashboard Access */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-[480px] flex flex-col items-center">
            
            {/* Floating Logo */}
            <div className="ne-logo-wrap animate-auth-logo mb-8">
              <div className="ne-logo-glow" />
              <img 
                src={logo} 
                alt="Nova Era" 
                className="ne-logo"
              />
            </div>

            {/* Main Card */}
            <div 
              className="auth-card-minimal rounded-2xl p-7 sm:p-9 w-full animate-auth-card"
            >
              {/* Title */}
              <h1 
                className="text-center text-xl sm:text-2xl font-bold mb-2 animate-auth-field opacity-0"
                style={{ 
                  animationDelay: '0.3s',
                  color: 'hsl(220 25% 15%)'
                }}
              >
                Bem-vindo ao Nova Era
              </h1>
              
              <p 
                className="text-center text-sm text-muted-foreground mb-6 animate-auth-field opacity-0"
                style={{ animationDelay: '0.35s' }}
              >
                Acesse seu dashboard para acompanhar dados, relatórios e configurações.
              </p>

              {/* CTA Button */}
              <button
                onClick={handleAccessDashboard}
                data-login-trigger
                className="w-full auth-btn-minimal flex items-center justify-center gap-2 animate-auth-field opacity-0"
                style={{ animationDelay: '0.4s' }}
              >
                <span>Acessar Dashboard</span>
                {isLoginOpen ? (
                  <ChevronUp className="h-4 w-4 transition-transform" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>

              {/* Inline Login Panel */}
              <InlineLoginPanel 
                isOpen={isLoginOpen} 
                onClose={() => setIsLoginOpen(false)} 
              />

              {/* Auth Links - only show when login is closed */}
              {!isLoginOpen && (
                <div 
                  className="mt-6 flex items-center justify-center gap-4 text-sm animate-auth-field opacity-0"
                  style={{ animationDelay: '0.45s' }}
                >
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="transition-colors font-medium hover:underline"
                    style={{ color: 'hsl(220 25% 20%)' }}
                  >
                    Entrar
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    onClick={() => navigate('/cadastro')}
                    className="transition-colors hover:underline"
                    style={{ color: 'hsl(220 15% 40%)' }}
                  >
                    Criar conta
                  </button>
                </div>
              )}
            </div>

            {/* Benefits Section */}
            <div 
              className="mt-8 w-full grid gap-4 animate-auth-field opacity-0"
              style={{ animationDelay: '0.5s' }}
            >
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/40 backdrop-blur-sm border border-white/60"
                >
                  <div 
                    className="p-2.5 rounded-lg shrink-0"
                    style={{ 
                      background: 'linear-gradient(135deg, hsl(220 15% 95%), hsl(220 10% 90%))',
                      boxShadow: '0 2px 8px hsl(220 20% 80% / 0.3)'
                    }}
                  >
                    <benefit.icon className="h-5 w-5" style={{ color: 'hsl(220 25% 30%)' }} />
                  </div>
                  <div>
                    <h3 
                      className="font-semibold text-sm"
                      style={{ color: 'hsl(220 25% 20%)' }}
                    >
                      {benefit.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Text */}
            <p 
              className="mt-8 text-xs text-muted-foreground text-center animate-auth-field opacity-0"
              style={{ animationDelay: '0.55s' }}
            >
              Acesso seguro • Dados protegidos • Interface rápida
            </p>
          </div>
        </div>

        {/* RIGHT SIDE - Store */}
        <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 lg:border-l lg:border-white/30">
          <div className="w-full max-w-[520px] pt-8 lg:pt-16">
            
            {/* Store Header with Logo */}
            <div 
              className="text-center mb-8 animate-auth-field opacity-0"
              style={{ animationDelay: '0.5s' }}
            >
              <div className="flex flex-col items-center gap-3 mb-4">
                <img 
                  src={logo} 
                  alt="Nova Era" 
                  className="h-16 w-16 object-contain opacity-80"
                />
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5" style={{ color: 'hsl(220 25% 30%)' }} />
                  <h2 
                    className="text-xl font-bold"
                    style={{ color: 'hsl(220 25% 15%)' }}
                  >
                    Loja Nova Era
                  </h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Explore produtos e serviços digitais que impulsionam sua operação.
              </p>
            </div>

            {/* Store Categories - Use component without header */}
            <StoreCategoriesSection hideHeader />
          </div>
        </div>
      </div>
    </div>
  );
}
