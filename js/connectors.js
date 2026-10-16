/*
 * Conectores da Rotina Inteligente.
 *
 * Cada conector conversa com o mundo de fora usando o mesmo formato de item:
 *   { id, titulo, tipo: "tarefa"|"evento", repete: "diario"|"uteis"|"semanal"|"nao",
 *     data: "AAAA-MM-DD", inicio: "HH:MM", fim: "HH:MM" | "", cor, nota }
 */
const Conectores = (() => {
  const pad = (n) => String(n).padStart(2, "0");

  const RRULES = {
    diario: "FREQ=DAILY",
    uteis: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    semanal: "FREQ=WEEKLY",
  };

  // "2026-10-16" + "08:30" -> "20261016T083000"
  function carimbo(data, hora) {
    return data.replace(/-/g, "") + "T" + hora.replace(":", "") + "00";
  }

  // Fim do item; sem fim (ou fim antes do início) vira +30 minutos.
  function fimDe(item) {
    const [h, m] = item.inicio.split(":").map(Number);
    const inicio = new Date(item.data + "T00:00");
    inicio.setHours(h, m);
    let fim;
    if (item.fim && item.fim > item.inicio) {
      const [fh, fm] = item.fim.split(":").map(Number);
      fim = new Date(inicio);
      fim.setHours(fh, fm);
    } else {
      fim = new Date(inicio.getTime() + 30 * 60000);
    }
    const data = `${fim.getFullYear()}-${pad(fim.getMonth() + 1)}-${pad(fim.getDate())}`;
    return { data, hora: `${pad(fim.getHours())}:${pad(fim.getMinutes())}` };
  }

  const escapar = (t) => String(t || "")
    .replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const desescapar = (t) => t
    .replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");

  /* ---------------- Calendário (.ics / Google Agenda) ---------------- */
  const Calendario = {
    exportarICS(itens) {
      const agora = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
      const linhas = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Rotina Inteligente//PT-BR",
        "CALSCALE:GREGORIAN",
      ];
      for (const item of itens) {
        const fim = fimDe(item);
        linhas.push(
          "BEGIN:VEVENT",
          `UID:${item.id}@rotina-inteligente`,
          `DTSTAMP:${agora}`,
          `DTSTART:${carimbo(item.data, item.inicio)}`,
          `DTEND:${carimbo(fim.data, fim.hora)}`,
          `SUMMARY:${escapar(item.titulo)}`,
        );
        if (item.nota) linhas.push(`DESCRIPTION:${escapar(item.nota)}`);
        if (RRULES[item.repete]) linhas.push(`RRULE:${RRULES[item.repete]}`);
        linhas.push("END:VEVENT");
      }
      linhas.push("END:VCALENDAR");
      return linhas.join("\r\n");
    },

    importarICS(texto) {
      // Desdobra linhas continuadas (RFC 5545: começam com espaço ou tab).
      const linhas = texto.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
      const itens = [];
      let atual = null;

      for (const linha of linhas) {
        if (linha === "BEGIN:VEVENT") { atual = {}; continue; }
        if (linha === "END:VEVENT") {
          if (atual && atual.DTSTART) itens.push(converter(atual));
          atual = null;
          continue;
        }
        if (!atual) continue;
        const i = linha.indexOf(":");
        if (i < 0) continue;
        const nome = linha.slice(0, i).split(";")[0].toUpperCase();
        atual[nome] = linha.slice(i + 1);
      }
      return itens;

      function lerData(valor) {
        const m = valor.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})\d{2}(Z)?)?$/);
        if (!m) return null;
        let d;
        if (m[6]) d = new Date(Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]));
        else d = new Date(+m[1], m[2] - 1, +m[3], +(m[4] || 9), +(m[5] || 0));
        return {
          data: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
          hora: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
        };
      }

      function converter(ev) {
        const inicio = lerData(ev.DTSTART) || { data: "", hora: "09:00" };
        const fim = ev.DTEND ? lerData(ev.DTEND) : null;
        const regra = (ev.RRULE || "").toUpperCase();
        let repete = "nao";
        if (regra.includes("FREQ=DAILY")) repete = "diario";
        else if (regra.includes("FREQ=WEEKLY")) {
          repete = /BYDAY=MO,TU,WE,TH,FR(;|$)/.test(regra) ? "uteis" : "semanal";
        }
        return {
          titulo: desescapar(ev.SUMMARY || "Sem título").slice(0, 80),
          tipo: repete === "nao" ? "evento" : "tarefa",
          repete,
          data: inicio.data,
          inicio: inicio.hora,
          fim: fim && fim.data === inicio.data ? fim.hora : "",
          cor: "ceu",
          nota: ev.DESCRIPTION ? desescapar(ev.DESCRIPTION).slice(0, 300) : "",
        };
      }
    },

    linkGoogle(item) {
      const fim = fimDe(item);
      const params = new URLSearchParams({
        action: "TEMPLATE",
        text: item.titulo,
        dates: `${carimbo(item.data, item.inicio)}/${carimbo(fim.data, fim.hora)}`,
        details: item.nota || "Criado com a Rotina Inteligente",
        ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (RRULES[item.repete]) params.set("recur", `RRULE:${RRULES[item.repete]}`);
      return `https://calendar.google.com/calendar/render?${params}`;
    },
  };

  /* ---------------- WhatsApp ---------------- */
  const WhatsApp = {
    // Disponível hoje: compartilha o resumo do dia via wa.me.
    linkResumo(titulo, itens) {
      const linhas = itens.length
        ? itens.map((i) => `• ${i.inicio}${i.fim ? "–" + i.fim : ""}  ${i.titulo}`)
        : ["Dia livre 🌱"];
      const texto = `🌿 ${titulo}\n\n${linhas.join("\n")}`;
      return `https://wa.me/?text=${encodeURIComponent(texto)}`;
    },

    /*
     * Ponto de encaixe do futuro bot de WhatsApp.
     * A ideia: um pequeno servidor (ex.: WhatsApp Cloud API) que
     *   - envia lembretes antes de cada tarefa;
     *   - entende mensagens como "dentista sexta 14h" e cria o item.
     * Quando existir, basta preencher `endpoint` e implementar `sincronizar`.
     */
    bot: {
      endpoint: null,
      disponivel() { return Boolean(this.endpoint); },
      async sincronizar(/* itens */) {
        throw new Error("Bot de WhatsApp ainda não conectado.");
      },
    },
  };

  return { Calendario, WhatsApp };
})();
