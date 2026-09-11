import React from 'react';
import logo from '../../assets/logo.webp';

const NavigationOverlay = ({ active }) => (
  <div
    className={`page-transition-overlay${active ? ' is-active' : ''}`}
    aria-hidden={!active}
  >
    <div className="page-transition-overlay__card" role="status" aria-live="polite">
      <img
        className="page-transition-overlay__logo"
        src={logo}
        alt=""
        width="54"
        height="54"
      />
      <div className="page-transition-overlay__track" aria-hidden="true">
        <span className="page-transition-overlay__progress" />
      </div>
      <span className="sr-only">Loading page</span>
    </div>
  </div>
);

export default NavigationOverlay;
