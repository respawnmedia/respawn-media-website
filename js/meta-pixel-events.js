(function () {
  var PIXEL_ID = '1599401624909023';
  var lastKey = '';
  var lastAt = 0;
  var sectionSeen = {};

  var SECTION_NAMES = {
    hero: 'Home',
    clients: 'Clients',
    work: 'Work',
    who: 'About',
    services: 'Services',
    contact: 'Contact',
    roles: 'Open Roles'
  };

  function isCareers() {
    return (location.pathname || '').indexOf('/careers') === 0;
  }

  function pageContent() {
    if (isCareers()) {
      return { content_name: 'Careers', content_category: 'careers', content_type: 'website' };
    }
    var hash = (location.hash || '').replace('#', '');
    return {
      content_name: SECTION_NAMES[hash] || 'Home',
      content_category: hash || 'home',
      content_type: 'website'
    };
  }

  function track(event, params) {
    var payload = params || {};
    var key = event + '|' + (payload.content_name || '') + '|' + (payload.content_category || '');
    var now = Date.now();
    if (key === lastKey && now - lastAt < 1000) return;
    lastKey = key;
    lastAt = now;
    try {
      if (typeof fbq === 'function') fbq('track', event, payload);
    } catch (e) {}
  }

  window.respawnPixel = { id: PIXEL_ID, track: track };
  window.trackMeta = track;

  track('ViewContent', pageContent());

  window.addEventListener('hashchange', function () {
    var content = pageContent();
    track('ViewContent', content);
  });

  function watchSections() {
    var ids = isCareers() ? ['roles'] : ['clients', 'work', 'who', 'services', 'contact'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || sectionSeen[id]) return;
      sectionSeen[id] = 'watching';
      if (typeof IntersectionObserver !== 'function') return;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || sectionSeen[id] === 'fired') return;
          sectionSeen[id] = 'fired';
          track('ViewContent', {
            content_name: SECTION_NAMES[id] || id,
            content_category: 'section',
            content_type: 'website'
          });
          io.disconnect();
        });
      }, { threshold: 0.4 });
      io.observe(el);
    });
  }

  function startWatch() {
    watchSections();
    setTimeout(watchSections, 1200);
    setTimeout(watchSections, 3500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWatch);
  } else {
    startWatch();
  }

  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a, button') : null;
    if (!el) return;

    var href = (el.getAttribute('href') || '').trim();
    var hrefLower = href.toLowerCase();
    var label = ((el.getAttribute('aria-label') || '') + ' ' + (el.textContent || '')).replace(/\s+/g, ' ').trim();
    var labelLower = label.toLowerCase();

    if (hrefLower.indexOf('mailto:') === 0 || /email us at/.test(labelLower)) {
      track('Lead', { content_name: 'Email', content_category: 'contact' });
      return;
    }
    if (hrefLower.indexOf('tel:') === 0) {
      track('Lead', { content_name: 'Phone', content_category: 'contact' });
      return;
    }

    var isLeadCta = /let'?s talk|start a project/.test(labelLower);
    if (isLeadCta) {
      track('Lead', { content_name: label || 'Contact CTA', content_category: 'contact' });
      return;
    }
  }, true);
})();
