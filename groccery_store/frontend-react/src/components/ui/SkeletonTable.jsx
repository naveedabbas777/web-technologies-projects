import React from 'react';

export default function SkeletonTable({ rows = 6, columns = 5 }) {
  return (
    <div className="ui-table-skeleton" role="status" aria-live="polite" aria-label="Loading table data">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="ui-table-skeleton__row">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <span key={`cell-${rowIndex}-${colIndex}`} className="ui-skeleton ui-table-skeleton__cell" />
          ))}
        </div>
      ))}
    </div>
  );
}
