<script>
    import Button from "./Button.svelte";
    import { queries } from "../scripts/queries.js";

    export let onSubmit = console.log;
    export let placeholder = "SELECT * FROM PowerFacilities;";
    export let query = "";
    let inputBoxMinRows = undefined;

    const formDataToObject = (formData) => {
        const data = {};
        for (const field of formData) {
            const [key, value] = field;
            data[key] = value;
        }

        return data;
    };

    const getQueryURL = (event) => {
        const formData = new FormData(event.target);
        return formDataToObject(formData).sql;
    };
</script>

<form on:submit|preventDefault={(e) => onSubmit(getQueryURL(e))}>
    <textarea
        class="w-full bg-zinc-200/50 dark:placeholder:text-white/50 dark:text-slate-200/90 shadow-inner font-mono resize-y rounded-md px-2 py-0.5 placeholder:text-gray-500/80 my-1"
        name="sql"
        rows={inputBoxMinRows}
        bind:value={query}
        {placeholder}
    />

    <div class="w-full flex flex-wrap gap-2">
        {#each queries as presetQuery}
            <Button
                fillSpace
                tooltip={presetQuery.tooltip}
                onclick={() => {
                    query = presetQuery.query.join("\n");
                    inputBoxMinRows = presetQuery.query.length;
                }}
            >
                {presetQuery.name}
            </Button>
        {/each}
    </div>
    <div id="submitContainer" class="flex flex-wrap items-center w-full my-2 gap-2">
        <Button disabled={!query} type="submit" tooltip="Evaluate the given query.">Submit</Button>

        {#if !query}
            <p class="inline text-red-400">You must provide a query.</p>
        {/if}
    </div>
</form>
