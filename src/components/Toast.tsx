"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastCtx = (msg: string) => void;
const Ctx = createContext<ToastCtx>(() => {});

export function useToast() {
  return useContext(Ctx);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2200);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      <div
        className={`fixed left-1/2 bottom-24 -translate-x-1/2 px-5 py-3 rounded-full bg-surface2 border border-border text-sm font-semibold z-50 transition-all whitespace-nowrap ${
          msg ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        {msg}
      </div>
    </Ctx.Provider>
  );
}
