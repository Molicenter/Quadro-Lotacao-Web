// ============================================================
// Quadro de Lotação (QL) · Molicenter — app web, etapa 1
// Quadro + edição lateral + zerar linha + atualizar o banco do Senior (Excel)
// Grava nas MESMAS tabelas do Streamlit (ql_banco / ql_historico) pelas funções ql_web_*.
// ============================================================
const CFG = window.CONFIG;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const p2 = (n) => String(n).padStart(2, "0");

// ---------- listas (as mesmas do app.py) ----------
const OPCOES_HORARIO = ["-", "ART 62 CLT", "SG-SB 05:00-10:00 11:15-13:35", "SG-SB 05:50-11:30 13:20-15:00",
  "SG-SB 06:00-10:00 11:10-14:30", "SG-SB 06:00-10:00 12:00-15:20", "SG-SB 06:00-11:00 12:15-14:35",
  "SG-SB 06:30-10:30 11:40-15:00", "SG-SB 06:30-11:00 13:00-15:50", "SG-SB 06:30-12:00 13:10-15:00",
  "SG-SB 07:00-11:00 13:00-16:20", "SG-SB 07:00-11:30 13:00-15:50", "SG-SB 07:00-11:30 13:30-16:20",
  "SG-SB 07:00-12:00 13:20-15:40", "SG-SB 07:00-12:00 14:00-16:20", "SG-SB 07:30-11:00 13:00-16:50",
  "SG-SB 07:30-11:30 13:30-16:50", "SG-SB 07:30-12:00 13:30-16:20", "SG-SB 07:30-12:00 14:00-16:50",
  "SG-SB 07:30-12:30 14:00-16:20", "SG-SB 07:30-13:00 15:00-16:50", "SG-SB 07:30-12:00 14:00-17:30", "SG-SB 07:50-11:30 13:30-17:10",
  "SG-SB 07:50-12:00 14:00-17:10", "SG-SB 08:00-11:30 13:30-17:20", "SG-SB 08:00-12:00 14:00-17:20",
  "SG-SB 08:30-11:00 13:00-17:50", "SG-SB 08:30-12:00 14:00-17:50", "SG-SB 09:00-13:00 15:00-18:20",
  "SG-SB 09:00-14:00 16:00-18:20", "SG-SB 09:30-13:00 15:00-18:50", "SG-SB 09:50-13:00 14:50-19:00",
  "SG-SB 10:00-12:30 14:30-19:20", "SG-SB 10:00-13:00 15:00-19:20", "SG-SB 10:00-14:00 16:00-19:20",
  "SG-SB 11:00-14:00 16:00-20:20", "SG-SB 11:00-14:30 16:00-19:50", "SG-SB 11:00-15:00 17:00-20:20",
  "SG-SB 11:20-14:00 16:00-20:40", "SG-SB 11:30-13:30 15:30-20:50", "SG-SB 11:30-14:00 16:00-20:50",
  "SG-SB 11:30-14:30 16:30-20:50", "SG-SB 11:30-15:30 17:30-20:50", "SG-SB 12:00-15:00 17:00-21:20", "SG-SB 12:30-15:00 17:00-21:50",
  "SG-SB 13:00-16:00 17:10-21:30", "SG-SB 13:00-17:00 18:10-21:30", "SG-SB 13:10-15:00 16:50-22:20",
  "SG-SX 07:00-12:00 13:12-17:00", "SG-SX 07:30-12:00 13:12-17:30", "SG-SX 07:30-12:00 13:42-18:00",
  "SG-SX 07:30-12:00 14:00-18:18", "SG-SX 08:00-12:00 13:12-18:00", "SG-SX 08:00-13:00 14:12-18:00",
  "SG-SX 08:00-17:30 Sab 08:00-12", "SG-SX 5:00-15:00 SB 5:00-09:00", "SG-SX 7:00-17:00 SB 7:00-11:00",
  "SG-SX 7:30-16:40 SB 7:30-11:30", "SG-SX 7:30-17:00 SB 08:00-12:0", "SG-SX 7:30-17:00 SB 7:30-11:30",
  "SG-SX 7:30-17:30 SB 7:30-11:30", "SG-SX 8:00-18:00 SB 8:00-12:00", "SG-SX 8:30-18:00 SB 9:00-13:00"];
const OPCOES_SEXO = ["-", "Indiferente", "Masculino", "Feminino"];
const SIGLA_SEXO = { "-": "-", I: "Indiferente", M: "Masculino", F: "Feminino" };
const OPCOES_MOTIVO = ["-", "Afastamento", "Aumento QL", "Encerramento Contrato Exp.", "Função Nova", "Mudança Setor", "Substituição", "Transferência"];
const OPCOES_STATUS_RH = ["-", "Requisição atendida", "Aguardando resposta Candidato", "Cancelado", "Divulgação da vaga", "Documentação Admissão", "Entrevista Loja", "Entrevista RH", "Exame Admissional", "Não Validado pelo gerente", "Previsão de Início", "Triagem de Curriculuns", "Validado pelo gerente", "Desistencia Candidato"];
const SITUACOES_NOVO = ["Ativos", "Demitido", "Afastamento", "Férias"];
const PERFIS_TOTAL = ["analista", "rh"];
const LOJAS_TL = [1, 2, 3, 4, 5, 6, 7, 8];
const DIAS_ADMISSAO = 7;   // admitido fica no quadro por 7 dias
const DIAS_DEMISSAO = 10;  // demitido some do quadro 10 dias após a Data Afastamento
const ROTULO_PERFIL = { analista: "Analista · edição total", rh: "RH · edição total", supervisor: "Supervisor", gerente: "Gerente" };
// de-para do nome do departamento no quadro → orçado (mesmo DE_PARA_DEPT do ql_orcado.py)
const DE_PARA_DEPT = {
  "FRENTE DE CAIXA": "FRENTE CAIXA", "ENTREGA": ["FRENTE CAIXA", "ENTREGADOR"], "HORTIFRUTI": "HORTFRUTI",
  "GERENCIA": "GERENCIA", "LIMPEZA": ["ADMINISTRATIVO", "LIMPEZA"], "PREVENCAO": ["ADMINISTRATIVO", "PREVENCAO"],
  "CONTROLADORIA": ["ADMINISTRATIVO", "CONTROLADORIA"],
};
const CARDS = [
  ["ATIVO", "Ativos", "trabalhando"], ["FERIAS", "Férias", "contam no real"], ["DEMITIDO", "Demitidos", "no quadro do Senior"],
  ["AFASTADO", "Afastados", "INSS / licença"], ["ALTERADOS", "Alterados", "vagas em andamento"], ["ADMITIDOS", "Admitidos", `últimos ${DIAS_ADMISSAO} dias`],
];

// ---------- utilidades ----------
const vazio = (v) => v == null || ["", "-", "nan", "none", "null", "nat", "<na>"].includes(String(v).trim().toLowerCase());
const limpar = (v, padrao = "-") => (vazio(v) ? padrao : String(v).trim());
const semAcento = (s) => String(s ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "");
const normalizar = (s) => semAcento(String(s ?? "").trim().toUpperCase()).split(/\s+/).filter(Boolean).join(" ");
const titulo = (s) => String(s ?? "").toLowerCase().replace(/(^|[^\p{L}])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);   // mesma ordem do sorted() do Python
const nomeLoja = (n) => (+n === 30 ? "Loja 30 · CD" : `Loja ${p2(n)}`);
const NOME_ESCOPO = { TL: "Total Lojas", TLCD: "Total Lojas + CD", TR: "Total Rede" };
const nomeEscopo = (e) => NOME_ESCOPO[e] || nomeLoja(e);

// data (texto DD/MM/AAAA, AAAA-MM-DD, com hora) → {a, m, d} · null se vazia/inválida
function lerData(v) {
  if (vazio(v)) return null;
  const t = String(v).trim().replace("T", " ").split(" ")[0];
  let m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return valida(+m[3], +m[2], +m[1]);
  m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return valida(+m[1], +m[2], +m[3]);
  return null;
}
function valida(a, m, d) { const x = new Date(Date.UTC(a, m - 1, d)); return x.getUTCMonth() === m - 1 && x.getUTCDate() === d ? x : null; }
const dataBR = (x) => (x ? `${p2(x.getUTCDate())}/${p2(x.getUTCMonth() + 1)}/${x.getUTCFullYear()}` : "-");
const dataISO = (x) => (x ? `${x.getUTCFullYear()}-${p2(x.getUTCMonth() + 1)}-${p2(x.getUTCDate())}` : "");
const fmtBR = (v) => { const x = lerData(v); return x ? dataBR(x) : limpar(v); };
const somaDias = (x, n) => new Date(x.getTime() + n * 86400000);
function hojeSP() { const s = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); return lerData(s); }
function dataHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
}

function toast(msg, tipo = "") {
  const t = $("#toast");
  t.textContent = msg; t.className = "toast " + tipo; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), tipo === "erro" ? 6500 : 3200);
}
function carregando(sim) { $("#carregando").hidden = !sim; }

const IC = {
  quadro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
  efet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>',
  resumo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/></svg>',
  orcado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-5h14v5"/></svg>',
  importar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>',
  seta: '<svg class="seta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>',
  busca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  mais: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"/></svg>',
  usuarios: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/></svg>',
  funil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18l-7 8v6l-4 2v-8z"/></svg>',
  excel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>',
  atualizar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5"/></svg>',
};

// ---------- sessão ----------
const CHAVE_SESSAO = "ql_web_sessao";
function lerLocal(k) { try { return localStorage.getItem(k); } catch { return null; } }
function gravarLocal(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} }
let sessao = (() => { try { return JSON.parse(lerLocal(CHAVE_SESSAO)) || null; } catch { return null; } })();
const podeTotal = () => PERFIS_TOTAL.includes(sessao?.perfil);
const podeImportar = () => podeTotal() && sessao?.loja_fixa == null;
const podeNovo = () => sessao && sessao.perfil !== "gerente";

// ---------- Supabase ----------
const MENSAGENS = {
  SENHA_INCORRETA: "Usuário ou senha incorretos. Tente de novo.",
  SENHA_NAO_CONFIGURADA: "A senha deste usuário ainda não foi cadastrada (falta rodar o SQL das senhas).",
  MUITAS_TENTATIVAS: "Muitas tentativas erradas. Espere 10 minutos e tente de novo.",
  USUARIO_INVALIDO: "Escolha um usuário da lista.",
  SESSAO_INVALIDA: "Sua sessão expirou. Entre de novo.",
  SEM_PERMISSAO: "Seu login não tem permissão para isso.",
  LOJA_INVALIDA: "Escolha a loja.",
  ESCOPO_INVALIDO: "Escolha a loja.",
  NOME_VAZIO: "O nome do colaborador não pode ficar em branco.",
  SITUACAO_INVALIDA: "Escolha a situação.",
  DATA_INVALIDA: "Data inválida.",
  ARQUIVO_VAZIO: "O arquivo não tem linhas na aba Banco.",
  "Could not find the function": "O banco ainda não tem as funções do app web (falta rodar o SQL 01).",
};
function traduzir(msg) {
  const m = String(msg);
  if (m.includes("CAMPOS_OBRIGATORIOS:")) return "Preencha os campos obrigatórios do Gerente: " + m.split("CAMPOS_OBRIGATORIOS:")[1];
  for (const k in MENSAGENS) if (m.includes(k)) return MENSAGENS[k];
  return m;
}
async function rpc(fn, args = {}) {
  let resp;
  try {
    resp = await fetch(`${CFG.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: CFG.SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
  } catch {
    throw new Error("Sem conexão com a internet. Tente de novo.");
  }
  const texto = await resp.text();
  let corpo = null;
  try { corpo = texto ? JSON.parse(texto) : null; } catch { corpo = texto; }
  if (!resp.ok) {
    const msg = (corpo && (corpo.message || corpo.hint)) || `Erro ${resp.status}`;
    if (String(msg).includes("SESSAO_INVALIDA")) { sair(true); throw new Error(MENSAGENS.SESSAO_INVALIDA); }
    throw new Error(traduzir(msg));
  }
  return corpo;
}

// ============================================================
// LOGIN
// ============================================================
async function telaLogin() {
  $("#app").hidden = true;
  $("#tela-login").hidden = false;
  $("#versao-login").textContent = "versão " + CFG.VERSAO;
  const sel = $("#login-usuario");
  sel.innerHTML = '<option value="">Carregando…</option>';
  try {
    const lista = await rpc("ql_web_lista_usuarios");
    const ultimo = lerLocal("ql_web_ultimo_usuario");
    sel.innerHTML = '<option value="">Selecione o usuário…</option>' +
      lista.map((u) => `<option${u === ultimo ? " selected" : ""}>${esc(u)}</option>`).join("");
  } catch (e) {
    sel.innerHTML = '<option value="">—</option>';
    mostrarErroLogin(e.message);
  }
  (sel.value ? $("#login-senha") : sel).focus();
}
function mostrarErroLogin(msg) { const el = $("#login-erro"); el.textContent = msg; el.hidden = !msg; }

$("#form-login").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const email = $("#login-usuario").value;
  const senha = $("#login-senha").value;
  if (!email) return mostrarErroLogin(MENSAGENS.USUARIO_INVALIDO);
  mostrarErroLogin("");
  const btn = $("#btn-entrar");
  btn.disabled = true; btn.textContent = "Entrando…";
  try {
    sessao = await rpc("ql_web_login", { p_email: email, p_senha: senha });
    gravarLocal(CHAVE_SESSAO, JSON.stringify(sessao));
    gravarLocal("ql_web_ultimo_usuario", email);
    $("#login-senha").value = "";
    iniciarApp();
  } catch (e) {
    mostrarErroLogin(e.message);
  } finally {
    btn.disabled = false; btn.textContent = "Entrar";
  }
});

async function sair(silencioso) {
  const tok = sessao?.token;
  sessao = null; dados = null;
  gravarLocal(CHAVE_SESSAO, null);
  fecharGaveta(); fecharJanela();
  if (tok && !silencioso) rpc("ql_web_sair", { p_token: tok }).catch(() => {});
  telaLogin();
}
$("#btn-sair").addEventListener("click", () => sair(false));

// ============================================================
// ESTADO + NAVEGAÇÃO
// ============================================================
let dados = null;           // resposta do ql_web_quadro
let linhas = [];            // quadro montado (Senior + lançamentos)
const est = { escopo: lerLocal("ql_web_escopo") || "TL", filtro: "TODOS", busca: "", abertos: {}, todosAbertos: false };

const PAGINAS = ["quadro", "efet", "funil", "resumo", "orcado", "importar", "usuarios"];
function pagina() { const h = location.hash.replace(/^#\/?/, ""); return PAGINAS.includes(h) ? h : "quadro"; }
window.addEventListener("hashchange", () => { if (sessao) render(); });

function iniciarApp() {
  $("#tela-login").hidden = true;
  $("#app").hidden = false;
  $("#conta-nome").textContent = sessao.email;
  $("#conta-perfil").textContent = ROTULO_PERFIL[sessao.perfil] + (sessao.loja_fixa != null ? ` · ${nomeLoja(sessao.loja_fixa)}` : "");
  if (pagina() === "importar" && !podeImportar()) location.hash = "#/quadro";
  carregar();
}

async function carregar(manterRolagem) {
  const y = window.scrollY;
  carregando(true);
  try {
    const escopo = sessao.loja_fixa != null ? String(sessao.loja_fixa) : est.escopo;
    dados = await rpc("ql_web_quadro", { p_token: sessao.token, p_escopo: escopo });
    linhas = montarQuadro(dados);
    render();
    if (manterRolagem) window.scrollTo(0, y);
  } catch (e) {
    toast(e.message, "erro");
    if (!dados) $("#conteudo").innerHTML = `<div class="cartao"><p class="erro">${esc(e.message)}</p><p><button class="btn" onclick="carregar()">Tentar de novo</button></p></div>`;
  } finally {
    carregando(false);
  }
}

function montarNav() {
  const pg = pagina();
  const itens = [["quadro", "Quadro de Lotação", IC.quadro, true]];
  itens.push(["efet", "Relatório de Efetividade", IC.efet, true], ["funil", "Funil do RH", IC.funil, true], ["resumo", "Resumo por Loja", IC.resumo, true], ["orcado", "QL Orçado", IC.orcado, true]);
  if (podeImportar()) itens.push(["importar", "Atualizar banco (Excel)", IC.importar, true]);
  if (sessao.perfil === "analista") itens.push(["usuarios", "Usuários", IC.usuarios, true]);
  $("#nav").innerHTML = '<div class="nav-rotulo">Quadro</div>' + itens.map(([id, nome, ic, pronto]) =>
    `<button type="button" data-pg="${id}" class="${pg === id ? "ativo" : ""}"${pronto ? "" : ' data-embreve="1"'}>${ic}<span>${nome}</span>${pronto ? "" : '<span class="em-breve">etapa 2</span>'}</button>`).join("");

  const on = $("#online");
  if (sessao.perfil === "analista" && dados?.online?.length) {
    on.hidden = false;
    on.innerHTML = `<b>● ${dados.online.length} online agora</b><div class="pontos">${dados.online.map((e) => `<span>${esc(e.split("@")[0])}</span>`).join("")}</div>`;
  } else on.hidden = true;
}
$("#nav").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-pg]");
  if (!b) return;
  location.hash = "#/" + b.dataset.pg;
});

function montarSeletor() {
  const sel = $("#sel-loja");
  if (sessao.loja_fixa != null) {
    sel.innerHTML = `<option>${esc(nomeLoja(sessao.loja_fixa))}</option>`;
    sel.disabled = true;
    return;
  }
  const lojas = (dados?.lojas || []).map(String);
  const opts = ["TL", "TLCD", "TR", ...lojas];
  if (!opts.includes(est.escopo)) est.escopo = "TL";
  sel.disabled = false;
  sel.innerHTML = opts.map((o) => `<option value="${o}"${o === est.escopo ? " selected" : ""}>${esc(nomeEscopo(o))}</option>`).join("");
}
$("#sel-loja").addEventListener("change", (e) => {
  est.escopo = e.target.value; est.abertos = {}; est.todosAbertos = false; efet.dados = null;
  gravarLocal("ql_web_escopo", est.escopo);
  carregar();
});

function render() {
  if (!dados) return;
  montarNav(); montarSeletor();
  const imp = dados.importacao;
  $("#pil-senior").textContent = imp ? `Senior: ${dataHora(imp.em)}` : "Senior: ainda não importado";
  const pg = pagina();
  $("#rotulo-loja").hidden = pg === "importar" || pg === "usuarios";
  if (pg === "usuarios") { $("#pg-titulo").textContent = "Usuários"; $("#pg-sub").textContent = "Logins, perfis, lojas e senhas do QL"; telaUsuarios(); return; }
  const nomeEsc = nomeEscopo(sessao.loja_fixa != null ? String(sessao.loja_fixa) : est.escopo);
  if (pg === "efet") { $("#pg-titulo").textContent = "Relatório de Efetividade — " + nomeEsc; $("#pg-sub").textContent = "Vagas abertas x concluídas no período (pela Data Abertura e Data Admissão)"; telaEfetividade(); return; }
  if (pg === "funil") { $("#pg-titulo").textContent = "Funil do RH — " + nomeEsc; $("#pg-sub").textContent = "Vagas em andamento por etapa do RH e há quantos dias estão abertas"; telaFunil(); return; }
  if (pg === "resumo") { $("#pg-titulo").textContent = "Resumo de Situação por Loja — " + nomeEsc; $("#pg-sub").textContent = "Mesma contagem dos cards do quadro, aberta por loja"; telaResumo(); return; }
  if (pg === "orcado") { $("#pg-titulo").textContent = "QL Orçado — " + nomeEsc; $("#pg-sub").textContent = "Organograma de funções orçadas · Real = Ativos + Férias do quadro"; telaOrcado(); return; }
  if (pg === "importar") {
    $("#pg-titulo").textContent = "Atualizar banco do Senior";
    $("#pg-sub").textContent = "Envie o Excel exportado do Senior (Banco QL.xlsx) · substitui o quadro do app";
    telaImportar();
  } else {
    const esc_ = sessao.loja_fixa != null ? String(sessao.loja_fixa) : est.escopo;
    $("#pg-titulo").textContent = "Quadro de Funcionários — " + nomeEscopo(esc_);
    $("#pg-sub").textContent = "Departamento → Cargo · Orçado x Real x Vagas · clique numa linha para editar";
    telaQuadro();
  }
}

// ============================================================
// MONTAGEM DO QUADRO (mesma regra do carregar_dados_completos do Streamlit)
// ============================================================
function montarQuadro(d) {
  const hoje = lerData(d.hoje) || hojeSP();
  const rows = d.senior.map((r) => ({
    loja: Number(r.l) || 0, dept: r.d, funcao: r.f, sit: r.s, nome: r.n,
    escala: vazio(r.e) ? "-" : String(r.e).replace(/\.0/g, "").trim() || "-",
    afast: r.da, obs: "-", abertura: "-", resp: "-", horario: "-", sexo: "-", motivo: "-",
    statusRh: "-", candidato: "-", admissao: "-", alt: false, excel: true, usuario: null, modificado: null,
  }));
  const indice = new Map();
  rows.forEach((r, i) => { const k = r.loja + "|" + r.nome; if (!indice.has(k)) indice.set(k, i); });
  const mapeados = new Set();
  const aplicar = (r, reg) => {
    r.obs = limpar(reg["Observação"]);
    r.abertura = fmtBR(reg["Data Abertura"]);
    r.resp = limpar(reg["Responsável"]);
    r.horario = limpar(reg["Horário Contrato"]);
    const s = limpar(reg["Sexo"]);
    r.sexo = SIGLA_SEXO[s] || s;
    r.motivo = limpar(reg["Motivo"]);
    r.statusRh = limpar(reg["Status RH"]);
    r.candidato = limpar(reg["Candidato"]);
    r.admissao = fmtBR(reg["Data Admissão"]);
    r.alt = true;
    r.usuario = reg.Usuario; r.modificado = reg.Modificado;
  };
  for (const reg of d.banco) {
    const k = (Number(reg.Loja) || 0) + "|" + reg.Nome;
    if (!indice.has(k)) continue;
    const r = rows[indice.get(k)];
    if (vazio(r.sit)) { const v = limpar(reg["Situação"], "Demitido"); r.sit = v === "-" ? "Demitido" : v; }
    aplicar(r, reg);
    mapeados.add(k);
  }
  for (const reg of d.banco) {
    const k = (Number(reg.Loja) || 0) + "|" + reg.Nome;
    if (mapeados.has(k)) continue;
    // não está mais no Excel do Senior → aparece sempre como Demitido (mesma regra do Streamlit)
    const r = { loja: Number(reg.Loja) || 0, nome: reg.Nome, sit: "Demitido", escala: "-", afast: null, excel: false,
      dept: limpar(reg.Dept, "HISTÓRICO / EX-COLABORADORES"), funcao: limpar(reg["Função"], "Sem Vínculo Atual") };
    aplicar(r, reg);
    rows.push(r);
  }
  const limAdm = somaDias(hoje, -DIAS_ADMISSAO), limDem = somaDias(hoje, -DIAS_DEMISSAO);
  rows.forEach((r, i) => {
    r.i = i;
    r.sitU = r.sit == null ? "NAN" : String(r.sit).toUpperCase();
    const ad = lerData(r.admissao);
    r.admArquivar = !!ad && ad < limAdm;
    r.admRecente = !!ad && ad >= limAdm && ad <= hoje;
    const af = lerData(r.afast);
    r.demArquivar = r.sitU.includes("DEMITIDO") && !!af && af < limDem;
    r.concluida = String(r.statusRh).trim().toUpperCase() === "REQUISIÇÃO ATENDIDA";
    r.alterado = r.alt && !r.concluida;
  });
  return rows;
}

const ehAtivo = (r) => r.sitU.includes("ATIVO");
const ehFerias = (r) => /FÉRIAS|FERIAS/.test(r.sitU);
const ehDemitido = (r) => r.sitU.includes("DEMITIDO") || ["NAN", "NONE", ""].includes(r.sitU);
const ehAfastado = (r) => /AFASTAMENTO|AFASTADO/.test(r.sitU);
function contar(rs) {
  return {
    ATIVO: rs.filter(ehAtivo).length, FERIAS: rs.filter(ehFerias).length, DEMITIDO: rs.filter(ehDemitido).length,
    AFASTADO: rs.filter(ehAfastado).length, ALTERADOS: rs.filter((r) => r.alterado).length, ADMITIDOS: rs.filter((r) => r.admRecente).length,
  };
}
// linhas que aparecem no quadro, já com a regra de retenção e o filtro do card
function linhasExibidas() {
  const f = est.filtro;
  if (f === "ADMITIDOS") return linhas.filter((r) => r.admRecente);
  if (f === "ALTERADOS") return linhas.filter((r) => r.alterado);
  let rs = linhas
    .filter((r) => !(r.admArquivar && !r.excel))
    .map((r) => (r.admArquivar ? { ...r, obs: "-", abertura: "-", resp: "-", horario: "-", sexo: "-", motivo: "-", statusRh: "-", candidato: "-", admissao: "-", alt: false, arquivada: true } : r))
    .filter((r) => !r.demArquivar);
  if (f === "ATIVO") rs = rs.filter(ehAtivo);
  else if (f === "FERIAS") rs = rs.filter(ehFerias);
  else if (f === "DEMITIDO") rs = rs.filter(ehDemitido);
  else if (f === "AFASTADO") rs = rs.filter(ehAfastado);
  return rs;
}

// ---------- orçado ----------
function mapasOrcado() {
  const dep = new Map(), fun = new Map();
  for (const o of dados.orcado || []) {
    const d = normalizar(o.d), f = normalizar(o.f);
    dep.set(d, (dep.get(d) || 0) + Number(o.q || 0));
    fun.set(d + "|" + f, (fun.get(d + "|" + f) || 0) + Number(o.q || 0));
  }
  return { dep, fun };
}
function destinoDept(dept) { const k = normalizar(dept); const v = DE_PARA_DEPT[k] ?? k; return Array.isArray(v) ? v.map(normalizar) : normalizar(v); }
function orcDept(m, dept) { const d = destinoDept(dept); return Array.isArray(d) ? m.fun.get(d.join("|")) : m.dep.get(d); }
function orcFunc(m, dept, func) { const d = destinoDept(dept); return Array.isArray(d) ? m.fun.get(d.join("|")) : m.fun.get(d + "|" + normalizar(func)); }
function badgeOrc(orc, real) {
  if (orc == null) return "";
  const s = orc - real;
  const [cls, txt] = s > 0 ? ["vaga", `${s} vaga${s > 1 ? "s" : ""}`] : s === 0 ? ["", "completo"] : ["acima", `${-s} acima`];
  return `<span class="orc num" title="Orçado x Real (Ativos + Férias) x Vagas"><span>Orçado ${orc}</span><span>Real ${real}</span><span class="${cls}">${txt}</span></span>`;
}

// ---------- badges ----------
function badgeSit(s) {
  const u = String(s ?? "").trim().toUpperCase();
  if (u.includes("ATIVO")) return `<span class="badge b-ativo">${esc(s)}</span>`;
  if (u.includes("FÉRIAS") || u.includes("FERIAS")) return `<span class="badge b-ferias">${esc(s)}</span>`;
  if (u.includes("AFASTAMENTO") || u.includes("AFASTADO")) return `<span class="badge b-afastado">${esc(s)}</span>`;
  if (u.includes("DEMITIDO") || ["NAN", "NONE", ""].includes(u)) return '<span class="badge b-demitido">Demitido</span>';
  return `<span class="badge b-outro">${esc(s)}</span>`;
}
function badgeRh(s) {
  if (vazio(s)) return "-";
  return `<span class="badge ${String(s).trim().toUpperCase() === "REQUISIÇÃO ATENDIDA" ? "b-ok" : "b-rh"}">${esc(s)}</span>`;
}

// ============================================================
// TELA: QUADRO
// ============================================================
function telaQuadro() {
  const c = contar(linhas);
  const global = isNaN(+dados.escopo);
  const termo = normalizar(est.busca);
  const exib = linhasExibidas();
  const casa = (r) => !termo || normalizar(`${r.nome} ${r.candidato} ${r.funcao} ${r.dept}`).includes(termo);
  const vis = exib.filter(casa);

  let h = '<div class="pagina"><div class="kpis">' + CARDS.map(([k, nome, sub]) =>
    `<button type="button" class="kpi k-${k}${est.filtro === k ? " sel" : ""}" data-filtro="${k}"><strong class="num">${c[k]}</strong><span>${nome}</span><small>${sub}</small></button>`).join("") + "</div>";

  h += `<div class="barra-ferr"><label class="busca">${IC.busca}<input id="busca" type="search" placeholder="Buscar colaborador, cargo ou candidato…" value="${esc(est.busca)}" autocomplete="off"></label>
    <button type="button" class="btn btn-borda" data-acao="expandir">${est.todosAbertos ? "Recolher tudo" : "Expandir tudo"}</button>
    <button type="button" class="btn btn-borda" data-acao="atualizar" title="Buscar de novo no banco">${IC.atualizar}Atualizar</button>
    <button type="button" class="btn btn-borda" data-acao="excel" title="Baixar o quadro como está na tela (loja, filtro e busca) em Excel">${IC.excel}Excel</button>
    <button type="button" class="btn btn-borda" data-acao="imprimir" title="Imprimir ou salvar em PDF o quadro como está na tela (loja e filtro)">${IC.pdf}PDF do quadro</button>
    ${podeNovo() ? `<button type="button" class="btn btn-primario" data-acao="novo">${IC.mais}Cadastrar novo</button>` : ""}</div>`;

  if (est.filtro !== "TODOS") {
    const k = CARDS.find((x) => x[0] === est.filtro);
    const txt = { ADMITIDOS: `Admitidos nos últimos ${DIAS_ADMISSAO} dias. Depois disso o lançamento vai para o histórico.`,
      ALTERADOS: "Linhas com digitação do gerente/RH (sem as que já estão como Requisição atendida)." }[est.filtro] || `Mostrando só: ${k[1]}`;
    h += `<div class="aviso k-${est.filtro}">${esc(txt)}<button type="button" data-filtro="${est.filtro}">Limpar filtro ✕</button></div>`;
  }
  // quem a busca encontra mas está fora do quadro (admitidos/demitidos antigos): dá para abrir mesmo assim
  if (termo.length >= 3) {
    const nosVis = new Set(vis.map((r) => r.i));
    const fora = linhas.filter((r) => !nosVis.has(r.i) && casa(r)).slice(0, 12);
    if (fora.length) h += `<div class="ocultos">Fora do quadro atual:${fora.map((r) => `<button type="button" data-linha="${r.i}">${esc(titulo(r.nome))} · ${p2(r.loja)}</button>`).join("")}</div>`;
  }

  const m = mapasOrcado();
  const realBase = linhas.filter((r) => (ehAtivo(r) || ehFerias(r)) && (!global || LOJAS_TL.includes(r.loja)));
  const real = (dept, func) => realBase.filter((r) => r.dept === dept && (func == null || r.funcao === func)).length;
  const depts = [...new Set(vis.map((r) => r.dept).filter((x) => x != null))].sort(cmp);
  if (!depts.length) h += `<div class="cartao vazio-msg">${linhas.length ? "Nenhum registro com esse filtro nesta loja/visão." : "O quadro do Senior ainda não foi importado. Use “Atualizar banco (Excel)”."}</div>`;

  for (const dept of depts) {
    const ld = vis.filter((r) => r.dept === dept);
    const aberto = est.abertos[dept] ?? (est.todosAbertos || !!termo);
    h += `<details class="dept" data-dept="${esc(dept)}"${aberto ? " open" : ""}><summary>${IC.seta}<h4>${esc(dept)}</h4><span class="qtd num">${ld.length}</span>${badgeOrc(orcDept(m, dept), real(dept))}</summary>`;
    if (aberto) h += corpoDept(ld, dept, m, real, global);
    h += "</details>";
  }
  $("#conteudo").innerHTML = h + "</div>";
}

// dias em aberto de uma vaga (alterada, ainda sem Requisição atendida): 0–15 normal · 16–30 laranja · +30 vermelho
function diasEmAberto(r) {
  if (!r.alterado) return null;
  const ab = lerData(r.abertura), hoje = lerData(dados.hoje) || hojeSP();
  if (!ab) return null;
  const d = Math.round((hoje - ab) / 86400000);
  return d >= 0 ? d : null;
}
function chipIdade(d) { return d == null ? "" : `<span class="idade ${d > 30 ? "i3" : d > 15 ? "i2" : "i1"}" title="${d} dia(s) desde a abertura da vaga">${d}d</span>`; }
function tdAbertura(r) {
  if (vazio(r.abertura)) return '<td class="vazio num">-</td>';
  return `<td class="num">${esc(r.abertura)}${chipIdade(diasEmAberto(r))}</td>`;
}
function corpoDept(ld, dept, m, real, global) {
  let h = '<div class="dept-corpo">';
  const funcs = [...new Set(ld.map((r) => r.funcao).filter((x) => x != null))].sort(cmp);
  for (const fn of funcs) {
    const lf = ld.filter((r) => r.funcao === fn);
    h += `<div class="cargo"><div class="cargo-tit"><strong>${esc(fn)}</strong>${badgeOrc(orcFunc(m, dept, fn), real(dept, fn))}</div>`;
    h += `<div class="tabela-wrap"><table class="ql"><thead><tr class="donos"><th class="d-a" colspan="${global ? 4 : 3}">Dono: Analista</th><th class="d-g" colspan="6">Dono: Gerente</th><th class="d-r" colspan="3">Dono: RH</th></tr>
      <tr class="cols"><th class="d-a">Status</th>${global ? '<th class="d-a">Loja</th>' : ""}<th class="d-a">Nome do Colaborador</th><th class="d-a">Horário Sistema</th>
      <th class="d-g">Data Abertura</th><th class="d-g">Responsável</th><th class="d-g">Horário Contrato</th><th class="d-g">Sexo</th><th class="d-g">Motivo</th><th class="d-g">Observação</th>
      <th class="d-r">Status RH</th><th class="d-r">Candidato</th><th class="d-r">Data Admissão</th></tr></thead><tbody>`;
    for (const r of lf) {
      const td = (v, cl = "") => (vazio(v) ? `<td class="vazio ${cl}">-</td>` : `<td class="${cl}">${esc(v)}</td>`);
      h += `<tr data-linha="${r.i}"${r.arquivada ? ' data-arquivada="1"' : ""} title="Clique para editar"><td>${badgeSit(r.sit)}</td>${global ? `<td class="cel-loja num">${p2(r.loja)}</td>` : ""}
        <td class="nome">${esc(titulo(r.nome))}</td>${td(r.escala, "escala")}${tdAbertura(r)}${td(r.resp)}${td(r.horario, "escala")}${td(r.sexo)}${td(r.motivo)}${td(r.obs, "quebra")}
        <td>${badgeRh(r.statusRh)}</td>${td(r.candidato, "quebra")}${td(r.admissao, "num")}</tr>`;
    }
    h += "</tbody></table></div></div>";
  }
  return h + "</div>";
}

// eventos do quadro
$("#conteudo").addEventListener("click", (e) => {
  const f = e.target.closest("[data-filtro]");
  if (f) { est.filtro = est.filtro === f.dataset.filtro ? "TODOS" : f.dataset.filtro; if (est.filtro !== "TODOS") { est.todosAbertos = true; est.abertos = {}; } telaQuadro(); return; }
  const l = e.target.closest("[data-linha]");
  if (l) { const r = linhas[+l.dataset.linha]; if (r) abrirGaveta(r); return; }
  const a = e.target.closest("[data-acao]");
  if (!a) return;
  if (a.dataset.acao === "expandir") { est.todosAbertos = !est.todosAbertos; est.abertos = {}; telaQuadro(); }
  else if (a.dataset.acao === "atualizar") carregar(true);
  else if (a.dataset.acao === "novo") abrirGaveta(null);
  else if (a.dataset.acao === "imprimir") imprimirQuadro();
  else if (a.dataset.acao === "excel") exportarExcel();
});
$("#conteudo").addEventListener("toggle", (e) => {
  const d = e.target;
  if (!d.matches || !d.matches("details.dept")) return;
  est.abertos[d.dataset.dept] = d.open;
  // monta a tabela só quando o departamento é aberto (deixa a tela leve no Total Rede)
  if (d.open && !d.querySelector(".dept-corpo")) {
    const global = isNaN(+dados.escopo);
    const termo = normalizar(est.busca);
    const ld = linhasExibidas().filter((r) => r.dept === d.dataset.dept && (!termo || normalizar(`${r.nome} ${r.candidato} ${r.funcao} ${r.dept}`).includes(termo)));
    const m = mapasOrcado();
    const realBase = linhas.filter((r) => (ehAtivo(r) || ehFerias(r)) && (!global || LOJAS_TL.includes(r.loja)));
    const real = (dept, func) => realBase.filter((r) => r.dept === dept && (func == null || r.funcao === func)).length;
    d.insertAdjacentHTML("beforeend", corpoDept(ld, d.dataset.dept, m, real, global));
  }
}, true);
let tBusca;
$("#conteudo").addEventListener("input", (e) => {
  if (e.target.id !== "busca") return;
  est.busca = e.target.value;
  clearTimeout(tBusca);
  tBusca = setTimeout(() => {
    const pos = e.target.selectionStart;
    telaQuadro();
    const b = $("#busca"); if (b) { b.focus(); try { b.setSelectionRange(pos, pos); } catch {} }
  }, 220);
});

// ============================================================
// GAVETA DE EDIÇÃO (formulário lateral do Streamlit)
// ============================================================
let gavetaLinha = null;
function opcoes(lista, atual) {
  const l = [...lista];
  if (!vazio(atual) && !l.includes(atual)) l.push(atual);   // não perde um valor antigo que saiu da lista
  return l.map((o) => `<option${o === (vazio(atual) ? "-" : atual) ? " selected" : ""}>${esc(o)}</option>`).join("");
}
function abrirGaveta(r) {
  gavetaLinha = r;
  const novo = !r;
  const total = podeTotal();
  const hoje = hojeSP();
  const ab = r ? lerData(r.abertura) : null;
  const ad = r ? lerData(r.admissao) : null;
  const lojaEsc = !isNaN(+dados.escopo) ? +dados.escopo : null;
  let h = `<header><div><h3>${novo ? "Cadastrar novo / não listado" : esc(titulo(r.nome))}</h3>
    <p>${novo ? "Entra no quadro com a digitação do gerente/RH" : `${esc(nomeLoja(r.loja))} · ${esc(r.dept)} · ${esc(r.funcao)}`}</p></div>
    <button type="button" class="btn-fechar" data-acao="fechar" aria-label="Fechar">×</button></header><form class="corpo" id="form-gaveta" autocomplete="off">`;

  if (r?.arquivada) h += `<div class="aviso laranja">Admissão de mais de ${DIAS_ADMISSAO} dias: o lançamento já foi para o histórico. Salvar aqui abre um lançamento novo.</div>`;

  h += `<div class="grupo-dono g-a${novo ? "" : " bloq"}"><h5>Analista · Senior<small>${novo ? "cadastro" : "vem do Excel"}</small></h5><div class="campos">`;
  if (novo) {
    const est_ = estrutura();
    const d0 = est_.depts[0] || "";
    h += `<label class="campo cheio">Nome completo do colaborador<input name="nome" required maxlength="120" style="text-transform:uppercase"></label>
      <label class="campo">Departamento<select name="dept">${est_.depts.map((d) => `<option>${esc(d)}</option>`).join("")}</select></label>
      <label class="campo">Cargo/Função<select name="funcao">${(est_.funcoes[d0] || []).map((f) => `<option>${esc(f)}</option>`).join("")}</select></label>
      <label class="campo">Situação inicial<select name="situacao">${SITUACOES_NOVO.map((s) => `<option>${s}</option>`).join("")}</select></label>`;
    if (sessao.loja_fixa != null) h += `<div class="campo">Loja<span class="so-leitura">${esc(nomeLoja(sessao.loja_fixa))}</span></div>`;
    else h += `<label class="campo">Loja<select name="loja"><option value="">Escolha…</option>${(dados.lojas || []).map((l) => `<option value="${l}"${l === lojaEsc ? " selected" : ""}>${esc(nomeLoja(l))}</option>`).join("")}</select></label>`;
  } else {
    h += `<div class="campo">Situação<span class="so-leitura">${badgeSit(r.sit)}</span></div><div class="campo">Horário sistema<span class="so-leitura">${esc(r.escala)}</span></div>`;
    if (r.usuario) h += `<div class="campo cheio">Último lançamento<span class="so-leitura">${esc(r.usuario)}${r.modificado ? " · " + esc(dataHora(r.modificado)) : ""}</span></div>`;
  }
  h += "</div></div>";

  const obrig = total ? "" : " *";
  h += `<div class="grupo-dono g-g"><h5>Gerente<small>${total ? "campos livres para analista/RH" : "* obrigatórios"}</small></h5><div class="campos">
    <label class="campo">Data abertura${obrig}<input type="date" name="abertura" value="${dataISO(ab || hoje)}"></label>
    <label class="campo">Responsável${obrig}<input name="resp" maxlength="80" value="${esc(r && !vazio(r.resp) ? r.resp : "")}"></label>
    <label class="campo cheio">Horário contrato${obrig}<select name="horario">${opcoes(OPCOES_HORARIO, r?.horario)}</select></label>
    <label class="campo">Sexo${obrig}<select name="sexo">${opcoes(OPCOES_SEXO, r?.sexo)}</select></label>
    <label class="campo">Motivo${obrig}<select name="motivo">${opcoes(OPCOES_MOTIVO, r?.motivo)}</select></label>
    <label class="campo cheio">Observação<textarea name="obs" maxlength="500" rows="2">${esc(r && !vazio(r.obs) ? r.obs : "")}</textarea></label></div></div>`;

  if (total) {
    const atend = ehAtendida(r?.statusRh);
    h += `<div class="grupo-dono g-r${atend ? " atendida" : ""}" id="grupo-rh"><h5>Recursos Humanos (RH)<small>você edita</small></h5><div class="campos">
      <label class="campo cheio">Status RH<select name="status_rh">${opcoes(OPCOES_STATUS_RH, r?.statusRh)}</select></label>
      <label class="campo cheio"><span>Candidato<b class="req">*</b></span><input name="candidato" maxlength="120" placeholder="Nome de quem vai entrar na vaga" value="${esc(r && !vazio(r.candidato) ? r.candidato : "")}"></label>
      <label class="check"><input type="checkbox" name="tem_admissao"${ad || atend ? " checked" : ""}> Definir data de admissão</label>
      <label class="campo" id="campo-admissao"${ad || atend ? "" : " hidden"}><span>Data admissão<b class="req">*</b></span><input type="date" name="admissao" value="${dataISO(ad || hoje)}"></label></div></div>`;
  } else {
    const v = (x) => esc(r && !vazio(x) ? x : "-");
    h += `<div class="grupo-dono g-r bloq"><h5>Recursos Humanos (RH)<small>só leitura</small></h5><div class="campos">
      <div class="campo cheio">Status RH<span class="so-leitura">${r && !vazio(r.statusRh) ? badgeRh(r.statusRh) : "-"}</span></div>
      <div class="campo">Candidato<span class="so-leitura">${v(r?.candidato)}</span></div><div class="campo">Data admissão<span class="so-leitura">${v(r?.admissao)}</span></div></div></div>`;
  }
  h += `<p class="nota">Cada gravação vai para o histórico com o seu usuário e o horário. Com <b>Requisição atendida</b> + data de admissão, a linha vai para o card Admitidos e é arquivada ${DIAS_ADMISSAO} dias depois.</p></form>
    <footer><button type="submit" form="form-gaveta" class="btn btn-primario" id="btn-salvar">Salvar alterações</button>
    ${!novo ? '<button type="button" class="btn btn-borda" data-acao="historico">Histórico</button>' : ""}
    ${!novo && total && !r.arquivada ? '<button type="button" class="btn btn-perigo" data-acao="zerar">Zerar linha</button>' : ""}</footer>`;
  const g = $("#gaveta");
  g.innerHTML = h; g.hidden = false; $("#veu").hidden = false;
  document.body.style.overflow = "hidden";
  (novo ? $('[name="nome"]', g) : $('[name="resp"]', g)).focus();
}
function fecharGaveta() { $("#gaveta").hidden = true; $("#veu").hidden = true; document.body.style.overflow = ""; gavetaLinha = null; }
$("#veu").addEventListener("click", fecharGaveta);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (!$("#janela").hidden) fecharJanela(); else fecharGaveta(); } });

function estrutura() {
  const funcoes = {};
  for (const x of dados.estrutura || []) (funcoes[x.d] ||= []).push(x.f);
  for (const k in funcoes) funcoes[k] = [...new Set(funcoes[k])].sort(cmp);
  const depts = Object.keys(funcoes).filter((d) => d !== "HISTÓRICO / EX-COLABORADORES").sort(cmp);
  return { depts, funcoes };
}

$("#gaveta").addEventListener("click", (e) => {
  const a = e.target.closest("[data-acao]");
  if (!a) return;
  if (a.dataset.acao === "fechar") fecharGaveta();
  else if (a.dataset.acao === "zerar") confirmarZerar(gavetaLinha);
  else if (a.dataset.acao === "historico") verHistorico(gavetaLinha);
});
$("#gaveta").addEventListener("change", (e) => {
  const g = $("#gaveta");
  if (e.target.name === "dept") {
    const f = estrutura().funcoes[e.target.value] || [];
    $('[name="funcao"]', g).innerHTML = f.map((x) => `<option>${esc(x)}</option>`).join("");
  }
  if (e.target.name === "tem_admissao") $("#campo-admissao").hidden = !e.target.checked;
  if (e.target.name === "status_rh") {
    const atend = ehAtendida(e.target.value);
    $("#grupo-rh").classList.toggle("atendida", atend);
    if (atend) {
      // Requisição atendida: já liga a data de admissão e leva o foco para o candidato
      $('[name="tem_admissao"]', g).checked = true;
      $("#campo-admissao").hidden = false;
      $("#grupo-rh").scrollIntoView({ block: "end", behavior: "smooth" });
      const c = $('[name="candidato"]', g);
      if (!c.value.trim()) c.focus({ preventScroll: true });
    }
  }
});
function ehAtendida(s) { return String(s ?? "").trim().toUpperCase() === "REQUISIÇÃO ATENDIDA"; }
$("#gaveta").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target, r = gavetaLinha, novo = !r;
  const v = (n) => (f.elements[n] ? f.elements[n].value : "");
  const br = (iso) => { const x = lerData(iso); return x ? dataBR(x) : "-"; };
  const p = {
    novo,
    loja: novo ? (sessao.loja_fixa ?? (v("loja") ? +v("loja") : null)) : r.loja,
    nome: novo ? v("nome").trim().toUpperCase() : r.nome,
    dept: novo ? v("dept") : String(r.dept ?? "").trim(),
    funcao: novo ? v("funcao") : String(r.funcao ?? "").trim(),
    situacao: novo ? v("situacao") : (vazio(r.sit) ? "Demitido" : String(r.sit).trim()),
    abertura: br(v("abertura")), resp: v("resp").trim(), horario: v("horario"), sexo: v("sexo"), motivo: v("motivo"), obs: v("obs").trim(),
  };
  if (novo && !p.nome) return toast(MENSAGENS.NOME_VAZIO, "erro");
  if (novo && !p.loja) return toast("Escolha a loja do novo colaborador.", "erro");
  if (podeTotal()) {
    p.status_rh = v("status_rh"); p.candidato = v("candidato").trim();
    p.admissao = f.elements.tem_admissao.checked ? br(v("admissao")) : "-";
    if (ehAtendida(p.status_rh)) {
      const falta = [!p.candidato && "Candidato", vazio(p.admissao) && "Data admissão"].filter(Boolean);
      if (falta.length) {
        f.elements[!p.candidato ? "candidato" : "admissao"]?.focus();
        return toast("Requisição atendida precisa de: " + falta.join(" e ") + ".", "erro");
      }
    }
  } else {
    const falta = [["abertura", "Data Abertura"], ["resp", "Responsável"], ["horario", "Horário Contrato"], ["sexo", "Sexo"], ["motivo", "Motivo"]]
      .filter(([k]) => vazio(p[k])).map((x) => x[1]);
    if (falta.length) return toast("Preencha os campos obrigatórios do Gerente: " + falta.join(", "), "erro");
  }
  const btn = $("#btn-salvar");
  btn.disabled = true; btn.textContent = "Gravando…";
  try {
    await rpc("ql_web_salvar", { p_token: sessao.token, p });
    fecharGaveta();
    toast("Dados salvos com sucesso!", "ok");
    await carregar(true);
  } catch (err) {
    toast(err.message, "erro");
    btn.disabled = false; btn.textContent = "Salvar alterações";
  }
});

// ---------- janela de confirmação ----------
function abrirJanela(html) { const j = $("#janela"); j.innerHTML = html; j.hidden = false; $("#veu-janela").hidden = false; }
function fecharJanela() { $("#janela").classList.remove("larga"); $("#janela").hidden = true; $("#veu-janela").hidden = true; }
$("#veu-janela").addEventListener("click", fecharJanela);
function confirmarZerar(r) {
  abrirJanela(`<h3>Zerar linha / deixar em aberto?</h3>
    <p class="nota"><b>${esc(titulo(r.nome))}</b><br>${esc(nomeLoja(r.loja))} · ${esc(r.dept)} · ${esc(r.funcao)}</p>
    <div class="aviso laranja">Toda a digitação desta linha (Observação, Data Abertura, Responsável, Horário Contrato, Sexo, Motivo, Status RH, Candidato e Data Admissão) será removida e a vaga volta ao estado em aberto. O registro vai para o histórico antes.</div>
    <div class="acoes"><button type="button" class="btn btn-borda" id="zer-nao">Cancelar</button><button type="button" class="btn btn-primario" id="zer-sim">Sim, zerar linha</button></div>`);
  $("#zer-nao").onclick = fecharJanela;
  $("#zer-sim").onclick = async () => {
    $("#zer-sim").disabled = true;
    try {
      await rpc("ql_web_zerar", { p_token: sessao.token, p: { loja: r.loja, nome: r.nome, dept: r.dept, funcao: r.funcao, situacao: vazio(r.sit) ? "Demitido" : r.sit } });
      fecharJanela(); fecharGaveta();
      toast("Linha zerada! O registro voltou ao estado em aberto.", "ok");
      await carregar(true);
    } catch (err) { toast(err.message, "erro"); $("#zer-sim").disabled = false; }
  };
}

// ============================================================
// TELA: ATUALIZAR BANCO (importar o Excel do Senior)
// ============================================================
// colunas que o app guarda (o resto do Excel, inclusive CPF e Nascimento, é descartado aqui no navegador)
const COLUNAS = { Loja: "l", Dept: "d", "Função": "f", "Situação": "s", Nome: "n", "Descrição (Escala)": "e", "Data Afastamento": "da", "Admissão": "ad", DSR1: "d1", DSR2: "d2" };   // DSR1/DSR2 são opcionais (vão para a Escala 5x2)
let importacao = null;   // { arquivo, linhas, cabecalhos, resumo }

function telaImportar() {
  if (!podeImportar()) { $("#conteudo").innerHTML = '<div class="cartao"><p class="erro">Seu login não pode atualizar o banco.</p></div>'; return; }
  let h = `<div class="pagina"><div class="cartao"><h3>1 · Envie o arquivo</h3>
    <label class="zona" id="zona">${IC.importar}<strong>Arraste aqui o Excel exportado do Senior</strong>
    <span>ou clique para escolher · o mesmo “Banco QL.xlsx” que hoje vai para o GitHub (aba <b>Banco</b>)</span>
    <input type="file" id="arquivo" accept=".xlsx" hidden></label>
    <p class="nota" style="margin-top:10px">O arquivo é lido aqui no seu computador. Só as colunas do quadro vão para o banco — <b>CPF, Nascimento, Cadastro</b> e as demais ficam de fora.</p></div>`;
  if (importacao) {
    const r = importacao.resumo;
    const lidas = Object.keys(COLUNAS).filter((c) => importacao.cabecalhos.includes(c));
    const faltam = Object.keys(COLUNAS).filter((c) => !importacao.cabecalhos.includes(c));
    const fora = importacao.cabecalhos.filter((c) => c && !COLUNAS[c]);
    const queda = r.atual > 0 && r.linhas < r.atual * 0.8;
    h += `<div class="cartao"><h3>2 · Confira antes de gravar<small>${esc(importacao.arquivo)}</small></h3>
      ${queda ? `<div class="aviso laranja" style="margin-bottom:12px">Atenção: o arquivo tem bem menos linhas que o quadro atual (${r.linhas} contra ${r.atual}). Confira se é o arquivo certo.</div>` : ""}
      ${faltam.length ? `<div class="aviso laranja" style="margin-bottom:12px">Colunas não encontradas: ${esc(faltam.join(", "))}.</div>` : ""}
      <div class="passos">
        <div class="passo"><span>Linhas lidas</span><strong class="num">${r.linhas}</strong><b>${r.lojas} lojas · hoje: ${r.atual}</b></div>
        <div class="passo"><span>Novos no Senior</span><strong class="num">${r.novos}</strong><b>nome que não estava no quadro</b></div>
        <div class="passo"><span>Mudaram de situação</span><strong class="num">${r.mudaram}</strong><b>ex.: Ativos → Demitido</b></div>
        <div class="passo"><span>Saíram do Senior</span><strong class="num">${r.sairam}</strong><b>somem do quadro</b></div>
      </div>
      <p class="nota" style="margin-top:12px">Por situação: ${Object.entries(r.por_situacao || {}).sort().map(([k, v]) => `<b>${esc(k)}</b> ${v}`).join(" · ")}. Os <b>${r.lancamentos}</b> lançamentos do gerente/RH continuam como estão.</p>
      ${r.exemplos_mudaram?.length ? `<details style="margin-top:8px"><summary class="nota" style="cursor:pointer">Ver quem mudou de situação</summary><table class="simples" style="margin-top:8px"><thead><tr><th>Loja</th><th>Nome</th><th>Antes</th><th>Agora</th></tr></thead><tbody>${r.exemplos_mudaram.map((x) => `<tr><td>${p2(x.loja)}</td><td>${esc(titulo(x.nome))}</td><td>${esc(x.de ?? "-")}</td><td>${esc(x.para ?? "-")}</td></tr>`).join("")}</tbody></table></details>` : ""}
      <p class="nota" style="margin-top:12px"><b>Colunas guardadas:</b></p><div class="chips ok">${lidas.map((c) => `<span>${esc(c)}</span>`).join("")}</div>
      <p class="nota" style="margin-top:10px"><b>Colunas descartadas</b> (não saem do seu computador):</p><div class="chips fora">${fora.map((c) => `<span>${esc(c)}</span>`).join("")}</div>
      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn btn-primario" id="btn-gravar">Gravar no banco</button><button type="button" class="btn btn-borda" id="btn-cancelar-imp">Cancelar</button></div></div>`;
  }
  h += '<div class="cartao"><h3>Últimas atualizações</h3><div id="hist-imp" class="nota">Carregando…</div></div></div>';
  $("#conteudo").innerHTML = h;

  const zona = $("#zona"), inp = $("#arquivo");
  inp.addEventListener("change", () => inp.files[0] && lerArquivo(inp.files[0]));
  zona.addEventListener("dragover", (e) => { e.preventDefault(); zona.classList.add("arrastando"); });
  zona.addEventListener("dragleave", () => zona.classList.remove("arrastando"));
  zona.addEventListener("drop", (e) => { e.preventDefault(); zona.classList.remove("arrastando"); const f = e.dataTransfer.files[0]; if (f) lerArquivo(f); });
  if (importacao) {
    $("#btn-cancelar-imp").onclick = () => { importacao = null; telaImportar(); };
    $("#btn-gravar").onclick = gravarImportacao;
  }
  rpc("ql_web_importacoes_lista", { p_token: sessao.token }).then((l) => {
    const el = $("#hist-imp"); if (!el) return;
    el.innerHTML = l.length ? `<table class="simples"><thead><tr><th>Quando</th><th>Quem</th><th>Arquivo</th><th>Linhas</th></tr></thead><tbody>${l.map((x) => `<tr><td class="num">${esc(dataHora(x.em))}</td><td>${esc(x.email)}</td><td>${esc(x.arquivo || "")}</td><td class="num">${x.linhas}</td></tr>`).join("")}</tbody></table>` : "Nenhuma importação ainda.";
  }).catch(() => {});
}

let exceljsPromessa = null;
function carregarExcelJS() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  exceljsPromessa ||= new Promise((ok, falha) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
    s.onload = () => ok(window.ExcelJS);
    s.onerror = () => { exceljsPromessa = null; falha(new Error("Não consegui carregar o leitor de Excel. Confira a internet.")); };
    document.head.appendChild(s);
  });
  return exceljsPromessa;
}
// valor "cru" de uma célula do ExcelJS (fórmula → resultado, rich text → texto)
function valorCelula(v) {
  if (v == null) return null;
  if (v instanceof Date) return v;
  if (typeof v === "object") {
    if ("result" in v) return valorCelula(v.result);
    if (v.richText) return v.richText.map((t) => t.text).join("");
    if ("text" in v) return v.text;
    if (v.error) return null;
    return null;
  }
  return v;
}
const dataCelula = (v) => {
  if (v instanceof Date) return `${v.getUTCFullYear()}-${p2(v.getUTCMonth() + 1)}-${p2(v.getUTCDate())}`;
  if (typeof v === "number" && v > 20000 && v < 80000) { const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000); return dataCelula(d); }
  return v == null ? "" : String(v).trim();
};
const textoCelula = (v) => (v == null ? "" : v instanceof Date ? dataCelula(v) : String(v));

async function lerArquivo(arquivo) {
  if (!/\.xlsx$/i.test(arquivo.name)) return toast("Envie o arquivo .xlsx exportado do Senior.", "erro");
  carregando(true);
  try {
    const ExcelJS = await carregarExcelJS();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await arquivo.arrayBuffer());
    const ws = wb.getWorksheet("Banco") || wb.worksheets.find((w) => {
      const vals = (w.getRow(1).values || []).map((x) => String(valorCelula(x) ?? "").trim());
      return vals.includes("Nome") && vals.includes("Loja");
    });
    if (!ws) throw new Error("Não encontrei a aba “Banco” no arquivo.");
    const cab = [];
    ws.getRow(1).eachCell({ includeEmpty: true }, (c, col) => { cab[col] = String(valorCelula(c.value) ?? "").trim(); });
    const pos = {};
    cab.forEach((nome, col) => { if (COLUNAS[nome] && !(nome in pos)) pos[nome] = col; });   // 1ª coluna com o nome (o Excel tem duas "Situação")
    if (!pos.Nome || !pos.Loja) throw new Error("A aba Banco precisa das colunas Loja e Nome.");
    const out = [];
    for (let i = 2; i <= ws.rowCount; i++) {
      const row = ws.getRow(i);
      const get = (n) => (pos[n] ? valorCelula(row.getCell(pos[n]).value) : null);
      const nome = get("Nome"), loja = get("Loja");
      if ((nome == null || String(nome).trim() === "") && (loja == null || String(loja).trim() === "")) continue;
      const lj = Number(String(loja ?? "").replace(",", "."));
      const t = (n) => { const x = get(n); return x == null ? "" : textoCelula(x); };
      out.push({ l: Number.isFinite(lj) ? Math.trunc(lj) : 0, d: t("Dept"), f: t("Função"), s: t("Situação"), n: nome == null ? "" : String(nome),
        e: t("Descrição (Escala)"), da: dataCelula(get("Data Afastamento")), ad: dataCelula(get("Admissão")), d1: t("DSR1"), d2: t("DSR2") });
    }
    if (!out.length) throw new Error(MENSAGENS.ARQUIVO_VAZIO);
    const resumo = await rpc("ql_web_importar", { p_token: sessao.token, p_linhas: out, p_arquivo: arquivo.name, p_gravar: false });
    importacao = { arquivo: arquivo.name, linhas: out, cabecalhos: cab.filter(Boolean), resumo };
    telaImportar();
  } catch (e) {
    toast(e.message, "erro");
  } finally {
    carregando(false);
  }
}
async function gravarImportacao() {
  const btn = $("#btn-gravar");
  btn.disabled = true; btn.textContent = "Gravando…";
  carregando(true);
  try {
    const r = await rpc("ql_web_importar", { p_token: sessao.token, p_linhas: importacao.linhas, p_arquivo: importacao.arquivo, p_gravar: true });
    importacao = null;
    toast(`Banco atualizado: ${r.linhas} linhas.${r.ledger_novos ? ` ${r.ledger_novos} admissões novas no histórico acumulado.` : ""}`, "ok");
    location.hash = "#/quadro";
    await carregar();
  } catch (e) {
    toast(e.message, "erro");
    btn.disabled = false; btn.textContent = "Gravar no banco";
  } finally {
    carregando(false);
  }
}

// ============================================================
// TEMA + MENU + INÍCIO
// ============================================================
function temaAtual() { return document.documentElement.dataset.theme === "dark" ? "dark" : "light"; }
function rotuloTema() { $("#txt-tema").textContent = temaAtual() === "dark" ? "Claro" : "Escuro"; }
$("#btn-tema").addEventListener("click", () => {
  const novo = temaAtual() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = novo;
  gravarLocal("ql_web_tema", novo);
  rotuloTema();
});
$("#btn-menu").addEventListener("click", () => {
  const fechado = document.documentElement.classList.toggle("menu-fechado");
  gravarLocal("ql_web_menu", fechado ? "fechado" : null);
});

document.addEventListener("DOMContentLoaded", () => {
  rotuloTema();
  if (sessao?.token) iniciarApp(); else telaLogin();
});
