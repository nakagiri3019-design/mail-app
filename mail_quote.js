// mail_quote.js — メールの引用（Gmail と同じ形）を作る共通コード
// 中桐版（ルート）・新村版・尾田版が同じこのファイルを読み込む。新しい版も <script src> で読み込むだけで使える。
//   ルートの版:      <script src="mail_quote.js"></script>
//   フォルダ内の版:  <script src="../mail_quote.js"></script>
// メッセージは MAILS の thread と同じ形 { from, fromEmail, to, toEmail, datetime, date, body, attachments } を想定。

// 引用元の行・転送の Date の日時は「2026年9月30日(水) 午後4:12」（曜日つき・午前/午後＋12時間表記、時は0埋めなし）
// datetime が24時間表記でも午前/午後つきでも読める。正午は「午後12:00」、0時台は「午前0:05」（Gmail と同じ）
function quoteDate(dt) {
  const m = String(dt || '').match(/(\d{4})年(\d+)月(\d+)日(?:\([^)]*\))?\s*(午前|午後)?\s*(\d+):(\d+)/);
  if (!m) return String(dt || '');
  let h = parseInt(m[5], 10);
  if (m[4] === '午後' && h < 12) h += 12;
  if (m[4] === '午前' && h === 12) h = 0;
  const wd = '日月火水木金土'[new Date(+m[1], +m[2] - 1, +m[3]).getDay()];
  const ampm = h < 12 ? '午前' : '午後';
  const h12 = h > 12 ? h - 12 : h;
  return `${m[1]}年${+m[2]}月${+m[3]}日(${wd}) ${ampm}${h12}:${m[6]}`;
}

function quoteAttr(msg) {
  const addr = msg.fromEmail ? ` &lt;<span class="gq-addr" data-addr="${msg.fromEmail}" data-name="${String(msg.from || '').replace(/"/g, '&quot;')}">${msg.fromEmail}</span>&gt;` : '';
  return `<div class="gq-attr">${quoteDate(msg.datetime || msg.date)} ${msg.from}${addr}:</div>`;
}

// messages[idx] の本文を縦線のブロックにし、その1つ前のメールも同じ形で中に入れる（スレッドの最初のメールまで）
// 入れ子が深くなっても狭い画面で横にはみ出さないよう、線と余白は QUOTE_MAX_INDENT 段までにする
const QUOTE_MAX_INDENT = 10;
function renderQuoteNest(messages, idx, depth) {
  const inner = idx > 0 ? quoteAttr(messages[idx - 1]) + renderQuoteNest(messages, idx - 1, depth + 1) : '';
  return `<blockquote class="gq${depth >= QUOTE_MAX_INDENT ? ' gq-flat' : ''}"><div class="gq-body">${messages[idx].body || ''}</div>${inner}</blockquote>`;
}

// メール詳細の本文下の引用。開くと 引用元の行 → 「•••」 → 引用ブロック、閉じているときは 引用元の行 → 「•••」
function renderQuoteInner(messages, idx, open, btnAttr, attrWhenClosed) {
  const dots = `<button class="gq-dots${open ? ' is-open' : ''}" ${btnAttr} aria-label="${open ? '引用部分を隠す' : '引用部分を表示'}"><span><i></i><i></i><i></i></span></button>`;
  if (open) return quoteAttr(messages[idx]) + dots + renderQuoteNest(messages, idx, 0);
  return (attrWhenClosed ? quoteAttr(messages[idx]) : '') + dots;
}

const MailQuote = {
  // 作成画面の本文欄の下に付ける引用（畳まずに全部）。
  //   mode: 'reply' | 'replyAll' | 'forward'
  //   messages: スレッドのメール（古い順）、idx: 返信・転送するメールの位置
  //   head: 転送の見出し用 { from, to, cc, subject }（「名前 <アドレス>」の文字列。cc は空でよい）
  // 返信：最新のメールから最初のメールまで、1つ古くなるごとに1段深い引用
  // 転送：Forwarded message の見出し＋そのメールの本文、その下に返信と同じ形でそれより前のメール
  compose(mode, messages, idx, head) {
    if (mode === 'forward') {
      const h = head || {};
      const e = MailQuote.esc;
      const m = messages[idx];
      return '---------- Forwarded message ---------<br>'
        + `From: ${e(h.from)}<br>`
        + `Date: ${e(quoteDate(m.datetime || m.date))}<br>`
        + `Subject: ${e(h.subject)}<br>`
        + `To: ${e(h.to)}<br>`
        + (h.cc ? `Cc: ${e(h.cc)}<br>` : '')
        + `<br><div class="gq-body">${m.body || ''}</div>`
        + (idx > 0 ? quoteAttr(messages[idx - 1]) + renderQuoteNest(messages, idx - 1, 0) : '');
    }
    return quoteAttr(messages[idx]) + renderQuoteNest(messages, idx, 0);
  },

  // 送るメールの HTML（本文＋引用）。引用は blockquote のまま、見た目はメールソフトでも崩れないようインラインの style にする。
  // 送信サーバーができたら、この戻り値を HTML 本文として渡す。
  toSendHTML(bodyText, quoteHTML) {
    const body = MailQuote.esc(bodyText).replace(/\r?\n/g, '<br>');
    if (!quoteHTML) return `<div>${body}</div>`;
    const box = document.createElement('div');
    box.innerHTML = quoteHTML;
    box.querySelectorAll('.gq-addr').forEach((s) => s.replaceWith(document.createTextNode(s.textContent)));
    box.querySelectorAll('blockquote').forEach((q) => {
      q.setAttribute('style', q.classList.contains('gq-flat')
        ? 'margin:0;padding:0'
        : 'margin:0 0 0 0.8ex;border-left:1px solid #ccc;padding-left:1ex');
    });
    box.querySelectorAll('.gq-body').forEach((b) => b.setAttribute('style', 'white-space:pre-wrap'));
    box.querySelectorAll('.gq-body + .gq-attr').forEach((a) => a.setAttribute('style', 'margin-top:16px'));
    box.querySelectorAll('[class]').forEach((el) => el.removeAttribute('class'));
    return `<div>${body}</div><br><div class="gmail_quote">${box.innerHTML}</div>`;
  },

  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
};
