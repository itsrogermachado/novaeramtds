import { useState } from "react";
import { LoginInput } from "@/components/ui/login-input";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-nova-era.png";

const LoginCard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login attempt:", { email });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border border-border rounded-lg p-8 shadow-2xl backdrop-blur-sm animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src={logo} 
            alt="Nova Era" 
            className="h-32 w-auto object-contain drop-shadow-lg"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-display font-bold text-center text-gold-light mb-8">
          Entrar na sua conta
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <LoginInput
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <LoginInput
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold mt-2"
            variant="default"
          >
            Entrar
          </Button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center space-y-3">
          <a 
            href="#" 
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Esqueci minha senha
          </a>
          <a 
            href="#" 
            className="block text-sm text-gold hover:text-gold-light transition-colors"
          >
            Não tem uma conta? <span className="font-semibold">Cadastre-se</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginCard;
