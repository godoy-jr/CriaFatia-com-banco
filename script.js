
const TAMANHOS = [
  { id: 'broto', label: 'Broto', fatias: 4, preco: 29.9, desc: '4 pedaços · serve 1 a 2' },
  { id: 'medio', label: 'Médio', fatias: 6, preco: 39.9, desc: '6 pedaços · serve 2 a 3' },
  { id: 'grande', label: 'Grande', fatias: 8, preco: 49.9, desc: '8 pedaços · serve 3 a 4' },
];
const MASSAS = [
  { id: 'normal', label: 'Massa Normal', preco: 0, desc: 'Massa tradicional de forno' },
  { id: 'integral', label: 'Massa Integral', preco: 4, desc: 'Com farinha integral' },
];
const MOLHOS = [
  { id: 'com-molho', label: 'Com molho', preco: 0, desc: 'Molho de tomate tradicional' },
  { id: 'sem-molho', label: 'Sem molho', preco: 0, desc: 'Pizza sem molho de tomate' },
];
const RECHEIOS = [
  { id: 'mussarela', label: 'Mussarela' },
  { id: 'calabresa', label: 'Calabresa' },
  { id: 'frango', label: 'Frango Desfiado' },
  { id: 'bacon', label: 'Bacon' },
  { id: 'presunto', label: 'Presunto' },
  { id: 'catupiry', label: 'Catupiry' },
  { id: 'palmito', label: 'Palmito' },
  { id: 'champignon', label: 'Champignon' },
  { id: 'milho', label: 'Milho' },
  { id: 'ervilha', label: 'Ervilha' },
  { id: 'cebola', label: 'Cebola' },
  { id: 'tomate', label: 'Tomate' },
  { id: 'pimentao', label: 'Pimentão' },
  { id: 'queijo-prato', label: 'Queijo Prato' },
  { id: 'ovo', label: 'Ovo' },
  { id: 'abobrinha', label: 'Abobrinha' },
];
const MAX_RECHEIOS = 5;

const FOODISH_ENDPOINT = 'https://foodish-api.com/api/images/pizza';
const PIZZA_IMAGE_FALLBACK = 'assets/pizza-fallback.svg';
const PIZZA_IMAGE_CACHE_KEY = 'cria-fatia:menu-photo:v1';
const PIZZA_IMAGE_CACHE_TTL = 1000 * 60 * 60 * 24 * 30;
let menuPizzaImage = PIZZA_IMAGE_FALLBACK;

const steps = [
  { id: 'tamanho', title: 'Escolha o tamanho', sub: 'O tamanho que combina com a fome de hoje.' },
  { id: 'massa', title: 'Escolha a massa', sub: 'Tradicional ou integral — a base do sabor.' },
  { id: 'molho', title: 'Vai molho?', sub: 'A base leva molho de tomate ou não?' },
  { id: 'sabores', title: 'Monte os sabores', sub: 'Escolha de 1 a 3 sabores e até 5 ingredientes para cada um.' },
  { id: 'azeitona', title: 'Adicionar azeitona?', sub: 'Não conta nos seus 5 recheios.' },
  { id: 'oregano', title: 'Adicionar orégano?', sub: 'Não conta nos seus 5 recheios.' },
  { id: 'resumo', title: 'Confira o pedido', sub: 'Revise tudo e envie para a produção.' },
];

const state = {
  step: 0, tamanho: null, massa: null, molho: null,
  quantidadeSabores: 0, sabores: [], azeitona: null, oregano: null,
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

function ingredienteLabel(id) {
  if (id.startsWith('custom:')) return id.slice(7);
  return RECHEIOS.find(item => item.id === id)?.label || id;
}

function createSabores(amount, previous = []) {
  return Array.from({ length: amount }, (_, index) => ({
    ingredientes: [...(previous[index]?.ingredientes || [])],
  }));
}

function sectorPolygon(index, amount) {
  if (amount === 1) return 'circle(50% at 50% 50%)';
  const start = -90 + index * (360 / amount);
  const points = ['50% 50%'];
  for (let angle = start; angle <= start + 360 / amount + 0.1; angle += 4) {
    const rad = angle * Math.PI / 180;
    points.push(`${50 + 52 * Math.cos(rad)}% ${50 + 52 * Math.sin(rad)}%`);
  }
  return `polygon(${points.join(',')})`;
}

function sectorSpot(itemIndex, flavorIndex, amount) {
  if (amount === 1) return spot(itemIndex, 5);
  const width = 360 / amount;
  const center = -90 + flavorIndex * width + width / 2;
  const offsets = [-0.22, 0.18, -0.08, 0.28, 0.03];
  const radii = [27, 29, 38, 37, 18];
  const angle = (center + offsets[itemIndex % 5] * width) * Math.PI / 180;
  const radius = radii[itemIndex % 5];
  return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle), rot: (itemIndex * 31) % 34 - 17 };
}

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

function menuPizzaImageMarkup() {
  return `<figure class="flavor-menu-photo">
    <img id="flavor-menu-photo" src="${menuPizzaImage}" alt="Pizza pronta usada como imagem ilustrativa"
      loading="lazy" decoding="async"
      onerror="this.onerror=null;this.src='${PIZZA_IMAGE_FALLBACK}'">
    <figcaption>Imagem ilustrativa</figcaption>
  </figure>`;
}

function optionCard(name, desc, price, value, selected) {
  return `
    <div class="option-card ${selected ? 'selected' : ''}" data-select data-value="${value}">
      <div class="option-name">${name}</div>
      ${desc ? `<div class="option-desc">${desc}</div>` : ''}
      ${price > 0 ? `<div class="option-price">+ ${fmt(price)}</div>` : ''}
    </div>`;
}

function readMenuPizzaImageCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(PIZZA_IMAGE_CACHE_KEY));
    if (cached && Number.isFinite(cached.savedAt)
      && Date.now() >= cached.savedAt
      && Date.now() - cached.savedAt < PIZZA_IMAGE_CACHE_TTL
      && typeof cached.image === 'string'
      && /^https:\/\/foodish-api\.com\/images\/pizza\/[^\s"<>]+$/.test(cached.image)) {
      return cached.image;
    }
  } catch (_) { /* O SVG local continua disponível sem localStorage. */ }
  return null;
}

function saveMenuPizzaImageCache(image) {
  try {
    localStorage.setItem(PIZZA_IMAGE_CACHE_KEY, JSON.stringify({ image, savedAt: Date.now() }));
  } catch (_) { /* O SVG local continua disponível sem localStorage. */ }
}

function updateMenuPizzaImage() {
  const image = document.querySelector('#flavor-menu-photo');
  if (image && image.src !== menuPizzaImage) image.src = menuPizzaImage;
}

async function loadMenuPizzaImage() {
  const cached = readMenuPizzaImageCache();
  if (cached) {
    menuPizzaImage = cached;
    updateMenuPizzaImage();
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(FOODISH_ENDPOINT, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) return;
    const data = await response.json();
    if (typeof data.image !== 'string'
      || !/^https:\/\/foodish-api\.com\/images\/pizza\/[^\s"<>]+$/.test(data.image)) return;
    menuPizzaImage = data.image;
    saveMenuPizzaImageCache(menuPizzaImage);
    updateMenuPizzaImage();
  } catch (_) { /* Falha de rede: mantém a ilustração local. */ }
  finally { clearTimeout(timeout); }
}

function renderStep() {
  const idx = state.step;
  const body = $(`[data-body="${idx}"]`);
  const sel = (list, key) => list.map(o => optionCard(o.label, o.desc, o.preco, o.id, state[key] && state[key].id === o.id));

  const content = {
    tamanho: `<div class="options-grid">${sel(TAMANHOS, 'tamanho').join('')}</div>`,
    massa: `<div class="options-grid">${sel(MASSAS, 'massa').join('')}</div>`,
    molho: `<div class="options-grid">${sel(MOLHOS, 'molho').join('')}</div>`,
    sabores: `
      ${menuPizzaImageMarkup()}
      <div class="flavor-count" aria-label="Quantidade de sabores">
        ${[1, 2, 3].map(amount => `<button type="button" class="flavor-count-btn ${state.quantidadeSabores === amount ? 'selected' : ''}" data-flavor-count="${amount}">${amount} sabor${amount > 1 ? 'es' : ''}</button>`).join('')}
      </div>
      <div class="flavors-builder">
        ${state.sabores.map((sabor, flavorIndex) => `
          <section class="flavor-section" data-flavor="${flavorIndex}">
            <div class="flavor-head">
              <div><h3>Sabor ${flavorIndex + 1}</h3>${sabor.ingredientes.length ? `<p class="flavor-ingredients">${sabor.ingredientes.map(ingredienteLabel).join(' · ')}</p>` : '<p class="flavor-ingredients empty">Nenhum ingrediente escolhido</p>'}</div>
              <span class="counter"><b>${sabor.ingredientes.length}</b>/5</span>
            </div>
            <div class="toppings-grid">
              ${RECHEIOS.map(r => `<button type="button" class="topping-choice ${sabor.ingredientes.includes(r.id) ? 'selected' : ''}" data-r="${r.id}" data-flavor="${flavorIndex}" aria-pressed="${sabor.ingredientes.includes(r.id)}"><span class="topping-name">${r.label}</span></button>`).join('')}
              <button type="button" class="add-topping" data-add-custom="${flavorIndex}">+ Outro ingrediente</button>
              <div class="custom-input-wrap" data-custom-wrap="${flavorIndex}">
                <input type="text" class="input-text" data-custom-input="${flavorIndex}" maxlength="24" placeholder="Ex.: camarão, rúcula..." />
                <button type="button" class="btn btn-primary" data-confirm-custom="${flavorIndex}">Adicionar</button>
              </div>
            </div>
          </section>`).join('')}
      </div>`,
    azeitona: `<div class="options-grid">${optionCard('Sim, com azeitona','Finaliza por cima',0,'sim',state.azeitona === 'sim')}${optionCard('Não quero azeitona','Sem azeitonas',0,'nao',state.azeitona === 'nao')}</div>`,
    oregano: `<div class="options-grid">${optionCard('Sim, com orégano','Polvilhado por cima',0,'sim',state.oregano === 'sim')}${optionCard('Não quero orégano','Sem orégano',0,'nao',state.oregano === 'nao')}</div>`,
    resumo: `<div class="summary-card" id="summary"></div>`,
  }[steps[idx].id];

  body.innerHTML = content;
  if (steps[idx].id === 'sabores') wireSabores();
  if (steps[idx].id === 'resumo') renderSummary();
  if (steps[idx].id !== 'sabores') wireOptionCards(idx);
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

function wireSabores() {
  const body = $('[data-body="3"]');
  body.querySelectorAll('[data-flavor-count]').forEach(button => button.addEventListener('click', () => {
    const amount = Number(button.dataset.flavorCount);
    state.quantidadeSabores = amount;
    state.sabores = createSabores(amount, state.sabores);
    renderStep();
  }));
  body.querySelectorAll('.topping-choice').forEach(button => button.addEventListener('click', () => {
    toggleIngrediente(Number(button.dataset.flavor), button.dataset.r);
  }));
  body.querySelectorAll('[data-add-custom]').forEach(button => button.addEventListener('click', () => {
    const flavorIndex = Number(button.dataset.addCustom);
    body.querySelector(`[data-custom-wrap="${flavorIndex}"]`).classList.add('open');
    body.querySelector(`[data-custom-input="${flavorIndex}"]`).focus();
  }));
  body.querySelectorAll('[data-confirm-custom]').forEach(button => button.addEventListener('click', () => {
    addCustom(Number(button.dataset.confirmCustom));
  }));
  body.querySelectorAll('[data-custom-input]').forEach(input => input.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); addCustom(Number(input.dataset.customInput)); }
  }));
}

function toggleIngrediente(flavorIndex, id) {
  const ingredientes = state.sabores[flavorIndex].ingredientes;
  if (!ingredientes.includes(id) && ingredientes.length >= MAX_RECHEIOS) {
    showToast(`O sabor ${flavorIndex + 1} já tem 5 ingredientes`);
    return;
  }
  state.sabores[flavorIndex].ingredientes = ingredientes.includes(id)
    ? ingredientes.filter(item => item !== id)
    : [...ingredientes, id];
  renderStep();
}

function addCustom(flavorIndex) {
  const input = document.querySelector(`[data-custom-input="${flavorIndex}"]`);
  const name = input.value.trim();
  if (!name) return;
  if (state.sabores[flavorIndex].ingredientes.length >= MAX_RECHEIOS) {
    showToast(`O sabor ${flavorIndex + 1} já tem 5 ingredientes`);
    return;
  }
  state.sabores[flavorIndex].ingredientes.push('custom:' + name);
  renderStep();
}

function renderSummary() {
  const t = state.tamanho;
  const total = t.preco + state.massa.preco + (state.azeitona === 'sim' ? 1.5 : 0) + (state.oregano === 'sim' ? 0.5 : 0);
  $('#summary').innerHTML = `
    <div class="summary-row"><span>Tamanho</span><span>${t.label} (${t.fatias} fatias)</span></div>
    <div class="summary-row"><span>Massa</span><span>${state.massa.label}</span></div>
    <div class="summary-row"><span>Molho</span><span>${state.molho.label}</span></div>
    <div class="summary-row"><span>Sabores</span><span>${state.quantidadeSabores}</span></div>
    ${state.sabores.map((sabor, index) => `<div class="summary-row flavor-summary"><span>Sabor ${index + 1}</span><span>${sabor.ingredientes.map(ingredienteLabel).join(', ')}</span></div>`).join('')}
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

  const toppingsLayer = $('#pizza-toppings');
  toppingsLayer.innerHTML = state.sabores.map((sabor, flavorIndex) => `
    <div class="pizza-flavor-layer" style="clip-path:${sectorPolygon(flavorIndex, state.quantidadeSabores)}">
      ${sabor.ingredientes.map((id, itemIndex) => {
        const p = sectorSpot(itemIndex, flavorIndex, state.quantidadeSabores);
        const toppingId = id.startsWith('custom:') ? 'custom' : id;
        return `<span class="pizza-topping-piece topping-${toppingId}" aria-hidden="true" style="left:${p.x}%;top:${p.y}%;--rot:${p.rot}deg;animation-delay:${itemIndex * 0.11}s"></span>`;
      }).join('')}
    </div>`).join('');
  toppingsLayer.style.background = state.quantidadeSabores > 1
    ? `repeating-conic-gradient(from -90deg, rgba(80,35,8,.5) 0deg, rgba(80,35,8,.5) 1deg, transparent 1deg, transparent ${360 / state.quantidadeSabores}deg)`
    : 'none';

  const oliveQt = state.tamanho ? { broto: 5, medio: 7, grande: 9 }[state.tamanho.id] : 5;
  $('#pizza-olives').innerHTML = state.azeitona === 'sim'
    ? Array.from({ length: oliveQt }, (_, i) => {
        const p = spot(i, oliveQt);
        return `<span class="pizza-olive-piece" aria-hidden="true" style="left:${p.x}%;top:${p.y}%;animation-delay:${ri(180, i)}ms"></span>`;
      }).join('')
    : '';

  $('#pizza-oregano').innerHTML = state.oregano === 'sim'
    ? Array.from({ length: 42 }, (_, i) => {
        const a = i * 2.3999;
        const r = 6 + (i % 7) * 6.5;
        const x = Math.round((50 + r * Math.cos(a)) * 10) / 10;
        const y = Math.round((50 + r * Math.sin(a)) * 10) / 10;
        return `<span class="pizza-oregano-piece" style="left:${x}%;top:${y}%;animation-delay:${ri(500, i)}ms"></span>`;
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
  if (state.quantidadeSabores) partes.push(state.quantidadeSabores + (state.quantidadeSabores === 1 ? ' sabor' : ' sabores'));
  if (state.azeitona === 'sim') partes.push('com azeitona');
  if (state.oregano === 'sim') partes.push('com orégano');
  $('#pizza-status').textContent = partes.length ? partes.join(' · ') : 'Escolha o tamanho para começar';

  const legend = $('#pizza-legend');
  const chips = [];
  if (state.tamanho) chips.push(`<li><strong>${state.tamanho.label}</strong></li>`);
  if (state.massa) chips.push(`<li>${state.massa.label}</li>`);
  if (state.molho) chips.push(`<li>${state.molho.label}</li>`);
  if (state.quantidadeSabores) chips.push(`<li><strong>${state.quantidadeSabores}</strong> ${state.quantidadeSabores === 1 ? 'sabor' : 'sabores'}</li>`);
  legend.innerHTML = chips.join('');
}

function validate() {
  switch (steps[state.step].id) {
    case 'tamanho': return !!state.tamanho;
    case 'massa': return !!state.massa;
    case 'molho': return !!state.molho;
    case 'sabores': return state.quantidadeSabores > 0 && state.sabores.length === state.quantidadeSabores && state.sabores.every(sabor => sabor.ingredientes.length > 0);
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
  const total = t.preco + state.massa.preco + (state.azeitona === 'sim' ? 1.5 : 0) + (state.oregano === 'sim' ? 0.5 : 0);
  const now = new Date();
  const dataHora = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  $('#comanda').innerHTML = `
    <div class="comanda-title">Pedido da Cria Fatia</div>
    <div class="comanda-sub">Ordem de produção · ${dataHora}</div>
    <div class="comanda-line"><span>Pizza</span><b>${t.label} · ${t.fatias} fatias</b></div>
    <div class="comanda-line"><span>Massa</span><b>${state.massa.label}</b></div>
    <div class="comanda-line"><span>Molho</span><b>${state.molho.label}</b></div>
    <div class="comanda-line"><span>Sabores</span><b>${state.quantidadeSabores}</b></div>
    ${state.sabores.map((sabor, index) => `<div class="comanda-line"><span>Sabor ${index + 1}</span><b>${sabor.ingredientes.map(ingredienteLabel).join(' + ')}</b></div>`).join('')}
    <div class="comanda-line"><span>Azeitona</span><b>${state.azeitona === 'sim' ? 'SIM' : 'NÃO'}</b></div>
    <div class="comanda-line"><span>Orégano</span><b>${state.oregano === 'sim' ? 'SIM' : 'NÃO'}</b></div>
    <div class="comanda-section">
      <h3>Passo a passo para o pizzaiolo</h3>
      <ol class="comanda-steps">
        <li>Abrir a massa ${state.massa.label}</li>
        <li>${state.molho.id === 'com-molho' ? 'Espalhar molho de tomate na base' : 'Não aplicar molho (pedido sem molho)'}</li>
        ${state.sabores.map((sabor, index) => `<li>Montar o sabor ${index + 1} em ${state.quantidadeSabores === 1 ? 'toda a pizza' : `1/${state.quantidadeSabores} da pizza`}: <b>${sabor.ingredientes.map(ingredienteLabel).join(' + ').toLowerCase()}</b></li>`).join('')}
        ${state.azeitona === 'sim' ? '<li>Adicionar azeitonas por cima</li>' : '<li>Não adicionar azeitonas</li>'}
        ${state.oregano === 'sim' ? '<li>Polvilhar orégano por cima</li>' : '<li>Não polvilhar orégano</li>'}
        <li>Assar até dourar</li>
        <li>Cortar em ${t.fatias} fatias</li>
      </ol>
    </div>
    <div class="comanda-total">Total: ${fmt(total)}</div>
    <div class="comanda-footer">Aguardando cliente retirar · Boa pizza!</div>`;

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
  Object.assign(state, { step: 0, tamanho: null, massa: null, molho: null, quantidadeSabores: 0, sabores: [], azeitona: null, oregano: null });
  $('#comanda-view').hidden = true;
  goTo(0);
});

buildSteps();
goTo(0);
loadMenuPizzaImage();
