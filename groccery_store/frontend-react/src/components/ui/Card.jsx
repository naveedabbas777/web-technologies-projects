import React from 'react';

export default function Card({ title, iconClass, actions = null, className = '', children }) {
  return (
    <section className={`ui-card ${className}`.trim()}>
      {(title || actions) && (
        <header className="ui-card__header">
          <h4 className="ui-card__title">
            {iconClass && <i className={iconClass} aria-hidden="true"></i>}
            <span>{title}</span>
          </h4>
          {actions && <div className="ui-card__actions">{actions}</div>}
        </header>
      )}
      <div className="ui-card__body">{children}</div>
    </section>
  );
}
