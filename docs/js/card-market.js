/* Market-price series for the card page's price chart.
 *
 * Client-side port of the Flask app's watcherbase market-price logic
 * (calculate_market_price_series and its helpers calculate_market_prices,
 * _listings_at_time, dominant_language, get_price_at_time, _iqr_bounds,
 * _percentile, calculate_price_average_time_weighted, _recency_weight_sum).
 *
 * Produces { labels, blend, transaction, floor } — the three market lines the
 * app bakes into blanko.htm as window.cwMarketSeries. Card.js calls
 * CWMarket.calculateMarketPriceSeries(page) and hands the result to the chart.
 *
 * Constants and formulas are copied verbatim from app/watcherbase.py so the
 * viewer's overlays match the app's.
 */
(function (global) {
  "use strict";

  // --- Constants (watcherbase.py) -----------------------------------------
  const GOOD_CONDITIONS = ["MT", "NM", "EX", "GD"];
  const BLEND_W_TRANSACTION = 0.6;
  const BLEND_W_FLOOR = 0.4;
  const BLEND_SOLD_FULL = 4.0;
  const BLEND_SOLD_HALFLIFE = 10.0; // days
  const FLOOR_PERCENTILE = 10;
  const MIN_CONDITION_SAMPLES = 3;
  const LANGUAGE_PRIORITY = ["English", "Japanese", "S-Chinese", "T-Chinese", "Korean"];
  const MIN_LANGUAGE_LISTINGS = 2;
  const DAY = 24 * 60 * 60;
  const UNSET = {}; // sentinel matching watcherbase._UNSET

  function toFloat(v) {
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  // The price active for a listing at target_time, from its previous_prices
  // history ([[old_price, change_ts], ...]). Verbatim get_price_at_time.
  function getPriceAtTime(listing, targetTime) {
    let candidate = listing.price;
    const prev = listing.previous_prices || [];
    if (!prev.length) return candidate;
    for (let i = prev.length - 1; i >= 0; i--) {
      const entry = prev[i];
      const oldPrice = toFloat(entry[0]);
      const changeDateStr = entry.length > 1 ? entry[1] : "";
      if (!changeDateStr) continue; // skip dateless entries
      const changeDate = toFloat(changeDateStr);
      if (changeDate > targetTime) candidate = oldPrice;
      else break;
    }
    return candidate;
  }

  // Split non-archived listings into [active, sold] pairs of [listing, price]
  // at a point in time. Verbatim _listings_at_time.
  function listingsAtTime(page, atTime) {
    const active = [], sold = [];
    for (const l of page.listings || []) {
      if (l.archived) continue;
      if (atTime == null) {
        if (l.ended) sold.push([l, l.price]);
        else active.push([l, l.price]);
        continue;
      }
      const firstDate = toFloat(l.first_date);
      const lastSeen = toFloat(l.date);
      if (l.ended && lastSeen > 0 && lastSeen <= atTime) { sold.push([l, l.price]); continue; }
      if (firstDate <= 0 || firstDate > atTime) continue;
      if (l.ended && lastSeen < atTime) continue;
      active.push([l, getPriceAtTime(l, atTime)]);
    }
    return [active, sold];
  }

  function dominantLanguage(listings) {
    const totals = {};
    for (const l of listings) {
      totals[l.language] = (totals[l.language] || 0) + Math.max(1, l.quantity || 1);
    }
    const keys = Object.keys(totals);
    if (!keys.length) return null;
    const solid = {};
    for (const k of keys) if (totals[k] >= MIN_LANGUAGE_LISTINGS) solid[k] = totals[k];
    const pool = Object.keys(solid).length ? solid : totals;
    for (const lang of LANGUAGE_PRIORITY) if (lang in pool) return lang;
    let best = null, bestN = -Infinity;
    for (const k of Object.keys(pool)) if (pool[k] > bestN) { bestN = pool[k]; best = k; }
    return best;
  }

  function iqrBounds(values) {
    const vals = values.slice().sort((a, b) => a - b);
    const n = vals.length;
    if (n < 4) return null;
    const q1 = vals[Math.floor(n / 4)];
    const q3 = vals[Math.floor((3 * n) / 4)];
    const iqr = q3 - q1;
    if (iqr <= 0) return null;
    return [q1 - 1.5 * iqr, q3 + 1.5 * iqr];
  }

  function percentile(sortedVals, pct) {
    if (!sortedVals.length) return 0.0;
    if (sortedVals.length === 1) return sortedVals[0];
    const k = (sortedVals.length - 1) * (pct / 100.0);
    const lo = Math.floor(k), hi = Math.ceil(k);
    if (lo === hi) return sortedVals[k | 0];
    return sortedVals[lo] * (hi - k) + sortedVals[hi] * (k - lo);
  }

  // now = reference_time (seconds); exponential-decay weighting on days_ago.
  function timeWeightedAverage(pairs, halfLifeDays, referenceTime) {
    if (!pairs.length) return 0.0;
    const now = referenceTime != null ? referenceTime : Date.now() / 1000;
    let weightedSum = 0, totalWeight = 0;
    for (const [price, ts] of pairs) {
      const t = toFloat(ts);
      let daysAgo;
      if (t <= 0) daysAgo = 365;
      else {
        daysAgo = (now - t) / DAY;
        if (daysAgo < 0) continue;
      }
      const w = Math.pow(2, -daysAgo / halfLifeDays);
      weightedSum += price * w;
      totalWeight += w;
    }
    return totalWeight === 0 ? 0.0 : weightedSum / totalWeight;
  }

  function recencyWeightSum(pairs, halfLifeDays, referenceTime) {
    if (!pairs.length) return 0.0;
    const now = referenceTime != null ? referenceTime : Date.now() / 1000;
    let total = 0;
    for (const [, ts] of pairs) {
      const t = toFloat(ts);
      let daysAgo;
      if (t <= 0) daysAgo = 365;
      else {
        daysAgo = (now - t) / DAY;
        if (daysAgo < 0) continue;
      }
      total += Math.pow(2, -daysAgo / halfLifeDays);
    }
    return total;
  }

  const round2 = (v) => Math.round(v * 100) / 100;

  // Verbatim calculate_market_prices.
  function calculateMarketPrices(page, atTime, lang) {
    if (arguments.length < 3) lang = UNSET;
    const [active, sold] = listingsAtTime(page, atTime == null ? null : atTime);
    if (lang === UNSET) {
      lang = dominantLanguage(active.map((x) => x[0])) || dominantLanguage(sold.map((x) => x[0]));
    }

    function filtered(pairs) {
      const sameLang = pairs.filter(([l]) => lang == null || l.language === lang);
      const good = sameLang.filter(([l]) => GOOD_CONDITIONS.indexOf(l.condition) !== -1);
      return good.length >= MIN_CONDITION_SAMPLES ? good : sameLang;
    }

    const activeF = filtered(active);
    const soldF = filtered(sold);

    // Transaction: realized sales, IQR-filtered then time-weighted.
    let transaction = 0.0, soldWeight = 0.0;
    if (soldF.length) {
      let soldPairs = soldF.map(([l, p]) => [p, l.date]);
      const bounds = iqrBounds(soldPairs.map(([p]) => p));
      if (bounds) {
        const kept = soldPairs.filter(([p]) => bounds[0] <= p && p <= bounds[1]);
        if (kept.length) soldPairs = kept;
      }
      transaction = timeWeightedAverage(soldPairs, 30, atTime == null ? undefined : atTime);
      soldWeight = recencyWeightSum(soldPairs, BLEND_SOLD_HALFLIFE, atTime == null ? undefined : atTime);
    }

    // Floor: low band of outlier-filtered current asks.
    let floor = 0.0;
    if (activeF.length) {
      let asks = activeF.map(([, p]) => p).sort((a, b) => a - b);
      const bounds = iqrBounds(asks);
      if (bounds) {
        const kept = asks.filter((p) => bounds[0] <= p && p <= bounds[1]);
        if (kept.length) asks = kept;
      }
      floor = percentile(asks, FLOOR_PERCENTILE);
    }

    // Blend: confidence-scaled mix of sold price and live floor.
    let blend;
    if (transaction > 0 && floor > 0) {
      const wt = BLEND_W_TRANSACTION, wf = BLEND_W_FLOOR;
      const conf = Math.min(1.0, soldWeight / BLEND_SOLD_FULL);
      const tw = wt * conf;
      const fw = wf + wt * (1 - conf);
      blend = (tw * transaction + fw * floor) / (wt + wf);
    } else if (transaction > 0) {
      blend = transaction;
    } else {
      blend = floor;
    }

    return {
      blend: round2(blend), transaction: round2(transaction), floor: round2(floor),
      language: lang, n_sold: soldF.length, n_ask: activeF.length,
    };
  }

  function midnight(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function ddmmyyyy(d) {
    const p = (x) => ("0" + x).slice(-2);
    return p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear();
  }

  // Verbatim calculate_market_price_series.
  function calculateMarketPriceSeries(page, maxDays) {
    maxDays = maxDays || 365;
    const firsts = [];
    for (const l of page.listings || []) {
      const fd = toFloat(l.first_date);
      if (fd > 0) firsts.push(fd);
    }
    if (!firsts.length) return { labels: [], blend: [], transaction: [], floor: [] };

    const today = midnight(new Date());
    let start = midnight(new Date(Math.min.apply(null, firsts) * 1000));
    const earliest = midnight(new Date(today.getTime() - maxDays * DAY * 1000));
    if (start < earliest) start = earliest;

    // Pin one language across the whole series (current snapshot's dominant).
    const canonicalLang = calculateMarketPrices(page).language;

    const labels = [], blend = [], transaction = [], floor = [];
    for (let day = new Date(start); day <= today; day.setDate(day.getDate() + 1)) {
      const mp = calculateMarketPrices(page, day.getTime() / 1000, canonicalLang);
      labels.push(ddmmyyyy(day));
      blend.push(mp.blend > 0 ? mp.blend : null);
      transaction.push(mp.transaction > 0 ? mp.transaction : null);
      floor.push(mp.floor > 0 ? mp.floor : null);
    }
    return { labels, blend, transaction, floor };
  }

  global.CWMarket = { calculateMarketPriceSeries, calculateMarketPrices };
})(window);
