// ============================================================
// QL web · 1.2.0 — Usuários, histórico da linha e exportação do quadro em Excel
// Usa os utilitários e o estado do app.js / relatorios.js (carregados antes).
// ============================================================

// ---------- USUÁRIOS (só analista) ----------
let usuariosCache = null;
async function telaUsuarios() {
  if (sessao.perfil !== "analista") { $("#conteudo").innerHTML = '<div class="cartao"><p class="erro">Só o analista gerencia os usuários.</p></div>'; return; }
  $("#conteudo").innerHTML = '<div class="cartao vazio-msg">Carregando…</div>';
  try { usuariosCache = await rpc("ql_web_usuarios_lista", { p_token: sessao.token }); }
  catch (e) { $("#conteudo").innerHTML = `<div class="cartao"><p class="erro">${esc(e.message)}</p></div>`; return; }
  if (pagina() !== "usuarios") return;
  const quando = (v) => (v ? dataHora(v) : "—");
  const h = `<div class="pagina"><div class="cartao"><h3>Logins do QL<small>${usuariosCache.length} usuários</small></h3>
    <p class="nota" style="margin-bottom:12px">Trocar a senha, o perfil ou desativar derruba as sessões abertas daquele login. A senha fica guardada só como código (hash), ninguém consegue ver.</p>
    <div class="barra-ferr" style="margin-bottom:12px"><button type="button" class="btn btn-primario" data-us="novo">${IC.mais}Novo login</button></div>
    <div class="tabela-wrap"><table class="simples us-tab"><thead><tr><th>E-mail</th><th>Perfil</th><th>Loja</th><th>Situação</th><th>Senha</th><th>Último login</th><th></th></tr></thead><tbody>
    ${usuariosCache.map((u, i) => `<tr class="${u.ativo ? "" : "inativo"}"><td><b>${esc(u.email)}</b>${u.email === sessao.email ? ' <span class="badge b-ok">você</span>' : ""}</td>
      <td>${esc(ROTULO_PERFIL[u.perfil] || u.perfil)}</td><td>${u.loja_fixa != null ? esc(nomeLoja(u.loja_fixa)) : "Todas"}</td>
      <td>${u.ativo ? '<span class="badge b-ativo">Ativo</span>' : '<span class="badge b-demitido">Desativado</span>'}</td>
      <td>${u.tem_senha ? "definida" : '<span class="badge b-afastado">sem senha</span>'}</td><td class="num">${esc(quando(u.ultimo_login))}</td>
      <td><button type="button" class="btn btn-borda btn-peq" data-us="${i}">Editar</button></td></tr>`).join("")}
    </tbody></table></div></div></div>`;
  $("#conteudo").innerHTML = h;
  $$("[data-us]").forEach((b) => (b.onclick = () => formUsuario(b.dataset.us === "novo" ? null : usuariosCache[+b.dataset.us])));
}

function formUsuario(u) {
  const novo = !u;
  const lojas = dados?.lojas?.length ? dados.lojas : [1, 2, 3, 4, 5, 6, 7, 8, 30, 50];
  abrirJanela(`<h3>${novo ? "Novo login" : "Editar " + esc(u.email)}</h3>
    <form id="form-us" class="us-form" autocomplete="off">
      <label class="campo"><span>E-mail</span><input name="email" type="text" inputmode="email" autocapitalize="off" spellcheck="false" value="${esc(u?.email || "")}"${novo ? "" : " readonly"} placeholder="nome@molicenter.com.br"></label>
      <label class="campo"><span>Perfil</span><select name="perfil">${["analista", "rh", "supervisor", "gerente"].map((p) => `<option value="${p}"${(u?.perfil || "gerente") === p ? " selected" : ""}>${esc(ROTULO_PERFIL[p])}</option>`).join("")}</select></label>
      <label class="campo"><span>Loja</span><select name="loja"><option value="">Todas as lojas</option>${lojas.map((l) => `<option value="${l}"${u?.loja_fixa === l ? " selected" : ""}>${esc(nomeLoja(l))}</option>`).join("")}</select></label>
      <label class="campo"><span>${novo ? "Senha (mínimo 6)" : "Nova senha (em branco = não muda)"}</span>
        <input name="senha" type="text" class="senha" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-1p-ignore="true" data-form-type="other"></label>
      <label class="check"><input type="checkbox" name="ativo"${u?.ativo === false ? "" : " checked"}> Login ativo</label>
      <p class="nota">Gerente precisa de loja. RH com loja só vê e edita aquela loja.</p>
      <div class="acoes"><button type="button" class="btn btn-borda" id="us-cancelar">Cancelar</button><button type="submit" class="btn btn-primario" id="us-salvar">Salvar</button></div>
    </form>`);
  $("#us-cancelar").onclick = fecharJanela;
  $("#form-us").onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target, btn = $("#us-salvar");
    btn.disabled = true;
    try {
      await rpc("ql_web_usuario_salvar", { p_token: sessao.token, p_email: f.email.value, p_perfil: f.perfil.value,
        p_loja_fixa: f.loja.value ? +f.loja.value : null, p_ativo: f.ativo.checked, p_senha: f.senha.value });
      fecharJanela();
      toast(novo ? "Login criado." : "Login atualizado.", "ok");
      telaUsuarios();
    } catch (err) { toast(err.message, "erro"); btn.disabled = false; }
  };
}
Object.assign(MENSAGENS, {
  EMAIL_INVALIDO: "Digite um e-mail válido.", PERFIL_INVALIDO: "Escolha o perfil.", GERENTE_SEM_LOJA: "Gerente precisa ter uma loja.",
  NAO_PODE_SI_MESMO: "Você não pode desativar nem tirar o perfil de analista do seu próprio login.",
  SENHA_CURTA: "A senha precisa ter pelo menos 6 caracteres.", SENHA_OBRIGATORIA: "Defina uma senha para o login novo.",
});

// ---------- HISTÓRICO DA LINHA ----------
const CAMPOS_HIST = [["situacao", "Situação"], ["dept", "Dept"], ["funcao", "Função"], ["abertura", "Data Abertura"], ["resp", "Responsável"],
  ["horario", "Horário Contrato"], ["sexo", "Sexo"], ["motivo", "Motivo"], ["obs", "Observação"], ["status_rh", "Status RH"], ["candidato", "Candidato"], ["admissao", "Data Admissão"]];
async function verHistorico(r) {
  abrirJanela(`<h3>Histórico · ${esc(titulo(r.nome))}</h3><p class="nota">${esc(nomeLoja(r.loja))} · ${esc(r.dept)} · ${esc(r.funcao)}</p><div id="hist-corpo" class="nota">Carregando…</div>
    <div class="acoes"><button type="button" class="btn btn-borda" id="hist-fechar">Fechar</button></div>`);
  $("#janela").classList.add("larga");
  $("#hist-fechar").onclick = fecharJanela;
  let lista;
  try { lista = await rpc("ql_web_historico_linha", { p_token: sessao.token, p_loja: r.loja, p_nome: r.nome }); }
  catch (e) { $("#hist-corpo").innerHTML = `<p class="erro">${esc(e.message)}</p>`; return; }
  const el = $("#hist-corpo"); if (!el) return;
  if (!lista.length) { el.innerHTML = "Nenhuma alteração registrada para esta linha."; return; }
  const val = (x, k) => { const v = limpar(x[k]); return k === "sexo" ? SIGLA_SEXO[v] || v : k === "abertura" || k === "admissao" ? fmtBR(v) : v; };
  el.innerHTML = '<ol class="hist">' + lista.map((x, i) => {
    const ant = lista[i + 1];   // a lista vem da mais nova para a mais antiga
    const mud = CAMPOS_HIST.filter(([k]) => !ant ? val(x, k) !== "-" : val(x, k) !== val(ant, k));
    const auto = String(x.usuario || "").startsWith("SISTEMA");
    const zerou = String(x.obs || "").startsWith("[LINHA ZERADA");
    const marca = auto ? '<span class="badge b-outro">automático</span>' : zerou ? '<span class="badge b-demitido">zerou a linha</span>' : !ant ? '<span class="badge b-ativo">1º lançamento</span>' : "";
    return `<li><div class="hist-cab"><b class="num">${esc(dataHora(x.em))}</b><span>${esc(x.usuario || "—")}</span>${marca}</div>
      ${mud.length ? `<table class="hist-mud">${mud.map(([k, n]) => `<tr><th>${n}</th>${ant ? `<td class="de">${esc(val(ant, k))}</td><td class="seta-h">→</td>` : ""}<td class="para">${esc(val(x, k))}</td></tr>`).join("")}</table>` : '<p class="nota">Salvo sem mudanças nos campos.</p>'}</li>`;
  }).join("") + "</ol>";
}

// ---------- EXPORTAR O QUADRO EM EXCEL ----------
async function exportarExcel() {
  carregando(true);
  try {
    const ExcelJS = await carregarExcelJS();
    const global = isNaN(+dados.escopo);
    const termo = normalizar(est.busca);
    const vis = linhasExibidas().filter((r) => !termo || normalizar(`${r.nome} ${r.candidato} ${r.funcao} ${r.dept}`).includes(termo));
    const m = mapasOrcado();
    const realBase = linhas.filter((r) => (ehAtivo(r) || ehFerias(r)) && (!global || LOJAS_TL.includes(r.loja)));
    const real = (d, f) => realBase.filter((r) => r.dept === d && (f == null || r.funcao === f)).length;
    const ordem = (a, b) => cmp(a.dept ?? "", b.dept ?? "") || cmp(a.funcao ?? "", b.funcao ?? "") || a.i - b.i;
    const rs = vis.filter((r) => r.dept != null && r.funcao != null).sort(ordem);

    const wb = new ExcelJS.Workbook();
    wb.creator = "Molicenter QL";
    const ws = wb.addWorksheet("Quadro", { views: [{ state: "frozen", ySplit: 5 }] });
    const cols = [["Departamento", 18, "a"], ["Cargo", 18, "a"], ["Orçado cargo", 9, "a"], ["Real cargo", 8, "a"], ["Status", 11, "a"], ["Loja", 6, "a"], ["Nome do Colaborador", 36, "a"], ["Horário Sistema", 30, "a"],
      ["Data Abertura", 12, "g"], ["Responsável", 16, "g"], ["Horário Contrato", 30, "g"], ["Sexo", 11, "g"], ["Motivo", 22, "g"], ["Observação", 36, "g"],
      ["Status RH", 26, "r"], ["Candidato", 30, "r"], ["Data Admissão", 12, "r"], ["Dias em aberto", 9, "r"]];
    ws.columns = cols.map(([, w]) => ({ width: w }));
    const filtro = est.filtro !== "TODOS" ? CARDS.find((x) => x[0] === est.filtro)[1] : "Todos";
    ws.getCell("A1").value = "Molicenter — Quadro de Lotação (QL)";
    ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF0B3D63" } };
    ws.getCell("A2").value = `${nomeEscopo(dados.escopo)} · filtro: ${filtro}${est.busca ? " · busca: " + est.busca : ""} · gerado em ${dataHora(new Date().toISOString())}`;
    ws.getCell("A2").font = { color: { argb: "FF5B6B78" } };
    const cor = { a: "FF0B3D63", g: "FF047857", r: "FFBE123C" }, claro = { a: "FFDCEBF7", g: "FFDDF3EA", r: "FFFBE4EA" };
    // linha 4: donos · linha 5: colunas
    [["a", 1, 8, "DONO: ANALISTA"], ["g", 9, 14, "DONO: GERENTE"], ["r", 15, 18, "DONO: RH"]].forEach(([k, c1, c2, t]) => {
      ws.mergeCells(4, c1, 4, c2);
      const c = ws.getCell(4, c1); c.value = t; c.alignment = { horizontal: "center" };
      c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: cor[k] } };
    });
    const cab = ws.getRow(5);
    cols.forEach(([n, , k], i) => {
      const c = cab.getCell(i + 1); c.value = n; c.font = { bold: true, color: { argb: "FF22303C" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: claro[k] } }; c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      c.border = { bottom: { style: "thin", color: { argb: "FFC4D4E0" } } };
    });
    const fundoSit = (r) => (r.sitU.includes("ATIVO") ? "FFDCFCE7" : /FÉRIAS|FERIAS/.test(r.sitU) ? "FFDBEAFE" : /AFAST/.test(r.sitU) ? "FFFFEDD5" : "FFFEE2E2");
    const d_ = (v) => { const x = lerData(v); return x ? new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate())) : (vazio(v) ? null : v); };
    const sem = (v) => (vazio(v) ? null : v);
    rs.forEach((r) => {
      const of = orcFunc(m, r.dept, r.funcao);
      const linha = ws.addRow([r.dept, r.funcao, of ?? null, of != null ? real(r.dept, r.funcao) : null, ehDemitido(r) && !r.sitU.includes("ATIVO") ? "Demitido" : r.sit, r.loja, titulo(r.nome), sem(r.escala),
        d_(r.abertura), sem(r.resp), sem(r.horario), sem(r.sexo), sem(r.motivo), sem(r.obs), sem(r.statusRh), sem(r.candidato), d_(r.admissao), diasEmAberto(r)]);
      linha.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: fundoSit(r) } };
      [9, 17].forEach((c) => (linha.getCell(c).numFmt = "dd/mm/yyyy"));
      linha.getCell(14).alignment = { wrapText: true, vertical: "top" };
    });
    ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5 + rs.length, column: cols.length } };

    // aba de resumo por departamento → cargo (Orçado x Real x Vagas)
    const wr = wb.addWorksheet("Orçado x Real");
    wr.columns = [{ header: "Departamento", width: 22 }, { header: "Cargo", width: 24 }, { header: "No quadro", width: 11 }, { header: "Orçado", width: 9 }, { header: "Real", width: 8 }, { header: "Saldo", width: 9 }, { header: "Situação", width: 14 }];
    wr.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    wr.getRow(1).eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B3D63" } }));
    for (const d of [...new Set(rs.map((r) => r.dept))]) {
      const od = orcDept(m, d), rd = real(d);
      const ld = wr.addRow([d, "TOTAL DO DEPARTAMENTO", rs.filter((r) => r.dept === d).length, od ?? null, od != null ? rd : null, od != null ? od - rd : null, sitOrc(od, rd)]);
      ld.font = { bold: true }; ld.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCEBF7" } }));
      for (const f of [...new Set(rs.filter((r) => r.dept === d).map((r) => r.funcao))]) {
        const of = orcFunc(m, d, f), rf = real(d, f);
        wr.addRow([d, f, rs.filter((r) => r.dept === d && r.funcao === f).length, of ?? null, of != null ? rf : null, of != null ? of - rf : null, sitOrc(of, rf)]);
      }
    }
    const buf = await wb.xlsx.writeBuffer();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    a.download = `QL_${nomeEscopo(dados.escopo).replace(/\W+/g, "_")}_${carimbo()}.xlsx`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    toast(`Excel gerado com ${rs.length} linhas.`, "ok");
  } catch (e) {
    toast(e.message, "erro");
  } finally { carregando(false); }
}
function sitOrc(o, r) { if (o == null) return ""; const s = o - r; return s > 0 ? `${s} vaga${s > 1 ? "s" : ""}` : s === 0 ? "completo" : `${-s} acima`; }

// ---------- FUNIL DO RH ----------
// vagas em andamento (as mesmas do card Alterados) por Status RH, na ordem do processo
const ORDEM_FUNIL = ["-", "Divulgação da vaga", "Triagem de Curriculuns", "Entrevista RH", "Entrevista Loja", "Validado pelo gerente", "Não Validado pelo gerente",
  "Aguardando resposta Candidato", "Exame Admissional", "Documentação Admissão", "Previsão de Início", "Cancelado", "Desistencia Candidato"];
const funil = { status: null };
function telaFunil() {
  const vagas = linhas.filter((r) => r.alterado);
  const st = (r) => (vazio(r.statusRh) ? "-" : String(r.statusRh).trim());
  const nomes = [...new Set([...ORDEM_FUNIL.filter((s) => vagas.some((r) => st(r) === s)), ...vagas.map(st).filter((s) => !ORDEM_FUNIL.includes(s)).sort(cmp)])];
  const rot = (s) => (s === "-" ? "Sem status do RH" : s);
  const lojas = [...new Set(vagas.map((r) => r.loja))].sort((a, b) => a - b);
  const media = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
  const linhasF = nomes.map((s) => {
    const rs = vagas.filter((r) => st(r) === s);
    const ds = rs.map(diasEmAberto).filter((x) => x != null);
    return { s, n: rs.length, media: media(ds), velhas: ds.filter((d) => d > 30).length, porLoja: lojas.map((l) => rs.filter((r) => r.loja === l).length) };
  });
  const max = Math.max(1, ...linhasF.map((x) => x.n));
  const saida = (s) => s === "Cancelado" || s === "Desistencia Candidato";
  let h = `<div class="pagina"><div class="cartao"><h3>Onde as vagas estão<small>${vagas.length} vagas em andamento · mesma base do card Alterados</small></h3>`;
  if (!vagas.length) { $("#conteudo").innerHTML = h + '<p class="vazio-msg">Nenhuma vaga em andamento nesta seleção.</p></div></div>'; return; }
  h += `<div class="funil">${linhasF.map((x) => `<button type="button" class="funil-l${funil.status === x.s ? " sel" : ""}${saida(x.s) ? " saida" : ""}" data-st="${esc(x.s)}">
      <span class="funil-n">${esc(rot(x.s))}</span>
      <span class="funil-barra"><i style="width:${Math.max(2, (x.n / max) * 100)}%"></i></span>
      <b class="num">${x.n}</b>
      <span class="funil-d num">${x.media == null ? "" : `média ${x.media}d`}${x.velhas ? ` · <em>${x.velhas} com +30d</em>` : ""}</span></button>`).join("")}</div>
    <p class="nota" style="margin-top:10px">Dias contados desde a Data Abertura. Clique numa etapa para ver as vagas.</p></div>`;
  if (lojas.length > 1) {
    h += `<div class="cartao"><h3>Por loja</h3><div class="tabela-wrap"><table class="resumo num"><thead><tr><th>Etapa</th>${lojas.map((l) => `<th>${p2(l)}</th>`).join("")}<th>Total</th></tr></thead><tbody>
      ${linhasF.map((x) => `<tr><td>${esc(rot(x.s))}</td>${x.porLoja.map((n) => `<td>${n || '<span class="vazio">·</span>'}</td>`).join("")}<td><b>${x.n}</b></td></tr>`).join("")}
      <tr class="total"><td>Total</td>${lojas.map((l) => `<td>${vagas.filter((r) => r.loja === l).length}</td>`).join("")}<td>${vagas.length}</td></tr></tbody></table></div></div>`;
  }
  if (funil.status != null && nomes.includes(funil.status)) {
    const rs = vagas.filter((r) => st(r) === funil.status).map((r) => ({ r, d: diasEmAberto(r) })).sort((a, b) => (b.d ?? -1) - (a.d ?? -1));
    h += `<div class="cartao"><h3>${esc(rot(funil.status))}<small>${rs.length} vagas · clique para editar</small></h3><div class="tabela-wrap"><table class="simples funil-tab"><thead><tr><th>Loja</th><th>Dept / Cargo</th><th>Colaborador (vaga)</th><th>Abertura</th><th>Dias</th><th>Motivo</th><th>Candidato</th><th>Responsável</th></tr></thead><tbody>
      ${rs.map(({ r, d }) => `<tr data-linha-f="${r.i}"><td class="num">${p2(r.loja)}</td><td>${esc(r.dept)} · ${esc(r.funcao)}</td><td>${esc(titulo(r.nome))}</td><td class="num">${esc(r.abertura)}</td><td>${chipIdade(d) || "-"}</td><td>${esc(r.motivo)}</td><td>${esc(r.candidato)}</td><td>${esc(r.resp)}</td></tr>`).join("")}</tbody></table></div></div>`;
  }
  $("#conteudo").innerHTML = h + "</div>";
  $$("[data-st]").forEach((b) => (b.onclick = () => { funil.status = funil.status === b.dataset.st ? null : b.dataset.st; telaFunil(); }));
  $$("[data-linha-f]").forEach((tr) => (tr.onclick = () => abrirGaveta(linhas[+tr.dataset.linhaF])));
}
