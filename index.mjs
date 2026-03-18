// ../obieg-zero-plugins/wibor-lawsuit/src/store.ts
var STATUTORY_RATE = 11.25;
var EVIDENCE_ITEMS = [
  ["contract", "Umowa kredytu"],
  ["annexes", "Aneksy do umowy"],
  ["certificate", "Zaswiadczenie z banku o historii splat"],
  ["esis", "Formularz ESIS (jesli otrzymany)"],
  ["demand", "Wezwanie do zaplaty (kopia)"],
  ["demandProof", "Potwierdzenie nadania wezwania"],
  ["repaymentHistory", "Historia splat rat kredytu"]
];
var plnFmt = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", minimumFractionDigits: 2, maximumFractionDigits: 2 });
var formatPLN = (n) => plnFmt.format(n);
var EMPTY = { plaintiffName: "", plaintiffAddress: "", plaintiffPesel: "", courtName: "", demandDate: "", notes: "" };
var _posts;
var _sdk;
var _host;
function initStore(host, sdk) {
  _host = host;
  _posts = host.posts;
  _sdk = sdk;
  host.db.getSettings("wibor-lawsuit:").then(async (settings) => {
    const keys = Object.keys(settings);
    if (!keys.length) return;
    for (const key of keys) {
      const caseId = key.replace("wibor-lawsuit:", "");
      try {
        const data = { ...EMPTY, ...JSON.parse(settings[key]) };
        await _posts.add("wibor-lawsuit", data, { parentId: caseId });
      } catch {
      }
      await host.db.deleteSetting(key);
    }
  });
}
function useCurrentLawsuit() {
  const calcApi = _sdk.getProvider("wibor-calc");
  const calc = calcApi?.useCalc();
  const caseId = calc?.caseId ?? null;
  const lawsuits = _posts.usePosts("wibor-lawsuit", { parentId: caseId ?? void 0 });
  const current = lawsuits[0];
  return current ? { ...EMPTY, ...current.data } : EMPTY;
}
async function saveField(caseId, field, value) {
  if (!caseId) return;
  const lawsuits = await _posts.list("wibor-lawsuit", { parentId: caseId });
  if (lawsuits.length > 0) {
    await _posts.update(lawsuits[0].id, { ...lawsuits[0].data, [field]: value });
  } else {
    await _posts.add("wibor-lawsuit", { ...EMPTY, [field]: value }, { parentId: caseId });
  }
}
function useSyncCase() {
  const calcApi = _sdk.getProvider("wibor-calc");
  return calcApi?.useCalc() ?? null;
}
function calcCourtFee(wps) {
  return Math.max(30, Math.min(Math.ceil(wps * 0.05), 2e5));
}
function calcStatutoryInterest(wps, demandDate) {
  if (!demandDate) return { interest: 0, days: 0 };
  const demandMs = new Date(demandDate).getTime();
  const nowMs = (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0);
  const days = Math.max(0, Math.round((nowMs - demandMs) / 864e5));
  return { interest: wps * (STATUTORY_RATE / 100) * days / 365, days };
}

// ../obieg-zero-plugins/.shims/jsx-runtime.mjs
var J = globalThis.__obieg.jsxRuntime;
var { jsx, jsxs, Fragment } = J;

// ../obieg-zero-plugins/wibor-lawsuit/src/ui.tsx
function createUI(ui, icons, sdk) {
  const { Box, Cell, Field, Card, SummaryRow } = ui;
  const { Shield, Check, Circle } = icons;
  const inp = "input input-bordered input-sm w-full";
  function Left() {
    const calc = useSyncCase();
    const s = useCurrentLawsuit();
    const caseId = calc?.caseId;
    if (!caseId) return /* @__PURE__ */ jsx(Box, { header: /* @__PURE__ */ jsx(Cell, { label: true, children: "Pozew WIBOR" }), body: /* @__PURE__ */ jsx("div", { className: "text-xs text-base-content/40 text-center py-4", children: "Najpierw utworz sprawe w Kalkulatorze WIBOR" }) });
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Box, { header: /* @__PURE__ */ jsx(Cell, { label: true, children: "Dane powoda" }), body: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Field, { label: "Imie i nazwisko", children: /* @__PURE__ */ jsx("input", { value: s.plaintiffName, onChange: (e) => saveField(caseId, "plaintiffName", e.target.value), className: inp, placeholder: "Jan Kowalski" }) }),
        /* @__PURE__ */ jsx(Field, { label: "Adres", children: /* @__PURE__ */ jsx("input", { value: s.plaintiffAddress, onChange: (e) => saveField(caseId, "plaintiffAddress", e.target.value), className: inp, placeholder: "ul. Dluga 1, 00-001 Warszawa" }) }),
        /* @__PURE__ */ jsx(Field, { label: "PESEL", children: /* @__PURE__ */ jsx("input", { value: s.plaintiffPesel, onChange: (e) => saveField(caseId, "plaintiffPesel", e.target.value), className: inp, placeholder: "12345678901", maxLength: 11 }) })
      ] }) }),
      /* @__PURE__ */ jsx(Box, { header: /* @__PURE__ */ jsx(Cell, { label: true, children: "Sad i wezwanie" }), body: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Field, { label: "Sad wlasciwy", children: /* @__PURE__ */ jsx("input", { value: s.courtName, onChange: (e) => saveField(caseId, "courtName", e.target.value), className: inp, placeholder: "Sad Okregowy w Warszawie" }) }),
        /* @__PURE__ */ jsx(Field, { label: "Data wezwania", children: /* @__PURE__ */ jsx("input", { type: "date", value: s.demandDate, onChange: (e) => saveField(caseId, "demandDate", e.target.value), className: inp }) }),
        /* @__PURE__ */ jsx(Field, { label: "Notatki", children: /* @__PURE__ */ jsx("textarea", { value: s.notes, onChange: (e) => saveField(caseId, "notes", e.target.value), className: "textarea textarea-bordered textarea-sm w-full", rows: 3, placeholder: "Dodatkowe uwagi..." }) })
      ] }) })
    ] });
  }
  function Center() {
    const calc = useSyncCase();
    const s = useCurrentLawsuit();
    const result = calc?.result;
    const Splash = ({ children }) => /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-center space-y-3", children }) });
    if (!calc?.caseId) return /* @__PURE__ */ jsxs(Splash, { children: [
      /* @__PURE__ */ jsx(Shield, { size: 48, className: "mx-auto text-base-content/20" }),
      /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: "Pozew WIBOR" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-base-content/40", children: "Najpierw utworz sprawe i oblicz kredyt w Kalkulatorze WIBOR" })
    ] });
    if (!result) return /* @__PURE__ */ jsxs(Splash, { children: [
      /* @__PURE__ */ jsxs("div", { className: "text-lg font-bold", children: [
        "Sprawa: ",
        calc.caseName
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-base-content/40", children: "Oblicz kredyt w Kalkulatorze WIBOR" })
    ] });
    const hasPlaintiff = !!(s.plaintiffName && s.plaintiffPesel), hasCourt = !!s.courtName;
    const wps = result.overpaidInterest, fee = calcCourtFee(wps);
    const { interest: statInt, days: statDays } = calcStatutoryInterest(wps, s.demandDate);
    return /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 overflow-y-auto p-4 space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-base-300 p-5 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-2xs uppercase tracking-wider font-semibold text-base-content/40 mb-1", children: [
          "Stan sprawy: ",
          calc.caseName
        ] }),
        [
          { done: true, label: "Obliczenia", detail: `Roznica: ${formatPLN(wps)}` },
          { done: hasPlaintiff, label: "Dane powoda", detail: hasPlaintiff ? s.plaintiffName : "Uzupelnij po lewej" },
          { done: hasCourt, label: "Sad wlasciwy", detail: hasCourt ? s.courtName : "Uzupelnij po lewej" },
          { done: !!s.demandDate, label: "Wezwanie", detail: s.demandDate || "Podaj date" }
        ].map((r) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 py-1", children: [
          r.done ? /* @__PURE__ */ jsx(Check, { size: 14, className: "text-success shrink-0" }) : /* @__PURE__ */ jsx(Circle, { size: 12, className: "text-base-content/20 shrink-0" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium w-32", children: r.label }),
          /* @__PURE__ */ jsx("span", { className: `text-sm ${r.done ? "text-base-content/60" : "text-base-content/30 italic"}`, children: r.detail })
        ] }, r.label))
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsx(Card, { accent: true, label: "WPS (nadplata odsetkow)", value: formatPLN(wps), sub: "wartosc przedmiotu sporu" }),
        /* @__PURE__ */ jsx(Card, { label: "Oplata sadowa (5%)", value: formatPLN(fee), sub: "wpis od pozwu" })
      ] }),
      s.demandDate && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsx(Card, { label: `Odsetki ustawowe (${STATUTORY_RATE}%)`, value: formatPLN(statInt), sub: `${statDays} dni od wezwania` }),
        /* @__PURE__ */ jsx(Card, { accent: true, label: "Lacznie z odsetkami", value: formatPLN(wps + statInt), sub: "wartosc roszczenia" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center py-3 mb-1", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1 text-2xs uppercase tracking-wider font-semibold text-base-content/40", children: "Dane do pozwu" }),
          /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-2xs uppercase tracking-wider text-base-content/30", children: "Kwota" })
        ] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Kwota kredytu", columns: [calc.input ? formatPLN(calc.input.loanAmount) : "-"] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Rata z WIBOR", columns: [formatPLN(result.currentInstallment)] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Rata bez WIBOR", columns: [formatPLN(result.installmentNoWibor)] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Roznica miesieczna", columns: [formatPLN(result.currentInstallment - result.installmentNoWibor)] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Nadplata odsetkow", columns: [formatPLN(result.overpaidInterest)] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Przyszla oszczednosc", columns: [formatPLN(result.futureSavings)] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-base-300 bg-base-200/50 p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1 text-sm font-semibold", children: "Laczna korzysc" }),
        /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-sm tabular-nums font-bold text-success", children: formatPLN(result.overpaidInterest + result.futureSavings) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-base-300 p-5", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xs uppercase tracking-wider font-semibold text-base-content/40 mb-4", children: "Wymagane dokumenty" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2", children: EVIDENCE_ITEMS.map(([key, label]) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 py-1", children: [
          /* @__PURE__ */ jsx(Circle, { size: 12, className: "text-base-content/20 shrink-0" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-base-content/50", children: label })
        ] }, key)) })
      ] })
    ] });
  }
  function Footer() {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center px-3 text-2xs text-base-content/30", children: "Pozew WIBOR \xB7 generowanie roszczenia na podstawie kalkulacji" });
  }
  return { Left, Center, Footer };
}

// ../obieg-zero-plugins/wibor-lawsuit/src/index.tsx
var plugin = (deps) => {
  const { Shield } = deps.icons;
  const sdk = deps.sdk;
  initStore(deps.host, sdk);
  const { Left, Center, Footer } = createUI(deps.ui, deps.icons, sdk);
  return {
    id: "wibor-lawsuit",
    label: "Pozew WIBOR",
    description: "Przygotowanie pozwu \u2014 dane stron, WPS, oplaty sadowe, checklist dokumentow",
    icon: Shield,
    requires: ["wibor-calc"],
    defaultEnabled: false,
    layout: { left: Left, center: Center, footer: Footer }
  };
};
var index_default = plugin;
export {
  index_default as default
};
