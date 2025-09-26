// Hardcoded categories
const categories = [
	{ key: 'food', label: 'Food', className: 'cat-food' },
	{ key: 'transport', label: 'Transport', className: 'cat-transport' },
	{ key: 'entertainment', label: 'Entertainment', className: 'cat-entertainment' },
	{ key: 'bills', label: 'Bills', className: 'cat-bills' },
	{ key: 'other', label: 'Other', className: 'cat-other' },
];

// Hardcoded expenses (amount in USD, date ISO yyyy-mm-dd)
const expenses = [
	{ id: 1, amount: 12.5, category: 'food', date: dayOffset(0), description: 'Lunch sandwich' },
	{ id: 2, amount: 2.75, category: 'transport', date: dayOffset(0), description: 'Bus fare' },
	{ id: 3, amount: 49.99, category: 'entertainment', date: dayOffset(-1), description: 'Movie night' },
	{ id: 4, amount: 85.0, category: 'bills', date: firstOfMonth(), description: 'Internet bill' },
	{ id: 5, amount: 23.2, category: 'food', date: dayOffset(-3), description: 'Groceries' },
	{ id: 6, amount: 15.0, category: 'other', date: dayOffset(-8), description: 'Gift wrap' },
	{ id: 7, amount: 6.25, category: 'transport', date: dayOffset(-2), description: 'Metro card top-up' },
	{ id: 8, amount: 120.0, category: 'bills', date: dayOffset(-12), description: 'Electricity' },
];

function dayOffset(offsetDays) {
	const d = new Date();
	d.setDate(d.getDate() + offsetDays);
	return d.toISOString().slice(0, 10);
}

function firstOfMonth() {
	const d = new Date();
	d.setDate(1);
	return d.toISOString().slice(0, 10);
}

function formatCurrency(value) {
	return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
}

// DOM elements
const els = {};

document.addEventListener('DOMContentLoaded', () => {
	cacheDom();
	seedCategories();
	seedFilters();
	renderAll();
	bindFilterSync();
	bindClear();
	bindButtonAlerts();
});

function cacheDom() {
	els.totalToday = document.getElementById('totalToday');
	els.totalWeek = document.getElementById('totalWeek');
	els.totalMonth = document.getElementById('totalMonth');
	els.expensesList = document.getElementById('expensesList');
	els.byCategoryChart = document.getElementById('byCategoryChart');
	els.byCategoryBars = document.getElementById('byCategoryBars');
	// Form and selects
	els.categorySelect = document.getElementById('categorySelect');
	els.filterCategory = document.getElementById('filterCategory');
	els.filterFrom = document.getElementById('filterFrom');
	els.filterTo = document.getElementById('filterTo');
	// Desktop duplicates
	els.filterCategoryDesktop = document.getElementById('filterCategoryDesktop');
	els.filterFromDesktop = document.getElementById('filterFromDesktop');
	els.filterToDesktop = document.getElementById('filterToDesktop');
	els.clearFilters = document.getElementById('clearFilters');
	els.clearFiltersDesktop = document.getElementById('clearFiltersDesktop');
	// Buttons for alerts
	els.addExpenseBtn = document.getElementById('addExpenseBtn');
	els.filtersToggleMobile = document.getElementById('filtersToggleMobile');
	els.filtersToggleDesktop = document.getElementById('filtersToggleDesktop');
	// Full page list element if present
	els.allExpensesFull = document.getElementById('allExpensesFull');
}

function seedCategories() {
	if (!els.categorySelect) return;
	for (const c of categories) {
		const opt = document.createElement('option');
		opt.value = c.key;
		opt.textContent = c.label;
		els.categorySelect.appendChild(opt.cloneNode(true));
	}
}

function seedFilters() {
	const selects = [els.filterCategory, els.filterCategoryDesktop];
	for (const sel of selects) {
		if (!sel) continue;
		const all = document.createElement('option');
		all.value = '';
		all.textContent = 'All categories';
		sel.appendChild(all);
		for (const c of categories) {
			const opt = document.createElement('option');
			opt.value = c.key;
			opt.textContent = c.label;
			sel.appendChild(opt);
		}
	}
}

function bindFilterSync() {
	// Keep offcanvas and desktop filters in sync
	const pairs = [
		[els.filterCategory, els.filterCategoryDesktop],
		[els.filterFrom, els.filterFromDesktop],
		[els.filterTo, els.filterToDesktop],
	];
	for (const [a, b] of pairs) {
		if (!a || !b) continue;
		a.addEventListener('input', () => { b.value = a.value; renderAll(); });
		b.addEventListener('input', () => { a.value = b.value; renderAll(); });
	}
}

function bindClear() {
	const clearFn = () => {
		[els.filterCategory, els.filterCategoryDesktop].forEach(e => { if (e) e.value = ''; });
		[els.filterFrom, els.filterFromDesktop].forEach(e => { if (e) e.value = ''; });
		[els.filterTo, els.filterToDesktop].forEach(e => { if (e) e.value = ''; });
		renderAll();
	};
	if (els.clearFilters) {
		els.clearFilters.addEventListener('click', (e) => { e.preventDefault(); alert('Cleared filters'); clearFn(); });
	}
	if (els.clearFiltersDesktop) {
		els.clearFiltersDesktop.addEventListener('click', (e) => { e.preventDefault(); alert('Cleared filters'); clearFn(); });
	}
}

function bindButtonAlerts() {
	if (els.addExpenseBtn) {
		els.addExpenseBtn.addEventListener('click', () => {
			alert('Add Expense clicked (demo UI only)');
		});
	}
	if (els.filtersToggleMobile) {
		els.filtersToggleMobile.addEventListener('click', () => {
			alert('Filters opened');
		});
	}
	if (els.filtersToggleDesktop) {
		els.filtersToggleDesktop.addEventListener('click', () => {
			alert('Filters opened');
		});
	}
}

function getActiveFilters() {
	return {
		category: (els.filterCategory && els.filterCategory.value) || '',
		from: (els.filterFrom && els.filterFrom.value) || '',
		to: (els.filterTo && els.filterTo.value) || '',
	};
}

function filterExpenses(list) {
	const f = getActiveFilters();
	return list.filter(e => {
		if (f.category && e.category !== f.category) return false;
		if (f.from && e.date < f.from) return false;
		if (f.to && e.date > f.to) return false;
		return true;
	});
}

function calcSummary(list) {
	const now = new Date();
	const todayIso = now.toISOString().slice(0,10);
	const startOfWeek = new Date(now);
	const day = startOfWeek.getDay() || 7; // Monday=1 .. Sunday=7
	startOfWeek.setDate(startOfWeek.getDate() - (day - 1));
	const startOfWeekIso = startOfWeek.toISOString().slice(0,10);
	const startOfMonthIso = firstOfMonth();

	let totalToday = 0, totalWeek = 0, totalMonth = 0;
	for (const e of list) {
		if (e.date === todayIso) totalToday += e.amount;
		if (e.date >= startOfWeekIso) totalWeek += e.amount;
		if (e.date >= startOfMonthIso) totalMonth += e.amount;
	}
	return { totalToday, totalWeek, totalMonth };
}

let selectedExpenseId = null;

function renderAll() {
	const filtered = filterExpenses(expenses);
	// Summary
	const s = calcSummary(filtered);
    if (els.totalToday) els.totalToday.textContent = formatCurrency(s.totalToday);
    if (els.totalWeek) els.totalWeek.textContent = formatCurrency(s.totalWeek);
    if (els.totalMonth) els.totalMonth.textContent = formatCurrency(s.totalMonth);
    // Expenses section (home only)
    if (els.expensesList) renderSingleExpense(filtered);
	// Bars
	renderBars(filtered);
}

function renderSingleExpense(list) {
	els.expensesList.innerHTML = '';
	if (list.length === 0) {
		const empty = document.createElement('div');
		empty.className = 'text-center text-muted py-4';
		empty.textContent = 'No expenses available';
		els.expensesList.appendChild(empty);
		return;
	}
	let itemToShow = null;
	if (selectedExpenseId != null) {
		itemToShow = list.find(e => e.id === selectedExpenseId) || null;
	}
	if (!itemToShow) {
		itemToShow = [...list].sort((a,b) => b.date.localeCompare(a.date))[0];
	}
	const cat = categories.find(c => c.key === itemToShow.category);
	const item = document.createElement('a');
	item.href = '#';
	item.className = 'list-group-item list-group-item-action';
	item.innerHTML = `
		<div class="expense-item">
			<div>
				<div class="expense-title">${escapeHtml(itemToShow.description || cat.label)}</div>
				<div class="expense-meta">${itemToShow.date}
					<span class="ms-2 cat-chip ${cat.className}">
						<span class="cat-dot"></span>
						${cat.label}
					</span>
				</div>
			</div>
			<div class="expense-amount">${formatCurrency(itemToShow.amount)}</div>
		</div>`;
	els.expensesList.appendChild(item);
}

// Render all expenses for the separate page
function renderAllExpensesPage() {
	const filtered = filterExpenses(expenses);
	if (!els.allExpensesFull) return;
	const sorted = [...filtered].sort((a,b) => b.date.localeCompare(a.date));
	els.allExpensesFull.innerHTML = '';
	sorted.forEach(e => {
		const cat = categories.find(c => c.key === e.category);
		const item = document.createElement('a');
		item.href = 'index.html';
		item.className = 'list-group-item list-group-item-action';
		item.innerHTML = `
			<div class="expense-item">
				<div>
					<div class="expense-title">${escapeHtml(e.description || cat.label)}</div>
					<div class="expense-meta">${e.date}
						<span class="ms-2 cat-chip ${cat.className}">
							<span class="cat-dot"></span>
							${cat.label}
						</span>
					</div>
				</div>
				<div class="expense-amount">${formatCurrency(e.amount)}</div>
			</div>`;
		item.addEventListener('click', () => {
			alert('Opening on home (demo)');
		});
		els.allExpensesFull.appendChild(item);
	});
	// Expose for inline call from expenses.html
	window.renderAllExpensesPage = renderAllExpensesPage;
}

function escapeHtml(str) {
	return str.replace(/[&<>\"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
}

function renderBars(list) {
	if (!els.byCategoryBars) return;
	const byCat = categories.map(c => ({ key: c.key, label: c.label, total: 0 }));
	for (const e of list) {
		const row = byCat.find(x => x.key === e.category);
		if (row) row.total += e.amount;
	}
	const max = Math.max(1, ...byCat.map(x => x.total));
	els.byCategoryBars.innerHTML = '';
	byCat.forEach((x, i) => {
		const cat = categories.find(c => c.key === x.key);
		const row = document.createElement('div');
		row.className = 'bar-row bar-click';
		row.innerHTML = `
			<div class="bar-label">${cat.label}</div>
			<div class="bar-track"><div class="bar-fill" style="width:${(x.total / max) * 100}%; background:${pickColor(i)}"></div></div>
			<div class="bar-value">${formatCurrency(x.total)}</div>
		`;
		row.addEventListener('click', () => {
			alert(`${cat.label}: ${formatCurrency(x.total)}`);
		});
		els.byCategoryBars.appendChild(row);
	});
}

function pickColor(index) {
	const colors = ['#ff4d4f','#1677ff','#fa8c16','#52c41a','#722ed1'];
	return colors[index % colors.length];
}


