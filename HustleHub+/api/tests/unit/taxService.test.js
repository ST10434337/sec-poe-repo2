// Unit tests for the tax estimate. Run with: npm run test:unit ~> (Node.js, n.d.a)
// Expected figures are worked out by hand from the SARS 2027 tax table (SARS, 2026)
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { TAX_TABLES, getTaxTable } = require('../../config/taxTables');
const { calculateTax, getTaxYear, buildTaxSummary } = require('../../services/taxService');

const TABLE = TAX_TABLES[2027];

describe('calculateTax', () => {
    // The worked examples used in the README
    const examples = [
        { income: 0, taxBeforeRebate: 0, tax: 0, effectiveRate: 0, marginalRate: 0 },
        { income: 80000, taxBeforeRebate: 14400, tax: 0, effectiveRate: 0, marginalRate: 0 },
        { income: 99000, taxBeforeRebate: 17820, tax: 0, effectiveRate: 0, marginalRate: 0.18 },
        { income: 150000, taxBeforeRebate: 27000, tax: 9180, effectiveRate: 0.0612, marginalRate: 0.18 },
        { income: 245100, taxBeforeRebate: 44118, tax: 26298, effectiveRate: 0.1073, marginalRate: 0.18 },
        { income: 300000, taxBeforeRebate: 58392, tax: 40572, effectiveRate: 0.1352, marginalRate: 0.26 },
        { income: 2000000, taxBeforeRebate: 720969, tax: 703149, effectiveRate: 0.3516, marginalRate: 0.45 },
    ];

    for (const example of examples) {
        it(`works out the tax on R${example.income}`, () => {
            const result = calculateTax(example.income, TABLE);

            assert.equal(result.taxableIncome, example.income);
            assert.equal(result.taxBeforeRebate, example.taxBeforeRebate);
            assert.equal(result.rebate, 17820);
            assert.equal(result.threshold, 99000);
            assert.equal(result.tax, example.tax);
            assert.equal(result.afterTax, example.income - example.tax);
            assert.equal(result.effectiveRate, example.effectiveRate);
            assert.equal(result.marginalRate, example.marginalRate);
        });
    }

    // At the top of each band, the tax before rebate must match the base amount SARS prints for the next band
    const sarsBaseAmounts = [
        [245100, 44118],
        [383100, 79998],
        [530200, 125599],
        [695800, 185215],
        [887000, 259783],
        [1878600, 666339],
    ];

    for (const [income, base] of sarsBaseAmounts) {
        it(`matches the SARS base amount of R${base} at R${income}`, () => {
            assert.equal(calculateTax(income, TABLE).taxBeforeRebate, base);
        });
    }

    it('shows the working for each band the income reaches', () => {
        assert.deepEqual(calculateTax(300000, TABLE).bands, [
            { from: 0, to: 245100, rate: 0.18, amount: 245100, tax: 44118 },
            { from: 245100, to: 383100, rate: 0.26, amount: 54900, tax: 14274 },
        ]);
    });

    it('marks the top band as having no upper limit', () => {
        const topBand = calculateTax(2000000, TABLE).bands.at(-1);

        assert.deepEqual(topBand, { from: 1878600, to: null, rate: 0.45, amount: 121400, tax: 54630 });
    });

    it('has band taxes that add up to the tax before rebate', () => {
        for (const income of [1, 99001, 150000, 400000, 750000, 2000000]) {
            const result = calculateTax(income, TABLE);
            const bandTotal = result.bands.reduce((sum, band) => sum + band.tax, 0);
            const bandAmounts = result.bands.reduce((sum, band) => sum + band.amount, 0);

            assert.equal(Math.round(bandTotal * 100), Math.round(result.taxBeforeRebate * 100));
            assert.equal(bandAmounts, income);
        }
    });

    it('has no bands when there is no income', () => {
        assert.deepEqual(calculateTax(0, TABLE).bands, []);
    });

    it('keeps cents before the rebate and rounds the tax to the nearest rand', () => {
        // 18% of R99 001 is R17 820.18, which the R17 820 rebate almost covers
        const justOver = calculateTax(99001, TABLE);
        assert.equal(justOver.taxBeforeRebate, 17820.18);
        assert.equal(justOver.tax, 0);

        // 18% of R150 001 is R27 000.18, so the tax is R9 180.18, rounded to R9 180
        const withCents = calculateTax(150001, TABLE);
        assert.equal(withCents.taxBeforeRebate, 27000.18);
        assert.equal(withCents.tax, 9180);
    });

    it('rejects income that is not a whole number of rand, 0 or more', () => {
        for (const income of [-1, 1.5, '150000', Number.NaN, Infinity, null, undefined, 2 ** 53]) {
            assert.throws(() => calculateTax(income, TABLE), TypeError, `should reject ${String(income)}`);
        }
    });
});

describe('getTaxYear', () => {
    it('finds the 2027 tax year for a date in November 2026', () => {
        const taxYear = getTaxYear(new Date('2026-11-06T10:00:00Z'));

        assert.equal(taxYear.year, 2027);
        assert.equal(taxYear.label, '2026/27');
        assert.equal(taxYear.firstDay, '2026-03-01');
        assert.equal(taxYear.lastDay, '2027-02-28');
        // 1 March 00:00 in South Africa is 28 February 22:00 UTC
        assert.equal(taxYear.start.toISOString(), '2026-02-28T22:00:00.000Z');
        assert.equal(taxYear.end.toISOString(), '2027-02-28T22:00:00.000Z');
    });

    it('keeps January and February in the tax year that started the March before', () => {
        assert.equal(getTaxYear(new Date('2027-01-15T12:00:00Z')).year, 2027);
        assert.equal(getTaxYear(new Date('2027-02-28T12:00:00Z')).year, 2027);
    });

    it('starts the new tax year at midnight South African time, not UTC', () => {
        // 23:59:59.999 on 28 February in South Africa: still the old tax year
        assert.equal(getTaxYear(new Date('2026-02-28T21:59:59.999Z')).year, 2026);
        // 00:00 on 1 March in South Africa: the new tax year
        assert.equal(getTaxYear(new Date('2026-02-28T22:00:00.000Z')).year, 2027);
    });

    it('includes 29 February in a leap year', () => {
        const taxYear = getTaxYear(new Date('2028-02-29T12:00:00Z'));

        assert.equal(taxYear.year, 2028);
        assert.equal(taxYear.label, '2027/28');
        assert.equal(taxYear.lastDay, '2028-02-29');
    });

    it('uses today when no date is given', () => {
        const now = Date.now();
        const taxYear = getTaxYear();

        assert.ok(taxYear.start.getTime() <= now && now < taxYear.end.getTime());
    });

    it('rejects anything that is not a valid date', () => {
        for (const value of [new Date('not a date'), '2026-11-06', 1762423200000, null]) {
            assert.throws(() => getTaxYear(value), TypeError, `should reject ${String(value)}`);
        }
    });
});

describe('buildTaxSummary', () => {
    // Build a summary the same way services/incomeService.js does, from rows the database would return
    const summaryFor = (nowIso, monthlyRows = [], pending = 0) => {
        const now = new Date(nowIso);
        const taxYear = getTaxYear(now);
        return buildTaxSummary({ taxYear, table: getTaxTable(taxYear.year), monthlyRows, pending, now });
    };

    it('lists every month from March up to this month, with 0 for months with no payments', () => {
        const summary = summaryFor('2026-11-06T10:00:00Z', [
            { month: '2026-04', earned: 12000, count: 2 },
            { month: '2026-10', earned: 3500, count: 1 },
        ]);

        assert.deepEqual(summary.monthly.map((row) => row.month), [
            '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11',
        ]);
        assert.deepEqual(summary.monthly.map((row) => row.label), [
            'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov',
        ]);
        assert.deepEqual(summary.monthly[1], { month: '2026-04', label: 'Apr', earned: 12000, count: 2 });
        assert.deepEqual(summary.monthly[0], { month: '2026-03', label: 'Mar', earned: 0, count: 0 });
    });

    it('lists only March on the first day of the tax year', () => {
        // 00:30 on 1 March in South Africa
        const summary = summaryFor('2026-02-28T22:30:00Z');

        assert.deepEqual(summary.monthly, [{ month: '2026-03', label: 'Mar', earned: 0, count: 0 }]);
    });

    it('lists all 12 months at the end of the tax year, ending in February of the next calendar year', () => {
        const summary = summaryFor('2027-02-20T10:00:00Z');

        assert.equal(summary.monthly.length, 12);
        assert.deepEqual(summary.monthly.at(-1), { month: '2027-02', label: 'Feb', earned: 0, count: 0 });
        assert.equal(summary.monthly[10].month, '2027-01');
    });

    it('estimates tax on paid income, and on paid plus pending income', () => {
        const summary = summaryFor('2026-11-06T10:00:00Z', [
            { month: '2026-05', earned: 100000, count: 4 },
            { month: '2026-09', earned: 50000, count: 2 },
        ], 20000);

        assert.equal(summary.currency, 'ZAR');
        assert.equal(summary.earned, 150000);
        assert.equal(summary.pending, 20000);
        assert.deepEqual(summary.estimate, calculateTax(150000, TABLE));
        assert.equal(summary.estimate.tax, 9180);
        // 18% of R170 000 = R30 600, minus the R17 820 rebate = R12 780
        assert.deepEqual(summary.ifPendingPaid, { taxableIncome: 170000, tax: 12780, extraTax: 3600 });
    });

    it('describes the tax year and the SARS table used', () => {
        assert.deepEqual(summaryFor('2026-11-06T10:00:00Z').taxYear, {
            year: 2027, label: '2026/27', start: '2026-03-01', end: '2027-02-28', tableYear: 2027,
        });
        // The 2028 table isn't added yet, so the 2027 one is used and the summary says so
        assert.equal(summaryFor('2027-06-01T10:00:00Z').taxYear.year, 2028);
        assert.equal(summaryFor('2027-06-01T10:00:00Z').taxYear.tableYear, 2027);
    });

    it('shows no tax for a freelancer with no payments yet', () => {
        const summary = summaryFor('2026-11-06T10:00:00Z');

        assert.equal(summary.earned, 0);
        assert.equal(summary.estimate.tax, 0);
        assert.deepEqual(summary.ifPendingPaid, { taxableIncome: 0, tax: 0, extraTax: 0 });
    });
});

// Node.js. n.d.a. Test runner. [online]. Available at: https://nodejs.org/api/test.html. [Accessed 6 November 2026].
// Node.js. n.d.b. Assert. [online]. Available at: https://nodejs.org/api/assert.html. [Accessed 6 November 2026].
// South African Revenue Service (SARS). 2026. Rates of tax for individuals. [online]. Available at: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/. [Accessed 6 November 2026].
