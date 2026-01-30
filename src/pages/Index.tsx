import LoginCard from "@/components/LoginCard";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Nova Era - Entrar na sua conta</title>
        <meta name="description" content="Faça login na sua conta Nova Era e aproveite a melhor experiência de jogos online." />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Helmet>
      
      <main className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-dark via-background to-navy-light opacity-50" />
        
        {/* Subtle glow effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10 w-full">
          <LoginCard />
        </div>
      </main>
    </>
  );
};

export default Index;
