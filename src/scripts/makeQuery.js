const requestBaseUrl = "http://colef.club:6969/";
const headers = {};
const formDataToObject = (formData) => {
    const data = {};
    for (const field of formData) {
        const [key, value] = field;
        data[key] = value;
    }

    return data;
};

const handleQuery = async (event) => {
    const formData = new FormData(event.target);
    const data = formDataToObject(formData);

    const urlEncodedQuery = encodeURI(data.sql);
    const requestUrl = `${requestBaseUrl}?sql=${urlEncodedQuery}`;

    alert(requestUrl);

    const res = await fetch(requestUrl, {
        method: "get",
        headers,
    });
    alert(res.json());
};
module.exports = {
    handleQuery,
};
