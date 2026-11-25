import React, {useEffect, useRef, useState} from 'react';
import data from './content.json';
import Arrow from './Arrow';

export const categories = [
  {slug:'fashion', name:'Fashion', cover:'tissera.jpg', clients:['Tissera','Tharun Kiron','Six By Eleven','Vedhara']},
  {slug:'restaurants-and-food', name:'Restaurants & Food', cover:'mishti.jpg', clients:['Sree Mishti Bhog']},
  {slug:'other', name:'Other', cover:'avias.jpg', clients:['Avias']},
];

const feed = ['Tissera', 'Six By Eleven', 'Vedhara', 'Avias', 'Tharun Kiron'].flatMap(client => {
  const project = data.INIT_WORK.find(project => project.client === client);
  const reel = project?.media.find(media => media.type === 'video');
  return reel ? [{client, logo: data.INIT_CLIENTS.find(item => item.name === client)?.logo, reel}] : [];
});

const heroMedia = {
  Tissera: {url: '/assets/tissera/hero-reel.mp4', poster: '/assets/tissera/hero-frame.jpg'},
};
const contactOptions = [
  {name:'WhatsApp', url:'https://wa.me/917358585884'},
  {name:'Call', url:'tel:+917358585884'},
  {name:'Email', url:'mailto:respawnmediain@gmail.com'},
];

export function Phone({autoplay, covers}) {
  const [clientIndex, setClientIndex] = useState(0);
  const [outgoing, setOutgoing] = useState(null);
  const [muted, setMuted] = useState(true);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const frame = useRef(null);
  const activeVideo = useRef(null);
  const lineup = feed;
  const project = lineup[clientIndex % lineup.length];
  const running = autoplay && visible && pageVisible;

  function nextClient() {
    if (outgoing) return;
    if (autoplay) setOutgoing(project);
    setClientIndex(current => (current + 1) % lineup.length);
  }

  useEffect(() => {
    if (!outgoing) return;
    const finish = setTimeout(() => setOutgoing(null), 420);
    return () => clearTimeout(finish);
  }, [outgoing]);

  function toggleSound() {
    const video = activeVideo.current;
    video.muted = !video.muted;
    setMuted(video.muted);
    video.play().catch(() => {});
  }

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.intersectionRatio >= .35), {threshold: .35});
    observer.observe(frame.current);
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  useEffect(() => {
    const video = activeVideo.current;
    let current = true;
    if (running) {
      video.play().catch(error => {
        if (!current || error.name !== 'NotAllowedError' || video.muted) return;
        video.muted = true;
        setMuted(true);
        video.play().catch(() => {});
      });
    }
    return () => {
      current = false;
      video.pause();
    };
  }, [running, project.client]);

  return <div className="phone-showcase" ref={frame}>
    <div className="iphone">
      <span className="phone-edge phone-edge-volume" aria-hidden="true"/>
      <span className="phone-edge phone-edge-power" aria-hidden="true"/>
      <div className="phone-screen">
        {(outgoing && outgoing !== project ? [outgoing, project] : [project]).map(item => {
          const active = item === project;
          const reel = heroMedia[item.client] || item.reel;
          const poster = reel.poster || '/assets/' + covers[item.client];
          return <div className={`phone-reel-slide ${outgoing ? active ? 'is-entering' : 'is-exiting' : ''}`}
            key={item.client} aria-hidden={active ? undefined : true}>
            <div className="phone-reel-frame">
              <video className="phone-reel" ref={active ? activeVideo : undefined} muted={active ? muted : true}
                playsInline preload={active ? "auto" : "none"} poster={poster} src={reel.url} aria-label={item.client + ' reel'}
                onEnded={active && running ? nextClient : undefined}/>
            </div>
            <div className="phone-credit" aria-hidden="true">
              {item.logo && <img className="brand-logo" src={item.logo} alt="" onError={event => {event.currentTarget.hidden = true;}}/>}
              <span>{item.client}</span>
            </div>
          </div>;
        })}
        <span className="phone-island" aria-hidden="true"/>
        <span className="phone-home-indicator" aria-hidden="true"/>
        <button className="phone-next" type="button" aria-label={project.client + '. Show the next client'} onClick={nextClient}/>
        <button className="reel-sound phone-sound" type="button" aria-label={muted ? 'Unmute reel' : 'Mute reel'} onClick={toggleSound}
          data-muted={muted}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H3v6h3l5 4V5Z"/>
            {muted ? <path d="m16 9 6 6m0-6-6 6"/> : <><path d="M15 8a6 6 0 0 1 0 8"/><path d="M18 5a10 10 0 0 1 0 14"/></>}
          </svg>
        </button>
      </div>
    </div>
    <p className="phone-hint" aria-hidden="true">Tap the phone for next</p>
  </div>;
}

const brandAccents = {
  'Atha Fragrances': '#eab1b0',
  Avias: '#f55850',
  'Bajoria Hospitality': '#709bbd',
  'Chennai Grocers': '#c4a66e',
  'Chit Chaat Chai': '#ed8a54',
  Coconut: '#fd6351',
  'Ctrl VR': '#b6957c',
  'Kati Roll Shop': '#f05338',
  Mantras: '#70ae91',
  Pakwan: '#d78b6e',
  'Saffron by Anu': '#e4b461',
  Spica: '#dc9a79',
  'Sree Mishti Bhog': '#dc9b85',
  'Suswani Bullion': '#d2ba8d',
  'Tea Villa Cafe': '#b38d7b',
  'Tharun Kiron': '#a2aab6',
  Tissera: '#c88098',
  'Six By Eleven': '#f5b91f',
  Vedhara: '#c19a61',
};

const clientRow = ['Tissera', 'Avias', 'Bajoria Hospitality', 'Sree Mishti Bhog', 'Pakwan', 'Coconut', 'Saffron by Anu', 'Ctrl VR', 'Tea Villa Cafe'];
const clientRows = [
  clientRow.map(name => data.INIT_CLIENTS.find(client => client.name === name)).filter(Boolean),
  data.INIT_CLIENTS.filter(client => !clientRow.includes(client.name)),
];

export function ClientWall({reduced}) {
  return <div className="client-wall">
    {clientRows.map((clients, index) => <AutoRail key={clients[0]?.id} kind="logo" speed={index === 0 ? 22 : -17} reduced={reduced}>
      {duplicate => clients.map(client => <Logo key={client.id} client={client} showIndustry duplicate={duplicate} accent={brandAccents[client.name]}/>)}
    </AutoRail>)}
  </div>;
}

function AutoRail({kind, speed, reduced, children}) {
  const rail = useRef(null);
  const row = useRef(null);
  const gesture = useRef({pointer: null, manualUntil: 0, autoOffset: 0});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(rail.current);
    return () => observer.disconnect();
  }, []);

  function releasePointer(event) {
    if (gesture.current.pointer === event.pointerId) gesture.current.pointer = null;
  }

  useEffect(() => {
    window.addEventListener('pointerup', releasePointer);
    window.addEventListener('pointercancel', releasePointer);
    return () => {
      window.removeEventListener('pointerup', releasePointer);
      window.removeEventListener('pointercancel', releasePointer);
    };
  }, []);

  useEffect(() => {
    if (reduced || !visible) return;
    const element = rail.current;
    const interaction = gesture.current;
    let previous;
    let position = element.scrollLeft;
    let frame;

    function advance(time) {
      const width = row.current.getBoundingClientRect().width;
      const elapsed = previous === undefined ? 0 : Math.min(time - previous, 32);
      const interacting = interaction.pointer !== null || time < interaction.manualUntil || element.querySelector(':focus-visible');
      if (interacting || !width) {
        position = element.scrollLeft;
      } else {
        const offset = (position + speed * elapsed / 1000) % width;
        position = width + (offset + width) % width;
        element.scrollLeft = position;
        interaction.autoOffset = element.scrollLeft;
      }
      previous = time;
      frame = requestAnimationFrame(advance);
    }
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [reduced, visible, speed]);

  return <div className={kind + "-rail"} ref={rail}
    onPointerDown={event => {gesture.current.pointer = event.pointerId;}}
    onScroll={event => {
      const interaction = gesture.current;
      if (Math.abs(event.currentTarget.scrollLeft - interaction.autoOffset) > 1) {
        interaction.manualUntil = performance.now() + 1100;
      }
    }}>
    {(reduced ? [0] : [0, 1, 2]).map(copy => <div className={kind + "-row"} key={copy}
      ref={copy === 0 ? row : undefined} aria-hidden={copy > 0 || undefined}>
      {children(copy > 0)}
    </div>)}
  </div>;
}

export function Logo({client, duplicate, className = 'logo-tile', showIndustry = false, accent}) {
  const logoClass = client.logoLayout === "wordmark" ? className + " logo-wordmark" : className;
  const linked = Boolean(client.url && client.url !== '#');
  const content = <>
    <img className="brand-logo" src={client.logo} alt="" draggable={false} loading="lazy" decoding="async" onError={event => {event.currentTarget.hidden = true;}}/>
    <span className="logo-copy">{client.name}{showIndustry && <small>{client.industry}</small>}</span>
    {linked && accent && <Arrow className="logo-arrow"/>}
  </>;
  const style = accent ? {'--brand-accent': accent} : undefined;
  return linked
    ? <a className={logoClass} style={style} href={client.url} target="_blank" rel="noreferrer" draggable={false} tabIndex={duplicate ? -1 : undefined}>{content}</a>
    : <div className={logoClass} style={style}>{content}</div>;
}

export function CategoryRail({reduced}) {
  return <AutoRail kind="category" speed={27} reduced={reduced}>
    {duplicate => categories.map(category => <a className="category-cover" key={category.slug} href={'/portfolio/'+category.slug} tabIndex={duplicate ? -1 : undefined}>
      <img src={'/assets/'+category.cover} alt=""/>
      <div><strong>{category.name}</strong><Arrow/></div>
    </a>)}
  </AutoRail>;
}

export function Contact() {
  const dialog = useRef(null);
  function open() {
    if (!dialog.current.open) dialog.current.showModal();
  }

  useEffect(() => {
    function onKey(event) {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
      if (event.target.closest?.('input, textarea, select, [contenteditable]') || document.querySelector('dialog[open]')) return;
      if (event.key.toLowerCase() === 'f') open();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return <section className="contact" id="contact">
    <h2>Let’s build<br/>something.</h2>
    <div className="contact-layout">
      <address>
        <a href="https://maps.app.goo.gl/U6VKjffpJgbL6UcW9?g_st=ic">G2, Ground Floor, Zainab Manzil, Office No. 21, Club Road, Chetpet, Chennai, Tamil Nadu 600031 <Arrow/></a>
        <a href="tel:+917358585884">+91 73585 85884</a>
        <a href="tel:+916383533033">+91 63835 33033</a>
        <a href="mailto:respawnmediain@gmail.com">respawnmediain@gmail.com</a>
      </address>
      <button className="respawn-key" onClick={open}><img className="brand-logo" src="/assets/logo-black.png" alt="Respawn"/><span>Press <kbd>F</kbd> to respawn</span></button>
    </div>
    <p className="contact-joke"><em><span lang="hi-Latn">Abhi tak padh rahe ho?</span> Thanks yaar.</em><br/><em>Diet Coke for you when we meet.</em></p>
    <dialog className="contact-dialog" ref={dialog} data-lenis-prevent aria-labelledby="contact-title">
      <form method="dialog"><button className="close" aria-label="Close contact options">Close ×</button></form>
      <h3 id="contact-title">You just got respawned, Let’s Talk!</h3>
      <div className="contact-options">
        {contactOptions.map(option => <a key={option.name} href={option.url} target={option.name==='WhatsApp'?'_blank':undefined} rel="noreferrer">{option.name} <Arrow/></a>)}
      </div>
    </dialog>
  </section>;
}
