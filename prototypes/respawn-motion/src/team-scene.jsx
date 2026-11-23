import React from 'react';

export default function TeamScene() {
  return <div className="team-scene">
    <div className="team-panorama" role="region" aria-label="Respawn team photograph">
      <div className="team-panorama-track">
        <img src="/assets/respawn-team-graded.jpg" alt="The Respawn Media team celebrating Diwali together"
          width="1448" height="1086" loading="lazy" decoding="async"/>
      </div>
    </div>
  </div>;
}
