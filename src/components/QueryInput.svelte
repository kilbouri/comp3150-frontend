<script>
    import { handleQuery } from "../scripts/makeQuery.js";

    export let placeholder = "SELECT * FROM information_schema.tables;";
    let query = "";
</script>

<form on:submit|preventDefault={handleQuery}>
    <textarea
        class="w-full bg-white/25 shadow-inner font-mono resize-y rounded-md p-1"
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
