"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";
import Spinner from "./spinner";

export default function EntityDrawer({
  open,
  onClose,
  title,
  onSubmit,
  initialValues,
  fields,
}) {
  const [formData, setFormData] = useState(initialValues || {});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFormData(initialValues || {});
    setError("");
  }, [initialValues, open]);

  if (!open) return null;

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err?.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-foreground/40 backdrop-blur-[2px] z-[200]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
            <motion.div
              className="w-full max-w-lg bg-background border-2 border-foreground/20 shadow-[8px_8px_0px_0px_rgba(26,26,26,0.6)]"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              {/* Header */}
              <div className="p-5 pb-4 border-b border-foreground/10 bg-muted/30 flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-base font-extrabold tracking-tight uppercase">
                    {title}
                  </h3>
                  <p className="text-[8px] font-mono tracking-[0.2em] uppercase text-muted-foreground/40 mt-1">
                    SYS.MODULE // DATA_ENTRY
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="w-8 h-8 flex items-center justify-center border border-foreground/15 hover:bg-foreground hover:text-background transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {fields.map((field) => (
                  <div key={field.key}>
                    <label className="text-[9px] font-mono tracking-[0.2em] uppercase font-bold block mb-1.5 text-muted-foreground/60">
                      {field.label}
                    </label>
                    {field.type === "select" ? (
                      <select
                        value={formData[field.key] ?? ""}
                        required={field.required}
                        disabled={submitting}
                        onChange={(event) =>
                          handleChange(
                            field.key,
                            field.numeric
                              ? Number(event.target.value)
                              : event.target.value
                          )
                        }
                        className="w-full border border-foreground/15 bg-background font-mono text-sm h-10 px-3 brutal-input transition-all"
                      >
                        <option value="">SELECT</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        maxLength={field.maxLength}
                        required={field.required}
                        disabled={submitting}
                        value={formData[field.key] ?? ""}
                        onChange={(event) =>
                          handleChange(
                            field.key,
                            field.type === "number"
                              ? Number(event.target.value)
                              : event.target.value
                          )
                        }
                        className="w-full border border-foreground/15 bg-background font-mono text-sm h-10 px-3 brutal-input transition-all"
                      />
                    )}
                  </div>
                ))}

                {error && (
                  <div className="p-3 border border-destructive/30 bg-destructive/5 text-xs font-mono text-destructive uppercase tracking-wider">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-foreground text-background hover:bg-accent hover:text-accent-foreground font-mono text-[10px] tracking-[0.15em] h-10 uppercase font-bold transition-all disabled:opacity-40 border-2 border-foreground hover:border-accent"
                >
                  {submitting ? <Spinner size="sm" /> : (
                    <>
                      <Save size={12} />
                      SAVE RECORD
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
