/* Per-tab login: every browser tab keeps its own id, so each tab can be signed in as a different user. */
(function () {
  var KEY = 'eb_tab_id';
  var id = sessionStorage.getItem(KEY);
  if (!id || !/^[a-z0-9]{6,24}$/.test(id)) {
    id = (Math.random().toString(36).slice(2, 10) + Date.now().toString(36)).replace(/[^a-z0-9]/g, '').slice(0, 16);
    sessionStorage.setItem(KEY, id);
  }
  function mark() { document.cookie = 'eb_tab=' + id + ';path=/;SameSite=Lax'; }
  mark();
  var meta = document.querySelector('meta[name="eb-tab"]');
  var rendered = meta ? meta.getAttribute('content') : id;
  if (rendered !== id) {
    var last = Number(sessionStorage.getItem('eb_tab_reload') || 0);
    if (Date.now() - last > 4000) {
      sessionStorage.setItem('eb_tab_reload', String(Date.now()));
      location.reload();
      return;
    }
  }
  ['focus', 'pageshow', 'mousedown', 'keydown', 'touchstart', 'submit', 'click'].forEach(function (ev) {
    window.addEventListener(ev, mark, true);
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) mark(); });
  var nativeFetch = window.fetch;
  if (nativeFetch) {
    window.fetch = function (input, init) {
      init = init || {};
      var headers = new Headers(init.headers || (input && input.headers) || {});
      headers.set('X-Tab-Id', id);
      init.headers = headers;
      return nativeFetch.call(this, input, init);
    };
  }
  var nativeOpen = XMLHttpRequest.prototype.open, nativeSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function () { this._ebSameOrigin = true; return nativeOpen.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () { try { this.setRequestHeader('X-Tab-Id', id); } catch (e) {} return nativeSend.apply(this, arguments); };
  window.EB_TAB_ID = id;
})();
