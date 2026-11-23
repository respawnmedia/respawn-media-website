import {gsap} from 'gsap';
import Arrow from './Arrow';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useGSAP} from '@gsap/react';
import SplitText from './bits/SplitText';
import TiltedCard from './bits/TiltedCard';
import SpotlightCard from './bits/SpotlightCard';
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './style.css';
import data from './content.json';
import Careers from './careers';
import ProjectGallery from './project-gallery';
import TeamScene from './team-scene';
import {Phone, ClientWall, CategoryRail, Contact, categories} from './showcase';
gsap.registerPlugin(ScrollTrigger,useGSAP);
const covers={Vedhara:'vedhara/first.jpg','Six By Eleven':'six-by-eleven/cover.jpg',Avias:'avias.jpg','Sree Mishti Bhog':'mishti.jpg',Tissera:'tissera.jpg','Tharun Kiron':'intoxicated.jpg'};
const path = window.location.pathname.replace(/\/$/, '');
const isLogoReview = path === '/logo-directions';
const isCareers = path === '/careers';
const isHome = !isCareers && !path.startsWith('/portfolio/');
const isPortfolio = path.startsWith('/portfolio/');
const category = categories.find(item => path === '/portfolio/' + item.slug);

function App(){
const preference=useRef(matchMedia('(prefers-reduced-motion: reduce)'));
const [reduced,setReduced]=useState(preference.current.matches);
useEffect(() => {
  const target = document.getElementById(window.location.hash.slice(1));
  if (!target) return;
  const frame = requestAnimationFrame(() => target.scrollIntoView());
  return () => cancelAnimationFrame(frame);
}, []);
useEffect(()=>{const query=preference.current;const update=e=>setReduced(e.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[]);
useGSAP(()=>{
 if(reduced||!isHome)return;
 gsap.from('.phone-showcase',{y:34,opacity:0,duration:.85,ease:'power2.out'});
 gsap.fromTo('.foundation-backdrop img',
   {scaleX: 1, scaleY: 1},
   {scaleX: 1.65, scaleY: 1.35, ease: 'none',
     scrollTrigger: {trigger: '.foundation', start: 'top bottom', end: 'bottom 20%', scrub: .6}});

 const mobile = gsap.matchMedia();
 mobile.add('(max-width: 760px)', () => {
   for (const card of document.querySelectorAll('.service-grid > *')) {
     gsap.timeline({scrollTrigger: {trigger: card, start: 'top 94%', end: 'bottom 16%', scrub: true}})
       .fromTo(card, {'--service-glow': 0}, {'--service-glow': 1, duration: .45, ease: 'none'})
       .to(card, {'--service-glow': 0, duration: .55, ease: 'none'});
   }
 });

 if (matchMedia('(min-width: 961px)').matches) gsap.fromTo('.phone-showcase',{yPercent:0},{yPercent:-8,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
 return () => mobile.revert();
},{dependencies:[reduced],revertOnUpdate:true});
const lenis=useRef(),dialog=useRef(),opener=useRef();const [selected,setSelected]=useState(null);useEffect(()=>{if(reduced)return;const instance=new Lenis({autoRaf:false,anchors:{offset:-120},smoothWheel:true,syncTouch:false,virtualScroll:({deltaX,deltaY,event})=>!(event.target.closest?.('.logo-rail,.category-rail,.team-panorama')&&Math.abs(deltaX)>Math.abs(deltaY)),prevent:node=>node.closest?.('dialog[data-lenis-prevent]')});lenis.current=instance;const tick=time=>instance.raf(time*1000);const unsubscribe=instance.on('scroll',ScrollTrigger.update);gsap.ticker.add(tick);return()=>{gsap.ticker.remove(tick);unsubscribe();instance.destroy();lenis.current=null}},[reduced]);useEffect(()=>{if(!selected)return;lenis.current?.stop();dialog.current.showModal();return()=>{dialog.current?.close();lenis.current?.start()}},[selected]);const close=()=>{dialog.current?.close();setSelected(null);opener.current?.focus()};return <><nav><a href="/" aria-label="Respawn home"><img className="brand-logo" src="/assets/logo-white.png" alt="Respawn Media"/></a><div><a className="nav-desktop" href="/#foundation">About Us</a><a className="nav-desktop" href="/#clients">Clients</a><a className="nav-work" href="/#work">Work</a><a className="nav-careers" href="/careers" aria-current={isCareers ? "page" : undefined}>Careers</a><a href="#contact">Let’s talk <Arrow/></a></div></nav><main>{isHome && <><header className="hero" id="top"><div className="eyebrow">Respawn Media / Creative studio / Chennai, India</div><h1 aria-label="Hi, we’re Respawn Media.">{!reduced?<span aria-hidden="true">{['Hi, we’re','Respawn','Media.'].map((line,i)=><span className={i===2?'accent-line':'title-line'} key={line}><SplitText text={line} tag="span" textAlign="left" splitType="words" delay={65} distance={18} duration={.55}/></span>)}</span>:<>Hi, we’re<br/>Respawn<br/><em>Media.</em></>}</h1><Phone autoplay={!reduced} covers={covers}/><div className="hero-bottom"><p>Chennai's Only Creative Social Media - First Agency.</p><a className="cta" href="/#work">Explore our work <Arrow direction="down"/></a></div></header><section id="clients"><div className="eyebrow">01 / Our clients</div><h2>Brands that have<br/><span className="client-heading-accent">trusted us.</span></h2><ClientWall reduced={reduced}/></section><section className="foundation" id="foundation"><div className="foundation-backdrop" aria-hidden="true"><img src="/assets/respawn-team-graded.jpg" alt=""/></div><div className="foundation-heading"><div className="eyebrow">02 / About us</div><h2>Who are we?</h2></div><TeamScene/><div className="foundation-copy"><p>Respawn Media is Chennai's only creative, social media-first agency. We exist at the intersection of content production, strategic thinking, and cultural fluency — working with restaurants, luxury fashion brands, and lifestyle businesses to build their presence on the internet.</p><p>We're a team of 10+ people who have spent years studying what makes content actually work — not as a job, but as a genuine obsession. Every reel, every campaign, every creative decision comes from that obsession. That's not something you can fake. And it's the reason our clients don't just hire us once. They stay.</p><h3>We help businesses become brands on the internet — with a perfect mix of content + strategy + ads.</h3></div></section><section className="portfolio" id="work"><div className="eyebrow">03 / Selected work</div><h2>Brands we’ve<br/>brought to life.</h2><CategoryRail reduced={reduced}/></section> </>}
{isCareers && <Careers/>}
{isPortfolio && <section className="portfolio category-page" aria-labelledby="category-title">
<a className="back-work" href="/#work"><Arrow direction="left"/> Portfolio</a>
<h1 id="category-title">{category?.name || 'Category unavailable'}</h1>
<div className="grid">{data.INIT_WORK.filter(p=>category?.clients.includes(p.client)).map(p=><button className="project" key={p.id} onClick={e=>{opener.current=e.currentTarget;setSelected(p)}}><div className={p.coverLayout ? "image image-" + p.coverLayout : "image"}>{!covers[p.client] ? <div className="project-placeholder" aria-hidden="true">{p.headline}</div> : !reduced && p.coverLayout !== "wide"?<TiltedCard imageSrc={'/assets/'+covers[p.client]} altText={p.client+' / '+p.headline} containerHeight="100%" imageWidth="100%" imageHeight="100%" rotateAmplitude={6} showTooltip={false} flipOnClick={false} radius="var(--image-radius)"/>:<img src={'/assets/'+covers[p.client]} alt={p.client+' / '+p.headline} loading="lazy"/>}<span className="project-arrow" aria-hidden="true"><Arrow/></span></div><h3>{p.client} / {p.headline}</h3><p>{p.tag}</p></button>)}</div></section>}
{isHome && <><section id="services"><div className="eyebrow">04 / What we do</div><h2>The services,<br/>we serve.</h2><div className="service-grid">{data.SERVICES.map(s=>{const Card=!reduced?SpotlightCard:"article";return <Card key={s.num}><span className="eyebrow">{s.num}</span><h3>{s.title}</h3><p>{s.desc}</p></Card>})}</div></section><section className="founders"><div className="eyebrow">05 / Meet the founders</div><h2>The brains behind the work.</h2><div className="founder-grid">{data.INIT_FOUNDERS.map(f=><article key={f.id}><img src={f.img} alt={f.name} loading="lazy"/><span className="eyebrow">{f.role}</span><h3>{f.name}</h3><p>{f.bio}</p></article>)}</div></section></>}<Contact/></main><footer>Respawn Media / Chennai, India</footer><dialog ref={dialog} data-lenis-prevent aria-labelledby="project-title" onCancel={e=>{e.preventDefault();close()}} onClick={e=>{if(e.target===dialog.current)close()}}><button className="close" onClick={close}>Close ×</button>{selected&&<div className="detail"><h2 id="project-title">{selected.client}</h2>{selected.description && <p>{selected.description}</p>}<ProjectGallery key={selected.id} project={selected} cover={covers[selected.client] ? "/assets/"+covers[selected.client] : undefined} groupPhotos={category?.slug === 'fashion'}/></div>}</dialog></>}
if (isCareers) document.title = 'Careers & Freelance Opportunities | Respawn Media Chennai';
const root = createRoot(document.getElementById('root'));
if (isLogoReview) {
  document.title = 'Client logo directions | Respawn prototype';
  import('./logo-directions').then(({default: LogoDirections}) => root.render(<LogoDirections/>));
} else {
  root.render(<React.StrictMode><App/></React.StrictMode>);
}
