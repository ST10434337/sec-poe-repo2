// Highest page number accepted, so a huge ?page= cannot create an invalid skip value
const MAX_PAGE = 10000;

// Turn a query-string value into a positive whole number, or use the fallback
const parsePositiveInt = (value, fallback) => {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) return fallback;
    const number = Number(value);
    return number > 0 ? number : fallback;
};

// Read ?page= and ?limit= safely; invalid values fall back to the defaults (Mongoose, n.d.)
const parsePagination = (query, defaultLimit = 10, maxLimit = 50) => {
    const page = Math.min(parsePositiveInt(query.page, 1), MAX_PAGE);
    const limit = Math.min(parsePositiveInt(query.limit, defaultLimit), maxLimit);
    return { page, limit, skip: (page - 1) * limit };
};

// Page details returned alongside every paginated list
const pageInfo = (page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
});

module.exports = { parsePagination, pageInfo };

// Mongoose. n.d. Queries. Available at: https://mongoosejs.com/docs/queries.html (Accessed: 8 October 2026).