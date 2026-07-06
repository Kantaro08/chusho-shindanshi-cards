let cards = [];
let filtered = [];
let index = 0;
let flipped = false;

const known = new Set(JSON.parse(localStorage.getItem("knownCards") || "[]"));
const els = {
  cardCount: document.querySelector("#cardCount"),
  knownCount: document.querySelector("#knownCount"),
  position: document.querySelector("#position"),
  search: document.querySelector("#search"),
  subjectFilter: document.querySelector("#subjectFilter"),
  prev: document.querySelector("#prevButton"),
  flip: document.querySelector("#flipButton"),
  next: document.querySelector("#nextButton"),
  bottomPrev: document.querySelector("#bottomPrev"),
  bottomFlip: document.querySelector("#bottomFlip"),
  bottomNext: document.querySelector("#bottomNext"),
  known: document.querySelector("#knownButton"),
  shuffle: document.querySelector("#shuffleButton"),
  card: document.querySelector("#card"),
  subject: document.querySelector("#subject"),
  importance: document.querySelector("#importance"),
  term: document.querySelector("#term"),
  diagram: document.querySelector("#diagram"),
  hint: document.querySelector("#hint"),
  answer: document.querySelector("#answer"),
  sourceBadge: document.querySelector("#sourceBadge"),
  count: document.querySelector("#count"),
  example: document.querySelector("#example"),
  sources: document.querySelector("#sources"),
};

async function boot() {
  if (Array.isArray(window.__CARDS__)) {
    cards = window.__CARDS__;
  } else {
    try {
      const response = await fetch("data/cards.json", { cache: "no-store" });
      if (!response.ok) throw new Error("cards.json not found");
      cards = await response.json();
    } catch {
      cards = [];
    }
  }
  filtered = [...cards];
  setupFilters();
  bind();
  render();
}

function setupFilters() {
  const subjects = new Set(cards.map(card => card.subject).filter(Boolean));
  for (const subject of [...subjects].sort((a, b) => a.localeCompare(b, "ja"))) {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    els.subjectFilter.append(option);
  }
}

function bind() {
  els.search.addEventListener("input", applyFilters);
  els.subjectFilter.addEventListener("change", applyFilters);
  els.prev.addEventListener("click", () => move(-1));
  els.next.addEventListener("click", () => move(1));
  els.bottomPrev.addEventListener("click", () => move(-1));
  els.bottomNext.addEventListener("click", () => move(1));
  els.flip.addEventListener("click", flip);
  els.bottomFlip.addEventListener("click", flip);
  els.known.addEventListener("click", toggleKnown);
  els.shuffle.addEventListener("click", shuffle);
  els.card.addEventListener("click", event => {
    if (event.target.closest("a,button")) return;
    flip();
  });
  window.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
    if (event.key === " ") {
      event.preventDefault();
      flip();
    }
  });
  let startX = 0;
  els.card.addEventListener("touchstart", event => startX = event.changedTouches[0].clientX, { passive: true });
  els.card.addEventListener("touchend", event => {
    const dx = event.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) move(dx > 0 ? -1 : 1);
  }, { passive: true });
}

function applyFilters() {
  const query = els.search.value.trim().toLowerCase();
  const subject = els.subjectFilter.value;
  filtered = cards.filter(card => {
    const text = `${card.term} ${card.back} ${card.point} ${card.example}`.toLowerCase();
    return (!query || text.includes(query)) && (!subject || card.subject === subject);
  });
  index = 0;
  flipped = false;
  render();
}

function move(delta) {
  if (!filtered.length) return;
  index = (index + delta + filtered.length) % filtered.length;
  flipped = false;
  render();
}

function flip() {
  flipped = !flipped;
  render();
}

function toggleKnown() {
  const card = filtered[index];
  if (!card) return;
  if (known.has(card.id)) known.delete(card.id);
  else known.add(card.id);
  localStorage.setItem("knownCards", JSON.stringify([...known]));
  render();
}

function shuffle() {
  for (let i = filtered.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }
  index = 0;
  flipped = false;
  render();
}

function render() {
  els.cardCount.textContent = `${cards.length} cards`;
  els.knownCount.textContent = `${known.size} known`;
  els.position.textContent = filtered.length ? `${index + 1} / ${filtered.length}` : "0 / 0";
  const card = filtered[index];
  if (!card) {
    els.subject.textContent = "NO DATA";
    els.importance.textContent = "-";
    els.term.textContent = "カードがありません";
    els.hint.textContent = "条件を変えるか、データを再生成してください。";
    els.answer.replaceChildren();
    els.diagram.replaceChildren();
    els.count.textContent = "-";
    els.example.textContent = "-";
    els.sources.replaceChildren();
    return;
  }
  els.subject.textContent = card.subject || "診断士";
  els.importance.textContent = card.importance || "B";
  els.term.textContent = card.term;
  els.hint.textContent = flipped ? card.point : "タップで解説。まずは自分の言葉で定義してみる。";
  els.answer.replaceChildren();
  if (flipped) {
    els.answer.append(paragraph(card.back), paragraph(`例: ${card.example || "過去問の文脈と合わせて確認。"}`));
  }
  els.diagram.innerHTML = diagramSvg(card.diagram);
  els.count.textContent = `${card.totalCount || 0} 回`;
  els.example.textContent = card.point || "-";
  els.sourceBadge.textContent = card.explanationSource ? `解説: ${card.explanationSource}` : "";
  els.known.textContent = known.has(card.id) ? "未習得に戻す" : "覚えた";
  els.card.classList.toggle("is-known", known.has(card.id));
  renderSources(card.sources || []);
}

function paragraph(text) {
  const p = document.createElement("p");
  p.textContent = text;
  return p;
}

function renderSources(sources) {
  els.sources.replaceChildren(...sources.slice(0, 3).map(source => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = source.url;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = source.title || new URL(source.url).hostname;
    li.append(a);
    return li;
  }));
}

function diagramSvg(type) {
  const diagrams = {
    demand: `<svg viewBox="0 0 320 180"><path d="M45 145H290M55 155V20" class="axis"/><path d="M82 42L255 136" class="line accent"/><text x="250" y="124">D</text><text x="16" y="28">P</text><text x="284" y="166">Q</text></svg>`,
    supply: `<svg viewBox="0 0 320 180"><path d="M45 145H290M55 155V20" class="axis"/><path d="M82 136L255 42" class="line accent"/><text x="250" y="50">S</text><text x="16" y="28">P</text><text x="284" y="166">Q</text></svg>`,
    equilibrium: `<svg viewBox="0 0 320 180"><path d="M45 145H290M55 155V20" class="axis"/><path d="M80 42L250 136" class="line"/><path d="M80 136L250 42" class="line accent"/><circle cx="165" cy="89" r="5" class="dot"/><text x="172" y="84">E</text><text x="252" y="130">D</text><text x="252" y="51">S</text></svg>`,
    elasticity: `<svg viewBox="0 0 320 180"><path d="M45 145H290M55 155V20" class="axis"/><path d="M80 55L260 120" class="line"/><path d="M135 42L170 140" class="line accent"/><text x="74" y="48">弾力的</text><text x="176" y="139">非弾力的</text></svg>`,
    indifference: `<svg viewBox="0 0 320 180"><path d="M45 145H290M55 155V20" class="axis"/><path d="M82 132C135 126 169 102 202 48" class="line accent"/><path d="M72 62L255 142" class="line"/><circle cx="154" cy="96" r="5" class="dot"/><text x="210" y="52">U</text><text x="226" y="136">予算線</text></svg>`,
    budget: `<svg viewBox="0 0 320 180"><path d="M45 145H290M55 155V20" class="axis"/><path d="M65 35L260 145" class="line accent"/><text x="95" y="76">予算制約線</text></svg>`,
    cost: `<svg viewBox="0 0 320 180"><path d="M45 145H290M55 155V20" class="axis"/><path d="M75 132C120 54 200 54 258 132" class="line"/><path d="M86 142C134 120 184 44 246 28" class="line accent"/><text x="205" y="43">MC</text><text x="234" y="129">AC</text></svg>`,
    "is-lm": `<svg viewBox="0 0 320 180"><path d="M45 145H290M55 155V20" class="axis"/><path d="M82 45L252 132" class="line"/><path d="M82 132L252 45" class="line accent"/><text x="245" y="128">IS</text><text x="244" y="54">LM</text><text x="18" y="28">r</text><text x="284" y="166">Y</text></svg>`,
    lorenz: `<svg viewBox="0 0 320 180"><path d="M45 145H290M55 155V20" class="axis"/><path d="M55 145L255 35" class="line"/><path d="M55 145C120 142 184 114 255 35" class="line accent"/><text x="190" y="68">完全平等線</text><text x="145" y="130">ローレンツ曲線</text></svg>`,
    npv: `<svg viewBox="0 0 320 180"><path d="M45 145H290M55 155V20" class="axis"/><rect x="70" y="114" width="28" height="31" class="bar negative"/><rect x="120" y="85" width="28" height="60" class="bar"/><rect x="170" y="68" width="28" height="77" class="bar"/><rect x="220" y="54" width="28" height="91" class="bar"/><text x="65" y="108">投資</text><text x="118" y="80">CF</text></svg>`,
    irr: `<svg viewBox="0 0 320 180"><path d="M45 110H290M55 155V20" class="axis"/><path d="M72 42C130 72 194 105 260 140" class="line accent"/><circle cx="190" cy="105" r="5" class="dot"/><text x="199" y="101">NPV=0</text><text x="250" y="154">割引率</text></svg>`,
    wacc: `<svg viewBox="0 0 320 180"><rect x="60" y="50" width="82" height="80" class="box"/><rect x="178" y="50" width="82" height="80" class="box accent-fill"/><text x="78" y="95">負債</text><text x="194" y="95">株主資本</text><text x="95" y="150">加重平均 = WACC</text></svg>`,
    capm: `<svg viewBox="0 0 320 180"><path d="M45 145H290M55 155V20" class="axis"/><path d="M70 125L260 35" class="line accent"/><text x="175" y="65">SML</text><text x="18" y="28">期待収益率</text><text x="260" y="166">β</text></svg>`,
    frontier: `<svg viewBox="0 0 320 180"><path d="M45 145H290M55 155V20" class="axis"/><path d="M90 135C115 78 170 36 250 34" class="line accent"/><text x="168" y="51">効率的フロンティア</text><text x="18" y="28">収益</text><text x="256" y="166">リスク</text></svg>`,
    "break-even": `<svg viewBox="0 0 320 180"><path d="M45 145H290M55 155V20" class="axis"/><path d="M72 130L260 45" class="line accent"/><path d="M72 110L260 110" class="line"/><circle cx="116" cy="110" r="5" class="dot"/><text x="124" y="105">BEP</text></svg>`,
    ratio: `<svg viewBox="0 0 320 180"><rect x="60" y="40" width="200" height="30" class="bar"/><rect x="60" y="88" width="140" height="30" class="bar accent-fill"/><text x="66" y="61">総資本</text><text x="66" y="109">自己資本</text></svg>`,
    swot: matrixSvg(["Strength", "Weakness", "Opportunity", "Threat"]),
    "five-forces": `<svg viewBox="0 0 320 180"><rect x="125" y="72" width="70" height="36" class="box accent-fill"/><text x="139" y="95">競争</text><text x="134" y="28">新規参入</text><text x="20" y="95">売り手</text><text x="246" y="95">買い手</text><text x="132" y="160">代替品</text><path d="M160 38V70M72 90H122M198 90H246M160 110V145" class="arrow"/></svg>`,
    vrio: matrixSvg(["Value", "Rarity", "Imitability", "Organization"]),
    matrix: matrixSvg(["既存市場", "新市場", "既存製品", "新製品"]),
    ppm: matrixSvg(["花形", "問題児", "金のなる木", "負け犬"]),
    flow: `<svg viewBox="0 0 320 180"><rect x="45" y="70" width="55" height="40" class="box"/><rect x="132" y="70" width="55" height="40" class="box"/><rect x="219" y="70" width="55" height="40" class="box"/><path d="M101 90H130M188 90H217" class="arrow"/><text x="56" y="95">前工程</text><text x="143" y="95">後工程</text><text x="232" y="95">顧客</text></svg>`,
    inventory: `<svg viewBox="0 0 320 180"><path d="M45 145H290M55 155V20" class="axis"/><path d="M70 45L120 130L121 55L175 130L176 55L230 130" class="line accent"/><path d="M60 118H260" class="line dashed"/><text x="64" y="113">発注点</text></svg>`,
    pert: `<svg viewBox="0 0 320 180"><circle cx="55" cy="90" r="18" class="node"/><circle cx="150" cy="50" r="18" class="node"/><circle cx="150" cy="130" r="18" class="node"/><circle cx="255" cy="90" r="18" class="node"/><path d="M73 84L132 57M73 96L132 123M168 57L237 84M168 123L237 96" class="arrow"/><text x="50" y="95">1</text><text x="145" y="55">2</text><text x="145" y="135">3</text><text x="250" y="95">4</text></svg>`,
    normal: `<svg viewBox="0 0 320 180"><path d="M45 145H290M55 155V20" class="axis"/><path d="M70 140C115 140 120 55 160 55C200 55 205 140 250 140" class="line accent"/><path d="M95 35V145M225 35V145" class="line dashed"/><text x="86" y="30">LSL</text><text x="216" y="30">USL</text></svg>`,
    system: `<svg viewBox="0 0 320 180">${["販売","購買","生産","会計"].map((t,i)=>`<rect x="${55+i*58}" y="62" width="48" height="48" class="box"/><text x="${64+i*58}" y="91">${t}</text>`).join("")}<path d="M78 118H252" class="line accent"/><text x="112" y="145">統合DB</text></svg>`,
    sql: `<svg viewBox="0 0 320 180"><rect x="55" y="35" width="210" height="110" class="box"/><path d="M55 65H265M55 95H265M55 125H265M125 35V145M195 35V145" class="line"/><text x="77" y="56">id</text><text x="142" y="56">商品</text><text x="212" y="56">売上</text></svg>`,
    normalization: `<svg viewBox="0 0 320 180"><rect x="40" y="55" width="90" height="70" class="box"/><rect x="190" y="35" width="90" height="45" class="box"/><rect x="190" y="105" width="90" height="45" class="box"/><path d="M132 86H188M132 86L188 127" class="arrow"/><text x="56" y="92">受注明細</text><text x="206" y="62">商品</text><text x="206" y="132">顧客</text></svg>`,
    security: `<svg viewBox="0 0 320 180"><rect x="80" y="60" width="160" height="85" rx="8" class="box"/><path d="M105 60V42C105 16 215 16 215 42V60" class="line accent"/><text x="124" y="110">暗号・署名</text></svg>`,
    ip: matrixSvg(["特許", "実用新案", "意匠", "商標"]),
    law: `<svg viewBox="0 0 320 180"><rect x="70" y="35" width="180" height="110" class="box"/><path d="M95 65H225M95 92H225M95 119H190" class="line"/><text x="112" y="154">条文・要件・効果</text></svg>`,
    policy: `<svg viewBox="0 0 320 180"><circle cx="90" cy="90" r="34" class="node"/><circle cx="170" cy="90" r="34" class="node accent-fill"/><circle cx="250" cy="90" r="34" class="node"/><path d="M124 90H136M204 90H216" class="arrow"/><text x="73" y="95">企業</text><text x="153" y="95">制度</text><text x="233" y="95">支援</text></svg>`,
    formula: `<svg viewBox="0 0 320 180"><rect x="50" y="55" width="220" height="70" class="box"/><text x="76" y="98">式・関係を暗記</text></svg>`,
    table: `<svg viewBox="0 0 320 180"><rect x="60" y="40" width="200" height="100" class="box"/><path d="M60 73H260M60 106H260M126 40V140M193 40V140" class="line"/></svg>`,
    none: ""
  };
  return diagrams[type] || "";
}

function matrixSvg(labels) {
  return `<svg viewBox="0 0 320 180"><rect x="50" y="32" width="220" height="116" class="box"/><path d="M160 32V148M50 90H270" class="line"/><text x="78" y="68">${labels[0]}</text><text x="184" y="68">${labels[1]}</text><text x="78" y="126">${labels[2]}</text><text x="184" y="126">${labels[3]}</text></svg>`;
}

boot();
