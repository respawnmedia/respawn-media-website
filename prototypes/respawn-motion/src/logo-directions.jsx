import React, {useEffect, useRef, useState} from 'react';
import Arrow from './Arrow';
import data from './content.json';
import {Logo} from './showcase';
import './logo-directions.css';

const clients = data.INIT_CLIENTS;

export default function LogoDirections() {
  const [gliding, setGliding] = useState(false);
  const rail = useRef(null);

  useEffect(() => {
    if (!gliding) return;
    const element = rail.current;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return;
    let animation;
    let previousTime;
    let position = element.scrollLeft || element.scrollWidth - element.clientWidth;
    function advance(time) {
      const max = element.scrollWidth - element.clientWidth;
      if (previousTime !== undefined) position -= Math.min(time - previousTime, 32) * .035;
      if (position <= 0 || position > max) position = max;
      element.scrollLeft = position;
      previousTime = time;
      animation = requestAnimationFrame(advance);
    }
    const stop = () => setGliding(false);
    preference.addEventListener('change', stop);
    animation = requestAnimationFrame(advance);
    return () => {
      cancelAnimationFrame(animation);
      preference.removeEventListener('change', stop);
    };
  }, [gliding]);

  return <main className="logo-review">
    <a className="back-work" href="/#clients"><Arrow direction="left"/> Back to the prototype</a>
    <h1>Client logo directions</h1>
    <p>Three treatments for “Brands that have trusted us,” using the current client marks.</p>
    <section className="logo-direction">
      <h2>A. Gallery Wall</h2>
      <p>A quiet, evenly spaced grid on the dark teal background. Visitors can scan every brand at once.</p>
      <div className="review-grid">
        {clients.map(client => <Logo key={client.id} client={client} className="review-grid-mark"/>)}
      </div>
    </section>
    <section className="logo-direction">
      <h2>B. The Moving Strip</h2>
      <p>Original logos on one continuous pale band. Swipe to browse, or turn on a slow left-to-right glide.</p>
      <button className="review-motion" type="button" onClick={() => setGliding(current => !current)}>
        {gliding ? 'Stop glide' : 'Preview glide'}
      </button>
      <div className="review-strip" ref={rail} onFocus={() => setGliding(false)} onPointerDown={() => setGliding(false)}>
        <div className="review-strip-row">
          {clients.map(client => <Logo key={client.id} client={client} className="review-strip-mark"/>)}
        </div>
      </div>
    </section>
    <section className="logo-direction">
      <h2>C. Client Index</h2>
      <p>A small mark, brand name, and industry on each line. It makes the range of Respawn’s work easy to read.</p>
      <div className="review-index">
        {clients.map(client => <Logo key={client.id} client={client} className="review-index-mark" showIndustry/>)}
      </div>
    </section>
  </main>;
}
