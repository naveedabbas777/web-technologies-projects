const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
};

exports.parsePagination = (query = {}, options = {}) => {
    const {
        defaultPage = 1,
        defaultLimit = 20,
        maxLimit = 100
    } = options;

    const page = parsePositiveInt(query.page, defaultPage);
    const requestedLimit = parsePositiveInt(query.limit, defaultLimit);
    const limit = Math.min(requestedLimit, maxLimit);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

exports.buildPaginationMeta = ({ page, limit, total }) => ({
    page,
    limit,
    total,
    pages: total === 0 ? 0 : Math.ceil(total / limit)
});
