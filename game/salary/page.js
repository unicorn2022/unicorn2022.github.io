'use strict';

const { calculate, getCity } = salaryCalculator;
const form = document.querySelector('#salary-form');
const fields = form.elements;
const contributionRows = document.querySelector('#contribution-rows');
const monthlyRows = document.querySelector('#monthly-rows');
const policy = document.querySelector('#policy');
const taxMonth = document.querySelector('#tax-month');
const resultValues = document.querySelectorAll('[data-result]');
const amountFormat = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });
const baseFormat = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 });
const yuan = amount => `${amountFormat.format(Math.abs(amount) < 0.5 ? 0 : amount)} 元`;
const percent = rate => `${rate}%`;

let city;
let contributionCells;

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function updateVariantFields() {
  const key = fields.city.value;
  const shenzhen = key === 'shenzhen';
  const hangzhou = key === 'hangzhou';
  document.getElementById('medical-tier-field').hidden = !shenzhen;
  document.getElementById('fund-variant-field').hidden = !shenzhen && !hangzhou;
  fields.medicalTier.value = 'first';
  setText('fund-variant-label', shenzhen ? '深圳公积金缴存情形' : '杭州市缴存地区');
  fields.fundVariant.replaceChildren(
    new Option(shenzhen ? '存量职工' : '杭州市区', 'standard'),
    new Option(shenzhen ? '2026 年 9 月起新入职或调入' : '桐庐、淳安、建德', 'alternate')
  );
}

function renderPolicy(previousRates = []) {
  city = getCity(fields.city.value, {
    medicalTier: fields.medicalTier.value,
    fundVariant: fields.fundVariant.value === 'alternate'
  });
  setText('city-note', city.note + (fields.city.value === 'shanghai' ? '' : ' 本页按普通公积金政策测算。'));
  const rows = [];
  contributionCells = city.rows.map((item, index) => {
    const row = document.createElement('tr');
    rows.push(row);
    const name = document.createElement('th');
    name.scope = 'row';
    name.textContent = item?.name ?? '补充住房公积金';
    row.append(name);
    const limits = row.insertCell();
    const personal = row.insertCell();
    const company = row.insertCell();
    const base = row.insertCell();
    const paid = row.insertCell();
    if (!item) {
      limits.textContent = '此测算不适用';
      for (const cell of [personal, company, base, paid]) cell.textContent = '—';
      return null;
    }

    const [minimum, maximum] = item.limits;
    limits.textContent = maximum === Infinity
      ? `${baseFormat.format(minimum)} 起`
      : `${baseFormat.format(minimum)}–${baseFormat.format(maximum)}`;
    let input;
    if (item.fixed) {
      personal.textContent = '0%';
    } else {
      const control = document.createElement('div');
      control.className = 'rate-field';
      input = document.createElement('input');
      input.type = 'number';
      input.inputMode = 'decimal';
      input.min = item.minRate ?? 0;
      input.max = item.maxRate ?? 100;
      input.step = item.fund ? 1 : 0.01;
      input.required = true;
      input.value = previousRates[index] ?? item.personal;
      input.setAttribute('form', form.id);
      input.setAttribute('aria-label', `${item.name}个人缴费比例（百分比）`);
      control.append(input, document.createTextNode('%'));
      personal.append(control);
      const hint = document.createElement('small');
      hint.textContent = item.fund ? `${input.min}%–${input.max}%`
        : `政策 ${percent(item.personal)}${item.extra ? ` + ${item.extra} 元` : ''}`;
      personal.append(hint);
    }
    company.textContent = item.company;
    return { input, base, company, paid };
  });
  contributionRows.replaceChildren(...rows);

  const sources = city.sources.map(([label, url]) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = url;
    link.textContent = label;
    link.target = '_blank';
    link.rel = 'noopener';
    item.append(link);
    return item;
  });
  document.querySelector('#policy-sources').replaceChildren(...sources);
}

function readRates() {
  return contributionCells.map(cell => cell?.input?.valueAsNumber);
}

function renderSalaryTax(result) {
  const month = result?.months[taxMonth.selectedIndex];
  setText('tax-month-base', month ? yuan(Math.max(0, result.monthlyTaxable)) : '—');
  setText('tax-cumulative-base', month ? `累计 ${yuan(month.cumulativeTaxable)}` : '');
  setText('tax-month-paid', month ? yuan(month.withholding) : '—');
}

function clearResults() {
  for (const element of resultValues) element.textContent = '—';
  setText('fund-note', '公积金入账包含个人缴存与单位缴存。');
  setText('expense-note', '全年支出包含实际租金和生活成本。');
  setText('bonus-note', '年终奖单独计税政策执行至 2027 年 12 月 31 日。');
  setText('contribution-note', '');
  document.getElementById('party-dues-note').hidden = true;
  const row = monthlyRows.insertRow();
  const cell = row.insertCell();
  cell.colSpan = 7;
  cell.textContent = '输入有效的测算数据后显示。';
  monthlyRows.replaceChildren(row);
}

function refresh() {
  const rates = readRates().map((rate, index) => rate ?? city.rows[index]?.personal);
  const valid = [...fields].every(field => !field.willValidate || field.validity.valid);
  const value = name => fields[name].valueAsNumber;
  const result = valid ? calculate({
    salary: value('salary'),
    rent: value('rent') || 0,
    living: value('living') || 0,
    rentEligible: fields.rentEligible.checked,
    socialWage: fields.socialWage.value ? value('socialWage') : undefined,
    fundWage: fields.fundWage.value ? value('fundWage') : undefined,
    bonusMode: fields.bonusMode.value,
    bonus: value('bonus') || 0,
    bonusTaxMode: fields.bonusTaxMode.value,
    partyDuesRate: fields.partyDuesRate.value,
    partyDuesBase: fields.partyDuesBase.disabled || !fields.partyDuesBase.value
      ? undefined : value('partyDuesBase')
  }, city, rates) : null;

  contributionCells.forEach((cell, index) => {
    if (!cell) return;
    const item = city.rows[index];
    const row = result?.contributions[index];
    cell.base.textContent = row ? yuan(row.base) : '—';
    cell.paid.textContent = row ? yuan(row.personal) : '—';
    if (item.fund) cell.company.textContent = Number.isFinite(rates[index]) ? percent(rates[index]) : '同个人';
  });
  renderSalaryTax(result);
  if (!result) {
    clearResults();
    return;
  }

  for (const element of resultValues) element.textContent = yuan(result[element.dataset.result]);
  const personalFund = result.contributions[0].personal + (result.contributions[1]?.personal ?? 0);
  setText('fund-note', `每月公积金入账 · 个人 ${yuan(personalFund)}，单位 ${yuan(result.monthlyFund - personalFund)}。`);
  setText('expense-note', `全年租金与生活支出 ${yuan(result.annualExpense)}。租金税前扣除每月 ${yuan(result.rentDeduction)}，全年少缴个税 ${yuan(result.rentTaxSaving)}。`);
  document.getElementById('party-dues-note').hidden = result.partyDuesRate === 0;
  setText('party-dues-note', `每月党费 ${yuan(result.monthlyPartyDues)}，按月基数 ${yuan(result.partyDuesBase)} 的 ${percent(result.partyDuesRate)} 测算，已从到手工资中扣除。`);
  const method = result.bonusMethod === 'combined' ? '并入综合所得' : '单独计税';
  setText('bonus-note', result.bonusGross > 0
    ? `年终奖税前 ${yuan(result.bonusGross)}，本次采用${method}。奖金单独计税 ${yuan(result.separateBonusTax)}，并入时新增个税 ${yuan(result.combinedBonusTax)}。`
    : '年终奖单独计税政策执行至 2027 年 12 月 31 日。');
  setText('contribution-note', `每月个人缴费 ${yuan(result.personalTotal)}，其中可在税前扣除 ${yuan(result.deductible)}。全年工资个税 ${yuan(result.annualSalaryTax)}。`);

  const rows = result.months.map(month => {
    const row = document.createElement('tr');
    const values = [
      `${month.month} 月`, yuan(result.monthlyBasicDeduction), yuan(result.personalTotal),
      yuan(Math.max(0, result.monthlyTaxable)), yuan(month.withholding),
      yuan(result.monthlyPartyDues), yuan(month.cash)
    ];
    for (const value of values) {
      row.insertCell().textContent = value;
    }
    return row;
  });
  monthlyRows.replaceChildren(...rows);
}

function updateBonusMode() {
  const byMonth = fields.bonusMode.value === 'months';
  setText('bonus-label', byMonth ? '年终奖折合月数' : '税前年终奖总额（元）');
  fields.bonus.max = byMonth ? 1000 : 100000000;
}

function updatePartyDuesMode() {
  const enabled = fields.partyDuesRate.value !== 'off';
  document.getElementById('party-dues-base-field').hidden = !enabled;
  fields.partyDuesBase.disabled = !enabled;
}

const bonuses = { months: '', amount: '' };
let bonusMode = fields.bonusMode.value;
form.addEventListener('input', event => {
  const { name } = event.target;
  if (name === 'city') {
    updateVariantFields();
    renderPolicy();
  }
  if (name === 'medicalTier' || name === 'fundVariant') {
    const previousRates = readRates();
    if (name === 'medicalTier') previousRates[2] = undefined;
    renderPolicy(previousRates);
  }
  if (name === 'bonusMode') {
    bonuses[bonusMode] = fields.bonus.value;
    bonusMode = fields.bonusMode.value;
    fields.bonus.value = bonuses[bonusMode];
    updateBonusMode();
  }
  if (name === 'partyDuesRate') updatePartyDuesMode();
  setText('form-note', '');
  refresh();
});
contributionRows.addEventListener('input', () => {
  setText('form-note', '');
  refresh();
});
form.addEventListener('submit', event => {
  event.preventDefault();
  refresh();
  setText('form-note', `已更新${city.name}测算结果。`);
});
document.querySelector('#policy-link').addEventListener('click', () => { policy.open = true; });
contributionRows.addEventListener('invalid', () => { policy.open = true; }, true);
taxMonth.replaceChildren(...Array.from({ length: 12 }, (_, index) => new Option(`${index + 1} 月`)));
taxMonth.addEventListener('change', refresh);

updateVariantFields();
renderPolicy();
updateBonusMode();
updatePartyDuesMode();
refresh();
