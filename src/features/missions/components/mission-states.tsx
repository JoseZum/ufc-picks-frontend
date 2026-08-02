'use client';

/**
 * The mission section's non-happy states, as primary behaviour rather than
 * exceptions: loading, error + retry, logged out, and nothing to show.
 *
 * One source for the Mission Lab and for the real Home, so a regression in the
 * Lab is a regression in production and vice versa.
 */

import React from 'react';

function SectionFrame({ children, ...rest }: React.ComponentProps<'section'>) {
  return (
    <section className="ml-section" {...rest}>
      <div className="ml-section__header">
        <h2 className="ml-section__title">MISSIONS</h2>
      </div>
      {children}
    </section>
  );
}

export function MissionsLoadingState() {
  return (
    <SectionFrame aria-busy="true" aria-label="Loading missions">
      <div className="ml-skeleton" style={{ height: '90px', marginBottom: '1rem' }} />
      <div className="ml-slots">
        <div className="ml-skeleton" />
        <div className="ml-skeleton" />
        <div className="ml-skeleton" />
      </div>
    </SectionFrame>
  );
}

export function MissionsErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <SectionFrame>
      <div className="ml-edge-box ml-edge-box--error" role="alert">
        <strong>MISSIONS COULD NOT LOAD</strong>
        <span className="ml-lab-bar__hint">{message}</span>
        <button type="button" className="ml-btn ml-btn--primary" onClick={onRetry}>
          Retry
        </button>
      </div>
    </SectionFrame>
  );
}

export function MissionsLoggedOutState() {
  return (
    <SectionFrame>
      <div className="ml-edge-box">
        <strong>SIGN IN TO ACCEPT MISSIONS</strong>
        <span className="ml-lab-bar__hint">
          Missions, XP and your Card Streak are tied to your account.
        </span>
        <a className="ml-btn ml-btn--primary" href="/auth">
          Sign in
        </a>
      </div>
    </SectionFrame>
  );
}

/** No card is open, so there is nothing to offer yet. */
export function MissionsUnavailableState({
  message = 'Missions open when the next card is confirmed.',
}: {
  message?: string;
}) {
  return (
    <SectionFrame>
      <div className="ml-edge-box">
        <strong>NO MISSIONS RIGHT NOW</strong>
        <span className="ml-lab-bar__hint">{message}</span>
      </div>
    </SectionFrame>
  );
}
