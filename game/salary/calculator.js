'use strict';

const salaryCalculator = (() => {
  const fund = (limits, maxRate, supplemental = false) => ({
    name: supplemental ? '补充住房公积金' : '住房公积金',
    limits, personal: supplemental ? 5 : 7, company: '同个人',
    minRate: supplemental ? 0 : 5, maxRate, fund: true
  });
  const insurance = (name, limits, personal, company, options = {}) => ({
    name, limits, personal, company, ...options
  });
  const injury = (limits, company) => insurance('工伤保险', limits, 0, company, { fixed: true });
  const maternity = (limits, company) => insurance('生育保险', limits, 0, company, { fixed: true });
  const medical = (limits, company, options) => insurance('医疗保险', limits, 2, company, options);
  const pension = (limits, company = '16%') => insurance('养老保险', limits, 8, company);
  const unemployment = (limits, personal, company) => insurance('失业保险', limits, personal, company);
  const beijingSocial = [7270, 36348];
  const shanghaiSocial = [7546, 37731];
  const guangdongPension = [5521, 27603];
  const guangzhouMedical = [6234, 31170];
  const shenzhenMedical = [6727, 33633];
  const hangzhouSocial = [5122, 25611];

  const cities = {
    beijing: {
      name: '北京',
      rows: [
        fund([2540, 36348], 12), null,
        medical(beijingSocial, '9.8%（含生育）', { extra: 3 }),
        pension(beijingSocial), unemployment(beijingSocial, 0.5, '0.5%'),
        injury(beijingSocial, '0.2%–1.9%'), maternity(beijingSocial, '并入医疗保险')
      ],
      note: '职工医保个人侧另计每月 3 元。社保与公积金分别执行各自下限。',
      sources: [
        ['北京人社局 · 社保基数与费率', 'https://rsj.beijing.gov.cn/bm/ywml/202611/t20261106_4935571.html'],
        ['北京市商务局 · 职工医保缴费说明', 'https://sw.beijing.gov.cn/zwxx/swxx/202605/P020260512520283489932.pdf'],
        ['北京市政府 · 2026 年度公积金缴存标准', 'https://www.beijing.gov.cn/fwcj/jiage/zxfb/69c68d72e6316310852dceac.html']
      ]
    },
    shanghai: {
      name: '上海',
      rows: [
        fund([2740, 37731], 7), fund([2740, 37731], 5, true),
        medical(shanghaiSocial, '9%（含生育）'),
        pension(shanghaiSocial), unemployment(shanghaiSocial, 0.5, '0.5%'),
        injury(shanghaiSocial, '0.16%–1.52%'), maternity(shanghaiSocial, '并入医疗保险')
      ],
      note: '普通公积金为 5%–7%。补充公积金由单位自愿参加，比例为 1%–5%，未参加时填 0%。两项分别计算，个人与单位的月缴存额各自四舍五入到元。',
      sources: [
        ['上海税务局 · 社保缴费基数', 'https://shanghai.chinatax.gov.cn/tax/zcfw/rdwd/202608/t481376.html'],
        ['上海人社局 · 单位社保费率', 'https://rsj.sh.gov.cn/tdjjf_17554/20201016/t0035_1394762.html'],
        ['上海税务局 · 2026 年职工医保费率', 'https://shanghai.chinatax.gov.cn/zcfw/zcfgk/sbf/202603/t479836.html'],
        ['上海市政府 · 2026 年度普通及补充公积金', 'https://www.shanghai.gov.cn/gwk/affairs/content/0064%40f3d788ec72e9404ebcbf3d27fda98435']
      ]
    },
    guangzhou: {
      name: '广州',
      rows: [
        fund([2680, 41697], 12), null,
        medical(guangzhouMedical, '6%'), pension(guangdongPension),
        unemployment([2680, 42933], 0.2, '0.8%'),
        injury([2680, Infinity], '0.2%–1.4%'), maternity(guangzhouMedical, '0.85%')
      ],
      note: '养老执行广东省统一上下限，医保与生育共用广州医保基数。失业保险按本市最低工资及上年度在岗职工月平均工资三倍设限。公积金下限自 2026 年 9 月起为 2,680 元。',
      sources: [
        ['广东税务局 · 2026 年职工养老缴费基数', 'https://guangdong.chinatax.gov.cn/gdsw/ssfggds/2026-10/08/content_b40dcb7bf605411fbb12e0f81281dc6b.shtml'],
        ['广州政务热线 · 职工养老、医疗和生育缴费口径', 'https://wx12345.gzonline.gov.cn/km/showMsg?id=BEAFDBCFD'],
        ['广州人社局 · 失业缴费规则', 'https://rsj.gz.gov.cn/ywzt/shbz/tzgg/content/post_10577009.html'],
        ['广州统计局 · 2025 年职工平均工资', 'https://tjj.gz.gov.cn/stats_newtjyw/tjsj/tjgb/qtgb/content/mpost_10894378.html'],
        ['广东省政府公报 · 工伤保险行业基准费率', 'https://www.gd.gov.cn/gbfj/gb2113.pdf'],
        ['广州越秀区政府 · 公积金缴存比例与基数', 'https://www.yuexiu.gov.cn/zmhd/hygq/content/post_10966810.html'],
        ['广州公积金中心 · 调整最低缴存基数', 'https://gjj.gz.gov.cn/gkmlpt/content/10/10983/post_10983424.html']
      ]
    },
    shenzhen: {
      name: '深圳',
      rows: [
        fund([2520, 48471], 12), null,
        medical(shenzhenMedical, '6%'),
        pension(guangdongPension, '16%（深户另缴 1%）'),
        unemployment([2700, 48471], 0.2, '0.8%'),
        injury([2700, Infinity], '0.2%–1.4%'), maternity(shenzhenMedical, '0.5%')
      ],
      note: '职工医保可按一档或二档测算。公积金按存量职工 2,520 元下限估算，2026 年 9 月起新参加工作或新调入的职工下限为 2,700 元。',
      sources: [
        ['深圳医保局 · 医保与生育缴费基数', 'https://hsa.sz.gov.cn/gkmlpt/content/12/12567/post_12567884.html'],
        ['深圳市政府公报 · 医保办法与档次', 'https://www.sz.gov.cn/attachment/1/1361/1361055/10865827.pdf'],
        ['广东税务局 · 2026 年职工养老缴费基数', 'https://guangdong.chinatax.gov.cn/gdsw/ssfggds/2026-10/08/content_b40dcb7bf605411fbb12e0f81281dc6b.shtml'],
        ['深圳人社局 · 失业保险缴费基数', 'https://www.sz.gov.cn/hdjlpt/detail?pid=3209367'],
        ['深圳人社局 · 工伤费率', 'https://hrss.sz.gov.cn/zmhd/cjwt/zcwdpt/shbz/content/post_11824297.html'],
        ['深圳人社局 · 最低工资', 'https://hrss.sz.gov.cn/tzgg/content/post_12954870.html'],
        ['深圳公积金中心 · 2026 年度缴存基数标准', 'https://www.sz.gov.cn/hdjl/ywzsk/jsj/zfgjj/content/post_12893587.html'],
        ['深圳公积金中心 · 新入职及调入职工缴存下限', 'https://zjj.sz.gov.cn/csml/zfgjjtlzx/zmhd/cjwtjd_236/jcyw/content/post_12977412.html'],
        ['深圳统计局 · 2025 年职工平均工资', 'https://www.sz.gov.cn/cn/xxgk/zfxxgj/tjsj/tjgb/content/mpost_12907800.html']
      ]
    },
    hangzhou: {
      name: '杭州',
      rows: [
        fund([2660, 42151], 12), null,
        medical(hangzhouSocial, '8.9%'), pension(hangzhouSocial),
        unemployment(hangzhouSocial, 0.5, '1.5%'),
        injury(hangzhouSocial, '0.2%–1.9%'), maternity(hangzhouSocial, '0.6%')
      ],
      note: '医保与生育单位费率合计为 9.5%。公积金下限按杭州市区估算，桐庐、淳安和建德适用 2,430 元下限。',
      sources: [
        ['浙江人社厅等五部门 · 2026 年社保缴费基数', 'https://rlsbt.zj.gov.cn/col/col1229506773/art/2026/art_2b4555c11a034b9e874038cbff2f84fb.html'],
        ['杭州市政府公报 · 医保及生育费率', 'https://zfgb.hangzhou.gov.cn/11/105220253/t116220253054/518112.shtml'],
        ['浙江税务局 · 企业职工养老费率', 'https://zhejiang.chinatax.gov.cn/art/2025/1/21/art_22104_630903.html'],
        ['浙江税务局 · 失业费率', 'https://zhejiang.chinatax.gov.cn/art/2015/1/15/art_8410_12307.html'],
        ['杭州税务局 · 失业和工伤降费期限', 'https://zhejiang.chinatax.gov.cn/art/2026/5/6/art_13129_654020.html'],
        ['杭州公积金中心 · 2026 年度缴存调整通知', 'https://apiv4.cst123.cn/cst/news/shareDetail?id=1265385379872112640']
      ]
    }
  };

  const annualBrackets = [
    [36000, 0.03, 0], [144000, 0.1, 2520], [300000, 0.2, 16920],
    [420000, 0.25, 31920], [660000, 0.3, 52920], [960000, 0.35, 85920],
    [Infinity, 0.45, 181920]
  ];
  const bonusBrackets = [
    [3000, 0.03, 0], [12000, 0.1, 210], [25000, 0.2, 1410],
    [35000, 0.25, 2660], [55000, 0.3, 4410], [80000, 0.35, 7160],
    [Infinity, 0.45, 15160]
  ];
  const partyDuesBrackets = [[3000, 0.5], [5000, 1], [10000, 1.5], [Infinity, 2]];
  const monthlyBasicDeduction = 5000;
  const round = amount => Math.round((amount + Number.EPSILON) * 100) / 100;
  const clamp = (amount, [min, max]) => Math.min(Math.max(amount, min), max);

  function getCity(key, options = {}) {
    const city = cities[key];
    const rows = [...city.rows];
    if (key === 'shenzhen') {
      if (options.fundVariant) rows[0] = { ...rows[0], limits: [2700, 48471] };
      if (options.medicalTier === 'second') rows[2] = { ...rows[2], personal: 0.5, company: '1.5%' };
    }
    if (key === 'hangzhou' && options.fundVariant) {
      rows[0] = { ...rows[0], limits: [2430, 42151] };
    }
    return { ...city, rows };
  }

  function tax(amount, brackets, divisor = 1) {
    const taxable = Math.max(0, round(amount));
    const [, rate, quickDeduction] = brackets.find(([limit]) => taxable <= limit * divisor);
    return round(taxable * rate - quickDeduction);
  }

  function calculate(input, city, rates) {
    const { salary, rent, living } = input;
    const rentDeduction = rent > 0 && input.rentEligible ? 1500 : 0;
    const contributions = city.rows.map((row, index) => {
      if (!row) return null;
      const wage = (row.fund ? input.fundWage : input.socialWage) ?? salary;
      const base = salary > 0 ? clamp(wage, row.limits) : 0;
      const rate = rates[index];
      const fixedAmount = base > 0 ? row.extra ?? 0 : 0;
      const amount = base * rate / 100;
      const personal = row.fund ? Math.round(amount) : round(amount + fixedAmount);
      const deductible = row.fund ? personal : round(base * Math.min(rate, row.personal) / 100 + fixedAmount);
      return { base, rate, personal, company: row.fund ? personal : null, deductible };
    });
    const active = contributions.filter(Boolean);
    const personalTotal = round(active.reduce((sum, row) => sum + row.personal, 0));
    const deductible = round(active.reduce((sum, row) => sum + row.deductible, 0));
    const monthlyFund = active.reduce((sum, row) => sum + (row.company === null ? 0 : row.personal + row.company), 0);
    const monthlyTaxable = round(salary - deductible - monthlyBasicDeduction - rentDeduction);
    const annualTaxable = round(monthlyTaxable * 12);
    const annualSalaryTax = tax(annualTaxable, annualBrackets);
    const salaryAfterTax = round(salary - personalTotal - annualSalaryTax / 12);
    const partyDuesBase = Math.max(0, input.partyDuesBase ?? salaryAfterTax);
    const partyDuesRate = input.partyDuesRate === 'auto'
      ? partyDuesBrackets.find(([limit]) => partyDuesBase <= limit)[1]
      : Number(input.partyDuesRate) || 0;
    const monthlyPartyDues = Math.min(1000, round(partyDuesBase * partyDuesRate / 100));
    const months = Array.from({ length: 12 }, (_, index) => {
      const cumulativeTaxable = Math.max(0, round(monthlyTaxable * (index + 1)));
      const cumulativeTax = tax(cumulativeTaxable, annualBrackets);
      const previousTax = tax(monthlyTaxable * index, annualBrackets);
      const withholding = round(cumulativeTax - previousTax);
      return { month: index + 1, cumulativeTaxable, withholding, cash: round(salary - personalTotal - withholding - monthlyPartyDues) };
    });

    const bonusGross = round(input.bonusMode === 'months' ? input.bonus * salary : input.bonus);
    const separateBonusTax = tax(bonusGross, bonusBrackets, 12);
    const combinedBonusTax = round(tax(annualTaxable + bonusGross, annualBrackets) - annualSalaryTax);
    const useCombined = input.bonusTaxMode === 'combined' ||
      (input.bonusTaxMode === 'auto' && combinedBonusTax < separateBonusTax);
    const bonusMethod = useCombined ? 'combined' : 'separate';
    const bonusTax = useCombined ? combinedBonusTax : separateBonusTax;
    const bonusCash = round(bonusGross - bonusTax);
    const annualSalaryCash = round((salary - personalTotal - monthlyPartyDues) * 12 - annualSalaryTax);
    const annualCash = round(annualSalaryCash + bonusCash);
    const annualWithFund = round(annualCash + monthlyFund * 12);
    const annualExpense = round((rent + living) * 12);

    return {
      contributions, personalTotal, deductible, rentDeduction, monthlyBasicDeduction, monthlyTaxable, monthlyFund,
      monthlyCash: round(annualSalaryCash / 12), months, annualSalaryTax,
      partyDuesBase, partyDuesRate, monthlyPartyDues,
      bonusGross, separateBonusTax, combinedBonusTax, bonusMethod, bonusTax, bonusCash,
      rentTaxSaving: round(tax(annualTaxable + rentDeduction * 12 +
        (useCombined ? bonusGross : 0), annualBrackets) - annualSalaryTax - (useCombined ? bonusTax : 0)),
      annualCash, annualWithFund, annualExpense,
      annualSavings: round(annualCash - annualExpense),
      annualSavingsWithFund: round(annualWithFund - annualExpense)
    };
  }

  return { calculate, cities, getCity };
})();

if (typeof module !== 'undefined') module.exports = salaryCalculator;
