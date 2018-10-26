
module.exports = function (middleware) {
    return async function (req, res, next) {
        try {
            await middleware(req, res, next);
        } catch (e) {
            next(e);
        }
    }
};