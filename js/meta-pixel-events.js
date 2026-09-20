(function () {
  var PIXEL_ID = '1599401624909023';
  var fired = {};

  function path() {
    return (location.pathname || '').replace(/\/+$/, '') || '/';
  }

  function isThanks() {
    return path() === '/careers/thanks';
  }

  function pageContent() {
    var p = path();
    if (p.indexOf('/careers/apply/') === 0) {
      var slug = decodeURIComponent(p.slice('/careers/apply/'.length) || '');
      return { content_name: slug || 'Career application', content_category: 'careers_apply', content_type: 'website' };
    }
    if (p === '/careers' || p.indexOf('/careers') === 0) {
      return { content_name: 'Careers', content_category: 'careers', content_type: 'website' };
    }
    return { content_name: 'Home', content_category: 'home', content_type: 'website' };
  }

  function send(event, params) {
    if (fired[event]) return;
    fired[event] = true;
    try {
      if (typeof fbq === 'function') fbq('track', event, params || {});
    } catch (e) {}
  }

  function track(event, params) {
    if (event === 'Lead') {
      if (!isThanks()) return;
      send('Lead', params || { content_name: 'Career application', content_category: 'careers' });
      return;
    }
    if (event === 'ViewContent') {
      if (isThanks()) return;
      send('ViewContent', params || pageContent());
      return;
    }
    if (event === 'PageView') {
      if (isThanks()) return;
      send('PageView', params);
    }
  }

  window.respawnPixel = { id: PIXEL_ID, track: track };
  window.trackMeta = track;

  if (!isThanks()) {
    fired.PageView = true;
    send('ViewContent', pageContent());
  }
})();
