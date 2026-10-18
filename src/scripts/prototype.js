const areas = [
  { id: 'station', label: '台北車站附近', aliases: ['台北車站', '車站'] },
  { id: 'songshan', label: '松山文創園區', aliases: ['松山', '文創'] },
  { id: 'current', label: '目前位置（模擬）', aliases: ['目前', '位置'] },
];

const places = [
  { id: 'nien', area: 'station', name: '念念不忘咖啡', kind: 'coffee', type: '咖啡甜點', address: '中山區赤峰街 47 巷 8 號', rating: '4.6 ★', reviews: '1,248', price: '$$', freshness: 'fresh', freshLabel: '22 分鐘前', emoji: '☕', color: 'mint', position: ['49%', '49%'], source: '午後散步的 3 家咖啡廳', quote: '「窗邊的光線很好，適合慢慢喝一杯。」', hero: 'linear-gradient(135deg,#d8834d 0 32%,#f1c582 33% 61%,#793e2d 62%)', sourceImage: true, placeImage: true, candidates: [{ name: '念念不忘咖啡（民生店）', address: '松山區民生東路', confidence: '相似店名；尚未確認' }] },
  { id: 'tiger', area: 'station', name: '虎記麵舖', kind: 'food', type: '吃東西', address: '大同區承德路一段 42 巷 15 號', rating: '4.4 ★', reviews: '876', price: '$', freshness: 'stale', freshLabel: '2 小時前', emoji: '🍜', color: 'pink', position: ['66%', '38%'], source: '下班後的一人晚餐清單', quote: '「湯頭乾淨，晚一點去也不會太有壓力。」', hero: 'linear-gradient(135deg,#7a3d25,#df7b3f,#f4c274)', sourceImage: true, placeImage: false, candidates: [] },
  { id: 'milk', area: 'station', name: '牛奶糖研究室', kind: 'coffee', type: '咖啡甜點', address: '萬華區成都路 93 號', rating: '4.7 ★', reviews: '514', price: '$$', freshness: 'error', freshLabel: '更新失敗', emoji: '🍮', color: 'orange', position: ['34%', '58%'], source: '西門散步時想再去的甜點店', quote: '「焦糖布丁和音樂都很對味。」', hero: 'linear-gradient(135deg,#f5c7ca,#ef8f95,#fff0d2)', sourceImage: false, placeImage: false, candidates: [] },
  { id: 'garden', area: 'songshan', name: '小島花園', kind: 'walk', type: '走走逛逛', address: '大安區新生南路三段 56 巷 4 號', rating: '4.5 ★', reviews: '326', price: '免費', freshness: 'loading', freshLabel: '整理中', emoji: '🌳', color: 'violet', position: ['72%', '65%'], source: '週末不排滿的散步地圖', quote: '「想留一點空白，就往這裡走。」', hero: 'linear-gradient(135deg,#72a47d,#d7e4ac,#6b9899)', sourceImage: false, placeImage: true, candidates: [{ name: '小島花園溫室', address: '信義區光復南路', confidence: '同一來源中的待確認地點', pendingPlace: { id: 'greenhouse', area: 'songshan', name: '小島花園溫室', kind: 'walk', type: '走走逛逛', address: '信義區光復南路 133 號', rating: '4.3 ★', reviews: '89', price: '免費', freshness: 'fresh', freshLabel: '剛剛', emoji: '🌱', color: 'mint', position: ['58%', '42%'], source: '週末不排滿的散步地圖', quote: '「溫室區域可能是另一個入口。」', hero: 'linear-gradient(135deg,#b7d68d,#f2efb0,#74a99c)', sourceImage: false, placeImage: false, candidates: [] } }] },
  { id: 'market', area: 'current', name: '河岸早餐室', kind: 'food', type: '吃東西', address: '目前位置附近（模擬）', rating: '4.2 ★', reviews: '137', price: '$', freshness: 'fresh', freshLabel: '5 分鐘前', emoji: '🥪', color: 'orange', position: ['48%', '53%'], source: '今天早上的收藏', quote: '「這是目前位置示意區域的有限模擬結果。」', hero: 'linear-gradient(135deg,#e9c87c,#f2e9b3,#86ae91)', sourceImage: false, placeImage: false, candidates: [] },
];

const inboxSources = [
  { id: 'coffee-list', title: '週末咖啡清單', status: 'processing', relative: '約 20 秒前', stage: 1, summary: '已取得來源摘要，正在比對地點線索。' },
  { id: 'walk-post', title: '赤峰街散步貼文', status: 'needs-confirmation', relative: '2 分鐘前', linkedPlace: 'garden', summary: '辨識到一個可能的地點與一個相似候選。' },
  { id: 'untitled-link', title: '沒有標題的連結', status: 'failed', relative: '6 分鐘前', failure: '來源內容不是可辨識的文字格式。', summary: '原始來源仍可在本機模擬摘要中查看。' },
  { id: 'night-market', title: '夜市吃吃清單', status: 'no-place-found', relative: '9 分鐘前', summary: '處理完成，但沒有找到可確認的地點。' },
];

let areaId = 'station';
let filter = 'all';
let current = 'nien';
let lastFocus = null;
const $ = (id) => document.getElementById(id);
const findPlace = (id) => places.find((place) => place.id === id);
const findInboxSource = (id) => inboxSources.find((source) => source.id === id);
const currentArea = () => areas.find((area) => area.id === areaId);
const visiblePlaces = () => places.filter((place) => place.area === areaId && (filter === 'all' || place.kind === filter));
const activeInboxSources = () => inboxSources.filter((source) => !['resolved', 'archived'].includes(source.status));

function toast(message) {
  const node = $('toast');
  node.textContent = message;
  node.classList.add('show');
  setTimeout(() => node.classList.remove('show'), 2600);
}

function openModal(id, trigger) {
  lastFocus = trigger || document.activeElement;
  const modal = $(id);
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  modal.querySelector('input,button')?.focus();
}

function closeModal(id) {
  const modal = $(id);
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  lastFocus?.focus?.();
}

function trapFocus(event) {
  const modal = document.querySelector('.modal.open');
  if (!modal || event.key !== 'Tab') return;
  const controls = [...modal.querySelectorAll('button:not([disabled]),input:not([disabled])')];
  if (!controls.length) return;
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function makeButton(text, className, handler) {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = className;
  node.textContent = text;
  node.addEventListener('click', handler);
  return node;
}

function renderAreas() {
  const root = $('areaOptions');
  root.replaceChildren();
  areas.forEach((area) => {
    const button = makeButton('', 'area-option', () => selectArea(area.id));
    const name = document.createElement('b');
    name.textContent = area.label;
    const copy = document.createElement('small');
    copy.textContent = '有限模擬區域；不查詢外部服務';
    button.append(name, copy);
    root.append(button);
  });
}

function render() {
  const items = visiblePlaces();
  if (!items.some((place) => place.id === current)) current = items[0]?.id || '';
  $('sheetEyebrow').textContent = currentArea().label;
  $('searchText').textContent = currentArea().label;
  $('locationLabel').textContent = areaId === 'current' ? '目前位置（模擬）' : '目前附近（模擬）';
  $('count').textContent = `${items.length} 個地點`;
  $('cards').replaceChildren();
  $('pins').replaceChildren();
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.append('此篩選沒有模擬地點。', makeButton('清除篩選', '', () => { filter = 'all'; syncChips(); render(); }));
    $('cards').append(empty);
    return;
  }
  items.forEach((place) => {
    const card = makeButton('', `card ${place.id === current ? 'active' : ''}`, () => select(place.id, true));
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.style.background = place.hero;
    const copy = document.createElement('div');
    const name = document.createElement('h3');
    name.textContent = place.name;
    const address = document.createElement('p');
    address.textContent = place.address;
    const meta = document.createElement('div');
    meta.className = 'meta';
    const rating = document.createElement('strong');
    rating.textContent = place.rating;
    const type = document.createElement('span');
    type.textContent = `· ${place.type}`;
    const fresh = document.createElement('span');
    fresh.className = 'fresh';
    fresh.textContent = place.freshLabel;
    meta.append(rating, type, fresh);
    copy.append(name, address, meta);
    card.append(thumb, copy);
    $('cards').append(card);
    const pin = makeButton('', `place-pin ${place.id === current ? 'selected' : ''}`, () => select(place.id, true));
    pin.style.left = place.position[0];
    pin.style.top = place.position[1];
    pin.setAttribute('aria-label', `查看 ${place.name}`);
    const marker = document.createElement('span');
    marker.className = `pin-dot ${place.color}`;
    const emoji = document.createElement('span');
    emoji.textContent = place.emoji;
    marker.append(emoji);
    const note = document.createElement('span');
    note.className = 'pin-note';
    note.textContent = place.name;
    pin.append(marker, note);
    $('pins').append(pin);
  });
}

function syncChips() {
  document.querySelectorAll('.chip').forEach((chip) => chip.classList.toggle('active', chip.dataset.filter === filter));
}

function renderFreshness(place) {
  const root = $('freshness');
  root.dataset.state = place.freshness;
  root.replaceChildren();
  const text = document.createElement('span');
  if (place.freshness === 'fresh') text.textContent = `已更新（模擬）：${place.freshLabel}`;
  if (place.freshness === 'stale') text.textContent = `資料較舊（模擬）：${place.freshLabel}`;
  if (place.freshness === 'loading') text.textContent = '正在整理模擬資料，不會連線更新。';
  if (place.freshness === 'error') text.textContent = '無法取得更新狀態，請再試一次（模擬）。';
  root.append(text);
  if (place.freshness === 'error') root.append(makeButton('重新嘗試', 'retry', () => retryFreshness(place)));
}

function retryFreshness(place) {
  place.freshness = 'loading';
  place.freshLabel = '整理中';
  renderDetail(place);
  setTimeout(() => {
    place.freshness = 'fresh';
    place.freshLabel = '剛剛';
    render();
    if (current === place.id && $('detail').classList.contains('open')) renderDetail(place);
    toast('模擬更新完成；沒有連線到外部服務。');
  }, 700);
}

function renderDetail(place) {
  $('detailType').textContent = `${place.type} · 已確認地點`;
  $('detailName').textContent = place.name;
  $('detailAddress').textContent = place.address;
  $('detailRating').textContent = place.rating;
  $('detailReviews').textContent = place.reviews;
  $('detailPrice').textContent = place.price;
  $('detailFresh').textContent = place.freshLabel;
  $('sourceTitle').textContent = place.source;
  $('sourceText').textContent = place.quote;
  $('hero').style.background = place.hero;
  renderFreshness(place);
  const gallery = $('gallery');
  gallery.replaceChildren();
  ['來源圖像欄位', '地點圖像欄位'].forEach((label, index) => {
    const image = document.createElement('div');
    image.className = 'image-placeholder';
    const available = index === 0 ? place.sourceImage : place.placeImage;
    image.textContent = available ? `${label}：模擬佔位，不是真實照片。` : `${label}：沒有圖像（模擬）。`;
    gallery.append(image);
  });
  if (!place.sourceImage && !place.placeImage) {
    const noImage = document.createElement('div');
    noImage.className = 'no-image';
    noImage.textContent = '沒有可用圖像；這是明確的無圖狀態。';
    gallery.append(noImage);
  }
  const list = $('candidateList');
  list.replaceChildren();
  if (!place.candidates.length) list.textContent = '沒有其他候選。';
  place.candidates.forEach((candidate) => {
    const item = document.createElement('article');
    item.className = 'candidate';
    const name = document.createElement('strong');
    name.textContent = candidate.name;
    const copy = document.createElement('p');
    copy.textContent = `${candidate.address} · ${candidate.confidence}`;
    item.append(name, copy);
    if (candidate.pendingPlace && !candidate.confirmed) {
      const button = makeButton('確認此候選', 'button secondary', () => confirmCandidate(candidate));
      button.dataset.confirmCandidate = 'true';
      item.append(button);
    }
    if (candidate.confirmed) item.append(document.createTextNode('已確認並加入地圖'));
    list.append(item);
  });
}

function confirmCandidate(candidate) {
  candidate.confirmed = true;
  if (!places.some((place) => place.id === candidate.pendingPlace.id)) places.push(candidate.pendingPlace);
  const linkedSource = inboxSources.find((source) => source.linkedPlace === 'garden');
  if (linkedSource) linkedSource.status = 'resolved';
  current = candidate.pendingPlace.id;
  render();
  renderInbox();
  renderDetail(candidate.pendingPlace);
  toast(`已確認「${candidate.pendingPlace.name}」並加入地圖（模擬）。`);
}

function inboxStatusLabel(status) {
  return { processing: '處理中', 'needs-confirmation': '需要確認', failed: '處理失敗', retrying: '重新處理中', 'no-place-found': '找不到地點' }[status] || status;
}

function appendInboxAction(row, text, className, handler, disabled = false) {
  const action = makeButton(text, className, handler);
  action.disabled = disabled;
  row.append(action);
}

function renderInbox() {
  const root = $('inboxList');
  root.replaceChildren();
  const sources = activeInboxSources();
  if (!sources.length) {
    const empty = document.createElement('section');
    empty.className = 'inbox-empty';
    const title = document.createElement('h3');
    title.textContent = '目前沒有待處理來源';
    const copy = document.createElement('p');
    copy.textContent = '已確認的地點留在地圖與清單；重新整理會還原這組本機模擬資料。';
    empty.append(title, copy);
    root.append(empty);
    return;
  }
  sources.forEach((source) => {
    const row = document.createElement('article');
    row.className = 'inbox-row';
    row.dataset.status = source.status;
    const heading = document.createElement('div');
    heading.className = 'inbox-heading';
    const title = document.createElement('h3');
    title.textContent = source.title;
    const state = document.createElement('span');
    state.className = 'inbox-status';
    state.textContent = inboxStatusLabel(source.status);
    heading.append(title, state);
    const relative = document.createElement('p');
    relative.className = 'inbox-relative';
    relative.textContent = `${source.relative} · 僅本機模擬`;
    const copy = document.createElement('p');
    copy.textContent = source.summary;
    row.append(heading, relative, copy);

    if (source.status === 'processing') {
      const stages = ['擷取來源', '分析內容', '解析地點'];
      const progress = document.createElement('div');
      progress.className = 'stage-progress';
      const label = document.createElement('span');
      label.textContent = '處理階段';
      const list = document.createElement('ol');
      stages.forEach((stage, index) => {
        const item = document.createElement('li');
        item.textContent = stage;
        item.dataset.state = index < source.stage ? 'done' : index === source.stage ? 'active' : 'pending';
        list.append(item);
      });
      progress.append(label, list);
      row.append(progress);
      appendInboxAction(row, '查看來源摘要', 'button secondary', () => toast('這是本機模擬摘要；不會開啟或抓取原始來源。'));
    }

    if (source.status === 'needs-confirmation') appendInboxAction(row, '前往確認候選', 'button primary', () => openResolution(source));

    if (source.status === 'failed') {
      const failure = document.createElement('p');
      failure.className = 'failure-reason';
      failure.textContent = `處理原因：${source.failure}`;
      row.append(failure);
      appendInboxAction(row, '重新處理（模擬）', 'button secondary', () => retryInboxSource(source));
    }

    if (source.status === 'retrying') {
      const feedback = document.createElement('p');
      feedback.className = 'retry-feedback';
      feedback.textContent = '正在重新整理本機模擬結果…';
      row.append(feedback);
      appendInboxAction(row, '重新處理中…', 'button secondary', () => {}, true);
    }

    if (source.status === 'no-place-found') {
      const outcome = document.createElement('p');
      outcome.className = 'no-place-outcome';
      outcome.textContent = '已完成處理，不是失敗：沒有足夠線索建立可確認地點。';
      row.append(outcome);
      appendInboxAction(row, '查看來源摘要', 'button secondary', () => toast('這是本機模擬摘要；不會開啟或抓取原始來源。'));
      appendInboxAction(row, '封存這筆來源', 'button tertiary', (event) => dismissInboxSource(source, event.currentTarget));
    }

    root.append(row);
  });
}

function openResolution(source) {
  const place = findPlace(source.linkedPlace);
  if (!place) return;
  $('inboxDialog').classList.remove('open');
  $('inboxDialog').setAttribute('aria-hidden', 'true');
  areaId = place.area;
  filter = 'all';
  current = place.id;
  syncChips();
  render();
  renderDetail(place);
  openModal('detail', $('inboxBtn'));
  setTimeout(() => $('candidateList').querySelector('[data-confirm-candidate]')?.focus(), 0);
}

function retryInboxSource(source) {
  if (source.status !== 'failed') return;
  source.status = 'retrying';
  renderInbox();
  setTimeout(() => {
    source.status = 'no-place-found';
    source.summary = '重新處理完成，但仍沒有足夠線索建立可確認地點。';
    renderInbox();
    toast('重新處理完成：找不到地點，並非處理失敗。');
  }, 850);
}

function dismissInboxSource(source, trigger) {
  source.status = 'archived';
  renderInbox();
  const next = $('inboxList').querySelector('button');
  (next || trigger || $('inboxBtn')).focus();
  toast('已在本機封存這筆模擬來源。');
}

function advanceProcessingSource() {
  const source = findInboxSource('coffee-list');
  if (!source || source.status !== 'processing') return;
  if (source.stage < 2) {
    source.stage += 1;
    source.summary = source.stage === 2 ? '已完成分析，正在解析是否能建立地點。' : source.summary;
    renderInbox();
    setTimeout(advanceProcessingSource, 4000);
    return;
  }
  source.status = 'no-place-found';
  source.summary = '處理完成，但來源沒有足夠的地點線索。';
  renderInbox();
}

function select(id, shouldOpen) {
  const place = findPlace(id);
  if (!place) return;
  current = id;
  render();
  if (shouldOpen) {
    renderDetail(place);
    openModal('detail', document.activeElement);
  }
}

function selectArea(id) {
  areaId = id;
  filter = 'all';
  syncChips();
  render();
  closeModal('searchDialog');
  toast(`已切換至${currentArea().label}（模擬）。`);
}

function validateUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

$('searchBtn').addEventListener('click', (event) => { renderAreas(); $('destinationInput').value = ''; openModal('searchDialog', event.currentTarget); });
$('inboxBtn').addEventListener('click', (event) => { renderInbox(); openModal('inboxDialog', event.currentTarget); });
$('locate').addEventListener('click', () => selectArea('current'));
$('destinationForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const query = $('destinationInput').value.trim().toLowerCase();
  const match = areas.find((area) => area.label.toLowerCase().includes(query) || area.aliases.some((alias) => alias.includes(query)));
  if (!match) {
    toast('有限模擬資料中沒有這個目的地；可改選下方區域。');
    return;
  }
  selectArea(match.id);
});
document.querySelectorAll('.chip').forEach((chip) => chip.addEventListener('click', () => { filter = chip.dataset.filter; syncChips(); render(); }));
document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
document.querySelectorAll('.modal').forEach((modal) => modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(modal.id); }));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { const open = document.querySelector('.modal.open'); if (open) closeModal(open.id); } trapFocus(event); });
$('navigate').addEventListener('click', () => toast('這是 prototype：不會開啟真實導航。'));
$('sourceButton').addEventListener('click', () => toast('這是模擬來源欄位；不會開啟貼文。'));
$('urlForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const message = $('urlMessage');
  const value = $('sourceUrl').value.trim();
  if (!validateUrl(value)) {
    message.textContent = '請輸入 http:// 或 https:// 開頭的網址。';
    return;
  }
  message.textContent = '格式有效；prototype 不會送出請求或儲存網址。';
  $('sourceUrl').value = '';
});

render();
renderInbox();
setTimeout(advanceProcessingSource, 6000);
