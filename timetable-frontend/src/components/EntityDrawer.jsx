import { useEffect, useState } from "react";
import Spinner from "./Spinner";

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
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="page-header">
          <h3>{title}</h3>
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={submitting}>
            Close
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div className="form-group" key={field.key}>
              <label>{field.label}</label>
              {field.type === "select" ? (
                <select
                  value={formData[field.key] ?? ""}
                  required={field.required}
                  disabled={submitting}
                  onChange={(event) => handleChange(field.key, field.numeric ? Number(event.target.value) : event.target.value)}
                >
                  <option value="">Select</option>
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
                    handleChange(field.key, field.type === "number" ? Number(event.target.value) : event.target.value)
                  }
                />
              )}
            </div>
          ))}
          {error ? <div className="error-line">{error}</div> : null}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : "Save"}
          </button>
        </form>
      </div>
    </>
  );
}
