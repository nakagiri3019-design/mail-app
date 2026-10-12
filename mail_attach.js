// mail_attach.js — 添付ファイルのカード表示・プレビュー・端末からの追加（Gmail と同じ形）の共通コード
// 中桐版（ルート）・新村版・尾田版が同じこのファイルを読み込む。新しい版も <script src> で読み込むだけで使える。
//   ルートの版:      <script src="mail_attach.js"></script>
//   フォルダ内の版:  <script src="../mail_attach.js"></script>
// 添付は { name, url, meta?, noPreview?, type?, file? }（type は MIME、file は端末から追加した File）。
// カードの見た目の基本（.attachment-card / -preview / -info-bar など）は各版の CSS。ここでは追加分だけ <style> で足す。

const MailAttach = (() => {
  // このファイルの場所＝リポジトリのルート。PDF の日本語フォント用 cMap はそこからの相対で探す
  const BASE = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/[^/]*$/, '') : './';
  const CMAP_URL = BASE + 'attachments/cmaps/';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function kind(att) {
    const t = String(att.type || '').toLowerCase();
    const n = String(att.name || att.url || '').toLowerCase().split('?')[0];
    if (t.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|heic|heif|svg)$/.test(n)) return 'image';
    if (t === 'application/pdf' || /\.pdf$/.test(n)) return 'pdf';
    return 'file';
  }

  const ICON = {
    pdf: '<svg class="att-kind" width="22" height="22" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" fill="#D93025"/><text x="12" y="16" font-size="8.5" font-weight="700" fill="#fff" text-anchor="middle" font-family="Arial, sans-serif">PDF</text></svg>',
    image: '<svg class="att-kind" width="22" height="22" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" fill="#D93025"/><path d="M6 17l3.5-4.5 2.5 3 3.5-4.5L19 17z" fill="#fff"/><circle cx="8.5" cy="8.5" r="1.6" fill="#fff"/></svg>',
    file: '<svg class="att-kind" width="22" height="22" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" fill="#5F6368"/><path d="M8 7h5l3 3v7H8z" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    download: '<svg class="attachment-action-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    blank: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D93025" stroke-width="1.5"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" stroke-linejoin="round"/><path d="M14 3v5h5" stroke-linejoin="round"/></svg>',
  };

  // 長い名前は途中を「…」で省略：先頭は幅に合わせて縮め、拡張子を含む末尾は残す
  function nameHTML(name) {
    const s = String(name || '');
    const dot = s.lastIndexOf('.');
    const cut = Math.max(0, (dot > 0 ? dot : s.length) - 6);
    const head = s.slice(0, cut), tail = s.slice(cut);
    return `<span class="attachment-file-name att-name" title="${esc(s)}"><span class="att-name-head">${esc(head)}</span><span class="att-name-tail">${esc(tail)}</span></span>`;
  }

  // カード1枚：上に中身のプレビュー、下に 種類アイコン＋ファイル名＋ダウンロード。タップで別タブで開く
  // opts.removeAttr を渡すと右上に×（作成画面用）
  function card(att, opts) {
    const o = opts || {};
    const k = kind(att);
    const url = att.url || '';
    // ×を押したときは開かない（×の処理は作成画面のクリック処理に任せる）
    const open = `if(!event.target.closest('.att-x'))` + (url ? `window.open('${encodeURI(url).replace(/'/g, '%27')}', '_blank')` : `alert('添付ファイルを開く（デモ）')`);
    let preview = '';
    if (!att.noPreview) {
      if (url && k === 'image') preview = `<img class="att-img" src="${esc(url)}" alt="" loading="lazy">`;
      else if (url && k === 'pdf') preview = `<canvas class="pdf-thumb-canvas" data-pdf-url="${esc(url)}"></canvas>`;
      else preview = `<div class="att-blank">${k === 'file' ? ICON.file.replace('width="22" height="22"', 'width="40" height="40"') : ICON.blank}</div>`;
      preview = `<div class="attachment-preview">${preview}</div>`;
    }
    const x = o.removeAttr ? `<button class="att-x" ${o.removeAttr} aria-label="添付を外す">${ICON.x}</button>` : '';
    return `<div class="attachment-card att-card" onclick="${open}">${preview}${x}`
      + `<div class="attachment-info-bar">${ICON[k]}${nameHTML(att.name)}<span class="attachment-actions">${ICON.download}</span></div></div>`;
  }

  function list(atts, opts) {
    const o = opts || {};
    return (atts || []).map((a, i) => card(a, o.removable ? { removeAttr: `data-cmp="att-x" data-i="${i}"` } : {})).join('');
  }

  // PDF の1ページ目の上部を描く。画面に入ったものから順に描く（転送で添付が多くても一度に重くならないように）
  function drawPdf(canvas) {
    if (canvas.dataset.rendered) return;
    canvas.dataset.rendered = '1';
    if (typeof pdfjsLib === 'undefined') return;
    pdfjsLib.getDocument({ url: canvas.getAttribute('data-pdf-url'), cMapUrl: CMAP_URL, cMapPacked: true }).promise
      .then((pdf) => pdf.getPage(1))
      .then((page) => {
        const w = canvas.parentElement.clientWidth || 300;
        const base = page.getViewport({ scale: 1 });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: (w / base.width) * ratio });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = w + 'px';
        return page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      })
      .catch((err) => {
        console.error('PDF preview render failed:', err);
        canvas.replaceWith(Object.assign(document.createElement('div'), { className: 'att-blank', innerHTML: ICON.blank }));
      });
  }
  const io = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); drawPdf(e.target); } }), { rootMargin: '200px' })
    : null;
  function renderPreviews(area) {
    (area || document).querySelectorAll('canvas.pdf-thumb-canvas[data-pdf-url]').forEach((c) => {
      if (c.dataset.rendered) return;
      if (io) io.observe(c); else drawPdf(c);
    });
  }

  // 転送で引き継ぐ添付：スレッドの全メールから古い順に集め、同じファイル（同じ url。url がなければ同じ名前）は1つにする
  function collect(messages) {
    const seen = new Set();
    const out = [];
    (messages || []).forEach((m) => (m.attachments || []).forEach((a) => {
      const key = a.url ? 'u:' + a.url : 'n:' + a.name;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(Object.assign({}, a));
    }));
    return out;
  }

  // クリップのボタン：端末のファイルを選ぶ（複数可）。選んだものを添付の形にして onPick に渡す
  function pick(onPick) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const files = Array.from(input.files || []);
      input.remove();
      if (files.length) onPick(files.map((f) => ({ name: f.name, type: f.type, size: f.size, file: f, url: URL.createObjectURL(f), local: true })));
    });
    document.body.appendChild(input);
    input.click();
  }
  // 作成画面を閉じたら、端末から追加したファイルのプレビュー用 URL を片付ける
  function release(atts) {
    (atts || []).forEach((a) => { if (a.local && a.url) URL.revokeObjectURL(a.url); });
  }
  // 送信時に渡す添付一覧（送信サーバーができたらこれを渡す）
  function forSend(atts) {
    return (atts || []).map((a) => ({ name: a.name, url: a.local ? null : (a.url || null), type: a.type || (kind(a) === 'pdf' ? 'application/pdf' : ''), size: a.size || null, file: a.file || null }));
  }

  const style = document.createElement('style');
  style.textContent = `
.att-card { position: relative; }
.att-card .attachment-preview { position: relative; }
.att-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.att-blank { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #F8F9FA; }
.att-name { display: flex; min-width: 0; }
.att-name-head { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.att-name-tail { flex: 0 0 auto; white-space: nowrap; }
.att-kind { flex-shrink: 0; }
.att-x { position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; padding: 0; border: none; border-radius: 50%; background: rgba(32,33,36,0.72); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 1; }
.att-x:active { background: rgba(32,33,36,0.9); }
.cmp-atts.attachment-grid { margin-right: 0; }
`;
  document.head.appendChild(style);

  return { kind, card, list, renderPreviews, collect, pick, release, forSend };
})();
