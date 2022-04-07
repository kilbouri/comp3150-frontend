<script>
    export let onSubmit = console.log;
    export let placeholder = "SELECT * FROM information_schema.tables;";
    export let query = "";

    const formDataToObject = (formData) => {
        const data = {};
        for (const field of formData) {
            const [key, value] = field;
            data[key] = value;
        }

        return data;
    }

    const getQueryURL = (event) => {
        const formData = new FormData(event.target);
        return formDataToObject(formData).sql;
    }
</script>

<form on:submit|preventDefault={(e) => onSubmit(getQueryURL(e))}>
    <textarea
        class="w-full bg-white/25 shadow-inner font-mono resize-y rounded-md px-2 py-0.5 placeholder:text-gray-500/80"
        name="sql"
        bind:value={query}
        {placeholder}
    />

    <div id="submitContainer" class="mt-2">
        <button
            class="inline disabled:bg-red-400 active:bg-sky-700 hover:bg-sky-600 bg-sky-500 rounded font-bold py-2 mr-2 px-5 text-white"
            type="submit"
            disabled={!query}
        >
            Submit
        </button>
        {#if !query}
            <p class="inline text-red-400">You must specify a query.</p>
        {/if}
    </div>
</form>
