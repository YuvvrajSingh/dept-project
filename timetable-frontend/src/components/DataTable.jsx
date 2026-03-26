import { useState } from "react";
import Spinner from "./Spinner";

export default function DataTable({
  columns,
  rows,
  onEdit,
  onDelete,
  loading,
}) {
  const [confirmingId, setConfirmingId] = useState(null);

  if (loading) {
    return <Spinner />;
  }

  if (!rows.length) {
    return <div className="empty-state">No data found.</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key}>{column.label}</th>
          ))}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {columns.map((column) => (
              <td key={column.key}>
                {column.render
                  ? column.render(row[column.key], row)
                  : row[column.key]}
              </td>
            ))}
            <td>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => onEdit(row)}
              >
                Edit
              </button>{" "}
              {confirmingId === row.id ? (
                <>
                  Sure?{" "}
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => setConfirmingId(null)}
                  >
                    No
                  </button>{" "}
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => {
                      setConfirmingId(null);
                      onDelete(row);
                    }}
                  >
                    Yes
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => setConfirmingId(row.id)}
                >
                  Delete
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
