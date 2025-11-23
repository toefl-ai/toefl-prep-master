import { Button } from "@/components/ui/button";
import { Headphones, Home, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface HeaderProps {
  onHomeClick: () => void;
  showHomeButton?: boolean;
}

export const Header = ({ onHomeClick, showHomeButton = false }: HeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      toast.success("Logout realizado!");
      navigate("/auth");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onHomeClick}>
          <div className="p-2 bg-primary/10 rounded-full">
            <Headphones className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            TOEFL Listening Practice
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {showHomeButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={onHomeClick}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};