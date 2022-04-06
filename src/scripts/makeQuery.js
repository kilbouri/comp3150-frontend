const handleQuery = async (event) => {
    const formData = new FormData(event.target);

    const data = {};
    for (const field of formData) {
        const [key, value] = field;
        data[key] = value;
    }

    alert(JSON.stringify(data));
};
module.exports = {
    handleQuery,
};
