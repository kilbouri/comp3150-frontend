<script>
    export let records;
</script>

<!-- This component is responsible for showing a table of query results -->
<div class="space-y-4 overflow-auto">
    {#if (typeof records === 'string')}
        <p class="text-red-400">Your query is invalid, please correct any errors and try again. The error:</p>
        <p class="text-red-400">{records}</p>
    {:else if records.length > 0}
        <table class="table-auto w-full font-mono text-left whitespace-nowrap">
            <thead>
                {#each Object.keys(records[0]) as attributeName}
                    <th>{attributeName}</th>
                {/each}
            </thead>
            <tbody>
                {#each records as record}
                    <tr class="even:bg-slate-300/25">
                        {#each Object.values(record) as attributeValue}
                            <td class="px-2">{attributeValue || "None"}</td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    {:else}
        <p class="text-center w-full">No result.</p>
    {/if}
</div>
