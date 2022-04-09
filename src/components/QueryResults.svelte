<script>
    export let queryResults;
    export let queryError;
</script>

<!-- This component is responsible for showing a table of query results -->
<div class="space-y-4 overflow-auto">
    {#if queryError}
        <p class="text-red-400">
            Your query is invalid, please correct the errors and try again. The error:
        </p>
        <p class="text-red-400">{queryError}</p>
    {:else if queryResults && queryResults.length > 0}
        <table class="table-auto w-full font-mono text-left whitespace-nowrap">
            <thead>
                {#each Object.keys(queryResults[0]) as attributeName}
                    <th class="dark:text-slate-200/90 px-2">{attributeName}</th>
                {/each}
            </thead>
            <tbody>
                {#each queryResults as record}
                    <tr class="odd:bg-slate-300/25 dark:odd:bg-slate-200/10 dark:text-slate-200/90">
                        {#each Object.values(record) as attributeValue}
                            <td class="px-2"
                                >{attributeValue.toString() === "" ? "None" : attributeValue}</td
                            >
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    {:else}
        <p class="w-full dark:text-white/50">No result.</p>
    {/if}
</div>
