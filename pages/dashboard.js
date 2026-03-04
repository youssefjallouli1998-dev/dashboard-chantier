import { useState } from "react";

const CHANTIERS = [
  { id:"challan", nom:"Challancin",          site:"HEGP", color:"#58a6ff", ds:"collection://3069c204-2fc5-80ab-b3d9-000b81016b18" },
  { id:"ph1",     nom:"VGR Phase 1",          site:"VGR",  color:"#3fb950", ds:"collection://2949c204-2fc5-80a5-a534-000bdfde1468" },
  { id:"ph2",     nom:"VGR Phase 2",          site:"VGR",  color:"#bc8cff", ds:"collection://b03ca79b-e694-4b36-9eaf-c95d8a76db74" },
  { id:"ph3",     nom:"VGR Phase 3",          site:"VGR",  color:"#f0883e", ds:"collection://c03361da-f3d7-40bd-a5cc-de639e09a2a3" },
  { id:"cobas",   nom:"DMU COBAS 5800",       site:"HEGP", color:"#58a6ff", ds:"collection://2b09c204-2fc5-811f-8826-000bfada1d0e" },
  { id:"immu",    nom:"DMU Immunologie",      site:"HEGP", color:"#58a6ff", ds:"collection://3039c204-2fc5-800c-89b5-000bf2002e01" },
  { id:"creche",  nom:"Creche HEGP",          site:"HEGP", color:"#58a6ff", ds:"collection://3049c204-2fc5-8189-9aba-000bc58487d2" },
  { id:"urc",     nom:"Unite Rech. Clinique", site:"HEGP", color:"#58a6ff", ds:"collection://0be2ea00-15b6-4d90-b1e8-82d1fb4ae7c0" },
];

function etatColor(e) {
  if (e === "Terminé") return "#3fb950";
  if (e === "En cours") return "#d29922";
  return "#7d8590";
}

function chiffColor(c) {
  if (!c) return "#7d8590";
  if (c === "BDC Validé") return "#3fb950";
  if (c === "BDC émis") return "#58a6ff";
  if (c === "Devis reçu") return "#f0883e";
  if (c === "Devis non reçu") return "#f85149";
  return "#7d8590";
}

function Spin() {
  return (
    <span style={{
      display: "inline-block",
      width: "12px",
      height: "12px",
      border: "2px solid #30363d",
      borderTopColor: "#58a6ff",
      borderRadius: "50%",
      animation: "spin 1s linear infinite"
    }} />
  );
}

function Badge({ children, col }) {
  const color = col || "#7d8590";
  return (
    <span style={{
      fontSize: "9px",
      fontFamily: "monospace",
      padding: "2px 6px",
      borderRadius: "3px",
      backgroundColor: color + "22",
      color: color,
      whiteSpace: "nowrap",
      fontWeight: "700"
    }}>
      {children}
    </span>
  );
}

export default function Dashboard() {
  const [taches, setTaches] = useState({});
  const [loading, setLoading] = useState({});
  const [filt, setFilt] = useState("tous");
  const [missions, setMissions] = useState([]);
  const [loadingM, setLoadingM] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [cmd, setCmd] = useState("");
  const [cmdRes, setCmdRes] = useState(null);
  const [cmdLoad, setCmdLoad] = useState(false);

  async function syncOne(ch) {
    setLoading(function(l) { return Object.assign({}, l, { [ch.id]: true }); });
    try {
      const res = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ds: ch.ds })
      });
      const data = await res.json();
      const filtered = (data.taches || []).filter(function(x) {
        return x.nom && !x.nom.includes("Créer");
      });
      setTaches(function(t) { return Object.assign({}, t, { [ch.id]: filtered }); });
    } catch(e) {
      setTaches(function(t) { return Object.assign({}, t, { [ch.id]: [] }); });
    }
    setLoading(function(l) { return Object.assign({}, l, { [ch.id]: false }); });
  }

  async function syncAll() {
    setSyncing(true);
    for (var i = 0; i < CHANTIERS.length; i++) {
      await syncOne(CHANTIERS[i]);
    }
    setSyncing(false);
  }

  async function genMissions() {
    setLoadingM(true);
    var ctx = CHANTIERS.map(function(ch) {
      var t = taches[ch.id] || [];
      var done = t.filter(function(x) { return x.etat === "Terminé"; }).length;
      var reste = t.filter(function(x) { return x.etat !== "Terminé"; }).slice(0, 6)
        .map(function(x) { return "  - " + x.nom + " | " + x.etat + " | " + (x.chiff || "-") + " | " + (x.ent || "-"); }).join("\n");
      return "== " + ch.nom + " [" + ch.site + "] " + done + "/" + t.length + " terminees ==\n" + (reste || "  Aucune tache active");
    }).join("\n\n");
    try {
      var res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ctx: ctx, date: new Date().toLocaleDateString("fr-FR") })
      });
      var data = await res.json();
      if (data.missions) setMissions(data.missions);
    } catch(e) {}
    setLoadingM(false);
  }

  async function execCmd() {
    if (!cmd.trim()) return;
    setCmdLoad(true);
    setCmdRes(null);
    try {
      var res = await fetch("/api/commande", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cmd: cmd, chantiers: CHANTIERS.map(function(c) { return { nom: c.nom, ds: c.ds }; }) })
      });
      var data = await res.json();
      setCmdRes({ ok: true, msg: data.result || "Fait" });
    } catch(e) {
      setCmdRes({ ok: false, msg: "Erreur" });
    }
    setCmdLoad(false);
    setCmd("");
  }

  var allT = [];
  CHANTIERS.forEach(function(ch) {
    var t = taches[ch.id] || [];
    t.forEach(function(x) { allT.push(x); });
  });

  var nDone  = allT.filter(function(t) { return t.etat === "Terminé"; }).length;
  var nCours = allT.filter(function(t) { return t.etat === "En cours"; }).length;
  var nVisit = allT.filter(function(t) { return t.chiff === "A prévoir" || t.chiff === "Visite à faire" || t.chiff === "Devis non reçu"; }).length;
  var nBDC   = allT.filter(function(t) { return t.chiff === "BDC émis" || t.chiff === "Devis reçu"; }).length;
  var gp     = allT.length ? Math.round(nDone / allT.length * 100) : 0;
  var pcol   = gp >= 60 ? "#3fb950" : gp >= 30 ? "#d29922" : "#f85149";
  var nLoaded = CHANTIERS.filter(function(ch) { return taches[ch.id] !== undefined; }).length;
  var filtCh  = CHANTIERS.filter(function(c) { return filt === "tous" || c.site === filt; });
  var typeCol = { action: "#58a6ff", visite: "#bc8cff", bdc: "#3fb950", decision: "#f0883e" };

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: "#e6edf3", fontFamily: "Segoe UI, sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
      `}</style>

      <div style={{ background: "#161b22", borderBottom: "1px solid #21262d", padding: "0 16px", height: "46px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>🏗️</span>
          <strong style={{ fontSize: "14px" }}>Pilotage Chantiers</strong>
          <span style={{ fontSize: "11px", color: "#7d8590", fontFamily: "monospace" }}>HEGP &amp; Vaugirard</span>
          <div style={{ width: "1px", height: "18px", background: "#21262d" }} />
          {["tous", "HEGP", "VGR"].map(function(f) {
            return (
              <button key={f} onClick={function() { setFilt(f); }} style={{
                padding: "4px 10px", borderRadius: "5px",
                border: filt === f ? "1px solid transparent" : "1px solid #21262d",
                background: filt === f ? "#58a6ff" : "transparent",
                color: filt === f ? "#0d1117" : "#7d8590",
                cursor: "pointer", fontSize: "11px", fontWeight: "600"
              }}>
                {f === "tous" ? "Tous" : f}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={syncAll} disabled={syncing} style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 14px", borderRadius: "6px", border: "none",
            background: syncing ? "#1c2330" : "#58a6ff",
            color: syncing ? "#7d8590" : "#0d1117",
            cursor: syncing ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: "700"
          }}>
            {syncing ? "Sync en cours..." : "Sync Notion"}
          </button>
          <span style={{ fontSize: "10px", color: nLoaded > 0 ? "#3fb950" : "#7d8590", fontFamily: "monospace" }}>
            {nLoaded > 0 ? nLoaded + "/" + CHANTIERS.length + " charges" : "Non charge"}
          </span>
        </div>
      </div>

      <div style={{ flex: "1", display: "flex" }}>
        <div style={{ flex: "1", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {nLoaded > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", padding: "10px 14px" }}>
              {[
                ["Terminees", nDone, "#3fb950"],
                ["En cours", nCours, "#d29922"],
                ["A planifier", nVisit, "#58a6ff"],
                ["BDC/Devis", nBDC, "#f0883e"],
                ["Avancement", gp + "%", pcol]
              ].map(function(item, i) {
                return (
                  <div key={i} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "9px", padding: "10px 12px" }}>
                    <div style={{ fontSize: "9px", fontWeight: "700", color: "#7d8590", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "4px" }}>{item[0]}</div>
                    <div style={{ fontSize: "28px", fontWeight: "800", color: item[2], fontFamily: "monospace", lineHeight: "1" }}>{item[1]}</div>
                  </div>
                );
              })}
            </div>
          )}

          {nLoaded === 0 && !syncing && (
            <div style={{ flex: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px" }}>
              <div style={{ fontSize: "48px" }}>🔗</div>
              <strong style={{ fontSize: "16px" }}>Donnees non chargees</strong>
              <p style={{ color: "#7d8590", fontSize: "13px", textAlign: "center", maxWidth: "300px", lineHeight: "1.6" }}>
                Clique sur Sync Notion pour charger les vraies taches.
              </p>
              <button onClick={syncAll} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#58a6ff", color: "#0d1117", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
                Charger depuis Notion
              </button>
            </div>
          )}

          <div style={{ flex: "1", overflow: "auto", padding: "0 14px 14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
              {filtCh.map(function(ch) {
                var t = taches[ch.id] || [];
                var isL = loading[ch.id];
                var done = t.filter(function(x) { return x.etat === "Terminé"; }).length;
                var pct = t.length ? Math.round(done / t.length * 100) : 0;
                var pc2 = pct >= 75 ? "#3fb950" : pct >= 40 ? "#d29922" : pct > 0 ? "#58a6ff" : "#7d8590";
                var next5 = t.filter(function(x) { return x.etat !== "Terminé"; })
                  .sort(function(a, b) { return (a.date || "9999") < (b.date || "9999") ? -1 : 1; })
                  .slice(0, 5);

                return (
                  <div key={ch.id} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: ch.color, display: "inline-block" }} />
                        <strong style={{ fontSize: "13px" }}>{ch.nom}</strong>
                        <Badge col={ch.site === "HEGP" ? "#58a6ff" : "#3fb950"}>{ch.site}</Badge>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isL && <Spin />}
                        {taches[ch.id] && !isL && <span style={{ fontFamily: "monospace", fontSize: "13px", color: pc2, fontWeight: "800" }}>{pct}%</span>}
                        <button onClick={function() { syncOne(ch); }} disabled={isL} style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "4px", border: "1px solid #30363d", background: "transparent", color: "#7d8590", cursor: isL ? "not-allowed" : "pointer" }}>↻</button>
                      </div>
                    </div>

                    {taches[ch.id] && (
                      <div style={{ height: "3px", background: "#1c2330", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: pct + "%", background: pc2, transition: "width 1.2s ease", borderRadius: "2px" }} />
                      </div>
                    )}

                    {isL && (
                      <div style={{ color: "#7d8590", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", padding: "8px 0" }}>
                        <Spin /> Chargement Notion...
                      </div>
                    )}

                    {!isL && taches[ch.id] && next5.length === 0 && (
                      <div style={{ fontSize: "12px", color: "#3fb950", textAlign: "center", padding: "8px 0" }}>
                        Toutes les taches terminees
                      </div>
                    )}

                    {!isL && taches[ch.id] && next5.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ fontSize: "9px", fontWeight: "700", color: "#7d8590", letterSpacing: ".08em", textTransform: "uppercase", fontFamily: "monospace" }}>
                          5 prochaines missions
                        </div>
                        {next5.map(function(x, i) {
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "5px 8px", borderRadius: "6px", background: "#1c2330", border: "1px solid #21262d" }}>
                              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: etatColor(x.etat), flexShrink: "0" }} />
                              <span style={{ fontSize: "12px", flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.nom}</span>
                              {x.ent && <Badge col="#7d8590">{x.ent}</Badge>}
                              {x.chiff && <Badge col={chiffColor(x.chiff)}>{x.chiff}</Badge>}
                              {x.date && <span style={{ fontSize: "9px", color: "#7d8590", fontFamily: "monospace", flexShrink: "0" }}>{x.date.slice(5)}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {!isL && taches[ch.id] && (
                      <div style={{ display: "flex", gap: "10px", fontSize: "10px", fontFamily: "monospace", borderTop: "1px solid #21262d", paddingTop: "8px", color: "#7d8590" }}>
                        <span style={{ color: "#3fb950" }}>✓ {done}</span>
                        <span style={{ color: "#d29922" }}>● {t.filter(function(x) { return x.etat === "En cours"; }).length}</span>
                        <span>○ {t.filter(function(x) { return x.etat !== "Terminé" && x.etat !== "En cours"; }).length}</span>
                        <span style={{ marginLeft: "auto" }}>{done}/{t.length} taches</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ width: "310px", background: "#161b22", borderLeft: "1px solid #21262d", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #21262d" }}>
            <span style={{ fontSize: "9px", fontWeight: "700", color: "#7d8590", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "monospace" }}>5 Prochaines missions</span>
            <button onClick={genMissions} disabled={loadingM || nLoaded === 0} style={{
              display: "flex", alignItems: "center", gap: "5px",
              padding: "5px 12px", borderRadius: "6px", border: "none",
              background: (loadingM || nLoaded === 0) ? "#1c2330" : "#f0883e",
              color: (loadingM || nLoaded === 0) ? "#7d8590" : "#0d1117",
              cursor: (loadingM || nLoaded === 0) ? "not-allowed" : "pointer",
              fontSize: "11px", fontWeight: "700"
            }}>
              {loadingM ? "Analyse..." : "Generer"}
            </button>
          </div>

          <div style={{ flex: "1", overflow: "auto", padding: "12px" }}>
            {missions.length === 0 && !loadingM && (
              <div style={{ color: "#7d8590", fontSize: "12px", textAlign: "center", padding: "28px 16px", lineHeight: "1.7" }}>
                <div style={{ fontSize: "30px", marginBottom: "10px" }}>🎯</div>
                Sync Notion puis Generer pour voir les 5 actions prioritaires
              </div>
            )}
            {loadingM && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "30px 0", color: "#7d8590", fontSize: "12px" }}>
                <Spin /> Analyse...
              </div>
            )}
            {missions.map(function(m, i) {
              var borderColor = m.prio === 1 ? "#f85149" : m.prio === 2 ? "#f0883e" : "#7d8590";
              var badgeCol = typeCol[m.type] || "#7d8590";
              var siteCol = m.site === "HEGP" ? "#58a6ff" : "#3fb950";
              return (
                <div key={i} style={{ background: "#1c2330", border: "1px solid #30363d", borderLeft: "3px solid " + borderColor, borderRadius: "8px", padding: "12px", marginBottom: "8px" }}>
                  <div style={{ display: "flex", gap: "5px", marginBottom: "7px", alignItems: "center" }}>
                    <Badge col={badgeCol}>{(m.type || "action").toUpperCase()}</Badge>
                    <Badge col={siteCol}>{m.site}</Badge>
                    <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#7d8590", marginLeft: "auto" }}>#{m.prio}</span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "600", lineHeight: "1.4", marginBottom: "5px" }}>{m.titre}</div>
                  <div style={{ fontSize: "10px", color: "#7d8590", fontFamily: "monospace", lineHeight: "1.4" }}>{m.chantier} — {m.raison}</div>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: "1px solid #21262d", padding: "10px 12px", background: "#0d1117" }}>
            <div style={{ fontSize: "9px", fontWeight: "700", color: "#7d8590", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "8px" }}>
              Commande Notion
            </div>
            <textarea
              value={cmd}
              onChange={function(e) { setCmd(e.target.value); }}
              onKeyDown={function(e) { if (e.key === "Enter" && e.ctrlKey) execCmd(); }}
              placeholder={"Ex: Marquer Regrerage Termine\n(Ctrl+Entree pour envoyer)"}
              rows={2}
              style={{ width: "100%", background: "#161b22", border: "1px solid #30363d", borderRadius: "6px", color: "#e6edf3", fontSize: "12px", padding: "8px 10px", resize: "none", lineHeight: "1.5", fontFamily: "Segoe UI, sans-serif" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
              <button onClick={execCmd} disabled={cmdLoad || !cmd.trim()} style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "6px 14px", borderRadius: "6px", border: "none",
                background: (cmdLoad || !cmd.trim()) ? "#1c2330" : "#bc8cff",
                color: (cmdLoad || !cmd.trim()) ? "#7d8590" : "#0d1117",
                cursor: (cmdLoad || !cmd.trim()) ? "not-allowed" : "pointer",
                fontSize: "12px", fontWeight: "700"
              }}>
                {cmdLoad ? "Execution..." : "Executer"}
              </button>
            </div>
            {cmdRes && (
              <div style={{
                marginTop: "8px", padding: "8px 10px", borderRadius: "6px",
                background: cmdRes.ok ? "rgba(63,185,80,.1)" : "rgba(248,81,73,.1)",
                border: "1px solid " + (cmdRes.ok ? "rgba(63,185,80,.25)" : "rgba(248,81,73,.25)"),
                fontSize: "11px", color: cmdRes.ok ? "#3fb950" : "#f85149", lineHeight: "1.5"
              }}>
                {cmdRes.msg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
