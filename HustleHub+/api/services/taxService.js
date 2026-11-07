// Estimated income tax for freelancers, using the SARS tables in config/taxTables.js
// This is an estimate only. It assumes:
//  - HustleHub+ is the freelancer's only income
//  - no business expenses are taken off
//  - the freelancer is under 65, so only the primary rebate applies

// Tax years follow South African dates (UTC+2 all year, no daylight saving)
const SA_TIMEZONE = 'Africa/Johannesburg';

// thus 270018 cents -> 2700.18 rand
const centsToRand = (cents) => cents / 100;

// Rates are fractions with 4 decimals, e.g. 0.0612 means 6.12%
const roundRate = (rate) => Math.round(rate * 10000) / 10000;

// Estimate the yearly tax on a whole-rand income using one SARS table ~> (SARS, 2026)
//  1. Split the income into the table's bands and tax each part at its band's rate
//  2. Add the parts together: this is the tax before rebate
//  3. Take off the primary rebate; the tax can't go below 0
//  4. Round the tax to the nearest rand
// Money is worked out in cents (rand x percent = cents), so there are no rounding errors along the way
const calculateTax = (income, table) => {
    if (!Number.isSafeInteger(income) || income < 0)
        throw new TypeError('Income must be a whole number of rand, 0 or more');

    const bands = [];
    let from = 0;
    let taxCents = 0;

    for (const band of table.bands) {
        if (income <= from) break;                      // The income doesn't reach this band

        const top = band.upTo ?? Infinity;              // The last band has no upper limit
        const amount = Math.min(income, top) - from;    // The part of the income inside this band
        const bandTaxCents = amount * band.percent;

        // Keep each band's working, so the app can show how the tax was worked out
        bands.push({ from, to: band.upTo, rate: band.percent / 100, amount, tax: centsToRand(bandTaxCents) });
        taxCents += bandTaxCents;
        from = top;
    }

    const taxAfterRebateCents = Math.max(0, taxCents - table.primaryRebate * 100);
    const tax = Math.round(centsToRand(taxAfterRebateCents));

    // The rate the next rand is taxed at: 0 while the income is under the threshold,
    // otherwise the rate of the highest band the income reaches
    const highestBand = bands[bands.length - 1];
    const marginalRate = income < table.threshold ? 0 : highestBand.rate;

    return {
        taxableIncome: income,
        taxBeforeRebate: centsToRand(taxCents),
        rebate: table.primaryRebate,
        threshold: table.threshold,     // Below this income no tax is due
        tax,
        afterTax: income - tax,
        effectiveRate: income === 0 ? 0 : roundRate(tax / income),  // Share of all income that goes to tax
        marginalRate,
        bands,
    };
};

// A moment as a South African calendar date, e.g. "2026-03-01" ~> (MDN Web Docs, n.d.b)
// The en-CA format writes dates as year-month-day
const saDate = (date) => date.toLocaleDateString('en-CA', { timeZone: SA_TIMEZONE });

// First moment of a tax year: 1 March at 00:00 South African time ~> (MDN Web Docs, n.d.a)
const taxYearStart = (startYear) => new Date(`${startYear}-03-01T00:00:00+02:00`);

// The tax year a date falls in ~> (SARS, 2026)
// It ends just before the next 1 March, so a leap year's 29 February is included without a special case
const getTaxYear = (date = new Date()) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime()))
        throw new TypeError('A valid date is needed');

    // Read the year and month as they are in South Africa, e.g. "2026-11-06" -> 2026 and 11
    const [year, month] = saDate(date).split('-').map(Number);
    // March onwards belongs to the tax year that started this calendar year
    const startYear = month >= 3 ? year : year - 1;

    const start = taxYearStart(startYear);
    const end = taxYearStart(startYear + 1);

    return {
        year: startYear + 1,                                        // Named after the year it ends in, e.g. 2027
        label: `${startYear}/${String(startYear + 1).slice(-2)}`,   // e.g. "2026/27"
        start,                                                      // First moment of the tax year
        end,                                                        // First moment of the next tax year (not included)
        firstDay: saDate(start),                                    // e.g. "2026-03-01"
        lastDay: saDate(new Date(end.getTime() - 1)),               // e.g. "2027-02-28"
    };
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// The tax year's months from March up to the month `now` is in (South African time)
// e.g. on 6 November 2026: 2026-03 (Mar) ... 2026-11 (Nov)
const taxYearMonthsSoFar = (taxYear, now) => {
    const thisMonth = saDate(now).slice(0, 7);  // e.g. "2026-11"
    const months = [];
    let year = taxYear.year - 1;                // The tax year starts in March of the year before its name
    let month = 3;                              // March

    // Add one month at a time, stopping at this month or after 12 months
    while (months.length < 12) {
        const key = `${year}-${String(month).padStart(2, '0')}`;
        months.push({ month: key, label: MONTH_LABELS[month - 1] });

        // "YYYY-MM" text sorts in date order, so this also stops if `now` is before the tax year
        if (key >= thisMonth) break;

        // Move to the next month, going from December to January of the next year
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
    }

    return months;
};

// Put a freelancer's tax summary together for the dashboard
//  monthlyRows = paid income per month in this tax year, e.g. [{ month: '2026-04', earned: 12000, count: 2 }]
//  pending     = money from bookings that are not paid yet
// Kept apart from the database code (services/incomeService.js), so it can be unit tested
const buildTaxSummary = ({ taxYear, table, monthlyRows, pending, now }) => {
    // Convert the rows into an object so each month is easy to look up
    const byMonth = Object.fromEntries(monthlyRows.map((row) => [row.month, row]));

    // Every month so far, with 0 for months that had no payments
    const monthly = taxYearMonthsSoFar(taxYear, now).map(({ month, label }) => ({
        month,
        label,
        earned: byMonth[month]?.earned ?? 0,
        count: byMonth[month]?.count ?? 0,
    }));

    // Add up every row, not only the listed months, so no paid income is ever left out
    const earned = monthlyRows.reduce((sum, row) => sum + row.earned, 0);
    const estimate = calculateTax(earned, table);
    // What the tax would be if all pending work gets paid in this tax year too
    const withPending = calculateTax(earned + pending, table);

    return {
        currency: 'ZAR',
        taxYear: {
            year: taxYear.year,
            label: taxYear.label,
            start: taxYear.firstDay,
            end: taxYear.lastDay,
            tableYear: table.year,      // The SARS table used; older than `year` only if the new table isn't added yet
        },
        earned,
        pending,
        estimate,
        ifPendingPaid: {
            taxableIncome: withPending.taxableIncome,
            tax: withPending.tax,
            extraTax: withPending.tax - estimate.tax,
        },
        monthly,
    };
};

module.exports = { calculateTax, getTaxYear, buildTaxSummary };

// MDN Web Docs. n.d.a. Date() constructor. [online]. Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date. [Accessed 7 November 2026].
// MDN Web Docs. n.d.b. Date.prototype.toLocaleDateString(). [online]. Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString. [Accessed 7 November 2026].
// South African Revenue Service (SARS). 2026. Rates of tax for individuals. [online]. Available at: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/. [Accessed 6 November 2026].
