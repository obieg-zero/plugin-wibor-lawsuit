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
var EMPTY = { plaintiffName: "", plaintiffAddress: "", plaintiffPesel: "", defendantBank: "", defendantKrs: "", defendantNip: "", defendantAddress: "", courtName: "", demandDate: "", notes: "" };
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
function useBanks() {
  const api = _sdk.getProvider("wibor-banks");
  return api?.useBanks() ?? [];
}
function useEvidenceStatus(caseId) {
  const api = _sdk.getProvider("wibor-evidence");
  if (!api || !caseId) return null;
  return api.useEvidence(caseId);
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
  function EvidenceChecklist({ caseId }) {
    const evidenceStatus = useEvidenceStatus(caseId);
    return /* @__PURE__ */ jsx("div", { className: "space-y-3", children: EVIDENCE_ITEMS.map(([key, label]) => {
      const status = evidenceStatus?.find((e) => e.type === key);
      const uploaded = status?.uploaded ?? false;
      return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 py-1", children: [
        uploaded ? /* @__PURE__ */ jsx(Check, { size: 14, className: "text-success shrink-0" }) : /* @__PURE__ */ jsx(Circle, { size: 12, className: "text-base-content/20 shrink-0" }),
        /* @__PURE__ */ jsx("span", { className: `text-sm ${uploaded ? "text-base-content/60" : "text-base-content/30"}`, children: label }),
        uploaded && status?.count && /* @__PURE__ */ jsx("span", { className: "text-xs text-base-content/30 ml-auto", children: status.count })
      ] }, key);
    }) });
  }
  function Left() {
    const calc = useSyncCase();
    const s = useCurrentLawsuit();
    const banks = useBanks();
    const caseId = calc?.caseId;
    if (!caseId) return /* @__PURE__ */ jsx(Box, { header: /* @__PURE__ */ jsx(Cell, { label: true, children: "Pozew WIBOR" }), body: /* @__PURE__ */ jsx("div", { className: "text-xs text-base-content/40 text-center py-4", children: "Najpierw utw\xF3rz spraw\u0119 w Kalkulatorze WIBOR" }) });
    const handleBankSelect = (bankId) => {
      const bank = banks.find((b) => b.id === bankId);
      if (bank) {
        saveField(caseId, "defendantBank", bank.name);
        saveField(caseId, "defendantKrs", bank.krs);
        saveField(caseId, "defendantNip", bank.nip);
        saveField(caseId, "defendantAddress", bank.address);
      }
    };
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Box, { header: /* @__PURE__ */ jsx(Cell, { label: true, children: "Dane powoda" }), body: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(Field, { label: "Imi\u0119 i nazwisko", children: /* @__PURE__ */ jsx("input", { value: s.plaintiffName, onChange: (e) => saveField(caseId, "plaintiffName", e.target.value), className: inp, placeholder: "Jan Kowalski" }) }),
        /* @__PURE__ */ jsx(Field, { label: "Adres", children: /* @__PURE__ */ jsx("input", { value: s.plaintiffAddress, onChange: (e) => saveField(caseId, "plaintiffAddress", e.target.value), className: inp, placeholder: "ul. Dluga 1, 00-001 Warszawa" }) }),
        /* @__PURE__ */ jsx(Field, { label: "PESEL", children: /* @__PURE__ */ jsx("input", { value: s.plaintiffPesel, onChange: (e) => saveField(caseId, "plaintiffPesel", e.target.value), className: inp, placeholder: "12345678901", maxLength: 11 }) })
      ] }) }),
      banks.length > 0 && /* @__PURE__ */ jsx(Box, { header: /* @__PURE__ */ jsx(Cell, { label: true, children: "Pozwany (bank)" }), body: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(Field, { label: "Wybierz bank", children: /* @__PURE__ */ jsxs("select", { onChange: (e) => handleBankSelect(e.target.value), className: "select select-bordered select-sm w-full", children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "-- wybierz --" }),
          banks.map((b) => /* @__PURE__ */ jsx("option", { value: b.id, children: b.name }, b.id))
        ] }) }),
        s.defendantBank && /* @__PURE__ */ jsxs("div", { className: "text-xs text-base-content/60 space-y-1", children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium", children: s.defendantBank }),
          s.defendantKrs && /* @__PURE__ */ jsxs("div", { children: [
            "KRS: ",
            s.defendantKrs
          ] }),
          s.defendantNip && /* @__PURE__ */ jsxs("div", { children: [
            "NIP: ",
            s.defendantNip
          ] }),
          s.defendantAddress && /* @__PURE__ */ jsx("div", { children: s.defendantAddress })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Box, { header: /* @__PURE__ */ jsx(Cell, { label: true, children: "Sad i wezwanie" }), body: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(Field, { label: "S\u0105d w\u0142a\u015Bciwy", children: /* @__PURE__ */ jsx("input", { value: s.courtName, onChange: (e) => saveField(caseId, "courtName", e.target.value), className: inp, placeholder: "S\u0105d Okr\u0119gowy w Warszawie" }) }),
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
      /* @__PURE__ */ jsx("p", { className: "text-xs text-base-content/40", children: "Najpierw utw\xF3rz spraw\u0119 i oblicz kredyt w Kalkulatorze WIBOR" })
    ] });
    if (!result) return /* @__PURE__ */ jsxs(Splash, { children: [
      /* @__PURE__ */ jsxs("div", { className: "text-lg font-bold", children: [
        "Sprawa: ",
        calc.caseName
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-base-content/40", children: "Oblicz kredyt w kalkulatorze WIBOR" })
    ] });
    const hasPlaintiff = !!(s.plaintiffName && s.plaintiffPesel), hasCourt = !!s.courtName;
    const wps = result.overpaidInterest, fee = calcCourtFee(wps);
    const { interest: statInt, days: statDays } = calcStatutoryInterest(wps, s.demandDate);
    return /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 overflow-y-auto p-6 space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-base-300 p-6 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-xs uppercase tracking-wider font-semibold text-base-content/40 mb-1", children: [
          "Stan sprawy: ",
          calc.caseName
        ] }),
        [
          { done: true, label: "Obliczenia", detail: `R\xF3\u017Cnica: ${formatPLN(wps)}` },
          { done: hasPlaintiff, label: "Dane powoda", detail: hasPlaintiff ? s.plaintiffName : "Uzupe\u0142nij po lewej" },
          { done: hasCourt, label: "S\u0105d w\u0142a\u015Bciwy", detail: hasCourt ? s.courtName : "Uzupe\u0142nij po lewej" },
          { done: !!s.demandDate, label: "Wezwanie", detail: s.demandDate || "Podaj dat\u0119" }
        ].map((r) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 py-1", children: [
          r.done ? /* @__PURE__ */ jsx(Check, { size: 14, className: "text-success shrink-0" }) : /* @__PURE__ */ jsx(Circle, { size: 12, className: "text-base-content/20 shrink-0" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium w-32", children: r.label }),
          /* @__PURE__ */ jsx("span", { className: `text-sm ${r.done ? "text-base-content/60" : "text-base-content/30 italic"}`, children: r.detail })
        ] }, r.label))
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsx(Card, { accent: true, label: "WPS (nadplata odsetkow)", value: formatPLN(wps), sub: "warto\u015B\u0107 przedmiotu sporu" }),
        /* @__PURE__ */ jsx(Card, { label: "Op\u0142ata s\u0105dowa (5%)", value: formatPLN(fee), sub: "wpis od pozwu" })
      ] }),
      s.demandDate && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsx(Card, { label: `Odsetki ustawowe (${STATUTORY_RATE}%)`, value: formatPLN(statInt), sub: `${statDays} dni od wezwania` }),
        /* @__PURE__ */ jsx(Card, { accent: true, label: "\u0141\u0105cznie z odsetkami", value: formatPLN(wps + statInt), sub: "warto\u015B\u0107 roszczenia" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center py-3 mb-1", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1 text-xs uppercase tracking-wider font-semibold text-base-content/40", children: "Dane do pozwu" }),
          /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-xs uppercase tracking-wider text-base-content/30", children: "Kwota" })
        ] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Kwota kredytu", columns: [calc.input ? formatPLN(calc.input.loanAmount) : "-"] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Rata z WIBOR", columns: [formatPLN(result.currentInstallment)] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Rata bez WIBOR", columns: [formatPLN(result.installmentNoWibor)] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "R\xF3\u017Cnica miesi\u0119czna", columns: [formatPLN(result.currentInstallment - result.installmentNoWibor)] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Nadp\u0142ata odsetek", columns: [formatPLN(result.overpaidInterest)] }),
        /* @__PURE__ */ jsx(SummaryRow, { label: "Przysz\u0142a oszcz\u0119dno\u015B\u0107", columns: [formatPLN(result.futureSavings)] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-base-300 bg-base-200/50 p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1 text-sm font-semibold", children: "\u0141\u0105czna korzy\u015B\u0107" }),
        /* @__PURE__ */ jsx("div", { className: "w-32 text-right text-sm tabular-nums font-bold text-success", children: formatPLN(result.overpaidInterest + result.futureSavings) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-base-300 p-6", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wider font-semibold text-base-content/40 mb-4", children: "Wymagane dokumenty" }),
        /* @__PURE__ */ jsx(EvidenceChecklist, { caseId: calc.caseId })
      ] })
    ] });
  }
  function Footer() {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center px-4 text-xs text-base-content/30", children: "Pozew WIBOR \xB7 generowanie roszczenia na podstawie kalkulacji" });
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
    requires: ["wibor-calc", "wibor-banks", "wibor-evidence"],
    defaultEnabled: false,
    layout: { left: Left, center: Center, footer: Footer }
  };
};
var index_default = plugin;
export {
  index_default as default
};
