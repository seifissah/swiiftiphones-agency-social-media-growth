import { createContext, useContext, type ReactNode } from "react";
import type { Profile } from "./platform";

export type AppState = {
  userId: string;
  email: string;
  profile: Profile | null;
  isAdmin: boolean;
  refresh: () => void;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ value, children }: { value: AppState; children: ReactNode }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
