const requestBaseUrl = "http://colef.club:6969/";
const method = "get";
const mode = "cors";
const headers = {};

const makeMySQLQuery = async (query) => {
    const urlEncodedQuery = encodeURI(query);
    const requestUrl = `${requestBaseUrl}?sql=${urlEncodedQuery}`;

    const res = await fetch(requestUrl, { method, mode, headers }) //
        .then((res) => res.json());

    return res;
};

module.exports = {
    makeMySQLQuery,
};
