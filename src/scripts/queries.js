const requestBaseUrl = "http://colef.club:6969/";
const headers = {};

const makeMySQLQuery = async (query) => {
    const urlEncodedQuery = encodeURI(query);
    const requestUrl = `${requestBaseUrl}?sql=${urlEncodedQuery}`;

    const res = await fetch(requestUrl, {
        method: "get",
        headers,
    })
        .then((res) => res.json())
        .catch((err) => {
            console.log(err);
            return undefined;
        });
    return res;
};

module.exports = {
    makeMySQLQuery,
};
