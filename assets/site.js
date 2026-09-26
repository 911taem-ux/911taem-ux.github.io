(function () {
  var MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
  var mermaidReady = null;

  /* ---------- 글 본문 꾸미기 (페이지와 창 보기 공통) ---------- */
  function enhance(root) {
    // 표가 넓으면 옆으로 밀어서 보기
    root.querySelectorAll('.post-body table').forEach(function (t) {
      if (t.parentNode.classList.contains('table-wrap')) return;
      var w = document.createElement('div'); w.className = 'table-wrap';
      t.parentNode.insertBefore(w, t); w.appendChild(t);
    });
    // 공유하기: 주소 복사
    root.querySelectorAll('.share').forEach(function (b) {
      b.addEventListener('click', function () {
        var url = b.dataset.url || location.href;
        if (navigator.share) { navigator.share({ title: document.title, url: url }).catch(function () {}); }
        else if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function () {
            b.textContent = '주소 복사됨'; setTimeout(function () { b.textContent = '공유하기'; }, 1600);
          });
        }
      });
    });
    // 이미지 누르면 크게 보기
    root.querySelectorAll('.post-body img, .article-cover img').forEach(function (img) {
      if (img.closest('a')) return;
      img.classList.add('zoomable');
      img.addEventListener('click', function () {
        var cap = img.closest('figure') && img.closest('figure').querySelector('figcaption');
        openLightbox(img.currentSrc || img.src, cap ? cap.textContent : '');
      });
    });
    // 도식: ```mermaid 코드 블록을 그림으로
    var codes = [].filter.call(root.querySelectorAll('.language-mermaid'), function (c) { return !c.parentNode.closest('.language-mermaid'); });
    if (!codes.length) return;
    var nodes = codes.map(function (c) {
      var box = c.tagName === 'CODE' ? (c.closest('pre') || c) : c;
      var d = document.createElement('div'); d.className = 'mermaid'; d.textContent = c.textContent;
      box.parentNode.replaceChild(d, box); return d;
    });
    if (!mermaidReady) {
      mermaidReady = new Promise(function (ok) {
        var s = document.createElement('script'); s.src = MERMAID;
        s.onload = function () { mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: { primaryColor: '#EAF8E3', primaryBorderColor: '#09422B', primaryTextColor: '#09422B', lineColor: '#09422B' }, fontFamily: 'GmarketSans, sans-serif' }); ok(); };
        document.body.appendChild(s);
      });
    }
    mermaidReady.then(function () { mermaid.run({ nodes: nodes }); });
  }

  /* ---------- 이미지 크게 보기 ---------- */
  var lb = document.querySelector('.lightbox');
  function openLightbox(src, cap) {
    lb.querySelector('img').src = src;
    lb.querySelector('.lightbox-cap').textContent = cap || '';
    lb.hidden = false;
  }
  function closeLightbox() { lb.hidden = true; lb.querySelector('img').src = ''; }
  lb.addEventListener('click', closeLightbox);

  /* ---------- 목록 탭 ---------- */
  var tabs = document.querySelectorAll('.tabs button');
  function filter(f) {
    tabs.forEach(function (b) { b.classList.toggle('on', b.dataset.f === f); });
    document.querySelectorAll('.entry').forEach(function (e) { e.hidden = !(f === 'all' || e.dataset.cat === f); });
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { filter(b.dataset.f); }); });
  var q = new URLSearchParams(location.search).get('f');
  if (q && [].some.call(tabs, function (b) { return b.dataset.f === q; })) filter(q);

  /* ---------- 글 창으로 보기 ---------- */
  var viewer = document.querySelector('.viewer');
  var win = viewer.querySelector('.viewer-win');
  var body = viewer.querySelector('.viewer-body');
  var listUrl = location.href;

  function openViewer(url, push) {
    body.innerHTML = '<p class="viewer-loading">불러오는 중…</p>';
    viewer.hidden = false;
    document.documentElement.classList.add('viewer-open');
    viewer.querySelector('.vt-page').href = url;
    fetch(url).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var art = doc.querySelector('.article');
      if (!art) throw 0;
      body.innerHTML = ''; body.appendChild(art);
      viewer.querySelector('.viewer-title').textContent = (art.querySelector('.article-title') || {}).textContent || '';
      art.querySelectorAll('.share').forEach(function (b) { b.dataset.url = new URL(url, location.href).href; });
      body.scrollTop = 0;
      enhance(body);
    }).catch(function () { location.href = url; });
    if (push) history.pushState({ viewer: url }, '', url);
  }
  function closeViewer(fromPop) {
    if (viewer.hidden) return;
    viewer.hidden = true; win.classList.remove('full');
    viewer.querySelector('.vt-full').textContent = '⛶ 전체 화면';
    document.documentElement.classList.remove('viewer-open');
    body.innerHTML = '';
    if (!fromPop && history.state && history.state.viewer) history.back();
  }

  document.querySelectorAll('.entries a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return; // 새 탭 열기는 그대로
      e.preventDefault(); openViewer(a.getAttribute('href'), true);
    });
  });
  viewer.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', function () { closeViewer(false); }); });
  viewer.querySelector('.vt-full').addEventListener('click', function () {
    var full = win.classList.toggle('full');
    this.textContent = full ? '❐ 창으로 보기' : '⛶ 전체 화면';
  });
  window.addEventListener('popstate', function (e) {
    if (e.state && e.state.viewer) openViewer(e.state.viewer, false);
    else closeViewer(true);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!lb.hidden) closeLightbox(); else closeViewer(false);
  });

  enhance(document);
})();
