
const TAMANHOS = [
  { id: 'broto', label: 'Broto', fatias: 4, preco: 29.9, icon: '🍕', desc: '4 pedaços · serve 1 a 2' },
  { id: 'medio', label: 'Médio', fatias: 6, preco: 39.9, icon: '🍕', desc: '6 pedaços · serve 2 a 3' },
  { id: 'grande', label: 'Grande', fatias: 8, preco: 49.9, icon: '🍕', desc: '8 pedaços · serve 3 a 4' },
];
const MASSAS = [
  { id: 'normal', label: 'Massa Normal', preco: 0, icon: '🍞', desc: 'Massa tradicional de forno' },
  { id: 'integral', label: 'Massa Integral', preco: 4, icon: '🌾', desc: 'Com farinha integral' },
];
const MOLHOS = [
  { id: 'com-molho', label: 'Com molho', preco: 0, icon: '🍅', desc: 'Molho de tomate tradicional' },
  { id: 'sem-molho', label: 'Sem molho', preco: 0, icon: '🚫', desc: 'Pizza sem molho de tomate' },
];
const RECHEIOS = [
  { id: 'mussarela', label: 'Mussarela', icon: '🧀' },
  { id: 'calabresa', label: 'Calabresa', icon: '🌶️' },
  { id: 'frango', label: 'Frango Desfiado', icon: '🍗' },
  { id: 'bacon', label: 'Bacon', icon: '🥓' },
  { id: 'presunto', label: 'Presunto', icon: '🍖' },
  { id: 'catupiry', label: 'Catupiry', icon: '🧀' },
  { id: 'palmito', label: 'Palmito', icon: '🌱' },
  { id: 'champignon', label: 'Champignon', icon: '🍄' },
  { id: 'milho', label: 'Milho', icon: '🌽' },
  { id: 'ervilha', label: 'Ervilha', icon: '🫛' },
  { id: 'cebola', label: 'Cebola', icon: '🧅' },
  { id: 'tomate', label: 'Tomate', icon: '🍅' },
  { id: 'pimentao', label: 'Pimentão', icon: '🫑' },
  { id: 'queijo-prato', label: 'Queijo Prato', icon: '🧀' },
  { id: 'ovo', label: 'Ovo', icon: '🥚' },
  { id: 'abobrinha', label: 'Abobrinha', icon: '🥒' },
];
const CUSTOM_EMOJIS = ['🥩','🍤','🐟','🧄','🥬','🌽','🍄','🥚','🍖','🫛','🌶️','🥦'];
const MAX_RECHEIOS = 5;

const FOODISH_ENDPOINT = 'https://foodish-api.com/api/images/pizza';
const PIZZA_IMAGE_FALLBACK = 'assets/pizza-fallback.svg';
const PIZZA_IMAGE_CACHE_KEY = 'monta-pizza:foodish-images:v1';
const PIZZA_IMAGE_CACHE_TTL = 1000 * 60 * 60 * 24 * 30;
const PIZZA_IMAGE_SLOTS = ['broto', 'medio', 'grande', 'normal', 'integral', 'com-molho', 'sem-molho', 'sim', 'nao'];
let pizzaImages = {};

const steps = [
  { id: 'tamanho', title: 'Escolha o tamanho', sub: 'O tamanho que combina com a fome de hoje.' },
  { id: 'massa', title: 'Escolha a massa', sub: 'Tradicional ou integral — a base do sabor.' },
  { id: 'molho', title: 'Vai molho?', sub: 'A base leva molho de tomate ou não?' },
  { id: 'recheios', title: 'Escolha os recheios', sub: 'Até 5 ingredientes. Azeitona e orégano confirmam no final.' },
  { id: 'azeitona', title: 'Adicionar azeitona?', sub: 'Não conta nos seus 5 recheios.' },
  { id: 'oregano', title: 'Adicionar orégano?', sub: 'Não conta nos seus 5 recheios.' },
  { id: 'resumo', title: 'Confira o pedido', sub: 'Revise tudo e envie para a produção.' },
];

const state = {
  step: 0, tamanho: null, massa: null, molho: null,
  recheios: [], azeitona: null, oregano: null,
};

const $ = (sel) => document.querySelector(sel);
const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function spot(i, max) {
  const k = i + 1;
  const angle = k * 2.399963;
  const r = (20 + (k % 5) * 7) * (max > 12 ? 0.72 : 0.8);
  return {
    x: Math.round((50 + r * Math.cos(angle)) * 10) / 10,
    y: Math.round((50 + r * Math.sin(angle)) * 10) / 10,
    rot: Math.round((k * 37) % 40 - 20),
  };
}
function ri(base, i) { return base + (i * 13) % 180; }

function buildSteps() {
  $('#steps').innerHTML = steps.map((s, i) => `
    <section class="step" id="step-${i}" data-idx="${i}">
      <div class="step-head">
        <span class="step-index">${String(i + 1).padStart(2, '0')}</span>
        <div>
          <h2 class="step-title">${s.title}</h2>
          <p class="step-sub">${s.sub}</p>
        </div>
      </div>
      <div class="step-body" data-body="${i}"></div>
    </section>`).join('');
}

function pizzaImageMarkup(value, name) {
  const src = pizzaImages[value] || PIZZA_IMAGE_FALLBACK;
  return `<div class="option-media">
    <img class="option-photo" src="${src}" alt="Pizza artesanal ilustrativa para a opção ${name}"
      loading="lazy" decoding="async" onload="this.classList.add('loaded')"
      onerror="this.onerror=null;this.src='${PIZZA_IMAGE_FALLBACK}'">
    <span class="photo-label">Imagem ilustrativa</span>
  </div>`;
}

function optionCard(icon, name, desc, price, value, selected) {
  return `
    <div class="option-card ${selected ? 'selected' : ''}" data-select data-value="${value}">
      ${pizzaImageMarkup(value, name)}
      <div class="option-name">${name}</div>
      ${desc ? `<div class="option-desc">${desc}</div>` : ''}
      ${price > 0 ? `<div class="option-price">+ ${fmt(price)}</div>` : ''}
    </div>`;
}

function readPizzaImageCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(PIZZA_IMAGE_CACHE_KEY));
    if (cached && Number.isFinite(cached.savedAt) && Date.now() >= cached.savedAt
      && Date.now() - cached.savedAt < PIZZA_IMAGE_CACHE_TTL && cached.images) {
      return Object.fromEntries(Object.entries(cached.images).filter(([slot, url]) =>
        PIZZA_IMAGE_SLOTS.includes(slot) && typeof url === 'string'
        && /^https:\/\/foodish-api\.com\/images\/pizza\/[^\s"<>]+$/.test(url)));
    }
  } catch (_) { /* localStorage pode estar indisponível em modo privado */ }
  return {};
}

function savePizzaImageCache(images) {
  try {
    localStorage.setItem(PIZZA_IMAGE_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), images }));
  } catch (_) { /* a reserva local continua funcionando */ }
}

async function loadPizzaImages() {
  pizzaImages = readPizzaImageCache();
  const missing = PIZZA_IMAGE_SLOTS.filter(slot => !pizzaImages[slot]);
  if (!missing.length) return;

  const results = await Promise.allSettled(missing.map(async slot => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(FOODISH_ENDPOINT, { headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error(`Foodish respondeu ${response.status}`);
      const data = await response.json();
      if (typeof data.image !== 'string' || !data.image.startsWith('https://foodish-api.com/images/pizza/')) throw new Error('Imagem inválida');
      return [slot, data.image];
    } finally {
      clearTimeout(timeout);
    }
  }));

  results.forEach(result => {
    if (result.status === 'fulfilled') pizzaImages[result.value[0]] = result.value[1];
  });
  if (Object.keys(pizzaImages).length) savePizzaImageCache(pizzaImages);
}

function renderStep() {
  const idx = state.step;
  const body = $(`[data-body="${idx}"]`);
  const sel = (list, key) => list.map(o => optionCard(o.icon, o.label, o.desc, o.preco, o.id, state[key] && state[key].id === o.id));

  const content = {
    tamanho: `<div class="options-grid">${sel(TAMANHOS, 'tamanho').join('')}</div>`,
    massa: `<div class="options-grid">${sel(MASSAS, 'massa').join('')}</div>`,
    molho: `<div class="options-grid">${sel(MOLHOS, 'molho').join('')}</div>`,
    recheios: `
      <span class="counter">RECH<span><b>${state.recheios.length}</b>/5</span></span>
      <div class="toppings-grid">
        ${RECHEIOS.map(r => `
          <div class="topping ${state.recheios.includes(r.id) ? 'selected' : ''}" data-r="${r.id}">
            <span>${r.icon}</span>${r.label}
          </div>`).join('')}
        <button type="button" class="add-topping" id="btn-add-custom">+ Outro ingrediente</button>
        <div class="custom-input-wrap" id="custom-input-wrap">
          <input type="text" id="custom-input" class="input-text" maxlength="24" placeholder="Ex.: camarão, rúcula..." />
          <button type="button" class="btn btn-primary" id="btn-confirm-custom">Adicionar</button>
        </div>
      </div>`,
    azeitona: `<div class="options-grid">${optionCard('🫒','Sim, com azeitona','Finaliza por cima',0,'sim',state.azeitona === 'sim')}${optionCard('🚫','Não quero azeitona','Sem azeitonas',0,'nao',state.azeitona === 'nao')}</div>`,
    oregano: `<div class="options-grid">${optionCard('🌿','Sim, com orégano','Polvilhado por cima',0,'sim',state.oregano === 'sim')}${optionCard('🚫','Não quero orégano','Sem orégano',0,'nao',state.oregano === 'nao')}</div>`,
    resumo: `<div class="summary-card" id="summary"></div>`,
  }[steps[idx].id];

  body.innerHTML = content;
  if (steps[idx].id === 'recheios') wireRecheios();
  if (steps[idx].id === 'resumo') renderSummary();
  wireOptionCards(idx);
  refreshNav();
}

function wireOptionCards(idx) {
  const body = $(`[data-body="${idx}"]`);
  body.querySelectorAll('[data-select]').forEach(card => {
    card.addEventListener('click', () => {
      const key = steps[idx].id;
      const choices = { tamanho: TAMANHOS, massa: MASSAS, molho: MOLHOS };
      state[key] = choices[key]
        ? choices[key].find(option => option.id === card.dataset.value)
        : card.dataset.value;
      body.querySelectorAll('[data-select]').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      refreshNav();
    });
  });
}

function wireRecheios() {
  const body = $('[data-body="3"]');
  body.querySelectorAll('.topping').forEach(t => t.addEventListener('click', () => toggleRecheio(t.dataset.r)));
  $('#btn-add-custom').addEventListener('click', () => {
    $('#custom-input-wrap').classList.add('open');
    $('#custom-input').focus();
  });
  $('#btn-confirm-custom').addEventListener('click', addCustom);
  $('#custom-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } });
}

function toggleRecheio(id) {
  if (!state.recheios.includes(id) && state.recheios.length >= MAX_RECHEIOS) {
    showToast('Limite de 5 ingredientes atingido');
    return;
  }
  const exists = state.recheios.includes(id);
  state.recheios = exists ? state.recheios.filter(r => r !== id) : [...state.recheios, id];
  renderStep();
}

function addCustom() {
  const input = $('#custom-input');
  const name = input.value.trim();
  if (!name) return;
  if (state.recheios.length >= MAX_RECHEIOS) { showToast('Limite de 5 ingredientes atingido'); return; }
  state.recheios.push('custom:' + name);
  renderStep();
}

function renderSummary() {
  const t = state.tamanho;
  const rec = state.recheios.map(r => r.startsWith('custom:') ? r.slice(7) : RECHEIOS.find(x => x.id === r).label);
  const total = t.preco + state.massa.preco + (state.azeitona === 'sim' ? 1.5 : 0) + (state.oregano === 'sim' ? 0.5 : 0);
  $('#summary').innerHTML = `
    <div class="summary-row"><span>Tamanho</span><span>${t.label} (${t.fatias} fatias)</span></div>
    <div class="summary-row"><span>Massa</span><span>${state.massa.label}</span></div>
    <div class="summary-row"><span>Molho</span><span>${state.molho.label}</span></div>
    <div class="summary-row"><span>Recheios (${rec.length})</span><span>${rec.join(', ')}</span></div>
    <div class="summary-row"><span>Azeitona</span><span>${state.azeitona === 'sim' ? 'Sim' : 'Não'}</span></div>
    <div class="summary-row"><span>Orégano</span><span>${state.oregano === 'sim' ? 'Sim' : 'Não'}</span></div>
    <div class="summary-row total-row"><span>TOTAL</span><span>${fmt(total)}</span></div>`;
}

function renderPizza() {
  const pizza = $('#pizza');
  pizza.className = 'pizza'
    + (state.tamanho ? ' tamanho-' + state.tamanho.id : '')
    + (state.massa && state.massa.id === 'integral' ? ' massa-integral' : '')
    + (!state.tamanho ? ' idle' : '');

  $('#pizza-hint').classList.toggle('hidden', !!state.tamanho);
  $('#pizza-sauce').classList.toggle('on', !!state.molho && state.molho.id === 'com-molho');

  $('#pizza-toppings').innerHTML = state.recheios.map((r, i) => {
    const tipo = RECHEIOS.find(x => x.id === r);
    const emoji = tipo ? tipo.icon : CUSTOM_EMOJIS[i % CUSTOM_EMOJIS.length];
    const p = spot(i, state.recheios.length);
    return `<span class="pizza topping" style="left:${p.x}%;top:${p.y}%;--rot:${p.rot}deg;font-size:${18 + (i % 3) * 3}px;animation-delay:${i * 0.14}s">${emoji}</span>`;
  }).join('');

  const oliveQt = state.tamanho ? { broto: 5, medio: 7, grande: 9 }[state.tamanho.id] : 5;
  $('#pizza-olives').innerHTML = state.azeitona === 'sim'
    ? Array.from({ length: oliveQt }, (_, i) => {
        const p = spot(i, oliveQt);
        return `<span class="pizza olive" style="left:${p.x}%;top:${p.y}%;animation-delay:${ri(180, i)}ms">🫒</span>`;
      }).join('')
    : '';

  $('#pizza-oregano').innerHTML = state.oregano === 'sim'
    ? Array.from({ length: 42 }, (_, i) => {
        const a = i * 2.3999;
        const r = 6 + (i % 7) * 6.5;
        const x = Math.round((50 + r * Math.cos(a)) * 10) / 10;
        const y = Math.round((50 + r * Math.sin(a)) * 10) / 10;
        return `<span class="pizza oregano-spec" style="left:${x}%;top:${y}%;animation-delay:${ri(500, i)}ms"></span>`;
      }).join('')
    : '';

  const cuts = $('#pizza-cuts');
  const fatias = state.tamanho ? state.tamanho.fatias : 8;
  const showCuts = state.step >= 6;
  cuts.classList.toggle('on', showCuts);
  cuts.style.background = showCuts
    ? `repeating-conic-gradient(from 0deg, rgba(60,30,5,0.28) 0deg, rgba(60,30,5,0.28) 0.7deg, transparent 0.7deg, transparent ${360 / fatias}deg)`
    : 'none';

  const partes = [];
  if (state.tamanho) partes.push(state.tamanho.label);
  if (state.massa) partes.push(state.massa.label);
  if (state.molho) partes.push(state.molho.label);
  if (state.recheios.length) partes.push(state.recheios.length + ' recheios');
  if (state.azeitona === 'sim') partes.push('com azeitona');
  if (state.oregano === 'sim') partes.push('com orégano');
  $('#pizza-status').textContent = partes.length ? partes.join(' · ') : 'Escolha o tamanho para começar';

  const legend = $('#pizza-legend');
  const chips = [];
  if (state.tamanho) chips.push(`<li><strong>${state.tamanho.label}</strong></li>`);
  if (state.massa) chips.push(`<li>${state.massa.label}</li>`);
  if (state.molho) chips.push(`<li>${state.molho.label}</li>`);
  if (state.recheios.length) chips.push(`<li><strong>${state.recheios.length}/5</strong> recheios</li>`);
  legend.innerHTML = chips.join('');
}

function validate() {
  switch (steps[state.step].id) {
    case 'tamanho': return !!state.tamanho;
    case 'massa': return !!state.massa;
    case 'molho': return !!state.molho;
    case 'recheios': return state.recheios.length > 0;
    case 'azeitona': return !!state.azeitona;
    case 'oregano': return !!state.oregano;
    case 'resumo': return true;
    default: return false;
  }
}

function refreshNav() {
  renderPizza();
  const last = steps.length - 1;
  $('#btn-next').style.display = state.step < last ? '' : 'none';
  $('#btn-prev').style.display = state.step > 0 ? '' : 'none';
  $('#btn-print').style.display = state.step === last ? '' : 'none';
  $('#btn-restart').style.display = state.step === last ? '' : 'none';
  $('#btn-next').textContent = state.step === last - 1 ? 'Enviar pedido →' : 'Continuar →';
  $('#btn-next').disabled = !validate();
  document.querySelectorAll('.progress li').forEach((li, i) => {
    li.classList.toggle('active', i === state.step);
    li.classList.toggle('done', i < state.step);
  });
}

function goTo(stepIdx) {
  state.step = stepIdx;
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  $('#step-' + stepIdx).classList.add('active');
  renderStep();
  refreshNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function next() {
  if (!validate()) { showToast('Complete a seleção para continuar'); return; }
  if (state.step < steps.length - 1) goTo(state.step + 1);
  else finishOrder();
}

function finishOrder() {
  const t = state.tamanho;
  const rec = state.recheios.map(r => r.startsWith('custom:') ? r.slice(7) : RECHEIOS.find(x => x.id === r).label);
  const total = t.preco + state.massa.preco + (state.azeitona === 'sim' ? 1.5 : 0) + (state.oregano === 'sim' ? 0.5 : 0);
  const now = new Date();
  const dataHora = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  $('#comanda').innerHTML = `
    <div class="comanda-title">Pedido da Monta Pizza</div>
    <div class="comanda-sub">Ordem de produção · ${dataHora}</div>
    <div class="comanda-line"><span>Pizza</span><b>${t.label} · ${t.fatias} fatias</b></div>
    <div class="comanda-line"><span>Massa</span><b>${state.massa.label}</b></div>
    <div class="comanda-line"><span>Molho</span><b>${state.molho.label}</b></div>
    <div class="comanda-line"><span>Recheios</span><b>${rec.length} ingredientes</b></div>
    <div class="comanda-line"><span>Azeitona</span><b>${state.azeitona === 'sim' ? 'SIM' : 'NÃO'}</b></div>
    <div class="comanda-line"><span>Orégano</span><b>${state.oregano === 'sim' ? 'SIM' : 'NÃO'}</b></div>
    <div class="comanda-section">
      <h3>Passo a passo para o pizzaiolo</h3>
      <ol class="comanda-steps">
        <li>Abrir a massa ${state.massa.label}</li>
        <li>${state.molho.id === 'com-molho' ? 'Espalhar molho de tomate na base' : 'Não aplicar molho (pedido sem molho)'}</li>
        <li>Distribuir recheios na ordem: <b>${rec.join(' + ').toLowerCase()}</b></li>
        ${state.azeitona === 'sim' ? '<li>Adicionar azeitonas por cima</li>' : '<li>Não adicionar azeitonas</li>'}
        ${state.oregano === 'sim' ? '<li>Polvilhar orégano por cima</li>' : '<li>Não polvilhar orégano</li>'}
        <li>Assar até dourar</li>
        <li>Cortar em ${t.fatias} fatias</li>
      </ol>
    </div>
    <div class="comanda-total">Total: ${fmt(total)}</div>
    <div class="comanda-footer">Aguardando cliente retirar · Boa pizza! 🍕</div>`;

  $('#comanda-view').hidden = false;
  $('#comanda-view').scrollIntoView({ behavior: 'smooth' });
  showToast('Pedido enviado para a produção!');
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 2200);
}

$('#btn-next').addEventListener('click', next);
$('#btn-prev').addEventListener('click', () => goTo(state.step - 1));
$('#btn-print').addEventListener('click', () => window.print());
$('#btn-restart').addEventListener('click', () => {
  Object.assign(state, { step: 0, tamanho: null, massa: null, molho: null, recheios: [], azeitona: null, oregano: null });
  $('#comanda-view').hidden = true;
  goTo(0);
});

buildSteps();
goTo(0);
loadPizzaImages().then(() => {
  document.querySelectorAll('.option-photo').forEach(img => {
    const slot = img.closest('[data-select]').dataset.value;
    if (pizzaImages[slot]) {
      img.classList.remove('loaded');
      img.src = pizzaImages[slot];
    }
  });
}).catch(() => {});

