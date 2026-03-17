// mcp-plugin-dev/shims/react.mjs
var R = globalThis.__obieg.React;
var { useState, useEffect, useCallback, useRef, useMemo, useReducer, useContext, createContext, createElement, Fragment, memo, forwardRef, useLayoutEffect, useId, useSyncExternalStore, useTransition, Component } = R;

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
var empty = () => ({ plaintiffName: "", plaintiffAddress: "", plaintiffPesel: "", courtName: "", demandDate: "", notes: "" });
var _data = {};
var _activeCaseId = null;
var subs = /* @__PURE__ */ new Set();
var emit = () => subs.forEach((fn) => fn());
var getCurrent = () => _activeCaseId ? _data[_activeCaseId] ?? empty() : empty();
var _host;
var _sdk;
function initStore(host, sdk) {
  _host = host;
  _sdk = sdk;
}
function useCurrentLawsuit() {
  return useSyncExternalStore((cb) => {
    subs.add(cb);
    return () => subs.delete(cb);
  }, getCurrent);
}
async function loadForCase(caseId) {
  if (_data[caseId]) return;
  const raw = await _host.db.getSetting(`wibor-lawsuit:${caseId}`);
  if (raw) try {
    _data[caseId] = { ...empty(), ...JSON.parse(raw) };
  } catch {
  }
  emit();
}
function saveField(field, value) {
  if (!_activeCaseId) return;
  if (!_data[_activeCaseId]) _data[_activeCaseId] = empty();
  _data[_activeCaseId] = { ..._data[_activeCaseId], [field]: value };
  emit();
  _host.db.setSetting(`wibor-lawsuit:${_activeCaseId}`, JSON.stringify(_data[_activeCaseId]));
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
function useSyncCase() {
  const calcApi = _sdk.getProvider("wibor-calc");
  const calc = calcApi?.useCalc();
  const caseId = calc?.caseId ?? null;
  useEffect(() => {
    if (caseId && caseId !== _activeCaseId) {
      _activeCaseId = caseId;
      loadForCase(caseId);
    }
  }, [caseId]);
  return calc;
}

// mcp-plugin-dev/shims/jsx-runtime.mjs
var J = globalThis.__obieg.jsxRuntime;
var { jsx, jsxs, Fragment: Fragment2 } = J;

// ../obieg-zero-plugins/wibor-lawsuit/src/ui.tsx
function createUI(ui, icons, sdk) {
  const { Box, Cell, Field } = ui;
  const { Shield, Check, Circle } = icons;
  const grid2 = { display: "grid", gridTemplateColumns: "repeat(2, 1fr)" };
  const inp = "input input-bordered input-sm w-full";
  const StatusRow = ({ done, label, detail }) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    done ? /* @__PURE__ */ jsx(Check, { size: 14, className: "text-success shrink-0" }) : /* @__PURE__ */ jsx(Circle, { size: 12, className: "text-base-content/20 shrink-0" }),
    /* @__PURE__ */ jsx("span", { className: "text-xs font-medium w-28", children: label }),
    /* @__PURE__ */ jsx("span", { className: `text-xs ${done ? "text-base-content/60" : "text-base-content/30 italic"}`, children: detail })
  ] });
  function Left() {
    const calc = useSyncCase();
    const s = useCurrentLawsuit();
    if (!calc?.caseId) return /* @__PURE__ */ jsx(Box, { header: /* @__PURE__ */ jsx(Cell, { label: true, children: "Pozew WIBOR" }), body: /* @__PURE__ */ jsx("div", { className: "text-xs text-base-content/40 text-center py-4", children: "Najpierw utworz sprawe w Kalkulatorze WIBOR" }) });
    return /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx(Box, { header: /* @__PURE__ */ jsx(Cell, { label: true, children: "Dane powoda" }), body: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Field, { label: "Imie i nazwisko", children: /* @__PURE__ */ jsx("input", { value: s.plaintiffName, onChange: (e) => saveField("plaintiffName", e.target.value), className: inp, placeholder: "Jan Kowalski" }) }),
        /* @__PURE__ */ jsx(Field, { label: "Adres", children: /* @__PURE__ */ jsx("input", { value: s.plaintiffAddress, onChange: (e) => saveField("plaintiffAddress", e.target.value), className: inp, placeholder: "ul. Dluga 1, 00-001 Warszawa" }) }),
        /* @__PURE__ */ jsx(Field, { label: "PESEL", children: /* @__PURE__ */ jsx("input", { value: s.plaintiffPesel, onChange: (e) => saveField("plaintiffPesel", e.target.value), className: inp, placeholder: "12345678901", maxLength: 11 }) })
      ] }) }),
      /* @__PURE__ */ jsx(Box, { header: /* @__PURE__ */ jsx(Cell, { label: true, children: "Sad i wezwanie" }), body: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Field, { label: "Sad wlasciwy", children: /* @__PURE__ */ jsx("input", { value: s.courtName, onChange: (e) => saveField("courtName", e.target.value), className: inp, placeholder: "Sad Okregowy w Warszawie" }) }),
        /* @__PURE__ */ jsx(Field, { label: "Data wezwania", children: /* @__PURE__ */ jsx("input", { type: "date", value: s.demandDate, onChange: (e) => saveField("demandDate", e.target.value), className: inp }) }),
        /* @__PURE__ */ jsx(Field, { label: "Notatki", children: /* @__PURE__ */ jsx("textarea", { value: s.notes, onChange: (e) => saveField("notes", e.target.value), className: "textarea textarea-bordered textarea-sm w-full", rows: 3, placeholder: "Dodatkowe uwagi..." }) })
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
    const td = "text-base-content/50";
    return /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 overflow-y-auto p-3 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-base-200 rounded-lg p-3 space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2", children: [
          "Stan sprawy: ",
          calc.caseName
        ] }),
        /* @__PURE__ */ jsx(StatusRow, { done: true, label: "Obliczenia", detail: `Roznica: ${formatPLN(wps)}` }),
        /* @__PURE__ */ jsx(StatusRow, { done: hasPlaintiff, label: "Dane powoda", detail: hasPlaintiff ? s.plaintiffName : "Uzupelnij po lewej" }),
        /* @__PURE__ */ jsx(StatusRow, { done: hasCourt, label: "Sad wlasciwy", detail: hasCourt ? s.courtName : "Uzupelnij po lewej" }),
        /* @__PURE__ */ jsx(StatusRow, { done: !!s.demandDate, label: "Wezwanie", detail: s.demandDate || "Podaj date" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-base-200 rounded-lg p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-base-content/60 uppercase tracking-wider mb-3", children: "Wartosc przedmiotu sporu" }),
        /* @__PURE__ */ jsxs("div", { style: grid2, className: "gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-2xs text-base-content/40", children: "WPS (nadplata odsetkow)" }),
            /* @__PURE__ */ jsx("div", { className: "text-xl font-bold text-success", children: formatPLN(wps) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-2xs text-base-content/40", children: "Oplata sadowa (5% WPS)" }),
            /* @__PURE__ */ jsx("div", { className: "text-xl font-bold", children: formatPLN(fee) })
          ] })
        ] }),
        s.demandDate && /* @__PURE__ */ jsxs("div", { style: grid2, className: "gap-3 mt-3 pt-3 border-t border-base-300", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "text-2xs text-base-content/40", children: [
              "Odsetki ustawowe (",
              STATUTORY_RATE,
              "%)"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-lg font-bold", children: formatPLN(statInt) }),
            /* @__PURE__ */ jsxs("div", { className: "text-2xs text-base-content/30", children: [
              statDays,
              " dni od wezwania"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-2xs text-base-content/40", children: "Lacznie z odsetkami" }),
            /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-primary", children: formatPLN(wps + statInt) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-base-200 rounded-lg p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-base-content/60 uppercase tracking-wider mb-3", children: "Dane do pozwu" }),
        /* @__PURE__ */ jsx("table", { className: "table table-xs", children: /* @__PURE__ */ jsxs("tbody", { children: [
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: td, children: "Kwota kredytu" }),
            /* @__PURE__ */ jsx("td", { className: "text-right", children: calc.input ? formatPLN(calc.input.loanAmount) : "-" })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: td, children: "Rata z WIBOR" }),
            /* @__PURE__ */ jsx("td", { className: "text-right", children: formatPLN(result.currentInstallment) })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: td, children: "Rata bez WIBOR" }),
            /* @__PURE__ */ jsx("td", { className: "text-right", children: formatPLN(result.installmentNoWibor) })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: td, children: "Roznica miesieczna" }),
            /* @__PURE__ */ jsx("td", { className: "text-right", children: formatPLN(result.currentInstallment - result.installmentNoWibor) })
          ] }),
          /* @__PURE__ */ jsxs("tr", { className: "font-bold", children: [
            /* @__PURE__ */ jsx("td", { className: td, children: "Nadplata odsetkow" }),
            /* @__PURE__ */ jsx("td", { className: "text-right", children: formatPLN(result.overpaidInterest) })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: td, children: "Przyszla oszczednosc" }),
            /* @__PURE__ */ jsx("td", { className: "text-right", children: formatPLN(result.futureSavings) })
          ] }),
          /* @__PURE__ */ jsxs("tr", { className: "font-bold", children: [
            /* @__PURE__ */ jsx("td", { className: td, children: "Laczna korzysc" }),
            /* @__PURE__ */ jsx("td", { className: "text-right", children: formatPLN(result.overpaidInterest + result.futureSavings) })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-base-200 rounded-lg p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-base-content/60 uppercase tracking-wider mb-3", children: "Wymagane dokumenty" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-1", children: EVIDENCE_ITEMS.map(([key, label]) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
          /* @__PURE__ */ jsx(Circle, { size: 12, className: "text-base-content/20 shrink-0" }),
          /* @__PURE__ */ jsx("span", { className: "text-base-content/50", children: label })
        ] }, key)) })
      ] })
    ] });
  }
  function Footer() {
    const calc = sdk.getProvider("wibor-calc")?.useCalc();
    if (!calc?.result) return null;
    const wps = calc.result.overpaidInterest;
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 text-2xs text-base-content/40", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        "WPS: ",
        /* @__PURE__ */ jsx("strong", { className: "text-success", children: formatPLN(wps) })
      ] }),
      /* @__PURE__ */ jsx("span", { children: "|" }),
      /* @__PURE__ */ jsxs("span", { children: [
        "Oplata: ",
        /* @__PURE__ */ jsx("strong", { children: formatPLN(calcCourtFee(wps)) })
      ] })
    ] });
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
