export default function ConflictBanner({ message, type, onGoToAssignments }) {
  if (!message) return null;

  return (
    <div className={`conflict-banner ${type}`}>
      <div>{message}</div>
      {type === "prerequisite" && onGoToAssignments ? (
        <button
          className="btn btn-ghost"
          type="button"
          onClick={onGoToAssignments}
          style={{ marginTop: 8 }}
        >
          Go to Assignments
        </button>
      ) : null}
    </div>
  );
}
