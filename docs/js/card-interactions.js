/* Card-page interactivity: price + availability charts and the
 * country/language/condition/property/availability filters.
 *
 * Lifted VERBATIM from the Flask app's templates/blanko.htm (this logic already
 * ran client-side there). The only change: `marketSeries` now comes from the
 * global window.cwMarketSeries (set by card.js) instead of a server-injected
 * JSON blob. Wrapped in CWCard.initInteractions(), which card.js calls after it
 * has built the article rows and filter checkboxes into the DOM.
 */
(function (global) {
  "use strict";
  function initInteractions() {
	// Country Checkboxes ------------------------------------------------------------------------------
    var country_checkboxes = document.querySelectorAll('.country-checkbox');
	country_checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            var allUnchecked = true;
			var allWereUnchecked = true;
			var value = this.value;
            country_checkboxes.forEach(function(checkbox) {
                if (checkbox.checked) {
                    allUnchecked = false;
					if (checkbox.value != value){
						allWereUnchecked = false;
					}
					console.log("found checked box")
                }
            });
            if (allUnchecked) {
				console.log("no box checked, showing all rows")
                // If all checkboxes are unchecked, show all article rows
                document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.remove('hidden-country');
                });
            } else {
				if (allWereUnchecked){
					document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.add('hidden-country');
                });

				}
				console.log("changing visibility of rows with class "+value)
				var checked = this.checked
				console.log("changing visibility: "+checked)
				document.querySelectorAll('.'+value).forEach(function(element) {
					console.log("  changing visibility for : "+element.id)
					if (checked) {
						element.classList.remove('hidden-country');
					} else {
						element.classList.add('hidden-country');
					}
				});
            }
			this.disabled = true;
			setTimeout(function(){checkbox.disabled = false;},100);
			generate_Graph();
        });
    });
	document.querySelectorAll('.deselect-all-countries')[0].addEventListener('click',function() {
		country_checkboxes.forEach(function(checkbox){
			checkbox.checked = false;
			document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.remove('hidden-country');
                });
		});
		this.disabled = true;
		setTimeout(function(){checkbox.disabled = false;},100);
		generate_Graph();
	});
	// Language Checkboxes -------------------------------------------------------------------------------
	var language_checkboxes = document.querySelectorAll('.language-checkbox');
	language_checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            var allUnchecked = true;
			var allWereUnchecked = true;
			var value = this.value;
            language_checkboxes.forEach(function(checkbox) {
                if (checkbox.checked) {
                    allUnchecked = false;
					if (checkbox.value != value){
						allWereUnchecked = false;
					}
					console.log("found checked box")
                }
            });
            if (allUnchecked) {
				console.log("no box checked, showing all rows")
                // If all checkboxes are unchecked, show all article rows
                document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.remove('hidden-language');
                });
            } else {
				if (allWereUnchecked){
					document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.add('hidden-language');
                });

				}
				console.log("changing visibility of rows with class "+value)
				var checked = this.checked
				console.log("changing visibility: "+checked)
				document.querySelectorAll('.'+value).forEach(function(element) {
					console.log("  changing visibility for : "+element.id)
					if (checked) {
						element.classList.remove('hidden-language');
					} else {
						element.classList.add('hidden-language');
					}
				});
            }
			this.disabled = true;
			setTimeout(function(){checkbox.disabled = false;},100);
			generate_Graph();
        });
    });
	document.querySelectorAll('.deselect-all-languages')[0].addEventListener('click',function() {
		language_checkboxes.forEach(function(checkbox){
			checkbox.checked = false;
			document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.remove('hidden-language');
                });
		});
		this.disabled = true;
		setTimeout(function(){checkbox.disabled = false;},100)
		generate_Graph();
	});
	// Availability Checkboxes ---------------------------------------------------------------------
	var availability_checkboxes = document.querySelectorAll('.availability-checkbox');
	availability_checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            var allUnchecked = true;
			var allWereUnchecked = true;
			var value = this.value;
            availability_checkboxes.forEach(function(checkbox) {
                if (checkbox.checked) {
                    allUnchecked = false;
					if (checkbox.value != value){
						allWereUnchecked = false;
					}
					console.log("found checked box")
                }
            });
            if (allUnchecked) {
				console.log("no box checked, showing all rows")
                // If all checkboxes are unchecked, show all article rows
                document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.remove('hidden-availability');
                });
            } else {
				if (allWereUnchecked){
					document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.add('hidden-availability');
                });

				}
				console.log("changing visibility of rows with class "+value)
				var checked = this.checked
				console.log("changing visibility: "+checked)
				document.querySelectorAll('.'+value).forEach(function(element) {
					console.log("  changing visibility for : "+element.id)
					if (checked) {
						element.classList.remove('hidden-availability');
					} else {
						element.classList.add('hidden-availability');
					}
				});
            }
			this.disabled = true;
			setTimeout(function(){checkbox.disabled = false;},100)
			generate_Graph();
        });
    });
	document.querySelectorAll('.deselect-all-availability')[0].addEventListener('click',function() {
		availability_checkboxes.forEach(function(checkbox){
			checkbox.checked = false;
			document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.remove('hidden-availability');
                });
		});
		this.disabled = true;
		setTimeout(function(){checkbox.disabled = false;},100)
		generate_Graph();
	});
	// Property Checkboxes ---------------------------------------------------------------------
	var firsted_checkboxes = document.querySelectorAll('.firsted-checkbox');
	firsted_checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            var allUnchecked = true;
			var allWereUnchecked = true;
			var value = this.value;
            firsted_checkboxes.forEach(function(checkbox) {
                if (checkbox.checked) {
                    allUnchecked = false;
					if (checkbox.value != value){
						allWereUnchecked = false;
					}
					console.log("found checked box")
                }
            });
            if (allUnchecked) {
				console.log("no box checked, showing all rows")
                // If all checkboxes are unchecked, show all article rows
                document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.remove('hidden-firsted');
                });
            } else {
				if (allWereUnchecked){
					document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.add('hidden-firsted');
                });

				}
				console.log("changing visibility of rows with class "+value)
				var checked = this.checked
				console.log("changing visibility: "+checked)
				document.querySelectorAll('.'+value).forEach(function(element) {
					console.log("  changing visibility for : "+element.id)
					if (checked) {
						element.classList.remove('hidden-firsted');
					} else {
						element.classList.add('hidden-firsted');
					}
				});
            }
			this.disabled = true;
			setTimeout(function(){checkbox.disabled = false;},100)
			generate_Graph();
        });
    });
	var reverse_checkboxes = document.querySelectorAll('.reverse-checkbox');
	reverse_checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            var allUnchecked = true;
			var allWereUnchecked = true;
			var value = this.value;
            reverse_checkboxes.forEach(function(checkbox) {
                if (checkbox.checked) {
                    allUnchecked = false;
					if (checkbox.value != value){
						allWereUnchecked = false;
					}
					console.log("found checked box")
                }
            });
            if (allUnchecked) {
				console.log("no box checked, showing all rows")
                // If all checkboxes are unchecked, show all article rows
                document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.remove('hidden-reverse');
                });
            } else {
				if (allWereUnchecked){
					document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.add('hidden-reverse');
                });

				}
				console.log("changing visibility of rows with class "+value)
				var checked = this.checked
				console.log("changing visibility: "+checked)
				document.querySelectorAll('.'+value).forEach(function(element) {
					console.log("  changing visibility for : "+element.id)
					if (checked) {
						element.classList.remove('hidden-reverse');
					} else {
						element.classList.add('hidden-reverse');
					}
				});
            }
			this.disabled = true;
			setTimeout(function(){checkbox.disabled = false;},100)
			generate_Graph();
        });
    });
	document.querySelectorAll('.deselect-all-property')[0].addEventListener('click',function() {
		firsted_checkboxes.forEach(function(checkbox){
			checkbox.checked = false;
			document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.remove('hidden-firsted');
                });
		});
		this.disabled = true;
		setTimeout(function(){checkbox.disabled = false;},100)
		reverse_checkboxes.forEach(function(checkbox){
			checkbox.checked = false;
			document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.remove('hidden-reverse');
                });
		});
		this.disabled = true;
		setTimeout(function(){checkbox.disabled = false;},100)
		generate_Graph();
		generate_Graph();
	});
	// Condition Checkboxes -------------------------------------------------------------------------
	var condition_checkboxes = document.querySelectorAll('.condition-checkbox');
	condition_checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            var allUnchecked = true;
			var allWereUnchecked = true;
			var value = this.value;
            condition_checkboxes.forEach(function(checkbox) {
                if (checkbox.checked) {
                    allUnchecked = false;
					if (checkbox.value != value){
						allWereUnchecked = false;
					}
					console.log("found checked box")
                }
            });
            if (allUnchecked) {
				console.log("no box checked, showing all rows")
                // If all checkboxes are unchecked, show all article rows
                document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.remove('hidden-condition');
                });
            } else {
				if (allWereUnchecked){
					document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.add('hidden-condition');
                });

				}
				console.log("changing visibility of rows with class "+value)
				var checked = this.checked
				console.log("changing visibility: "+checked)
				document.querySelectorAll('.'+value).forEach(function(element) {
					console.log("  changing visibility for : "+element.id)
					if (checked) {
						element.classList.remove('hidden-condition');
					} else {
						element.classList.add('hidden-condition');
					}
				});
            }
			this.disabled = true;
			setTimeout(function(){checkbox.disabled = false;},100)
			generate_Graph();
        });
    });
	document.querySelectorAll('.deselect-all-conditions')[0].addEventListener('click',function() {
		condition_checkboxes.forEach(function(checkbox){
			checkbox.checked = false;
			document.querySelectorAll('[id^="articleRow"]').forEach(function(element) {
                    element.classList.remove('hidden-condition');
                });
		});
		this.disabled = true;
		setTimeout(function(){checkbox.disabled = false;},100)
		generate_Graph();
	});

	// chart data
	var currentChartPeriod = 'all';

	function parseDMY(str) {
		var d = new Date(str.trim().split('.').reverse().join('-'));
		d.setHours(0, 0, 0, 0);
		return d;
	}

	function histAtDate(history, day, fallback, key) {
		if (!history || history.length === 0) return fallback;
		var result = history[0][key];
		for (var i = 0; i < history.length; i++) {
			if (history[i].date <= day) result = history[i][key];
			else break;
		}
		return result;
	}

	function getDataFromTable(periodDays) {
		var currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		var cutoffDate = null;
		if (periodDays) {
			cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - periodDays);
			cutoffDate.setHours(0, 0, 0, 0);
		}

		var listings = [];
		document.querySelectorAll('.article-row').forEach(function(row) {
			var isHidden = false;
			row.classList.forEach(function(cls) {
				if (cls.startsWith('hidden') || cls === 'archived-listing') isHidden = true;
			});
			if (isHidden) return;

			var isEnded      = row.getAttribute('data-is-ended') === 'true';
			var firstDateStr = row.getAttribute('data-first-date');
			var shownDateStr = row.querySelectorAll('.actions-container')[0].innerText.trim();
			var fallbackPrice = parseFloat(row.getAttribute('data-price')) || 0;
			var fallbackQty   = parseInt(row.getAttribute('data-quantity')) || 1;

			function parseHistory(attr, key) {
				var raw = row.getAttribute(attr);
				var arr = [];
				try { arr = raw ? JSON.parse(raw) : []; } catch(e) {}
				return arr.map(function(e) {
					var obj = { date: parseDMY(e[1]) };
					obj[key] = e[0];
					return obj;
				});
			}

			var priceHistory = parseHistory('data-price-history', 'price');
			var qtyHistory   = parseHistory('data-qty-history',   'qty');

			var firstDate = firstDateStr ? parseDMY(firstDateStr) : null;
			var endDate   = (isEnded && shownDateStr) ? parseDMY(shownDateStr) : null;

			if (firstDate) listings.push({ isEnded, firstDate, endDate, fallbackPrice, fallbackQty, priceHistory, qtyHistory });
		});

		if (listings.length === 0) return { labels: [], prices: [] };

		var minDate = null;
		listings.forEach(function(l) {
			if (!minDate || l.firstDate < minDate) minDate = new Date(l.firstDate);
		});

		var startDate = cutoffDate || minDate;
		var labels = [], prices = [];

		for (var d = new Date(startDate); d <= currentDate; d.setDate(d.getDate() + 1)) {
			var day = new Date(d);
			day.setHours(0, 0, 0, 0);

			var dayListings = [];
			listings.forEach(function(l) {
				if (l.firstDate > day) return;
				if (l.isEnded && l.endDate && l.endDate < day) return;
				var price = histAtDate(l.priceHistory, day, l.fallbackPrice, 'price');
				var qty   = histAtDate(l.qtyHistory,   day, l.fallbackQty,   'qty');
				if (price > 0 && qty > 0) dayListings.push({ price: price, qty: qty });
			});

			// IQR outlier filter — mirrors calculate_price_average_robust in page.py
			var filtered = dayListings;
			if (dayListings.length >= 4) {
				var sorted = dayListings.slice().sort(function(a, b) { return a.price - b.price; });
				var n = sorted.length;
				var q1 = sorted[Math.floor(n / 4)].price;
				var q3 = sorted[Math.floor(3 * n / 4)].price;
				var iqr = q3 - q1;
				if (iqr > 0) {
					var lo = q1 - 1.5 * iqr;
					var hi = q3 + 1.5 * iqr;
					var f = dayListings.filter(function(e) { return e.price >= lo && e.price <= hi; });
					if (f.length > 0) filtered = f;
				}
			}

			var weightedSum = 0, totalQty = 0;
			filtered.forEach(function(e) { weightedSum += e.price * e.qty; totalQty += e.qty; });

			var dayStr = ('0' + day.getDate()).slice(-2) + '.' + ('0' + (day.getMonth()+1)).slice(-2) + '.' + day.getFullYear();
			labels.push(dayStr);
			prices.push(totalQty > 0 ? weightedSum / totalQty : null);
		}

		return { labels: labels, prices: prices };
	}

	var mychart;
	var availabilityChart;
	// Server-computed daily history of the three market-price methods
	var marketSeries = window.cwMarketSeries || { labels: [] };

	// Map a market-price series onto the chart's label axis (null where missing)
	function alignMarketSeries(values, labels) {
		if (!marketSeries || !marketSeries.labels) return null;
		var map = {};
		for (var i = 0; i < marketSeries.labels.length; i++) map[marketSeries.labels[i]] = values[i];
		return labels.map(function(lbl) { var v = map[lbl]; return (v === undefined ? null : v); });
	}

	function getAvailabilityDataFromTable(periodDays) {
		var currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		var cutoffDate = null;
		if (periodDays) {
			cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - periodDays);
			cutoffDate.setHours(0, 0, 0, 0);
		}

		var listings = [];
		document.querySelectorAll('.article-row').forEach(function(row) {
			var isHidden = false;
			row.classList.forEach(function(cls) {
				if (cls.startsWith('hidden') || cls === 'archived-listing') isHidden = true;
			});
			if (isHidden) return;

			var isEnded = row.getAttribute('data-is-ended') === 'true';
			var firstDateStr = row.getAttribute('data-first-date');
			var shownDateStr = row.querySelectorAll('.actions-container')[0].innerText.trim();
			var fallbackQty = parseInt(row.getAttribute('data-quantity')) || 1;
			var qtyHistoryRaw = row.getAttribute('data-qty-history');
			var qtyHistory = [];
			try { qtyHistory = qtyHistoryRaw ? JSON.parse(qtyHistoryRaw) : []; } catch(e) {}
			qtyHistory = qtyHistory.map(function(e) {
				return { qty: e[0], date: new Date(e[1].split('.').reverse().join('-')) };
			});
			qtyHistory.forEach(function(e) { e.date.setHours(0,0,0,0); });

			var firstDate = firstDateStr ? new Date(firstDateStr.split('.').reverse().join('-')) : null;
			if (firstDate) firstDate.setHours(0, 0, 0, 0);

			var endDate = (isEnded && shownDateStr) ? new Date(shownDateStr.split('.').reverse().join('-')) : null;
			if (endDate) endDate.setHours(0, 0, 0, 0);

			if (firstDate) listings.push({ isEnded: isEnded, firstDate: firstDate, endDate: endDate, fallbackQty: fallbackQty, qtyHistory: qtyHistory });
		});

		if (listings.length === 0) return { labels: [], available: [], sold: [] };

		function qtyAtDate(qtyHistory, day, fallback) {
			// Ignore zero-quantity entries. A 0 in a listing's quantity history marks
			// a relist gap (the listing ended, then came back) and is stamped with the
			// end date. Availability gaps are already handled by the firstDate/endDate
			// window, so for the stock level we only consider the non-zero steps.
			// Without this, a trailing (0, endDate) artifact makes a currently-active
			// listing read as 0 on every past day, collapsing the historical bars.
			var hist = qtyHistory.filter(function(e) { return e.qty > 0; });
			if (hist.length === 0) return fallback;
			var result = hist[0].qty;
			for (var i = 0; i < hist.length; i++) {
				if (hist[i].date <= day) result = hist[i].qty;
				else break;
			}
			return result;
		}

		function lastNonZeroQty(qtyHistory, fallback) {
			for (var i = qtyHistory.length - 1; i >= 0; i--) {
				if (qtyHistory[i].qty > 0) return qtyHistory[i].qty;
			}
			return fallback;
		}

		var minDate = null;
		listings.forEach(function(l) {
			if (!minDate || l.firstDate < minDate) minDate = new Date(l.firstDate);
		});

		var startDate = cutoffDate || minDate;
		var labels = [], existingAvailableData = [], newAvailableData = [], soldData = [];

		for (var d = new Date(startDate); d <= currentDate; d.setDate(d.getDate() + 1)) {
			var day = new Date(d);
			day.setHours(0, 0, 0, 0);
			var dayTime = day.getTime();
			var availCount = 0, newAvailCount = 0, soldCount = 0;

			listings.forEach(function(l) {
				if (!l.firstDate || l.firstDate > day) return;
				var qty = qtyAtDate(l.qtyHistory, day, l.fallbackQty);
				var isNew = l.firstDate.getTime() === dayTime;
				if (!l.isEnded) {
					availCount += qty;
					if (isNew) newAvailCount += qty;
				} else {
					if (l.endDate && l.endDate > day) {
						availCount += qty;
						if (isNew) newAvailCount += qty;
					}
					if (l.endDate && l.endDate.getTime() === dayTime) soldCount += lastNonZeroQty(l.qtyHistory, l.fallbackQty);
				}
			});

			var dayStr = ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth()+1)).slice(-2) + '.' + d.getFullYear();
			labels.push(dayStr);
			existingAvailableData.push(availCount - newAvailCount);
			newAvailableData.push(newAvailCount);
			soldData.push(-soldCount);
		}
		return { labels: labels, existingAvailable: existingAvailableData, newAvailable: newAvailableData, sold: soldData };
	}

	function aggregateToWeeks(dailyData) {
		var weekLabels = [], weekExisting = [], weekNew = [], weekSold = [];
		var i = dailyData.labels.length;
		while (i > 0) {
			var start = Math.max(0, i - 7);
			var existingSum = 0, newSum = 0, soldSum = 0, count = i - start;
			for (var j = start; j < i; j++) {
				existingSum += dailyData.existingAvailable[j];
				newSum      += dailyData.newAvailable[j];
				soldSum     += dailyData.sold[j];
			}
			weekLabels.unshift(dailyData.labels[start]);
			weekExisting.unshift(Math.round(existingSum / count));
			weekNew.unshift(newSum);          // summed like sold — represents items that entered this week
			weekSold.unshift(soldSum);
			i = start;
		}
		return { labels: weekLabels, existingAvailable: weekExisting, newAvailable: weekNew, sold: weekSold };
	}

	function aggregateToMonths(dailyData) {
		var monthMap = {}, monthOrder = [];
		for (var i = 0; i < dailyData.labels.length; i++) {
			var parts = dailyData.labels[i].split('.');
			var key = parts[2] + '-' + parts[1];
			if (!monthMap[key]) {
				monthMap[key] = { label: parts[1] + '.' + parts[2], existingSum: 0, newSum: 0, soldSum: 0, count: 0 };
				monthOrder.push(key);
			}
			monthMap[key].existingSum += dailyData.existingAvailable[i];
			monthMap[key].newSum      += dailyData.newAvailable[i];
			monthMap[key].soldSum     += dailyData.sold[i];
			monthMap[key].count++;
		}
		var labels = [], existingAvailable = [], newAvailable = [], sold = [];
		monthOrder.forEach(function(key) {
			var m = monthMap[key];
			labels.push(m.label);
			existingAvailable.push(Math.round(m.existingSum / m.count));
			newAvailable.push(m.newSum);      // summed — represents items that entered this month
			sold.push(m.soldSum);
		});
		return { labels: labels, existingAvailable: existingAvailable, newAvailable: newAvailable, sold: sold };
	}

	function generate_availability_graph(period) {
		period = period || currentChartPeriod;
		var periodDays = { '1m': 30, '3m': 90, '6m': 180, 'all': null }[period];
		var data = getAvailabilityDataFromTable(periodDays);
		if (data.labels.length === 0) return;

		if (period === 'all' && data.labels.length > 180) data = aggregateToMonths(data);
		else if (data.labels.length > 31) data = aggregateToWeeks(data);

		if (availabilityChart) availabilityChart.destroy();

		var drainageData = data.existingAvailable.map(function(existing, i) {
			var total = existing + data.newAvailable[i];
			var s = Math.abs(data.sold[i]);
			return (total > 0 && s > 0) ? parseFloat((s / total * 100).toFixed(1)) : null;
		});

		var ctx = document.getElementById('availabilityChart').getContext('2d');
		availabilityChart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: data.labels,
				datasets: [
					{
						label: 'Existing',
						data: data.existingAvailable,
						backgroundColor: 'rgba(54, 162, 235, 0.45)',
						borderColor: 'rgba(54, 162, 235, 0.7)',
						borderWidth: 0,
						yAxisID: 'left'
					},
					{
						label: 'New',
						data: data.newAvailable,
						backgroundColor: 'rgba(75, 192, 100, 0.5)',
						borderColor: 'rgba(75, 192, 100, 0.8)',
						borderWidth: 0,
						yAxisID: 'left'
					},
					{
						label: 'Sold',
						data: data.sold,
						backgroundColor: 'rgba(220, 53, 69, 0.45)',
						borderColor: 'rgba(220, 53, 69, 0.7)',
						borderWidth: 0,
						yAxisID: 'left'
					},
					{
						label: 'Drainage %',
						data: drainageData,
						type: 'line',
						yAxisID: 'right',
						borderColor: 'rgba(255, 159, 64, 0.9)',
						backgroundColor: 'rgba(255, 159, 64, 0.1)',
						borderWidth: 2,
						pointRadius: 2,
						pointHoverRadius: 4,
						fill: false,
						spanGaps: false,
						lineTension: 0.3
					}
				]
			},
			options: {
				scales: {
					xAxes: [{
						stacked: true,
						ticks: { autoSkip: true, maxTicksLimit: 8, fontSize: 10 }
					}],
					yAxes: [
						{
							id: 'left',
							position: 'left',
							ticks: { callback: function(v) { return Math.abs(v); } }
						},
						{
							id: 'right',
							position: 'right',
							ticks: {
								callback: function(v) { return v + '%'; },
								min: 0
							},
							gridLines: { drawOnChartArea: false }
						}
					]
				},
				legend: {
					display: true,
					position: 'top',
					labels: { boxWidth: 10, fontSize: 10, padding: 8 }
				},
				tooltips: {
					mode: 'index',
					callbacks: {
						title: function(items) { return items[0].xLabel; },
						label: function(item, chartData) {
							var label = chartData.datasets[item.datasetIndex].label;
							if (label === 'Drainage %') return label + ': ' + item.yLabel + '%';
							return label + ': ' + Math.abs(Math.round(item.yLabel));
						},
						afterBody: function(items, chartData) {
							var existing = 0, newAvail = 0;
							items.forEach(function(item) {
								var label = chartData.datasets[item.datasetIndex].label;
								if (label === 'Existing') existing = Math.round(item.yLabel);
								else if (label === 'New') newAvail = Math.round(item.yLabel);
							});
							var total = existing + newAvail;
							if (total > 0) return ['Total available: ' + total];
							return [];
						}
					}
				}
			}
		});
	}

	function smoothPrices(prices, window_size) {
		// Centered moving average that skips nulls
		var smoothed = [];
		var half = Math.floor(window_size / 2);
		for (var i = 0; i < prices.length; i++) {
			var sum = 0;
			var count = 0;
			for (var j = Math.max(0, i - half); j <= Math.min(prices.length - 1, i + half); j++) {
				if (prices[j] !== null) {
					sum += prices[j];
					count++;
				}
			}
			smoothed.push(count > 0 ? sum / count : null);
		}
		return smoothed;
	}

	function getSmoothingWindow(totalDays) {
		// Scale smoothing window based on timeframe
		if (totalDays <= 35) return 5;       // 1 month: 5-day smoothing
		if (totalDays <= 100) return 11;      // 3 months: 11-day smoothing
		if (totalDays <= 200) return 21;      // 6 months: 21-day smoothing
		return 31;                            // all time: 31-day smoothing
	}

	function generate_Graph(period){
		period = period || currentChartPeriod;
		currentChartPeriod = period;

		// Theme-aware chart colors (re-applied each render so toggling works)
		if (window.cwChartColors) {
			var cwc = cwChartColors();
			Chart.defaults.global.defaultFontColor = cwc.tick;
			Chart.defaults.scale.gridLines.color = cwc.grid;
			Chart.defaults.scale.gridLines.zeroLineColor = cwc.grid;
		}

		var periodDays = { '1m': 30, '3m': 90, '6m': 180, 'all': null }[period];
		var data = getDataFromTable(periodDays);
		if (data.labels.length === 0) return;

		// Scale smoothing to timeframe
		var windowSize = getSmoothingWindow(data.labels.length);
		var smoothed = smoothPrices(data.prices, windowSize);

		var lineData = {
			labels: data.labels,
			datasets: [
			{
				label: 'Trend',
				data: smoothed,
				fill: false,
				borderColor: 'rgba(54, 162, 235, 1)',
				borderWidth: 3,
				lineTension: 0.3,
				spanGaps: true,
				pointRadius: 0,
				pointHitRadius: 5,
				pointHoverRadius: 4
			},
			{
				label: 'Raw',
				data: data.prices,
				fill: false,
				borderColor: 'rgba(54, 162, 235, 0)',
				borderWidth: 0,
				pointRadius: 2,
				pointBackgroundColor: 'rgba(54, 162, 235, 0.3)',
				pointBorderColor: 'rgba(54, 162, 235, 0.3)',
				pointHitRadius: 5,
				pointHoverRadius: 4,
				pointHoverBackgroundColor: 'rgba(54, 162, 235, 0.8)',
				spanGaps: false
			}]
		}
		// Overlay the three market-price methods (server-computed)
		if (marketSeries && marketSeries.labels && marketSeries.labels.length) {
			lineData.datasets.push({
				label: 'Blend', data: alignMarketSeries(marketSeries.blend, data.labels),
				fill: false, borderColor: 'rgba(40, 167, 69, 0.95)', borderWidth: 2,
				lineTension: 0.3, spanGaps: true, pointRadius: 0, pointHitRadius: 5, pointHoverRadius: 4
			});
			lineData.datasets.push({
				label: 'Sold', data: alignMarketSeries(marketSeries.transaction, data.labels),
				fill: false, borderColor: 'rgba(220, 53, 69, 0.85)', borderWidth: 1.5, borderDash: [5, 3],
				lineTension: 0.3, spanGaps: true, pointRadius: 0, pointHitRadius: 5, pointHoverRadius: 4
			});
			lineData.datasets.push({
				label: 'Floor', data: alignMarketSeries(marketSeries.floor, data.labels),
				fill: false, borderColor: 'rgba(255, 159, 64, 0.9)', borderWidth: 1.5, borderDash: [2, 2],
				lineTension: 0.3, spanGaps: true, pointRadius: 0, pointHitRadius: 5, pointHoverRadius: 4
			});
		}
		if(mychart){
			mychart.destroy();
		}
		var ctx = document.getElementById("chart").getContext("2d");
		mychart = new Chart(ctx, {
			type: 'line',
			data: lineData,
			options: {
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero: true
						}
					}]
				},
				legend: {
					display: true,
					position: 'top',
					labels: {
						boxWidth: 10, fontSize: 10, padding: 8,
						filter: function(item) { return item.text !== 'Raw'; }
					}
				},
				tooltips: {
					mode: 'index',
					intersect: false,
					callbacks: {
						label: function(tooltipItem, chartData) {
							var label = chartData.datasets[tooltipItem.datasetIndex].label;
							if (label === 'Raw') return null;
							return label + ': ' + tooltipItem.yLabel.toFixed(2) + ' €';
						}
					}
				}
			}
		});
		generate_availability_graph(currentChartPeriod);
	}

	// Period button handlers
	document.querySelectorAll('.chart-period-btn').forEach(function(btn) {
		btn.addEventListener('click', function() {
			document.querySelectorAll('.chart-period-btn').forEach(function(b) { b.classList.remove('active'); });
			this.classList.add('active');
			generate_Graph(this.dataset.period);
		});
	});

	generate_Graph();

	// Re-render charts when the theme is toggled so colors update
	window.cwOnThemeChange = function () {
		if (typeof generate_Graph === 'function') generate_Graph(currentChartPeriod);
	};
  }
  global.CWCard = global.CWCard || {};
  global.CWCard.initInteractions = initInteractions;
})(window);
