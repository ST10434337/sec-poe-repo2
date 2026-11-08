// Unit tests for the SARS tax tables. Run with: npm run test:unit ~> (Node.js, n.d.)
// These catch typing mistakes when a new tax year is added
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { TAX_TABLES, getTaxTable } = require('../../config/taxTables');

describe('TAX_TABLES', () => {
    for (const [year, table] of Object.entries(TAX_TABLES)) {
        it(`has bands that go up in order for the ${year} tax year`, () => {
            const limits = table.bands.slice(0, -1).map((band) => band.upTo);
            const rates = table.bands.map((band) => band.percent);

            assert.deepEqual(limits, [...limits].sort((a, b) => a - b));
            assert.deepEqual(rates, [...rates].sort((a, b) => a - b));
            // Only the last band has no upper limit
            assert.ok(limits.every((limit) => Number.isInteger(limit)));
            assert.equal(table.bands.at(-1).upTo, null);
        });

        it(`has a threshold where the first band's tax equals the rebate for the ${year} tax year`, () => {
            // SARS's threshold is the income the rebate fully covers, e.g. 18% of R99 000 = R17 820
            assert.equal(table.threshold * table.bands[0].percent, table.primaryRebate * 100);
        });

        it(`cannot be changed while the app runs for the ${year} tax year`, () => {
            assert.ok(Object.isFrozen(table));
            assert.ok(Object.isFrozen(table.bands));
            assert.ok(table.bands.every((band) => Object.isFrozen(band)));
        });
    }
});

describe('getTaxTable', () => {
    it('returns the table for a tax year that has one', () => {
        const table = getTaxTable(2027);

        assert.equal(table.year, 2027);
        assert.equal(table.bands, TAX_TABLES[2027].bands);
        assert.equal(table.primaryRebate, 17820);
    });

    it('uses the latest older table when a new tax year has none yet', () => {
        assert.equal(getTaxTable(2028).year, 2027);
    });

    it('fails for a tax year older than every table', () => {
        assert.throws(() => getTaxTable(2026), RangeError);
    });
});

// Node.js. n.d. Test runner. [online]. Available at: https://nodejs.org/api/test.html. [Accessed 6 November 2026].
