/* Search grid controller — client-side port of app/watchersearch.py:build_search.
 *
 * Reads the shared changes/price_history.json (all per-card metrics) plus
 * docs/manifest.json (active + archived card list with names and last-updated
 * dates), then filters / sorts / formats the gallery entirely in the browser.
 * The sort / price-period / price-type controls re-render in place instead of
 * navigating back to Flask.
 *
 * Collection features are intentionally excluded (private, off-repo data).
 */
(function () {
  "use strict";
  const { escapeHtml, fetchJSON } = window.CW;

  let MANIFEST = null;
  let PRICE_HISTORY = {};

  function params() {
    const p = new URLSearchParams(window.location.search);
    const sortBy = p.get("sortBy") || "name";
    const order = p.get("order") || (sortBy === "name" ? "asc" : "desc");
    return {
      q: p.get("q") || p.get("searchString") || "",
      sortBy,
      order,
      pricePeriod: p.get("pricePeriod") || "last",
      priceType: p.get("priceType") || "available",
    };
  }

  // dd.mm.yyyy from epoch seconds (matches datetime.fromtimestamp(...).strftime).
  function fmtDate(ts) {
    const d = new Date(parseFloat(ts) * 1000);
    const pad = (x) => ("0" + x).slice(-2);
    return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear();
  }

  const r2 = (v) => Math.round(v * 100) / 100;
  const r1 = (v) => Math.round(v * 10) / 10;

  function compact(v) {
    if (Math.abs(v) >= 100) return String(Math.round(v));
    const r = r2(v);
    return r === Math.trunc(r) ? String(Math.trunc(r)) : String(r);
  }

  // Assemble the per-card sort/display record — mirrors build_search's first loop.
  function cardData(card, cfg) {
    const canonical = card.canonical;
    const fileName = canonical + ".json";
    const ph = PRICE_HISTORY[canonical];
    const available = ph ? (ph.current_available || 0) : 0;

    let priceAvg = 0, priceChg = 0, percentChg = 0, priceMin = 0;
    let endedAvg = 0, endedChg = 0, endedPercentChg = 0;

    if (ph) priceMin = ph.current_min || 0;

    if (cfg.pricePeriod === "last") {
      if (ph) {
        const last = ph.last_download || {};
        priceAvg = last.avg || 0;
        priceChg = last.avg_change || 0;
        if (priceAvg > 0) percentChg = (priceChg / priceAvg) * 100;
        endedAvg = last.ended_avg || 0;
        endedChg = last.ended_avg_change || 0;
        if (endedAvg > 0) endedPercentChg = (endedChg / endedAvg) * 100;
      }
    } else if (ph) {
      priceAvg = ph.current_avg || 0;
      const pd = ph[cfg.pricePeriod] || {};
      if (pd && pd.change != null) priceChg = pd.change;
      if (priceAvg > 0) percentChg = (priceChg / priceAvg) * 100;
      endedAvg = ph.current_ended_avg || 0;
      if (pd && pd.ended_change != null) endedChg = pd.ended_change;
      if (endedAvg > 0) endedPercentChg = (endedChg / endedAvg) * 100;
    }

    // Market metrics (drainage / inflation / net supply)
    let ins = 0, sld = 0;
    if (ph) {
      if (cfg.pricePeriod === "last") {
        const ld = ph.last_download || {};
        ins = ld.inserted || 0; sld = ld.sold || 0;
      } else {
        const pd = ph[cfg.pricePeriod] || {};
        ins = pd.listings_added || 0; sld = pd.listings_removed || 0;
      }
    }
    const base = available - ins + sld;
    const drainage = base > 0 ? r1(sld / base * 100) : null;
    const inflation = base > 0 ? r1(ins / base * 100) : null;
    const netSupply = base > 0 ? r1((ins - sld) / base * 100) : null;

    // Buy-now floor + period-aware change of raw lowest ("From") and Floor.
    let marketFloor = 0, fromChange = null, floorChange = null;
    if (ph) {
      marketFloor = (ph.market || {}).floor || 0;
      const curMin = ph.current_min || 0;
      if (cfg.pricePeriod === "last") {
        const ld = ph.last_download || {};
        fromChange = ld.min_change != null ? ld.min_change : null;
        floorChange = ld.floor_change != null ? ld.floor_change : null;
      } else {
        const pd = ph[cfg.pricePeriod] || {};
        if (pd.historical_min) fromChange = r2(curMin - pd.historical_min);
        const hf = (pd.market || {}).floor;
        if (hf) floorChange = r2(marketFloor - hf);
      }
    }

    return {
      fileName, canonical, updated: card.updated,
      priceAvg, priceChg, percentChg, priceMin,
      endedAvg, endedChg, endedPercentChg,
      available, ins, sld,
      drainage, inflation, netSupply,
      marketFloor, fromChange, floorChange,
    };
  }

  function sortList(list, cfg) {
    const desc = cfg.order === "desc";
    const dir = desc ? -1 : 1;
    const by = (fn) => list.sort((a, b) => (fn(a) < fn(b) ? -1 : fn(a) > fn(b) ? 1 : 0) * dir);
    const num = (fn) => list.sort((a, b) => (fn(a) - fn(b)) * dir);
    switch (cfg.sortBy) {
      case "price": return num((x) => cfg.priceType === "sold" ? x.endedAvg : x.priceAvg);
      case "priceChange": return num((x) => cfg.priceType === "sold" ? x.endedChg : x.priceChg);
      case "percentChange": return num((x) => cfg.priceType === "sold" ? x.endedPercentChg : x.percentChg);
      case "lowestPrice": return num((x) => x.priceMin);
      case "drainage": return num((x) => x.drainage != null ? x.drainage : -1);
      case "inflation": return num((x) => x.inflation != null ? x.inflation : -1);
      case "netSupply": return num((x) => x.netSupply != null ? x.netSupply : 0);
      default: return by((x) => x.fileName); // name
    }
  }

  function availabilityBadges(d, cfg) {
    const parts = [];
    if (d.ins > 0) parts.push('<span style="color: rgb(34,139,34); font-weight: bold;">+' + d.ins + "</span>");
    if (d.sld > 0) parts.push('<span style="color: rgb(220, 20, 60); font-weight: bold;">-' + d.sld + "</span>");
    let nsBadge = "";
    if (d.netSupply != null) {
      const c = d.netSupply > 0 ? "rgb(34,139,34)" : (d.netSupply < 0 ? "rgb(220,53,69)" : "#888");
      const s = d.netSupply > 0 ? "+" : "";
      nsBadge = '<div style="text-align:right;color:' + c + ';font-weight:bold;font-size:0.9em;">' + s + d.netSupply + "%</div>";
    }
    if (d.available > 0 || parts.length || nsBadge) {
      const countPart = d.available > 0 ? '<span style="font-weight: bold;">' + d.available + "</span>" : "";
      const sep = countPart && parts.length ? " " : "";
      const changesRow = countPart + sep + parts.join(" ");
      const inner = (changesRow ? '<div style="display:flex;gap:6px;">' + changesRow + "</div>" : "") + nsBadge;
      return '<div style="position: absolute; top: 4px; right: 4px; background: var(--cw-pill-strong); padding: 2px 6px; border-radius: 4px; font-size: 0.8em;">' + inner + "</div>";
    }
    return "";
  }

  function pricePill(d, cfg) {
    let avg = d.priceAvg, chg = d.priceChg;
    const hasData = avg > 0;
    let str = "--€ (0€)";
    let style = "font-size: 0.85em; font-weight: bold; background: var(--cw-pill); padding: 2px 4px; border-radius: 4px; display: inline-block;";
    let arrow = "";
    if (hasData) {
      const sign = chg >= 0 ? "+" : "";
      const pct = (chg / avg) * 100;
      arrow = chg > 0 ? " ↑" : (chg < 0 ? " ↓" : " →");
      avg = avg < 1000 ? r2(avg) : Math.trunc(avg);
      if (cfg.sortBy === "percentChange") {
        str = "Avail: " + avg + "€ (" + sign + r1(pct) + "%)" + arrow;
      } else {
        chg = (d.priceAvg < 1000 || chg < 1) ? r2(chg) : Math.trunc(chg);
        str = "Avail: " + avg + "€ (" + sign + chg + "€)" + arrow;
      }
      if (d.priceChg > 0) style = "font-size: 0.85em; color: rgb(34,139,34); font-weight: bold; background: var(--cw-pill); padding: 2px 4px; border-radius: 4px; display: inline-block;";
      else if (d.priceChg < 0) style = "font-size: 0.85em; color: rgb(220, 20, 60); font-weight: bold; background: var(--cw-pill); padding: 2px 4px; border-radius: 4px; display: inline-block;";
    }
    return '<div style="' + style + '">' + str + "</div>";
  }

  function endedPill(d, cfg) {
    let avg = d.endedAvg, chg = d.endedChg;
    const hasData = avg > 0;
    if (!hasData) {
      return '<div style="font-size: 0.85em; font-weight: bold; background: var(--cw-pill-gray); padding: 2px 4px; border-radius: 4px; display: inline-block;">Sold: --</div>';
    }
    const sign = chg >= 0 ? "+" : "";
    const pct = (chg / avg) * 100;
    const arrow = chg > 0 ? " ↑" : (chg < 0 ? " ↓" : " →");
    avg = avg < 1000 ? r2(avg) : Math.trunc(avg);
    let str;
    if (cfg.sortBy === "percentChange") str = "Sold: " + avg + "€ (" + sign + r1(pct) + "%)" + arrow;
    else { chg = avg < 1000 ? r2(chg) : Math.trunc(chg); str = "Sold: " + avg + "€ (" + sign + chg + "€)" + arrow; }
    let style = "font-size: 0.85em; font-weight: bold; background: var(--cw-pill-gray); padding: 2px 4px; border-radius: 4px; display: inline-block;";
    if (d.endedChg > 0) style = "font-size: 0.85em; color: rgb(34,139,34); font-weight: bold; background: var(--cw-pill-gray); padding: 2px 4px; border-radius: 4px; display: inline-block;";
    else if (d.endedChg < 0) style = "font-size: 0.85em; color: rgb(220, 20, 60); font-weight: bold; background: var(--cw-pill-gray); padding: 2px 4px; border-radius: 4px; display: inline-block;";
    return '<div style="' + style + '">' + str + "</div>";
  }

  function priceRow(label, value, change) {
    if (value <= 0) return "";
    const base = "font-size: 0.78em; font-weight: bold; background: var(--cw-pill-blue); padding: 2px 4px; border-radius: 4px; display: inline-block; white-space: nowrap;";
    if (change == null) return '<div style="' + base + '">' + label + ": " + compact(value) + "€</div>";
    const sign = change >= 0 ? "+" : "";
    const arrow = change > 0 ? " ↑" : (change < 0 ? " ↓" : " →");
    const color = change > 0 ? "rgb(34,139,34)" : (change < 0 ? "rgb(220,20,60)" : "#555");
    const style = change === 0 ? base : "font-size: 0.78em; font-weight: bold; color: " + color + "; background: var(--cw-pill-blue); padding: 2px 4px; border-radius: 4px; display: inline-block; white-space: nowrap;";
    return '<div style="' + style + '">' + label + ": " + compact(value) + "€ (" + sign + compact(change) + "€)" + arrow + "</div>";
  }

  function cardHtml(d, cfg) {
    const articleName = d.canonical.split("_").pop().replace(/-/g, " ");
    const metrics = (["drainage", "inflation", "netSupply"].indexOf(cfg.sortBy) !== -1 && d.drainage != null)
      ? '<div style="font-size:0.78em;color:rgb(220,53,69);">Drainage: ' + d.drainage + "%</div>" +
        '<div style="font-size:0.78em;color:rgb(34,139,34);">Inflation: ' + d.inflation + "%</div>"
      : "";
    const lowest = priceRow("From", d.priceMin, d.fromChange) + priceRow("Floor", d.marketFloor, d.floorChange);
    return (
      '<div class="d-flex mb-4 col-12 col-sm-6 col-md-4 col-lg-2">' +
        '<a name="' + d.fileName + '" href="card.html?name=' + encodeURIComponent(d.fileName) + '" class="card text-center w-100 galleryBox" style="position: relative;">' +
          availabilityBadges(d, cfg) +
          '<img src="images/' + d.canonical + '.jpg" alt="' + escapeHtml(articleName) + '" class="lazy card-img-top img-fluid">' +
          '<div class="card-body d-flex flex-column p-2" style="gap: 2px;">' +
            '<div class="card-title" style="font-size: 0.9em; font-weight: bold; margin-bottom: 2px;">' + escapeHtml(articleName) + "</div>" +
            '<div style="font-size: 0.75em; color: #666;">(' + fmtDate(d.updated) + ")</div>" +
            pricePill(d, cfg) + endedPill(d, cfg) + lowest + metrics +
          "</div>" +
        "</a>" +
      "</div>"
    );
  }

  function archiveHtml(cfg) {
    let html = '<h1 class="page-header">Archive</h1>';
    const term = cfg.q.toLowerCase();
    const archived = (MANIFEST.archived || []).slice().sort((a, b) => (a.canonical < b.canonical ? -1 : 1));
    archived.forEach((card) => {
      const fileName = card.canonical + ".json";
      if (term && fileName.toLowerCase().indexOf(term) === -1) return;
      const articleName = card.canonical.split("_").pop().replace(/-/g, " ");
      html +=
        '<div class="d-flex mb-4 col-12 col-sm-6 col-md-4 col-lg-2">' +
          '<a name="' + fileName + '" href="card.html?name=' + encodeURIComponent(fileName) + '&archived=1" class="card text-center w-100 galleryBox">' +
            '<img src="images/' + card.canonical + '.jpg" alt="' + escapeHtml(articleName) + '" class="lazy card-img-top img-fluid">' +
            '<div class="card-body d-flex flex-column p-2" style="gap: 2px;">' +
              '<div class="card-title" style="font-size: 0.9em; font-weight: bold; margin-bottom: 2px;">' + escapeHtml(articleName) + "</div>" +
              (card.updated ? '<div style="font-size: 0.75em; color: #666;">(' + fmtDate(card.updated) + ")</div>" : "") +
            "</div>" +
          "</a>" +
        "</div>";
    });
    return html;
  }

  function render() {
    const cfg = params();
    const terms = cfg.q.toLowerCase().split(/\s+/).filter(Boolean);
    let list = (MANIFEST.cards || [])
      .filter((c) => terms.every((t) => (c.canonical + ".json").toLowerCase().indexOf(t) !== -1))
      .map((c) => cardData(c, cfg));
    sortList(list, cfg);
    const grid = list.map((d) => cardHtml(d, cfg)).join("") + archiveHtml(cfg);
    document.getElementById("searchResults").innerHTML = grid;
    syncControls(cfg);
    document.getElementById("resultCount").textContent = list.length + " cards";
  }

  function syncControls(cfg) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set("sortBy", cfg.sortBy); set("order", cfg.order);
    set("pricePeriod", cfg.pricePeriod); set("priceType", cfg.priceType);
    const sh = document.getElementById("searchStringHidden");
    if (sh) sh.value = cfg.q;
    const si = document.getElementById("ProductSearchInput");
    if (si && !si.value) si.value = cfg.q;
  }

  function updateUrl(cfg) {
    const p = new URLSearchParams();
    if (cfg.q) p.set("q", cfg.q);
    p.set("sortBy", cfg.sortBy); p.set("order", cfg.order);
    p.set("pricePeriod", cfg.pricePeriod); p.set("priceType", cfg.priceType);
    history.replaceState(null, "", "search.html?" + p.toString());
  }

  function onControlChange() {
    const cfg = {
      q: params().q,
      sortBy: document.getElementById("sortBy").value,
      order: document.getElementById("order").value,
      pricePeriod: document.getElementById("pricePeriod").value,
      priceType: document.getElementById("priceType").value,
    };
    updateUrl(cfg);
    render();
  }

  async function main() {
    try {
      [MANIFEST, PRICE_HISTORY] = await Promise.all([
        fetchJSON("manifest.json"),
        fetchJSON("changes/price_history.json").catch(() => ({})),
      ]);
    } catch (e) {
      document.getElementById("searchResults").innerHTML =
        '<div class="col-12 text-danger">Failed to load card data.</div>';
      console.error(e);
      return;
    }
    render();

    // "name" sorts ascending by default, price-like fields descending — mirrors
    // the Flask select's onchange behavior.
    const sortBy = document.getElementById("sortBy");
    sortBy.addEventListener("change", function () {
      document.getElementById("order").value = this.value === "name" ? "asc" : "desc";
      onControlChange();
    });
    ["order", "pricePeriod", "priceType"].forEach((id) => {
      document.getElementById(id).addEventListener("change", onControlChange);
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();
