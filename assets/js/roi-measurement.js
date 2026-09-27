window.ROI_MEASUREMENT_CONFIG = {"site": "claudflow", "id": "G-SXQPGSJPYB", "product": "zovo_lifetime"};
/* Portfolio KPI measurement: opt-in, no form values or calculator inputs. */
(function () {
  'use strict';
  var config = window.ROI_MEASUREMENT_CONFIG;
  if (!config || window.__roiMeasurementLoaded) return;
  window.__roiMeasurementLoaded = true;
  var blocked = navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true || /(?:^|[?&])roi_qa=1(?:&|$)/.test(location.search) || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var key = 'roi-ga4-consent-v1';
  var consent = null;
  try { consent = localStorage.getItem(key); } catch (e) {}
  var active = false;
  var allowed = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  function safePage() {
    var page = location.origin + location.pathname;
    var query = new URLSearchParams(location.search);
    var safe = new URLSearchParams();
    allowed.forEach(function (k) {
      var v = query.get(k);
      if (v && /^[a-zA-Z0-9_ .-]{1,80}$/.test(v)) safe.set(k, v);
    });
    return page + (safe.toString() ? '?' + safe.toString() : '');
  }
  var page = safePage();
  var referrer = '';
  try {
    var r = new URL(document.referrer);
    if (r.protocol === 'https:' || r.protocol === 'http:') referrer = r.origin + r.pathname;
  } catch (e) {}
  var base = {site_id: config.site, event_schema_version: '1', qa_marker: 'false'};
  function send(name, extra) {
    if (!active || typeof window.gtag !== 'function') return;
    var params = Object.assign({}, base, extra || {});
    window.gtag('event', name, params);
  }
  function label(node) {
    var a = node.closest('a');
    if (!a) return null;
    var url;
    try { url = new URL(a.href); } catch (e) { return null; }
    if (config.site === 'heytensor' && url.hostname === 'buy.heytensor.com') {
      return {product_id: 'tensor_preflight', placement: a.closest('.product-cta') ? 'product_cta' : 'navigation', kind: url.pathname.indexOf('sample-report') >= 0 ? 'offer_open' : 'offer_click'};
    }
    if (config.site === 'earlythunder' && url.hostname === 'workbench.earlythunder.com') {
      return {product_id: 'token_evidence_workbench', placement: a.closest('.workbench-offer') ? (a.closest('.workbench-offer').className.match(/workbench-offer--([a-z]+)/) || [,'offer'])[1] : 'navigation', kind: url.pathname.indexOf('preview') >= 0 ? 'offer_open' : 'offer_click'};
    }
    if (config.site === 'claudflow') {
      if (url.hostname === 'zovo.one' && /\/(pricing|lifetime)/.test(url.pathname)) return {product_id: 'zovo_lifetime', placement: a.closest('footer') ? 'footer' : 'inline', kind: 'offer_click'};
      if (url.hostname === 'handsofflinks.com') return {product_id: 'hands_off_links', placement: 'inline', kind: 'offer_click'};
    }
    return null;
  }
  function wire() {
    var selectors = config.site === 'heytensor' ? '.product-cta' : config.site === 'earlythunder' ? '.workbench-offer' : config.site === 'deepvalueradar' ? '.studio-purchase' : 'a.footer-cta, a.nav-pro';
    var registered = new WeakSet();
    var observed = new WeakSet();
    var pending = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        if (observed.has(el)) return;
        if (entry.intersectionRatio < 0.25) {
          if (pending.has(el)) clearTimeout(pending.get(el));
          pending.delete(el);
          return;
        }
        if (pending.has(el)) return;
        pending.set(el, setTimeout(function () {
          pending.delete(el);
          if (observed.has(el) || !document.contains(el)) return;
          observed.add(el);
          io.unobserve(el);
          send('offer_view', {product_id: config.product, placement: el.classList.contains('workbench-offer--homepage') ? 'homepage' : el.classList.contains('workbench-offer--footer') ? 'footer' : el.classList.contains('product-cta-home') ? 'homepage' : el.classList.contains('studio-purchase') ? 'studio' : 'inline'});
        }, 1000));
      });
    }, {threshold: [0, .25, .5, 1]});
    function scan() { document.querySelectorAll(selectors).forEach(function (el) { if (!registered.has(el)) { registered.add(el); io.observe(el); } }); }
    scan();
    new MutationObserver(scan).observe(document.body, {childList: true, subtree: true});
    document.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!(t instanceof Element)) return;
      var item = label(t);
      if (item) send(item.kind, {product_id: item.product_id, placement: item.placement});
      if (config.site === 'deepvalueradar' && t.closest('[data-studio-interest]')) send('offer_click', {product_id: 'equity_scenario_studio', placement: 'studio_interest'});
    }, {capture: true});
    document.addEventListener('toggle', function (ev) {
      var t = ev.target;
      if (t instanceof HTMLDetailsElement && t.open && t.closest('.product-cta, .workbench-offer')) send('offer_open', {product_id: config.product, placement: 'fit_details'});
    }, {capture: true});
  }
  function start() {
    if (blocked || active) return;
    active = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('consent', 'default', {analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
    window.gtag('config', config.id, {send_page_view: false, page_location: page, page_referrer: referrer, allow_google_signals: false, allow_ad_personalization_signals: false, anonymize_ip: true, site_id: config.site, event_schema_version: '1'});
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.id);
    document.head.appendChild(script);
    send('page_view', {page_location: page, page_referrer: referrer});
    wire();
    if (config.site === 'earlythunder') {
      var previous = page;
      function routeView() {
        setTimeout(function () {
          var current = safePage();
          if (current === previous) return;
          var old = previous;
          previous = current;
          page = current;
          send('page_view', {page_location: current, page_referrer: old});
        }, 150);
      }
      ['pushState', 'replaceState'].forEach(function (method) {
        var old = history[method];
        history[method] = function () { var result = old.apply(this, arguments); routeView(); return result; };
      });
      addEventListener('popstate', routeView);
    }
  }
  function banner() {
    if (blocked || consent === 'yes' || consent === 'no') return;
    var box = document.createElement('div');
    box.id = 'roi-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Analytics choice');
    box.style.cssText = 'position:fixed;z-index:2147483647;bottom:12px;left:12px;right:12px;max-width:480px;margin:auto;background:#17202b;color:#fff;border:1px solid #62748a;border-radius:12px;padding:16px;font:14px/1.45 system-ui,sans-serif;box-shadow:0 10px 35px #0007;box-sizing:border-box';
    box.innerHTML = '<p style="margin:0 0 10px">Allow optional Google Analytics to measure page visits and product interest? Tool inputs and results are never sent. You can change this choice later.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-roi-choice="yes" style="padding:9px 14px;min-height:40px;border:0;border-radius:6px;background:#a8e67b;color:#10200a;font-weight:700;cursor:pointer">Allow analytics</button><button type="button" data-roi-choice="no" style="padding:9px 14px;min-height:40px;border:1px solid #8fa3b8;border-radius:6px;background:transparent;color:#fff;cursor:pointer">Decline</button></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-roi-choice]');
      if (!btn) return;
      consent = btn.getAttribute('data-roi-choice');
      try { localStorage.setItem(key, consent); } catch (err) {}
      box.remove();
      if (consent === 'yes') start();
    });
  }
  function settings() {
    var foot = document.querySelector('footer');
    if (blocked || !foot || foot.querySelector('[data-roi-settings]')) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Analytics settings';
    button.setAttribute('data-roi-settings', '');
    button.style.cssText = 'display:inline-block;background:none;border:0;color:inherit;text-decoration:underline;font:inherit;cursor:pointer;margin:8px';
    button.addEventListener('click', function () {
      try { localStorage.removeItem(key); } catch (e) {}
      location.reload();
    });
    foot.appendChild(button);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { settings(); banner(); if (consent === 'yes') start(); });
  else { settings(); banner(); if (consent === 'yes') start(); }
})();
