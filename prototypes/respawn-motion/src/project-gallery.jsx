import React, {useEffect, useRef, useState} from 'react';
import Arrow from './Arrow';

export default function ProjectGallery({project, cover, groupPhotos}) {
  const grid = useRef(null);
  const photos = project.media.filter(item => item.type === 'image');
  const reels = project.media.filter(item => item.type === 'video');
  const hasPhotoCarousel = groupPhotos && photos.length > 1;
  const hasVideoCarousel = reels.length > 1;

  useEffect(() => {
    const videos = [...grid.current.querySelectorAll('video')];
    if (!videos.length) return;

    const dialog = grid.current.closest('dialog');
    const ratios = new Map();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let selected;
    const preload = new IntersectionObserver(entries => {
      for (const {target, isIntersecting} of entries) {
        if (!isIntersecting) continue;
        target.preload = 'auto';
        const next = videos[videos.indexOf(target) + 1];
        if (next) next.preload = 'auto';
        preload.unobserve(target);
      }
    }, {root: dialog, rootMargin: '500px 0px'});

    function syncPlayback() {
      if (document.hidden) {
        videos.forEach(video => video.pause());
        selected = undefined;
        return;
      }
      const playing = videos.find(video => !video.paused);
      if (playing && (ratios.get(playing) || 0) >= .4) return;
      playing?.pause();
      const next = videos.find(video => (ratios.get(video) || 0) >= .55);
      if (next === selected) return;
      selected = next;
      if (!reduced.matches) next?.play().catch(() => {});
    }

    const viewport = new IntersectionObserver(entries => {
      for (const {target, intersectionRatio} of entries) ratios.set(target, intersectionRatio);
      syncPlayback();
    }, {root: dialog, threshold: [0, .4, .55]});

    videos.forEach(video => {
      preload.observe(video);
      viewport.observe(video);
    });
    document.addEventListener('visibilitychange', syncPlayback);
    return () => {
      preload.disconnect();
      viewport.disconnect();
      document.removeEventListener('visibilitychange', syncPlayback);
      videos.forEach(video => video.pause());
    };
  }, [project.id]);

  function keepOnlyOnePlaying(event) {
    const current = event.currentTarget;
    grid.current.querySelectorAll('video').forEach(video => {
      if (video !== current && !video.paused) video.pause();
    });
  }

  function renderReel(item, index) {
    return <GalleryVideo item={item} cover={cover} label={project.client + ' reel ' + (index + 1)} onPlay={keepOnlyOnePlaying}/>;
  }

  return <div className="media-grid" ref={grid}>
    {hasPhotoCarousel
      ? <MediaCarousel items={photos} title="Campaign photos" name={project.client} kind="photo" renderItem={(item, index) =>
        <img src={item.url} alt={project.client + ' campaign photo ' + (index + 1)} loading={index === 0 ? 'eager' : 'lazy'} decoding="async"/>}/>
      : photos.map((item, index) => <div className="vertical-media" key={item.url}>
        <img src={item.url} alt={project.client + ' portfolio photo ' + (index + 1)} loading="lazy"/>
      </div>)}
    {hasVideoCarousel
      ? <MediaCarousel items={reels} title="Campaign reels" name={project.client} kind="reel" renderItem={renderReel}/>
      : reels.length === 1 && renderReel(reels[0], 0)}
  </div>;
}

function GalleryVideo({item, cover, label, onPlay}) {
  return <div className="vertical-media gallery-video">
    <video src={item.galleryUrl || item.url} controls playsInline loop preload="none"
      poster={item.poster || cover} aria-label={label} onPlay={onPlay}/>
  </div>;
}

function MediaCarousel({items, title, name, kind, renderItem}) {
  const track = useRef(null);
  const [active, setActive] = useState(0);

  function updatePosition() {
    const element = track.current;
    if (!element?.clientWidth) return;
    const stride = element.children[1].offsetLeft - element.children[0].offsetLeft;
    setActive(Math.min(items.length - 1, Math.max(0, Math.round(element.scrollLeft / stride))));
  }

  useEffect(() => {
    const observer = new ResizeObserver(updatePosition);
    observer.observe(track.current);
    return () => observer.disconnect();
  }, [items.length]);

  function goTo(index) {
    const element = track.current;
    const offset = element.children[index].offsetLeft - element.children[0].offsetLeft;
    element.scrollTo({left: offset});
  }

  const itemName = kind === 'photo' ? 'Photo' : 'Reel';
  return <section className={`project-carousel project-carousel-${kind}`} aria-label={name + ' ' + title.toLowerCase()}>
    <div className="project-carousel-header">
      <h3>{title}</h3>
      <div className="project-carousel-buttons">
        <button type="button" aria-label={'Previous ' + kind} disabled={active === 0} onClick={() => goTo(active - 1)}>
          <Arrow direction="left"/>
        </button>
        <button type="button" aria-label={'Next ' + kind} disabled={active === items.length - 1} onClick={() => goTo(active + 1)}>
          <Arrow direction="right"/>
        </button>
      </div>
    </div>
    <div className="project-carousel-track" ref={track} onScroll={updatePosition} tabIndex={0} aria-label={'Scrollable ' + title.toLowerCase()}>
      {items.map((item, index) => <div className={`project-carousel-slide project-${kind}`} key={item.url}>
        {renderItem(item, index)}
      </div>)}
    </div>
    <div className="project-carousel-dots" role="group" aria-label={'Choose a ' + kind}>
      {items.map((item, index) => <button key={item.url} type="button"
        aria-label={`${itemName} ${index + 1} of ${items.length}`}
        aria-current={active === index ? 'true' : undefined}
        onClick={() => goTo(index)}/>)}
    </div>
  </section>;
}
