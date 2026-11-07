// SARS income tax tables for individuals, one entry per tax year ~> (SARS, 2026)
//  A tax year runs from 1 March to the end of February and is named after the year it ends in,
//  so the 2027 tax year is 1 March 2026 to 28 February 2027
//  Each band taxes the income above the previous band, up to `upTo`, at `percent`
//  The last band has no upper limit, so its upTo is null
//  Rebate and threshold are for people under 65 (the only case this app estimates)
//  Next year: add a new entry with SARS's new figures

const TAX_TABLES = {
    2027: {
        bands: [
            { upTo: 245100, percent: 18 },
            { upTo: 383100, percent: 26 },
            { upTo: 530200, percent: 31 },
            { upTo: 695800, percent: 36 },
            { upTo: 887000, percent: 39 },
            { upTo: 1878600, percent: 41 },
            { upTo: null, percent: 45 },
        ],
        primaryRebate: 17820,   // Taken off the tax for every taxpayer
        threshold: 99000,       // Below this income no tax is due (the rebate covers it all)
    },
};

// Lock every table so no code can change the tax figures while the app runs ~> (MDN Web Docs, n.d.)
for (const table of Object.values(TAX_TABLES)) {
    table.bands.forEach((band) => Object.freeze(band));
    Object.freeze(table.bands);
    Object.freeze(table);
}
Object.freeze(TAX_TABLES);

// The oldest tax year that has a table, e.g. 2027
const OLDEST_YEAR = Math.min(...Object.keys(TAX_TABLES).map(Number));

// Get the table for a tax year
// SARS often keeps the same figures, so a newer year with no table yet uses the latest older one
// `year` in the result says which table was really used
const getTaxTable = (taxYear) => {
    // Start at the asked-for year and step back one year at a time until a table is found
    for (let year = taxYear; year >= OLDEST_YEAR; year--) {
        if (TAX_TABLES[year]) return { year, ...TAX_TABLES[year] };
    }

    throw new RangeError(`No tax table for the ${taxYear} tax year`);
};

module.exports = { TAX_TABLES, getTaxTable };

// MDN Web Docs. n.d. Object.freeze(). [online]. Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze. [Accessed 7 November 2026].
// South African Revenue Service (SARS). 2026. Rates of tax for individuals. [online]. Available at: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/. [Accessed 6 November 2026].
