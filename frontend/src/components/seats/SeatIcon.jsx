import React from 'react';

/**
 * A cinema chair seen from the front: backrest, cushion and two armrests.
 * Colour comes from the --seat-color CSS variable set by the parent.
 */
const SeatIcon = ({ type = 'REGULAR' }) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <rect className="part arm" x="1" y="12" width="5.5" height="15" rx="2.75" />
    <rect className="part arm" x="25.5" y="12" width="5.5" height="15" rx="2.75" />
    <rect className="part back" x="6" y="3" width="20" height="16" rx="6.5" />
    {type === 'PREMIUM' && <rect className="headrest" x="11" y="3" width="10" height="3.4" rx="1.7" />}
    <rect className="part cushion" x="5" y="17" width="22" height={type === 'RECLINER' ? 11 : 10} rx="4.5" />
    {type === 'RECLINER' && <rect className="part foot" x="8" y="28.8" width="16" height="2.8" rx="1.4" />}
  </svg>
);

export default React.memo(SeatIcon);
