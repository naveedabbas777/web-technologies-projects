import React from 'react';

export function LoadingState({ title = 'Loading', description = 'Please wait while data is being prepared.' }) {
  return (
    <div className="ui-state-card ui-empty-state" role="status" aria-live="polite">
      <div className="spinner-border text-success mb-3" role="status" aria-hidden="true"></div>
      <div className="title">{title}</div>
      <p className="desc">{description}</p>
    </div>
  );
}

export function EmptyState({
  iconClass = 'fas fa-inbox',
  title = 'No records found',
  description = 'Try adjusting your filters and search criteria.'
}) {
  return (
    <div className="ui-state-card ui-empty-state" role="status" aria-live="polite">
      <i className={`${iconClass} icon`} aria-hidden="true"></i>
      <div className="title">{title}</div>
      <p className="desc">{description}</p>
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again in a moment.'
}) {
  return (
    <div className="ui-state-card ui-empty-state" role="alert">
      <i className="fas fa-triangle-exclamation icon" style={{ color: 'var(--color-danger-500)' }} aria-hidden="true"></i>
      <div className="title">{title}</div>
      <p className="desc">{description}</p>
    </div>
  );
}
