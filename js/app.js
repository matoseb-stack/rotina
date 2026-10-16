(() => {
  const CHAVE = "rotina-inteligente:v1";
  const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  const $ = (s) => document.querySelector(s);
  const pad = (n) => String(n).padStart(2, "0");
  const chaveData = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const deChave = (k) => { const [a, m, d] = k.split("-").map(Number); return new Date(a, m - 1, d); };
  const somarDias = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const inicioSemana = (d) => somarDias(d, -d.getDay());
  const escapeHTML = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------------- Estado ---------------- */
  let estado = carregar();
  let vista = "dia";
  let foco = new Date();
  foco.setHours(0, 0, 0, 0);
  let editando = null;

  function carregar() {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE));
      if (salvo && Array.isArray(salvo.itens)) return salvo;
    } catch (e) { /* armazenamento indisponível */ }
    return exemplo();
  }

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* ignora */ }
  }

  // Uma rotina de exemplo para o primeiro acesso não ser uma tela vazia.
  function exemplo() {
    const hoje = chaveData(new Date());
    const daqui = (n) => chaveData(somarDias(new Date(), n));
    const item = (titulo, inicio, fim, repete, cor, data = hoje, tipo = "tarefa") =>
      ({ id: novoId(), titulo, tipo, repete, data, inicio, fim, cor, nota: "" });
    return {
      feitos: {},
      itens: [
        item("Acordar e beber água", "07:00", "07:15", "diario", "ceu"),
        item("Alongamento", "07:15", "07:45", "diario", "folha"),
        item("Café da manhã", "08:00", "08:30", "diario", "terra"),
        item("Trabalho focado", "09:00", "12:00", "uteis", "folha"),
        item("Almoço", "12:30", "13:30", "diario", "terra"),
        item("Feira orgânica", "08:00", "09:30", "semanal", "flor", chaveData(somarDias(new Date(), 6 - new Date().getDay()))),
        item("Leitura antes de dormir", "22:00", "22:30", "diario", "ceu"),
        item("Aniversário da Ana", "19:00", "", "nao", "flor", daqui(9), "evento"),
      ],
    };
  }

  /* ---------------- Regras de repetição ---------------- */
  function ocorreEm(item, data) {
    const k = chaveData(data);
    if (item.repete === "nao") return item.data === k;
    if (k < item.data) return false;
    const dia = data.getDay();
    if (item.repete === "diario") return true;
    if (item.repete === "uteis") return dia >= 1 && dia <= 5;
    if (item.repete === "semanal") return deChave(item.data).getDay() === dia;
    return false;
  }

  const itensDoDia = (data) =>
    estado.itens.filter((i) => ocorreEm(i, data)).sort((a, b) => a.inicio.localeCompare(b.inicio));

  const estaFeito = (id, data) => (estado.feitos[chaveData(data)] || []).includes(id);

  function alternarFeito(id, data) {
    const k = chaveData(data);
    const lista = estado.feitos[k] || [];
    estado.feitos[k] = lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
    if (!estado.feitos[k].length) delete estado.feitos[k];
    salvar();
    render();
  }

  /* ---------------- Renderização ---------------- */
  const maiuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  function render() {
    document.querySelectorAll(".aba").forEach((a) => a.classList.toggle("ativa", a.dataset.vista === vista));
    const alvo = $("#vista");
    if (vista === "dia") renderDia(alvo);
    if (vista === "semana") renderSemana(alvo);
    if (vista === "mes") renderMes(alvo);
    renderProximos();
  }

  function renderDia(alvo) {
    const hoje = chaveData(new Date()) === chaveData(foco);
    $("#titulo-periodo").textContent = maiuscula((hoje ? "hoje, " : "") +
      foco.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }));

    const itens = itensDoDia(foco);
    if (!itens.length) {
      alvo.innerHTML = `<div class="vazio"><span class="grande">🌱</span>Nada por aqui. Um dia livre — ou toque em <b>+ Adicionar</b>.</div>`;
      return;
    }
    const feitos = itens.filter((i) => estaFeito(i.id, foco)).length;
    const agora = new Date();
    const horaAgora = `${pad(agora.getHours())}:${pad(agora.getMinutes())}`;

    alvo.innerHTML = `
      <div class="progresso" title="${feitos} de ${itens.length} feitas"><span style="width:${(feitos / itens.length) * 100}%"></span></div>
      <ul class="lista-dia">
        ${itens.map((i) => {
          const feito = estaFeito(i.id, foco);
          const ativo = hoje && i.inicio <= horaAgora && horaAgora < (i.fim || i.inicio);
          return `
          <li class="item-dia cor-${i.cor}${feito ? " feito" : ""}${ativo ? " agora" : ""}" data-id="${i.id}">
            <div class="hora">${i.inicio}${i.fim ? `<small>até ${i.fim}</small>` : ""}</div>
            <div>
              <div class="item-titulo">${escapeHTML(i.titulo)}</div>
              <div class="item-meta">${rotuloRepete(i)}${i.nota ? " · " + escapeHTML(i.nota) : ""}</div>
            </div>
            <button class="check" data-check="${i.id}" aria-label="Marcar como feito">${feito ? "✓" : ""}</button>
          </li>`;
        }).join("")}
      </ul>`;
  }

  function renderSemana(alvo) {
    const ini = inicioSemana(foco);
    const fim = somarDias(ini, 6);
    $("#titulo-periodo").textContent =
      `${ini.getDate()} ${MESES_CURTOS[ini.getMonth()]} – ${fim.getDate()} ${MESES_CURTOS[fim.getMonth()]} ${fim.getFullYear()}`;
    const hoje = chaveData(new Date());
    let html = "";
    for (let n = 0; n < 7; n++) {
      const d = somarDias(ini, n);
      html += `
        <div class="dia-semana${chaveData(d) === hoje ? " hoje" : ""}" data-dia="${chaveData(d)}">
          <header><span>${DIAS_CURTOS[d.getDay()]}</span><b>${d.getDate()}</b></header>
          ${itensDoDia(d).map((i) =>
            `<div class="pilula cor-${i.cor}${estaFeito(i.id, d) ? " feito" : ""}" title="${i.inicio} ${escapeHTML(i.titulo)}">${i.inicio} ${escapeHTML(i.titulo)}</div>`
          ).join("")}
        </div>`;
    }
    alvo.innerHTML = `<div class="semana">${html}</div>`;
  }

  function renderMes(alvo) {
    $("#titulo-periodo").textContent = maiuscula(foco.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
    const primeiro = new Date(foco.getFullYear(), foco.getMonth(), 1);
    const ini = inicioSemana(primeiro);
    const hoje = chaveData(new Date());
    let html = DIAS_CURTOS.map((d) => `<div class="cabeca">${d}</div>`).join("");
    for (let n = 0; n < 42; n++) {
      const d = somarDias(ini, n);
      if (n === 35 && d.getMonth() !== foco.getMonth()) break; // evita linha final vazia
      const itens = itensDoDia(d);
      const max = 3;
      html += `
        <div class="celula${d.getMonth() !== foco.getMonth() ? " fora" : ""}${chaveData(d) === hoje ? " hoje" : ""}" data-dia="${chaveData(d)}">
          <div class="num">${d.getDate()}</div>
          ${itens.slice(0, max).map((i) => `<div class="pilula cor-${i.cor}" title="${i.inicio} ${escapeHTML(i.titulo)}">${escapeHTML(i.titulo)}</div>`).join("")}
          ${itens.length > max ? `<div class="mais">+${itens.length - max}</div>` : ""}
          <div class="pontos">${itens.map((i) => `<span class="ponto cor-${i.cor}"></span>`).join("")}</div>
        </div>`;
    }
    alvo.innerHTML = `<div class="mes">${html}</div>`;
  }

  function renderProximos() {
    const hoje = chaveData(new Date());
    const limite = chaveData(somarDias(new Date(), 60));
    const proximos = estado.itens
      .filter((i) => i.repete === "nao" && i.data >= hoje && i.data <= limite)
      .sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio))
      .slice(0, 6);
    $("#lista-proximos").innerHTML = proximos.length
      ? proximos.map((i) => {
          const d = deChave(i.data);
          return `<li data-id="${i.id}" class="cor-${i.cor}">
            <div class="data-mini"><b>${d.getDate()}</b><span>${MESES_CURTOS[d.getMonth()]}</span></div>
            <div><div class="item-titulo">${escapeHTML(i.titulo)}</div><div class="item-meta">${DIAS_CURTOS[d.getDay()]} · ${i.inicio}</div></div>
          </li>`;
        }).join("")
      : `<li class="discreto">Nenhum evento marcado. Que tal planejar algo bom?</li>`;
  }

  function rotuloRepete(i) {
    return { diario: "todo dia", uteis: "dias úteis", semanal: "toda semana", nao: i.tipo === "evento" ? "evento" : "só hoje" }[i.repete];
  }

  /* ---------------- Formulário ---------------- */
  const dialogo = $("#dialogo");
  const form = $("#formulario");

  function abrirForm(item) {
    editando = item || null;
    form.reset();
    $("#dialogo-titulo").textContent = item ? "Editar" : "Nova tarefa";
    $("#btn-excluir").hidden = !item;
    const valores = item || {
      titulo: "", tipo: "tarefa", repete: "diario", data: chaveData(foco),
      inicio: proximaHora(), fim: "", cor: "folha", nota: "",
    };
    for (const [k, v] of Object.entries(valores)) {
      const campo = form.elements[k];
      if (!campo) continue;
      campo.value = v;
    }
    atualizarLinkGoogle();
    atualizarRotuloData();
    dialogo.showModal();
    form.elements.titulo.focus();
  }

  function proximaHora() {
    const h = Math.min(new Date().getHours() + 1, 23);
    return `${pad(h)}:00`;
  }

  function lerForm() {
    const f = form.elements;
    return {
      titulo: f.titulo.value.trim(),
      tipo: f.tipo.value,
      repete: f.repete.value,
      data: f.data.value,
      inicio: f.inicio.value,
      fim: f.fim.value,
      cor: f.cor.value,
      nota: f.nota.value.trim(),
    };
  }

  function atualizarLinkGoogle() {
    const dados = lerForm();
    const link = $("#link-google");
    link.hidden = !(dados.titulo && dados.data && dados.inicio);
    if (!link.hidden) link.href = Conectores.Calendario.linkGoogle(dados);
  }

  function atualizarRotuloData() {
    $("#rotulo-data").textContent = form.elements.repete.value === "nao" ? "" : "(a partir de)";
  }

  // Ao escolher "Evento", sugere que não repete (e vice-versa).
  form.elements.tipo.addEventListener("change", (e) => {
    form.elements.repete.value = e.target.value === "evento" ? "nao" : "diario";
    atualizarRotuloData();
  });
  form.elements.repete.addEventListener("change", atualizarRotuloData);
  form.addEventListener("input", atualizarLinkGoogle);

  form.addEventListener("submit", (e) => {
    const dados = lerForm();
    if (!dados.titulo || !dados.data || !dados.inicio) { e.preventDefault(); return; }
    if (dados.fim && dados.fim <= dados.inicio) dados.fim = "";
    if (editando) Object.assign(editando, dados);
    else estado.itens.push({ id: novoId(), ...dados });
    salvar();
    if (!editando) { foco = deChave(dados.data); }
    avisar(editando ? "Alterações salvas" : "Adicionado à rotina 🌿");
    editando = null;
    render();
  });

  $("#btn-cancelar").addEventListener("click", () => dialogo.close());
  $("#btn-excluir").addEventListener("click", () => {
    if (!editando || !confirm(`Excluir "${editando.titulo}"?`)) return;
    estado.itens = estado.itens.filter((i) => i !== editando);
    for (const k of Object.keys(estado.feitos)) {
      estado.feitos[k] = estado.feitos[k].filter((id) => id !== editando.id);
      if (!estado.feitos[k].length) delete estado.feitos[k];
    }
    salvar();
    dialogo.close();
    editando = null;
    avisar("Excluído");
    render();
  });

  /* ---------------- Navegação ---------------- */
  document.querySelectorAll(".aba").forEach((aba) =>
    aba.addEventListener("click", () => { vista = aba.dataset.vista; render(); }));

  function mover(direcao) {
    if (vista === "dia") foco = somarDias(foco, direcao);
    if (vista === "semana") foco = somarDias(foco, 7 * direcao);
    if (vista === "mes") foco = new Date(foco.getFullYear(), foco.getMonth() + direcao, 1);
    render();
  }
  $("#btn-anterior").addEventListener("click", () => mover(-1));
  $("#btn-proximo").addEventListener("click", () => mover(1));
  $("#btn-hoje").addEventListener("click", () => { foco = new Date(); foco.setHours(0, 0, 0, 0); render(); });
  $("#btn-novo").addEventListener("click", () => abrirForm());

  $("#vista").addEventListener("click", (e) => {
    const check = e.target.closest("[data-check]");
    if (check) { alternarFeito(check.dataset.check, foco); return; }
    const item = e.target.closest(".item-dia");
    if (item) { abrirForm(estado.itens.find((i) => i.id === item.dataset.id)); return; }
    const dia = e.target.closest("[data-dia]");
    if (dia) { foco = deChave(dia.dataset.dia); vista = "dia"; render(); }
  });

  $("#lista-proximos").addEventListener("click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li) return;
    const item = estado.itens.find((i) => i.id === li.dataset.id);
    foco = deChave(item.data);
    vista = "dia";
    render();
  });

  /* ---------------- Conectores ---------------- */
  $("#btn-exportar").addEventListener("click", () => {
    const ics = Conectores.Calendario.exportarICS(estado.itens);
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "rotina-inteligente.ics" });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    avisar("Arquivo .ics gerado");
  });

  $("#input-importar").addEventListener("change", async (e) => {
    const arquivo = e.target.files[0];
    e.target.value = "";
    if (!arquivo) return;
    try {
      const assinatura = (i) => `${i.titulo}|${i.data}|${i.inicio}`;
      const existentes = new Set(estado.itens.map(assinatura));
      const novos = Conectores.Calendario.importarICS(await arquivo.text())
        .filter((i) => i.data && !existentes.has(assinatura(i)));
      novos.forEach((i) => estado.itens.push({ id: novoId(), ...i }));
      salvar();
      render();
      avisar(novos.length ? `${novos.length} evento(s) importado(s)` : "Nenhum evento novo encontrado");
    } catch (err) {
      avisar("Não consegui ler esse arquivo");
    }
  });

  $("#btn-whatsapp").addEventListener("click", () => {
    const titulo = "Rotina de " + foco.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    window.open(Conectores.WhatsApp.linkResumo(titulo, itensDoDia(foco)), "_blank", "noopener");
  });

  /* ---------------- Aviso ---------------- */
  let temporizador;
  function avisar(msg) {
    const el = $("#aviso");
    el.textContent = msg;
    el.classList.add("visivel");
    clearTimeout(temporizador);
    temporizador = setTimeout(() => el.classList.remove("visivel"), 2200);
  }

  render();
  // Atualiza o destaque "agora" a cada minuto.
  setInterval(() => { if (vista === "dia") render(); }, 60000);
})();
