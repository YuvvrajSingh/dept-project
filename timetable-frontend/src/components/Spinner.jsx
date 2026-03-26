export default function Spinner({ size = "md", overlay = false }) {
  const spinner = <div className={`spinner ${size}`} />;

  if (overlay) {
    return <div className="spinner-overlay">{spinner}</div>;
  }

  return <div className="spinner-wrap">{spinner}</div>;
}
