import React from 'react';

export default function Arrow({direction = 'up-right', className = ''}) {
  return <span aria-hidden="true" className={`ui-arrow ui-arrow-${direction} ${className}`}/>;
}
