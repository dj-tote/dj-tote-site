(() => {
  'use strict';
  const list = document.querySelector('#gig-list');
  const year = document.querySelector('#year-select');
  const search = document.querySelector('#gig-search');
  const status = document.querySelector('#archive-result');
  const more = document.querySelector('#load-more');
  const total = document.querySelector('#archive-total');
  let events = [];
  let visible = 15;
  const PAGE_SIZE = 15;

  function jaDate(date) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '');
    if (!m) return {year: '', day: date || ''};
    return {year: m[1], day: `${Number(m[2])}.${String(m[3]).padStart(2, '0')}`};
  }
  function safeUrl(url) {
    try {
      const u = new URL(url);
      return ['https:', 'http:'].includes(u.protocol) ? u.href : '';
    } catch {return '';}
  }
  function filtered() {
    const query = search.value.trim().normalize('NFKC').toLowerCase();
    const chosen = year.value;
    return events.filter(x => (chosen === 'all' || x.date.startsWith(chosen)) &&
      (!query || `${x.event} ${x.venue} ${x.date}`.normalize('NFKC').toLowerCase().includes(query)));
  }
  function row(item) {
    const li = document.createElement('li');
    li.className = 'gig-row';
    const date = jaDate(item.date);
    const dateEl = document.createElement('time');
    dateEl.className = 'gig-row-date';
    dateEl.dateTime = item.date;
    const y = document.createElement('span'); y.className = 'gig-row-year'; y.textContent = date.year;
    const d = document.createElement('span'); d.className = 'gig-row-day'; d.textContent = date.day;
    dateEl.append(y, d);
    const title = document.createElement('div');title.className = 'gig-row-body';
    const name = document.createElement('strong');name.textContent = item.event;
    const venue = document.createElement('span');venue.textContent = item.venue || '会場記録なし';
    title.append(name,venue);
    li.append(dateEl, title);
    const u = safeUrl(item.url);
    if (u) {
      const a = document.createElement('a');
      a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.className = 'gig-row-link';a.textContent = 'DETAIL ↗';
      a.setAttribute('aria-label', `${item.event} の参考リンクを開く`);
      li.append(a);
    } else {const span = document.createElement('span');span.className='gig-row-empty';span.textContent='—';li.append(span);}
    return li;
  }
  function render() {
    const matched = filtered();
    const shown = matched.slice(0,visible);
    const fragment = document.createDocumentFragment();
    shown.forEach(item => fragment.appendChild(row(item)));
    list.replaceChildren(fragment);
    status.textContent = `${matched.length} 件の出演履歴${matched.length > visible ? ` ／ ${shown.length} 件を表示中` : ''}`;
    if (!matched.length) {
      const li = document.createElement('li');li.className='empty-state';li.textContent='該当する出演履歴がありません。検索条件を変えてみてください。';list.append(li);
    }
    more.hidden = matched.length <= visible;
  }
  function fillYears() {
    [...new Set(events.map(x => x.date.slice(0,4)))].sort().reverse().forEach(y => {
      const opt = document.createElement('option');opt.value=y;opt.textContent=y;year.append(opt);
    });
  }
  const redraw = () => {visible=PAGE_SIZE;render();};
  year.addEventListener('change',redraw);
  search.addEventListener('input',redraw);
  more.addEventListener('click',()=>{visible+=PAGE_SIZE;render();});

  async function loadGigs() {
    try {
      const response = await fetch('data/gigs.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.events)) throw new Error('invalid data');
      events = data.events.filter(x => typeof x.event==='string' && /^\d{4}-\d{2}-\d{2}$/.test(x.date));
      events.sort((a,b) => b.date.localeCompare(a.date));
      total.textContent = String(events.length);
      fillYears();render();
    } catch(err) {
      status.textContent = '出演履歴を読み込めませんでした。時間をおいて再読み込みしてください。';
      console.warn('Gig archive unavailable', err);
    }
  }
  function showUpcoming() {
    const formatter = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'});
    const parts=formatter.formatToParts(new Date());
    const date=Object.fromEntries(parts.map(x=>[x.type,x.value]));
    const today=`${date.year}-${date.month}-${date.day}`;
    const upcoming=document.querySelector('#upcoming-card');
    if(today>'2026-11-15') {
      upcoming.className='upcoming upcoming-empty';
      upcoming.innerHTML='<div class="upcoming-info"><span class="tiny-label">NEXT GIG</span><h3>次回出演は準備中です。</h3><p>新しい予定はXでお知らせします。</p><a class="inline-link" href="https://x.com/tote_becone" target="_blank" rel="noopener noreferrer">Xで最新情報を見る ↗</a></div>';
    }
  }
  showUpcoming();loadGigs();
})();
