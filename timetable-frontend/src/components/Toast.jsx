export default function Toast({ message, type, onDismiss }) {
  if (!message) return null;

  return (
    <button
      type="button"
      className={`toast ${type === "error" ? "toast-error" : "toast-success"}`}
      onClick={onDismiss}
    >
      {message}
    </button>
  );
}
