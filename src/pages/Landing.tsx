import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, FileText, Shield, ArrowRight, ChevronUp, Store, Package, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import InlineLoginPanel from '@/components/landing/InlineLoginPanel';
import { StoreCategoriesSection } from '@/components/store/StoreCategoriesSection';
import { CartButton } from '@/components/store/CartButton';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';

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
    <div className="min-h-screen auth-bg overflow-auto">
      {/* Background effects */}
      <div className="auth-spotlight" />
      <div className="auth-ambient" />
      <div className="auth-noise" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Right Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 sm:pt-4 lg:pt-6 px-4">
          <a
            href="https://chat.whatsapp.com/C6KXMYWZM8S7OqKm2cvIRr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card/60 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-muted-foreground hover:text-emerald-500 transition-all text-sm font-medium"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Grupo Network</span>
          </a>
          <ThemeToggle />
          <CartButton variant="outline" size="icon" />
        </div>

        {/* Two-Column Cards Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-0 p-4 sm:p-6 lg:px-12 lg:py-2">
          
          {/* LEFT SIDE - Dashboard Access */}
          <div className="flex flex-col items-center lg:items-end lg:pr-8">
            <div className="w-full max-w-[460px] flex flex-col">
              
              {/* Main Card */}
              <div className="auth-card-minimal rounded-2xl p-5 xs:p-7 sm:p-9 w-full animate-auth-card">
                {/* Title */}
                <h1 
                  className="text-center text-lg xs:text-xl sm:text-2xl font-bold mb-2 animate-auth-field opacity-0 text-foreground"
                  style={{ animationDelay: '0.3s' }}
                >
                  Bem-vindo ao Nova Era
                </h1>
                
                <p 
                  className="text-center text-xs xs:text-sm text-muted-foreground mb-4 xs:mb-6 animate-auth-field opacity-0"
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
                    className="mt-4 xs:mt-6 flex items-center justify-center gap-3 xs:gap-4 text-xs xs:text-sm animate-auth-field opacity-0"
                    style={{ animationDelay: '0.45s' }}
                  >
                    <button
                      onClick={() => setIsLoginOpen(true)}
                      className="transition-colors font-medium hover:underline text-foreground"
                    >
                      Entrar
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      onClick={() => navigate('/cadastro')}
                      className="transition-colors hover:underline text-muted-foreground hover:text-foreground"
                    >
                      Criar conta
                    </button>
                  </div>
                )}
              </div>

              {/* Benefits Section */}
              <div 
                className="mt-4 xs:mt-6 w-full grid gap-2 xs:gap-3 animate-auth-field opacity-0"
                style={{ animationDelay: '0.5s' }}
              >
                {benefits.map((benefit, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 xs:gap-4 p-3 xs:p-4 rounded-xl bg-card/60 dark:bg-card/40 backdrop-blur-sm border border-border"
                  >
                    <div className="p-2 xs:p-2.5 rounded-lg shrink-0 bg-muted">
                      <benefit.icon className="h-4 w-4 xs:h-5 xs:w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs xs:text-sm text-foreground">
                        {benefit.title}
                      </h3>
                      <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Text */}
              <p 
                className="mt-4 xs:mt-6 text-[10px] xs:text-xs text-muted-foreground text-center animate-auth-field opacity-0"
                style={{ animationDelay: '0.55s' }}
              >
                Acesso seguro • Dados protegidos • Interface rápida
              </p>
            </div>
          </div>

          {/* RIGHT SIDE - Store */}
          <div className="flex flex-col items-center lg:items-start lg:pl-8 lg:border-l lg:border-border">
            <div className="w-full max-w-[460px] flex flex-col">
              
              {/* Store Card */}
              <div className="auth-card-minimal rounded-2xl p-5 xs:p-7 sm:p-9 w-full animate-auth-card">
                {/* Store Header */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Store className="h-4 w-4 xs:h-5 xs:w-5 text-primary" />
                  <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-foreground">
                    Loja Nova Era
                  </h2>
                </div>
                <p className="text-center text-xs xs:text-sm text-muted-foreground mb-4 xs:mb-6">
                  Explore produtos e serviços digitais que impulsionam sua operação.
                </p>

                {/* Store Categories */}
                <StoreCategoriesSection hideHeader />

                {/* Order Lookup Link */}
                <button
                  onClick={() => navigate('/meus-pedidos')}
                  className="mt-4 xs:mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-sm text-muted-foreground hover:text-foreground"
                >
                  <Package className="h-4 w-4" />
                  <span>Consultar meus pedidos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
