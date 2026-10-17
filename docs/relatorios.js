// ============================================================
// QL web · etapa 2: Relatório de Efetividade, Resumo por Loja, QL Orçado e impressão do quadro
// Usa os utilitários e o estado do app.js (carregado antes).
// ============================================================

// arredondamento do Python (round "do banqueiro": 2,5 → 2; 3,5 → 4) para o % bater com o Streamlit
function roundPy(x) {
  const f = Math.floor(x), d = x - f;
  if (Math.abs(d - 0.5) < 1e-9) return f % 2 === 0 ? f : f + 1;
  return Math.round(x);
}
const pct = (a, b) => (b > 0 ? roundPy((a / b) * 100) : 0);
const fmtMoeda = (v) => (v == null || v === "" || isNaN(+v) ? "-" : "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const fmtInt = (v) => (v == null || v === "" || isNaN(+v) ? "-" : String(Math.trunc(+v)));
const lojaCurta = (l) => `Loja ${p2(l)}`;
function baixarCSV(nome, linhas) {
  const csv = "﻿" + linhas.map((l) => l.map((v) => { const t = String(v ?? ""); return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; }).join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = nome; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
const carimbo = () => { const h = new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }); return h.slice(0, 16).replace(/[-: ]/g, "").replace(/^(\d{8})/, "$1_"); };
const escopoAtual = () => (sessao.loja_fixa != null ? String(sessao.loja_fixa) : est.escopo);

// ============================================================
// RESUMO DE SITUAÇÃO POR LOJA
// ============================================================
const DIAS_DEMITIDOS_RESUMO = 30;
function telaResumo() {
  const hoje = lerData(dados.hoje) || hojeSP();
  const ini = somaDias(hoje, -DIAS_DEMITIDOS_RESUMO);
  const demRecente = (r) => ehDemitido(r) && (() => { const d = lerData(r.afast); return !!d && d >= ini && d <= hoje; })();
  const lojas = [...new Set(linhas.map((r) => r.loja))].sort((a, b) => a - b);
  const cols = [["Ativos", ehAtivo], ["Férias", ehFerias], ["Demitidos", demRecente], ["Afastados", ehAfastado], ["Alterados", (r) => r.alterado], ["Admitidos", (r) => r.admRecente]];
  const tab = lojas.map((l) => { const rs = linhas.filter((r) => r.loja === l); return [lojaCurta(l), ...cols.map(([, f]) => rs.filter(f).length)]; });
  if (tab.length > 1) tab.push(["Total", ...cols.map((_, i) => tab.reduce((s, t) => s + t[i + 1], 0))]);
  const agora = dataHora(new Date().toISOString());
  let h = `<div class="pagina"><div class="cartao"><h3>Situação por loja<small>${esc(agora)}</small></h3>
    <p class="nota" style="margin-bottom:12px">Foto atual do quadro. Ativos, Férias, Afastados e Alterados seguem a mesma contagem dos cards do quadro.
    <b>Demitidos</b> considera só desligamentos dos últimos ${DIAS_DEMITIDOS_RESUMO} dias (Data Afastamento de ${dataBR(ini)} até hoje).
    <b>Admitidos</b> considera admissões dos últimos ${DIAS_ADMISSAO} dias.</p>`;
  if (!tab.length) h += '<p class="vazio-msg">Nenhum registro nesta seleção.</p>';
  else {
    h += `<div class="tabela-wrap"><table class="resumo num"><thead><tr><th>Loja</th>${["Ativos", "Férias", "Demitidos", "Afastados", "Alterados", "Admitidos"].map((c, i) => `<th><i class="pt k-${CARDS[i][0]}"></i>${c}</th>`).join("")}</tr></thead><tbody>
      ${tab.map((t) => `<tr${t[0] === "Total" ? ' class="total"' : ""}>${t.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <div style="margin-top:14px"><button type="button" class="btn btn-borda" id="res-csv">${IC.pdf}Baixar resumo (CSV)</button></div>`;
  }
  $("#conteudo").innerHTML = h + "</div></div>";
  const b = $("#res-csv");
  if (b) b.onclick = () => baixarCSV(`Resumo_Situacao_${nomeEscopo(escopoAtual()).replace(/\W+/g, "_")}_${carimbo()}.csv`, [["Loja", ...cols.map((c) => c[0])], ...tab]);
}

// ============================================================
// RELATÓRIO DE EFETIVIDADE
// ============================================================
const efet = { dados: null, chave: "", ini: null, fim: null, incluirSaidos: false, carregando: false };
const COR_EF = { req: "#7A8CA0", ab: "#D6006C", dp: "#0093E9", rh: "#00A389" };
const ROT_EF = { req: "Requisições", ab: "Abertas", dp: "Concluídas DP", rh: "Concluídas RH" };

function periodoPadrao() {
  const h = hojeSP();
  return [new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth(), 1)), h];
}
function mesesAtalho() {
  const h = hojeSP(), out = [];
  for (let i = 0; i < 6; i++) {
    const ini = new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth() - i, 1));
    const fimMes = new Date(Date.UTC(ini.getUTCFullYear(), ini.getUTCMonth() + 1, 0));
    out.push({ ini, fim: i === 0 ? h : fimMes, nome: ini.toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(". de ", "/").replace(".", ""), aberto: i === 0 });
  }
  return out;
}

async function buscarEfet(escopo) {
  return rpc("ql_web_efetividade", { p_token: sessao.token, p_escopo: escopo, p_inicio: dataISO(efet.ini), p_fim: dataISO(efet.fim) });
}

// cálculo ao vivo — mesma regra do app.py (Análise de Preenchimento por Período de Abertura)
function calcularEfet(d, ini, fim, incluirSaidos) {
  const linhasRel = d.registros.map((r) => {
    const dAb = lerData(r.ab), dAd = lerData(r.ad);
    const temAd = !!dAd;
    const conc = temAd && dAd >= ini && dAd <= fim;
    const temReq = !!dAb || temAd;
    const abertaAteFim = temReq && (!dAb || dAb <= fim);
    const naoFechadaAntes = !temAd || dAd >= ini;
    const aberta = (abertaAteFim && naoFechadaAntes) || conc;
    const atendida = String(r.st ?? "").trim().toUpperCase() === "REQUISIÇÃO ATENDIDA";
    const concRH = atendida && temAd && dAd >= ini && dAd <= fim;
    const dias = concRH && dAb ? Math.round((dAd - dAb) / 86400000) : null;          // tempo para preencher
    const idade = aberta && !concRH && dAb ? Math.round((fim - dAb) / 86400000) : null; // há quantos dias aberta (no fim do período)
    return { loja: Number(r.l), nome: titulo(r.n), dept: limpar(r.d), funcao: limpar(r.f), ab: fmtBR(r.ab), ad: fmtBR(r.ad), st: limpar(r.st),
      aberta, conc, concRH, dias: dias != null && dias >= 0 ? dias : null, idade, atendidaSemData: atendida && !temAd, atendidaFora: atendida && temAd && !concRH };
  });
  const porLoja = (lista) => { const m = new Map(); for (const x of lista) { if (!m.has(x.l)) m.set(x.l, new Map()); if (!m.get(x.l).has(x.nn)) m.get(x.l).set(x.nn, x); } return m; };
  const roster = porLoja(d.roster), ledger = porLoja(d.ledger);
  const pessoas = new Map();
  const saidos = [];
  for (const [l, m] of ledger) for (const [nn, x] of m) if (!roster.get(l)?.has(nn)) saidos.push({ ...x, saiu: true });
  for (const [l, m] of roster) pessoas.set(l, new Map([...m].map(([k, v]) => [k, { ...v, saiu: false }])));
  if (incluirSaidos) for (const x of saidos) { if (!pessoas.has(x.l)) pessoas.set(x.l, new Map()); pessoas.get(x.l).set(x.nn, x); }

  const lojas = new Set([...linhasRel.filter((r) => r.aberta).map((r) => r.loja), ...pessoas.keys()]);
  const tabela = [...lojas].sort((a, b) => a - b).map((l) => {
    const rs = linhasRel.filter((r) => r.loja === l && r.aberta);
    const req = rs.length, rh = rs.filter((r) => r.concRH).length;
    return { l, req, ab: req - rh, dp: pessoas.get(l)?.size || 0, rh, pct: pct(rh, req) };
  });
  const concRHporLoja = new Map(tabela.map((t) => [t.l, t.rh]));
  return { linhasRel, tabela, pessoas, saidos, concRHporLoja, vazio: !linhasRel.some((r) => r.aberta) && ![...pessoas.values()].some((m) => m.size) };
}

async function telaEfetividade() {
  if (!efet.ini) [efet.ini, efet.fim] = periodoPadrao();
  const escopo = escopoAtual();
  const chave = `${escopo}|${dataISO(efet.ini)}|${dataISO(efet.fim)}`;
  if (efet.chave !== chave || !efet.dados) {
    $("#conteudo").innerHTML = '<div class="cartao vazio-msg">Carregando o relatório…</div>';
    try {
      efet.dados = await buscarEfet(escopo);
      efet.chave = chave;
    } catch (e) {
      $("#conteudo").innerHTML = `<div class="cartao"><p class="erro">${esc(e.message)}</p></div>`;
      return;
    }
    if (pagina() !== "efet") return;
    await congelarSePreciso();
  }
  desenharEfet();
}

// período já encerrado e ainda sem foto congelada: calcula para a rede toda e congela
// (o Streamlit congelava só as lojas da tela; aqui sempre vão todas, para não faltar loja)
async function congelarSePreciso() {
  const d = efet.dados;
  const hoje = lerData(d.hoje);
  if (efet.incluirSaidos || !(efet.fim < hoje) || (d.snapshot && d.snapshot.length) || !d.pode_congelar) return;
  try {
    const todas = await buscarEfet("TR");
    const c = calcularEfet(todas, efet.ini, efet.fim, false);
    if (!c.tabela.length) return;
    await rpc("ql_web_fechamento_salvar", { p_token: sessao.token, p_inicio: dataISO(efet.ini), p_fim: dataISO(efet.fim),
      p_linhas: c.tabela.map((t) => ({ l: t.l, req: t.req, ab: t.ab, dp: t.dp, rh: t.rh })) });
  } catch (e) { console.warn("congelamento", e); }
}

function tabelaFinal(d, c) {
  // período fechado com foto congelada: Requisições e Concluídas DP vêm da foto;
  // Concluídas RH é sempre ao vivo (vale a Data Admissão) e Abertas = Requisições − Concluídas RH
  const snap = !efet.incluirSaidos && d.snapshot && d.snapshot.length && efet.fim < lerData(d.hoje);
  if (!snap) return { linhas: c.tabela, snap: false };
  const esc_ = d.lojas_escopo;
  const linhas = d.snapshot.filter((s) => !esc_ || esc_.includes(s.l)).map((s) => {
    const rh = c.concRHporLoja.get(s.l) || 0;
    return { l: s.l, req: s.req, dp: s.dp, rh, ab: Math.max(0, s.req - rh), pct: pct(rh, s.req) };
  });
  return { linhas, snap: true };
}

function desenharEfet() {
  const d = efet.dados;
  const c = calcularEfet(d, efet.ini, efet.fim, efet.incluirSaidos);
  const { linhas: tab, snap } = tabelaFinal(d, c);
  const tot = tab.reduce((a, t) => ({ req: a.req + t.req, ab: a.ab + t.ab, dp: a.dp + t.dp, rh: a.rh + t.rh }), { req: 0, ab: 0, dp: 0, rh: 0 });
  tot.pct = pct(tot.rh, tot.req);
  // tempo para preencher (Data Abertura → Data Admissão das Concluídas RH) e vagas abertas há mais de 30 dias
  const media = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
  const tempo = (l) => {
    const rs = c.linhasRel.filter((r) => r.aberta && (l == null || r.loja === l));
    return { media: media(rs.map((r) => r.dias).filter((x) => x != null)), velhas: rs.filter((r) => r.idade != null && r.idade > 30).length };
  };
  tab.forEach((t) => Object.assign(t, tempo(t.l)));
  Object.assign(tot, tempo(null));
  const txtDias = (v) => (v == null ? "-" : `${v} dia${v === 1 ? "" : "s"}`);

  const meses = mesesAtalho();
  const iguais = (a, b) => a && b && a.getTime() === b.getTime();
  let h = `<div class="pagina"><div class="cartao"><div class="ef-filtros">
    <label class="campo"><span>Data início (abertura)</span><input type="date" id="ef-ini" value="${dataISO(efet.ini)}"></label>
    <label class="campo"><span>Data fim (abertura)</span><input type="date" id="ef-fim" value="${dataISO(efet.fim)}"></label>
    <div class="ef-meses">${meses.map((m, i) => `<button type="button" class="mes${iguais(m.ini, efet.ini) && iguais(m.fim, efet.fim) ? " sel" : ""}" data-mes="${i}">${esc(m.nome)}${m.aberto ? " · até hoje" : ""}</button>`).join("")}</div>
    <label class="check ef-saidos"><input type="checkbox" id="ef-saidos"${efet.incluirSaidos ? " checked" : ""}> Incluir admitidos que já saíram (histórico acumulado)</label>
  </div></div>`;

  if (c.vazio) {
    $("#conteudo").innerHTML = h + '<div class="cartao vazio-msg">Nenhuma abertura ou admissão encontrada no período selecionado para esta(s) loja(s).</div></div>';
    ligarFiltrosEfet(meses);
    return;
  }

  h += `<div class="kpis4">
    <div class="kpi k-ALTERADOS" style="--cor:${COR_EF.req}"><strong class="num">${tot.req}</strong><span>Requisições</span><small>abertas e/ou concluídas no período</small></div>
    <div class="kpi k-ADMITIDOS" style="--cor:${COR_EF.ab}"><strong class="num">${tot.ab}</strong><span>Abertas</span><small>sem Requisição atendida no período</small></div>
    <div class="kpi" style="--cor:${COR_EF.dp}"><strong class="num">${tot.dp}</strong><span>Concluídas DP</span><small>admitidos no Senior</small></div>
    <div class="kpi" style="--cor:${COR_EF.rh}"><strong class="num">${tot.rh} <em class="ef-pct ${tot.pct >= 50 ? "bom" : "ruim"}">${tot.pct}%</em></strong><span>Concluídas RH</span><small>base do % · preenchidas em ${tot.media == null ? "-" : tot.media + " dias"} em média</small></div></div>`;

  h += `<div class="cartao"><h3>Por loja<small>gerado em ${esc(dataHora(new Date().toISOString()))}</small></h3>
    <div class="legenda">${Object.keys(ROT_EF).map((k) => `<span><i style="background:${COR_EF[k]}"></i>${ROT_EF[k]}</span>`).join("")}<span><b class="ef-pct-leg">%</b> = Concluídas RH ÷ Requisições</span></div>
    <div class="grafico-wrap" id="ef-grafico">${graficoEfet(tab, tot)}<div class="dica-graf" id="ef-dica" hidden></div></div></div>`;

  h += `<div class="cartao"><div class="tabela-wrap"><table class="resumo num"><thead><tr><th>Loja</th><th>Requisições</th><th>Abertas</th><th>Concluídas DP</th><th>Concluídas RH</th><th>%</th><th title="Média de dias entre a Data Abertura e a Data Admissão das vagas Concluídas RH">Tempo médio p/ preencher</th><th title="Vagas ainda abertas no fim do período com mais de 30 dias desde a Data Abertura">Abertas há +30 dias</th></tr></thead><tbody>
    ${[...tab, { l: "Total", ...tot }].map((t) => `<tr${t.l === "Total" ? ' class="total"' : ""}><td>${t.l === "Total" ? "Total" : lojaCurta(t.l)}</td><td>${t.req}</td><td>${t.ab}</td><td>${t.dp}</td><td>${t.rh}</td><td><span class="ef-pct ${t.pct >= 50 ? "bom" : "ruim"}">${t.pct}%</span></td><td>${txtDias(t.media)}</td><td>${t.velhas ? `<span class="idade i3">${t.velhas}</span>` : "0"}</td></tr>`).join("")}
    </tbody></table></div><div style="margin-top:12px"><button type="button" class="btn btn-borda" id="ef-csv">${IC.pdf}Baixar tabela (CSV)</button></div></div>`;

  h += diagnosticoEfet(d, c, tab, tot, snap);
  $("#conteudo").innerHTML = h + "</div>";
  ligarFiltrosEfet(meses);
  ligarGrafico(tab, tot);
  $("#ef-csv").onclick = () => baixarCSV(`Efetividade_${dataISO(efet.ini)}_${dataISO(efet.fim)}_${nomeEscopo(escopoAtual()).replace(/\W+/g, "_")}.csv`,
    [["Loja", "Requisições", "Abertas", "Concluídas DP", "Concluídas RH", "%", "Tempo médio p/ preencher (dias)", "Abertas há +30 dias"], ...tab.map((t) => [lojaCurta(t.l), t.req, t.ab, t.dp, t.rh, t.pct + "%", t.media ?? "", t.velhas]), ["Total", tot.req, tot.ab, tot.dp, tot.rh, tot.pct + "%", tot.media ?? "", tot.velhas]]);
}

function ligarFiltrosEfet(meses) {
  const mudar = (ini, fim) => { if (!ini || !fim || fim < ini) return toast("Período inválido.", "erro"); efet.ini = ini; efet.fim = fim; efet.dados = null; telaEfetividade(); };
  $("#ef-ini").onchange = (e) => mudar(lerData(e.target.value), efet.fim);
  $("#ef-fim").onchange = (e) => mudar(efet.ini, lerData(e.target.value));
  $$(".ef-meses [data-mes]").forEach((b) => { b.onclick = () => { const m = meses[+b.dataset.mes]; mudar(m.ini, m.fim); }; });
  $("#ef-saidos").onchange = (e) => { efet.incluirSaidos = e.target.checked; desenharEfet(); };
}

// gráfico de barras agrupadas (SVG), um grupo por loja + Total, % em cima de cada grupo
function graficoEfet(tab, tot) {
  const grupos = [...tab.map((t) => ({ ...t, nome: lojaCurta(t.l) })), { ...tot, nome: "Total" }];
  const W = Math.max(640, grupos.length * 92), H = 340, base = H - 40, topo = 46;
  const max = Math.max(1, ...grupos.map((g) => g.req));
  const esc_y = (v) => ((base - topo) * v) / max;
  const gw = W / grupos.length, bw = Math.min(18, (gw - 22) / 4), gap = 2;
  let s = `<svg class="grafico" viewBox="0 0 ${W} ${H}" role="img" aria-label="Requisições, abertas e concluídas por loja">`;
  for (let i = 0; i <= 4; i++) { const y = base - ((base - topo) * i) / 4; s += `<line class="grade-l" x1="0" x2="${W}" y1="${y}" y2="${y}"/>`; }
  grupos.forEach((g, i) => {
    const x0 = i * gw + (gw - (4 * bw + 3 * gap)) / 2;
    if (g.nome === "Total") s += `<rect class="faixa-total" x="${i * gw + 4}" y="${topo - 34}" width="${gw - 8}" height="${base - topo + 60}" rx="10"/>`;
    ["req", "ab", "dp", "rh"].forEach((k, j) => {
      const v = g[k], hgt = esc_y(v), x = x0 + j * (bw + gap), y = base - hgt;
      if (v > 0) s += `<path d="M${x},${base} V${y + Math.min(4, hgt)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 V${base} Z" fill="${COR_EF[k]}"/>`;
      s += `<text class="val" x="${x + bw / 2}" y="${y - 5}" text-anchor="middle">${v}</text>`;
    });
    const yTop = base - esc_y(Math.max(g.req, g.ab, g.dp, g.rh));
    s += `<text class="pct ${g.pct > 0 ? "on" : ""}" x="${i * gw + gw / 2}" y="${Math.max(16, yTop - 24)}" text-anchor="middle">${g.pct}%</text>`;
    s += `<text class="rot" x="${i * gw + gw / 2}" y="${H - 14}" text-anchor="middle">${esc(g.nome)}</text>`;
    s += `<rect class="alvo" data-g="${i}" x="${i * gw}" y="0" width="${gw}" height="${H}"/>`;
  });
  s += `<line class="eixo" x1="0" x2="${W}" y1="${base}" y2="${base}"/></svg>`;
  return s;
}
function ligarGrafico(tab, tot) {
  const grupos = [...tab.map((t) => ({ ...t, nome: lojaCurta(t.l) })), { ...tot, nome: "Total" }];
  const wrap = $("#ef-grafico"), dica = $("#ef-dica");
  wrap.addEventListener("mousemove", (e) => {
    const alvo = e.target.closest(".alvo");
    if (!alvo) { dica.hidden = true; return; }
    const g = grupos[+alvo.dataset.g];
    dica.innerHTML = `<b>${esc(g.nome)}</b>${["req", "ab", "dp", "rh"].map((k) => `<div><i style="background:${COR_EF[k]}"></i>${ROT_EF[k]}<span>${g[k]}</span></div>`).join("")}<div class="tot">% Concluídas RH<span>${g.pct}%</span></div>`;
    const r = wrap.getBoundingClientRect();
    dica.hidden = false;
    let x = e.clientX - r.left + 14; if (x + 200 > r.width) x = e.clientX - r.left - 214;
    dica.style.left = x + "px"; dica.style.top = Math.max(0, e.clientY - r.top - 40) + "px";
  });
  wrap.addEventListener("mouseleave", () => (dica.hidden = true));
}

function diagnosticoEfet(d, c, tab, tot, snap) {
  const situ = (r) => (r.concRH ? "Concluída RH" : r.atendidaFora ? "Atendida — admissão após o período" : r.atendidaSemData ? "Atendida sem Data Admissão" : r.conc ? "Admitida DP (sem RH)" : "Em aberto");
  const ord = (a, b) => a.loja - b.loja || cmp(a.nome, b.nome);
  const req = c.linhasRel.filter((r) => r.aberta).sort(ord);
  const rh = req.filter((r) => r.concRH);
  const dp = [...c.pessoas.values()].flatMap((m) => [...m.values()]).map((x) => ({ loja: x.l, nome: titulo(x.n), dept: limpar(x.d), funcao: limpar(x.f), ad: fmtBR(x.ad), saiu: x.saiu })).sort(ord);
  const sai = c.saidos.map((x) => ({ loja: x.l, nome: titulo(x.n), dept: limpar(x.d), funcao: limpar(x.f), ad: fmtBR(x.ad) })).sort(ord);
  const tabela = (cab, rs, f) => rs.length ? `<div class="tabela-wrap"><table class="simples"><thead><tr>${cab.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rs.map((r) => `<tr>${f(r).map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : '<p class="nota">Nenhum.</p>';
  return `<details class="cartao diag"><summary><b>Diagnóstico da contagem (conferência)</b></summary>
    <ul class="nota diag-lista">
      <li>Modo de contagem: <b>${efet.incluirSaidos ? "histórico acumulado (inclui quem já saiu)" : "quadro atual do Senior (só quem permaneceu)"}</b>${snap ? " · Requisições e Concluídas DP deste período estão <b>congeladas</b> (período encerrado)" : ""}</li>
      <li><b>Requisições</b> no período: ${tot.req} · <b>Abertas</b>: ${tot.ab} · <b>Concluídas DP</b>: ${tot.dp} · <b>Concluídas RH</b> (base do %): ${tot.rh}</li>
      <li>Admitidos no período que <b>já saíram</b> do Senior: ${sai.length} (${efet.incluirSaidos ? "incluídos" : "não incluídos"} na conta)</li>
    </ul>
    <h4>Vagas contadas como Requisições (${req.length})</h4>${tabela(["Loja", "Nome", "Dept", "Função", "Data Abertura", "Data Admissão", "Situação", "Dias"], req, (r) => [p2(r.loja), r.nome, r.dept, r.funcao, r.ab, r.ad, situ(r), r.dias != null ? r.dias + " p/ preencher" : r.idade != null ? r.idade + " em aberto" : ""])}
    <h4>Pessoas contadas como Admitidas DP (${dp.length})</h4>${tabela(["Loja", "Nome admitido", "Dept", "Função", "Data Admissão", "Situação"], dp, (r) => [p2(r.loja), r.nome, r.dept, r.funcao, r.ad, r.saiu ? "Já saiu" : "No Senior"])}
    <h4>Vagas contadas como Admitidas RH (${rh.length})</h4>${tabela(["Loja", "Nome", "Dept", "Função", "Status RH", "Data Abertura", "Data Admissão"], rh, (r) => [p2(r.loja), r.nome, r.dept, r.funcao, r.st, r.ab, r.ad])}
    ${sai.length ? `<h4>Admitidos no período que já saíram (${sai.length})</h4>${tabela(["Loja", "Nome admitido", "Dept", "Função", "Data Admissão"], sai, (r) => [p2(r.loja), r.nome, r.dept, r.funcao, r.ad])}` : ""}
  </details>`;
}

// ============================================================
// QL ORÇADO (organograma)
// ============================================================
const CORES_DEPT = {
  "GERÊNCIA": ["#0B3D63", "#FFFFFF"], "FRENTE CAIXA": ["#14507F", "#FFFFFF"], "LOJA": ["#2E86C1", "#FFFFFF"], "AÇOUGUE": ["#C0392B", "#FFFFFF"],
  "HORTFRUTI": ["#1E5631", "#FFFFFF"], "FRIOS": ["#34495E", "#FFFFFF"], "PADARIA": ["#F0B27A", "#22303C"], "CONFEITARIA": ["#F0B27A", "#22303C"],
  "ROTISSERIA": ["#F0B27A", "#22303C"], "DEPÓSITO": ["#5D6D7E", "#FFFFFF"], "ADMINISTRATIVO": ["#566573", "#FFFFFF"],
};
const orc = { editando: false, lojaEdicao: null };

function visaoOrcado() {
  const escopo = escopoAtual();
  const total = isNaN(+escopo);
  const todos = dados.orcado || [];
  const lojas = [...new Set(todos.map((o) => o.l))].sort((a, b) => a - b);
  let itens, params;
  if (total) {
    const m = new Map();
    for (const o of todos) {
      const k = o.d + "|" + o.f;
      const x = m.get(k) || { d: o.d, f: o.f, q: 0, c: true, od: Infinity, of: Infinity };
      x.q += Number(o.q || 0); x.c = x.c && o.c !== false; x.od = Math.min(x.od, o.od ?? 0); x.of = Math.min(x.of, o.of ?? 0);
      m.set(k, x);
    }
    itens = [...m.values()].sort((a, b) => a.od - b.od || a.of - b.of);
    const ps = (dados.parametros || []).filter((p) => lojas.includes(p.l));
    const soma = (k) => (ps.length ? ps.reduce((s, p) => s + Number(p[k] || 0), 0) : null);
    params = { venda: soma("venda"), media_6_meses: soma("media_6_meses"), proposta_quant: soma("proposta_quant"),
      venda_por_funcionario: ps.length ? ps.reduce((s, p) => s + Number(p.venda_por_funcionario || 0), 0) / ps.length : null,
      abertura_seg_sab: "08:00 as 21:00", abertura_domingo: "08:00 as 20:00" };
  } else {
    itens = todos.filter((o) => o.l === +escopo).sort((a, b) => (a.od ?? 0) - (b.od ?? 0) || (a.of ?? 0) - (b.of ?? 0));
    params = (dados.parametros || []).find((p) => p.l === +escopo) || {};
  }
  // Real = Ativos + Férias do quadro, só nas lojas que têm orçado
  const real = linhas.filter((r) => lojas.includes(r.loja) && (ehAtivo(r) || ehFerias(r))).length;
  return { total, itens, params, real, lojas };
}

function telaOrcado() {
  const v = visaoOrcado();
  const pode = podeTotal();
  let h = '<div class="pagina">';
  if (v.total && escopoAtual() !== "TL") h += '<div class="aviso">O QL Orçado existe só para as Lojas 01 a 08. O comparativo Orçado x Real abaixo considera só essas lojas.</div>';
  if (!v.itens.length) { $("#conteudo").innerHTML = h + '<div class="cartao vazio-msg">Nenhum valor orçado cadastrado para esta seleção (o orçado existe só para as Lojas 01 a 08).</div></div>'; return; }
  const totalGeral = v.itens.filter((i) => i.c !== false).reduce((s, i) => s + Number(i.q || 0), 0);
  const dif = v.real - totalGeral;
  const P = v.params;
  h += `<div class="cartao org"><div class="org-titulo">${v.total ? "QL Orçado — Total Lojas (01 a 08)" : "QL Orçado — " + esc(lojaCurta(+escopoAtual()))}</div>
    <div class="org-kpis">${[["Venda", fmtMoeda(P.venda)], ["Média 6 Meses", fmtMoeda(P.media_6_meses)], ["Venda R$ / Funcionário", fmtMoeda(P.venda_por_funcionario)], ["Proposta Quant", fmtInt(P.proposta_quant)], ["Seg a Sáb", P.abertura_seg_sab || "-"], ["Domingos", P.abertura_domingo || "-"]]
      .map(([a, b]) => `<div class="org-kpi"><span>${a}</span><b class="num">${esc(b)}</b></div>`).join("")}</div><div class="org-depts">`;
  const depts = [...new Set(v.itens.map((i) => i.d))];
  for (const d of depts) {
    const [bg, fg] = CORES_DEPT[d] || ["#0B3D63", "#FFFFFF"];
    const fs = v.itens.filter((i) => i.d === d);
    h += `<div class="org-col"><div class="org-dept" style="background:${bg};color:${fg}">${esc(d)}</div>
      ${fs.map((f) => `<div class="org-func"><div style="background:${bg};color:${fg}">${esc(f.f)}${f.c === false ? " *" : ""}</div><b class="num${+f.q === 0 ? " zero" : ""}">${f.q}</b></div>`).join("")}
      <div class="org-func org-tot"><div>Total</div><b class="num">${fs.reduce((s, f) => s + Number(f.q || 0), 0)}</b></div></div>`;
  }
  h += `</div><div class="org-rodape">
    <div class="org-big"><span>Total (Orçado)</span><b class="num">${totalGeral}</b></div>
    <div class="org-big"><span>Real (Ativos + Férias)</span><b class="num">${v.real}</b></div>
    <div class="org-big ${dif <= 0 ? "bom" : "ruim"}"><span>Diferença</span><b class="num">${dif > 0 ? "+" + dif : dif}</b></div></div>
    <p class="nota" style="text-align:center;margin-top:10px">* Funções marcadas não entram no Total geral (ex.: Aprendiz), seguindo o critério da planilha. Real = Ativos + Férias do quadro atual.</p></div>`;
  if (pode) h += `<div class="cartao"><h3>Editar valores orçados<small>analista e RH</small></h3>${formOrcado(v)}</div>`;
  $("#conteudo").innerHTML = h + "</div>";
  if (pode) ligarFormOrcado();
}

function formOrcado(v) {
  const lojas = v.total ? v.lojas : [+escopoAtual()];
  if (!lojas.length) return "";
  if (!lojas.includes(orc.lojaEdicao)) orc.lojaEdicao = lojas[0];
  const l = orc.lojaEdicao;
  const itens = (dados.orcado || []).filter((o) => o.l === l).sort((a, b) => (a.od ?? 0) - (b.od ?? 0) || (a.of ?? 0) - (b.of ?? 0));
  const p = (dados.parametros || []).find((x) => x.l === l) || {};
  const num = (n, val, step) => `<input type="number" name="${n}" min="0" step="${step}" value="${val == null ? "" : val}">`;
  let h = `<form id="form-orc" autocomplete="off">`;
  if (v.total) h += `<label class="campo" style="max-width:240px;margin-bottom:12px"><span>Loja para editar</span><select id="orc-loja">${lojas.map((x) => `<option value="${x}"${x === l ? " selected" : ""}>${lojaCurta(x)}</option>`).join("")}</select></label>`;
  h += `<div class="orc-params">
    <label class="campo"><span>Venda (R$)</span>${num("venda", p.venda, "0.01")}</label>
    <label class="campo"><span>Média 6 Meses (R$)</span>${num("media_6_meses", p.media_6_meses, "0.01")}</label>
    <label class="campo"><span>Venda R$ / Funcionário</span>${num("venda_por_funcionario", p.venda_por_funcionario, "0.01")}</label>
    <label class="campo"><span>Proposta Quant</span>${num("proposta_quant", p.proposta_quant, "1")}</label></div>
    <p class="nota" style="margin:8px 0 12px">O <b>Real</b> é calculado sozinho (Ativos + Férias do quadro), não precisa digitar.</p>
    <div class="tabela-wrap"><table class="simples orc-tab"><thead><tr><th>Departamento</th><th>Função</th><th>Qtd orçada</th><th>Conta no total?</th></tr></thead><tbody>
    ${itens.map((o, i) => `<tr data-i="${i}" data-d="${esc(o.d)}" data-f="${esc(o.f)}"><td>${esc(o.d)}</td><td>${esc(o.f)}</td><td><input type="number" min="0" step="1" class="orc-q" value="${o.q}"></td><td><input type="checkbox" class="orc-c"${o.c !== false ? " checked" : ""}></td></tr>`).join("")}
    </tbody></table></div>
    <div style="margin-top:14px"><button type="submit" class="btn btn-primario" id="orc-salvar">Salvar orçado da ${lojaCurta(l)}</button></div></form>`;
  return h;
}
function ligarFormOrcado() {
  const sel = $("#orc-loja");
  if (sel) sel.onchange = () => { orc.lojaEdicao = +sel.value; telaOrcado(); };
  $("#form-orc").onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target, btn = $("#orc-salvar");
    const itens = $$("tbody tr", f).map((tr) => ({ departamento: tr.dataset.d, funcao: tr.dataset.f, quantidade: Math.max(0, Math.trunc(+$(".orc-q", tr).value || 0)), conta_no_total: $(".orc-c", tr).checked }));
    const params = Object.fromEntries(["venda", "media_6_meses", "venda_por_funcionario", "proposta_quant"].map((k) => [k, f.elements[k].value]));
    btn.disabled = true; btn.textContent = "Gravando…";
    try {
      const r = await rpc("ql_web_orcado_salvar", { p_token: sessao.token, p_loja: orc.lojaEdicao, p_itens: itens, p_params: params });
      toast(`Orçado da ${lojaCurta(orc.lojaEdicao)} salvo (${r.alterados} função(ões) alterada(s)).`, "ok");
      await carregar(true);
    } catch (err) { toast(err.message, "erro"); btn.disabled = false; btn.textContent = "Salvar"; }
  };
}

// ============================================================
// IMPRESSÃO / PDF DO QUADRO (substitui o pdf_quadro.py)
// ============================================================
function imprimirQuadro() {
  const global = isNaN(+dados.escopo);
  const termo = normalizar(est.busca);
  const vis = linhasExibidas().filter((r) => !termo || normalizar(`${r.nome} ${r.candidato} ${r.funcao} ${r.dept}`).includes(termo));
  const c = contar(linhas);
  const m = mapasOrcado();
  const realBase = linhas.filter((r) => (ehAtivo(r) || ehFerias(r)) && (!global || LOJAS_TL.includes(r.loja)));
  const real = (d, f) => realBase.filter((r) => r.dept === d && (f == null || r.funcao === f)).length;
  const txtOrc = (o, rl) => { if (o == null) return ""; const s = o - rl; return ` — Orçado: ${o} | Real: ${rl} | ${s > 0 ? `${s} vaga${s > 1 ? "s" : ""}` : s === 0 ? "completo" : `${-s} acima`}`; };
  const filtro = est.filtro !== "TODOS" ? CARDS.find((x) => x[0] === est.filtro)[1] : "";
  let h = `<header class="imp-cab"><img src="logo.png" alt=""><div><h1>Molicenter — Quadro de Lotação (QL)</h1>
    <p>${esc(nomeEscopo(dados.escopo))} · gerado em ${esc(dataHora(new Date().toISOString()))}${filtro ? " · filtro: " + esc(filtro) : ""}${est.busca ? " · busca: " + esc(est.busca) : ""}</p></div></header>
    <div class="imp-cards">${CARDS.map(([k, nome]) => `<div><b>${c[k]}</b><span>${nome}</span></div>`).join("")}</div>`;
  const depts = [...new Set(vis.map((r) => r.dept).filter((x) => x != null))].sort(cmp);
  if (!depts.length) h += "<p>Nenhum registro encontrado para esta seleção.</p>";
  for (const d of depts) {
    const ld = vis.filter((r) => r.dept === d);
    h += `<section class="imp-dept"><h2>${esc(d)} (${ld.length})<small>${esc(txtOrc(orcDept(m, d), real(d)))}</small></h2>`;
    for (const f of [...new Set(ld.map((r) => r.funcao).filter((x) => x != null))].sort(cmp)) {
      const lf = ld.filter((r) => r.funcao === f);
      h += `<h3>${esc(f)}<small>${esc(txtOrc(orcFunc(m, d, f), real(d, f)))}</small></h3>
        <table><thead><tr class="g"><th class="a" colspan="${global ? 4 : 3}">Dono: Analista</th><th class="ge" colspan="6">Dono: Gerente</th><th class="r" colspan="3">Dono: RH</th></tr>
        <tr><th>Status</th>${global ? "<th>Loja</th>" : ""}<th>Nome do Colaborador</th><th>Horário Sistema</th><th>Data Abertura</th><th>Responsável</th><th>Horário Contrato</th><th>Sexo</th><th>Motivo</th><th>Observação</th><th>Status RH</th><th>Candidato</th><th>Data Admissão</th></tr></thead><tbody>
        ${lf.map((r) => { const u = r.sitU; const cl = u.includes("ATIVO") ? "s-at" : /FÉRIAS|FERIAS/.test(u) ? "s-fe" : /AFAST/.test(u) ? "s-af" : "s-de";
          return `<tr><td class="${cl}">${esc(ehDemitido(r) && !u.includes("ATIVO") ? "Demitido" : r.sit)}</td>${global ? `<td>${p2(r.loja)}</td>` : ""}<td class="n">${esc(titulo(r.nome))}</td><td>${esc(r.escala)}</td><td>${esc(r.abertura)}</td><td>${esc(r.resp)}</td><td>${esc(r.horario)}</td><td>${esc(r.sexo)}</td><td>${esc(r.motivo)}</td><td>${esc(r.obs)}</td><td>${esc(r.statusRh)}</td><td>${esc(r.candidato)}</td><td>${esc(r.admissao)}</td></tr>`; }).join("")}
        </tbody></table>`;
    }
    h += "</section>";
  }
  $("#impressao").innerHTML = h;
  const titOrig = document.title;
  document.title = `QL_${nomeEscopo(dados.escopo).replace(/\W+/g, "_")}_${carimbo()}`;
  setTimeout(() => { window.print(); document.title = titOrig; }, 60);
}
