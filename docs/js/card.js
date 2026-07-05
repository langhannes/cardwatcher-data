/* Card page controller.
 *
 * Reads ?name=<page>.json from the URL, fetches the card's page JSON (and the
 * shared price_history.json for the summary), then builds the article rows +
 * filter checkboxes into the DOM — a client-side port of the Flask app's
 * Listing.build_row / Page.build_table / build_country_selection /
 * build_language_selection and the blanko.htm price summary. Once the DOM is
 * built it hands off to CWCard.initInteractions() (the verbatim chart+filter
 * logic) to draw the charts and wire the filters.
 *
 * Deliberately omitted (server-only / mutating / private): archive, delete,
 * download, and the whole collection feature.
 */
(function () {
  "use strict";
  const { FLAGS, LANGUAGE_FLAGS, LANGUAGE_TO_ENGLISH, LOCATION_TO_ENGLISH,
          CONDITION_LONG, escapeHtml, imagePath, fetchJSON, fmtDateFromTs } = window.CW;

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name) || "";
  }

  // str(price).replace('.',',') with a trailing zero when there's a single
  // decimal digit — mirrors Listing.build_row's price formatting. JS integers
  // ("79") get a ".0" first so 79.0 renders "79,00" like Python's str(79.0).
  function euroComma(price) {
    let s = String(price);
    if (s.indexOf(".") === -1) s += ".0";
    const parts = s.split(".");
    let out = parts[0] + "," + parts[1];
    if (parts[1].length === 1) out += "0";
    return out;
  }

  // Previous-price tooltip line date: only format timestamps above the app's
  // 17_000_000 guard, as YYYY-MM-DD; otherwise 12 spaces (verbatim behavior).
  function prevPriceDate(ts) {
    let fd = 0;
    try { fd = ts ? parseFloat(ts) : 0; } catch (e) { fd = 0; }
    if (fd > 17000000) {
      const d = new Date(fd * 1000);
      const p = (x) => ("0" + x).slice(-2);
      return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
    }
    return "            ";
  }

  function buildRow(listing, rowNumber, canonical) {
    const ended = !!listing.ended;
    const archived = !!listing.archived;
    const qtyChange = listing.quantity_change || 0;
    const prevPrices = listing.previous_prices || [];
    const prevQty = listing.previous_quantities || [];
    const country = (listing.seller && listing.seller.country) || "";
    const sellerName = (listing.seller && listing.seller.name) || "";
    const lang = listing.language || "";
    const cond = listing.condition || "NM";

    // Display date: end date for ended listings, else first-seen date.
    const date = ended ? listing.date : listing.first_date;
    const firstDateStr = listing.first_date ? fmtDateFromTs(listing.first_date) : "";
    const displayQuantity = (ended && qtyChange < 0) ? (-qtyChange) : listing.quantity;

    // build_row appends the current quantity to the history only when the
    // listing is NOT ended (an ended listing's trailing qty is a relist gap).
    const qtyHistoryArr = [];
    (prevQty || []).forEach((p) => {
      const ds = fmtDateFromTs(p[1]); if (ds) qtyHistoryArr.push([parseInt(p[0]), ds]);
    });
    if (!ended) { const ds = fmtDateFromTs(listing.date); if (ds) qtyHistoryArr.push([listing.quantity, ds]); }

    const priceHistoryArr = [];
    (prevPrices || []).forEach((p) => {
      const ds = fmtDateFromTs(p[1]); if (ds) priceHistoryArr.push([parseFloat(p[0]), ds]);
    });
    { const ds = fmtDateFromTs(listing.date); if (ds) priceHistoryArr.push([listing.price, ds]); }

    const now = Date.now() / 1000;
    let status = "", rowExtraStyle = "";
    if (archived) {
      status = ' style="background:repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 10px, #e8e8e8 10px, #e8e8e8 20px); opacity: 0.7;"';
      rowExtraStyle = " archived-listing";
    } else if (ended) {
      const diff = Math.max(0, (10 - Math.floor((now - parseFloat(date)) / 86400))) / 10;
      const gray = [128, 128, 128], red = [220, 20, 60];
      const n = gray.map((g, i) => g * (1 - diff) + red[i] * diff);
      status = ' style="background:rgb(' + n[0] + "," + n[1] + "," + n[2] + ');"';
    } else {
      if (qtyChange < 0) status = ' style="background:orange;"';
      else if (qtyChange > 0) status = ' style="background:greenyellow;"';
      else {
        const diff = Math.max(0, (10 - Math.floor((now - parseFloat(date)) / 86400))) / 10;
        status = ' style="background:rgba(34,139,34,' + diff + ');"';
      }
    }

    const quantityString = String(listing.quantity) + (qtyChange ? ("(" + (listing.quantity - qtyChange) + ")") : "");

    let priceStyle = "", priceClass = "";
    let priceString = euroComma(listing.price);
    if (prevPrices.length > 0) {
      const lastPrev = prevPrices[prevPrices.length - 1];
      priceClass = listing.price < parseFloat(lastPrev[0]) ? "price-down" : "price-up";
      priceString += " (" + euroComma(lastPrev[0]) + ")";
      let tip = "";
      prevPrices.forEach((pp) => { tip += prevPriceDate(pp[1]) + " " + pp[0] + "€\n"; });
      priceString += "€";
      priceString = '<span title="' + escapeHtml(tip) + '">' + priceString + "</span>";
    } else {
      priceString += "€";
    }
    if (archived) {
      priceString = '<s style="opacity: 0.6;">' + priceString + "</s>";
      priceStyle = ' style="color: #999 !important;" ';
      priceClass = "";
    }

    let firstEdMarker = "", firstEdHider = "none";
    if (listing.first_ed === 1) {
      firstEdHider = "is";
      firstEdMarker = '<span style="display: inline-block; width: 16px; height: 16px; background-image:url(\'assets/Blanko/ssMain2.png\'); background-position: -112px -16px;" class="icon st_SpecialIcon mr-1" aria-label="First Edition"></span>';
    }
    let revHoloMarker = "", revHoloHider = "none";
    if (listing.reverse_holo === 1) {
      revHoloHider = "is";
      revHoloMarker = '<span style="display: inline-block; width: 16px; height: 16px; background-image:url(\'assets/Blanko/ssMain2.png\'); background-position: -416px -16px;" class="icon st_SpecialIcon mr-1" aria-label="Reverse Holo"></span>';
    }

    const locEng = LOCATION_TO_ENGLISH[country];
    const hasCountryFlag = locEng && FLAGS[locEng];
    const countryFlagPos = hasCountryFlag ? FLAGS[locEng] : "0px 0px";
    const countryText = hasCountryFlag ? "" : country;

    const langEng = LANGUAGE_TO_ENGLISH[lang];
    const hasLangFlag = langEng && LANGUAGE_FLAGS[langEng];
    const langFlagPos = hasLangFlag ? LANGUAGE_FLAGS[langEng] : "";
    const langText = hasLangFlag ? "" : lang;

    const rowClass =
      "show-" + country.slice(15) +
      " language-" + lang +
      " availability-" + String(!ended) +
      " condition-" + cond.toLowerCase() + "-val" +
      " firsted-" + firstEdHider +
      " reverseholo-" + revHoloHider +
      rowExtraStyle +
      " row g-0 article-row";

    return (
      '<div id="articleRow' + rowNumber + '" class="' + rowClass + '"' +
      ' data-first-date="' + firstDateStr + '"' +
      ' data-is-ended="' + String(ended) + '"' +
      ' data-quantity="' + displayQuantity + '"' +
      ' data-price="' + listing.price + '"' +
      " data-qty-history='" + JSON.stringify(qtyHistoryArr) + "'" +
      " data-price-history='" + JSON.stringify(priceHistoryArr) + "'" +
      ">" +
        '<div class="d-none col"></div>' +
        '<div class="col-sellerProductInfo col"><div class="row g-0">' +
          '<div class="col-seller col-12 col-lg-auto">' +
            '<span class="seller-info d-flex align-items-center">' +
              '<span class="seller-name d-flex">' +
                '<span class="icon d-flex has-content-centered me-1">' +
                  '<span style="display: inline-block; width: 16px; height: 16px; background-image:url(\'assets/Blanko/ssMain.png\'); background-position: ' + countryFlagPos + ';" class="icon"></span>' +
                  escapeHtml(countryText) +
                "</span>" +
                '<span class="d-flex has-content-centered me-1"><a href="">' + escapeHtml(sellerName) + "</a></span>" +
              "</span>" +
            "</span>" +
          "</div>" +
          '<div class="col-product col-12 col-lg"><div class="row g-0">' +
            '<div class="product-attributes" style="flex: 0 0 6.5rem;">' +
              '<a class="article-condition condition-' + cond.toLowerCase() + ' me-1" data-bs-original-title="' + escapeHtml(CONDITION_LONG[cond] || cond) + '">' +
                '<span class="badge ">' + escapeHtml(cond) + "</span>" +
              "</a>" +
              '<span style="display: inline-block; width: 16px; height: 16px; background-image:url(\'assets/Blanko/ssMain2.png\'); background-position: ' + langFlagPos + ';" class="icon me-2" aria-label="' + escapeHtml(lang) + '">' + escapeHtml(langText) + "</span>" +
              firstEdMarker + revHoloMarker +
            "</div>" +
            '<div class="product-comments me-1 col"><div class="w-100">' +
              '<span class="d-block text-truncate text-muted fst-italic small" title="' + escapeHtml(listing.comment || "") + '">' + escapeHtml(listing.comment || "") + "</span>" +
            "</div></div>" +
          "</div></div>" +
        "</div></div>" +
        '<div class="col-offer col-auto"' + status + ">" +
          '<div style="width:10rem" class="price-container d-flex justify-content-end"><div class="d-flex flex-column">' +
            '<div class="d-flex align-items-center justify-content-end">' +
              '<span class="color-primary small text-end text-nowrap fw-bold ' + priceClass + '"' + priceStyle + ">" + priceString + "</span>" +
            "</div>" +
          "</div></div>" +
          '<div class="amount-container d-flex justify-content-end me-3"><span class="item-count small text-end">' + escapeHtml(quantityString) + "</span></div>" +
          '<div class="actions-container d-flex align-items-center justify-content-end col ps-2 pe-0"><span>' + fmtDateFromTs(date) + "</span></div>" +
        "</div>" +
      "</div>"
    );
  }

  function buildCountrySelection(listings) {
    const countries = ["Item location: Germany"];
    listings.forEach((l) => {
      const c = (l.seller && l.seller.country) || "";
      if (c && countries.indexOf(c) === -1) countries.push(c);
    });
    return countries.map((country) => {
      const short = country.slice(15);
      const pos = FLAGS[country] || "0px 0px";
      return (
        '<div class="form-check">' +
          '<input type="checkbox" id="sellerCountry-' + escapeHtml(short) + '" value="show-' + escapeHtml(short) + '" class="country-checkbox form-check-input mb-1 me-2">' +
          '<label for="sellerCountry-' + escapeHtml(short) + '" class="d-inline-flex form-check-label">' +
            '<span style="display: inline-block; width: 16px; height: 16px; background-image:url(\'assets/Blanko/ssMain.png\'); background-position:' + pos + ';" class="icon align-self-center me-2"></span>' +
            "<span>" + escapeHtml(short) + "</span>" +
          "</label>" +
        "</div>"
      );
    }).join("");
  }

  function buildLanguageSelection(listings) {
    const languages = [];
    listings.forEach((l) => {
      const lang = l.language || "";
      if (lang && languages.indexOf(lang) === -1) languages.push(lang);
    });
    return languages.map((language) => {
      const pos = LANGUAGE_FLAGS[language] || "";
      return (
        '<div class="form-check">' +
          '<input type="checkbox" id="language-' + escapeHtml(language) + '" value="language-' + escapeHtml(language) + '" class="language-checkbox form-check-input mb-1 me-2">' +
          '<label for="language-' + escapeHtml(language) + '" class="d-inline-flex form-check-label">' +
            '<span style="display: inline-block; width: 16px; height: 16px; background-image:url(\'assets/Blanko/ssMain2.png\'); background-position:' + pos + ';" class="icon align-self-center me-2"></span>' +
            "<span>" + escapeHtml(language) + "</span>" +
          "</label>" +
        "</div>"
      );
    }).join("");
  }

  function buildPriceSummary(canonical, priceHistory) {
    const entry = priceHistory[canonical];
    if (!entry) return "";
    const last = entry.last_download || {};
    const availAvg = Math.round((last.avg || 0) * 100) / 100;
    const availChg = Math.round((last.avg_change || 0) * 100) / 100;
    const soldAvg = Math.round((last.ended_avg || 0) * 100) / 100;
    const soldChg = Math.round((last.ended_avg_change || 0) * 100) / 100;
    const lowest = Math.round((entry.current_min || 0) * 100) / 100;

    function pill(label, avg, chg) {
      if (!(avg > 0)) return "";
      const color = chg > 0 ? "rgb(34,139,34)" : (chg < 0 ? "rgb(220,20,60)" : "var(--cw-neutral-text)");
      const bg = chg > 0 ? "rgba(34,139,34,0.1)" : (chg < 0 ? "rgba(220,20,60,0.1)" : "var(--cw-faint)");
      const arrow = chg > 0 ? "↑" : (chg < 0 ? "↓" : "→");
      const sign = chg >= 0 ? "+" : "";
      return '<div style="font-size: 0.9em; font-weight: bold; padding: 4px 8px; border-radius: 4px; display: inline-block; color: ' + color + "; background: " + bg + ';">' +
        label + ": " + avg + "€ (" + sign + chg + "€) " + arrow + "</div>";
    }
    let html = pill("Avail", availAvg, availChg) + pill("Sold", soldAvg, soldChg);
    if (lowest > 0) {
      html += '<div style="font-size: 0.9em; font-weight: bold; background: var(--cw-pill-blue); padding: 4px 8px; border-radius: 4px; display: inline-block;">From: ' + lowest + "€</div>";
    }
    return html;
  }

  async function main() {
    let pageName = getParam("name");
    if (!pageName) { document.getElementById("cardName").textContent = "No card specified"; return; }
    if (!pageName.endsWith(".json")) pageName += ".json";
    const canonical = pageName.slice(0, -5);

    // Active cards live in pages/, archived ones in archive/. Search links to
    // archived cards carry ?archived=1 so we hit the right directory first and
    // avoid a spurious 404; direct links still fall back to the other dir.
    const dirs = getParam("archived") ? ["archive/", "pages/"] : ["pages/", "archive/"];
    let page = null, lastErr = null;
    for (const dir of dirs) {
      try { page = await fetchJSON(dir + pageName); break; }
      catch (e) { lastErr = e; }
    }
    if (!page) {
      document.getElementById("cardName").textContent = "Card not found";
      console.error(lastErr);
      return;
    }

    // Header + image
    document.title = (page.card || canonical) + " | CardWatcher";
    document.getElementById("cardName").textContent = page.card || "";
    document.getElementById("setName").textContent = page.set || "";
    document.getElementById("availableCount").textContent = page.available != null ? page.available : "";
    const img = document.getElementById("cardImage");
    img.src = imagePath(canonical);
    img.alt = page.card || canonical;
    document.getElementById("cardmarketLink").href =
      "https://www.cardmarket.com/en/" + canonical.replace(/_/g, "/");

    // Article rows + filter selections
    const listings = page.listings || [];
    document.getElementById("tableBody").innerHTML =
      listings.map((l, i) => buildRow(l, i, canonical)).join("") +
      '<div class="table-footer"></div>';
    document.getElementById("countrySelection").innerHTML = buildCountrySelection(listings);
    document.getElementById("languageSelection").innerHTML = buildLanguageSelection(listings);

    // Price summary (best-effort; degrades if price_history is unavailable)
    try {
      const ph = await fetchJSON("changes/price_history.json");
      document.getElementById("priceSummary").innerHTML = buildPriceSummary(canonical, ph);
    } catch (e) { /* summary is optional */ }

    // Blend / Sold / Floor overlay series for the price chart, computed in the
    // browser (port of watcherbase.calculate_market_price_series).
    try {
      window.cwMarketSeries = window.CWMarket
        ? window.CWMarket.calculateMarketPriceSeries(page)
        : { labels: [] };
    } catch (e) {
      window.cwMarketSeries = { labels: [] };
      console.error("market series failed", e);
    }

    // Hand off to the verbatim chart + filter logic.
    if (window.CWCard && window.CWCard.initInteractions) window.CWCard.initInteractions();
  }

  document.addEventListener("DOMContentLoaded", main);
})();
