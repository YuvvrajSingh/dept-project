"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const dismissToast = useCallback(() => {
    setToast({ message: "", type: "success" });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, toast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}
