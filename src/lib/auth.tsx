import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { checkAccess, lockSite, unlockSite } from "@/lib/gate.functions";

type AuthContextValue = {
  autenticado: boolean;
  login: (usuario: string, senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
  pronto: boolean;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [autenticado, setAutenticado] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    checkAccess()
      .then(({ unlocked }) => setAutenticado(unlocked))
      .catch((error) => {
        console.error("[auth] não foi possível verificar a sessão", error);
        setAutenticado(false);
      })
      .finally(() => setPronto(true));
  }, []);

  const login = useCallback(async (usuario: string, senha: string) => {
    try {
      const result = await unlockSite({ data: { usuario, senha } });
      setAutenticado(result.ok);
      return result.ok;
    } catch (error) {
      console.error("[auth] falha ao entrar", error);
      setAutenticado(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await lockSite();
    } finally {
      setAutenticado(false);
    }
  }, []);

  return <AuthContext.Provider value={{ autenticado, login, logout, pronto }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
