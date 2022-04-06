<script>
    export let records;
</script>

<!-- This component is responsible for showing a table of query results -->
<div class="block space-y-4 w-full">
    {#if records.length > 0}
        <table class="table-fixed w-full">
            <thead>
                {#each Object.keys(records[0]) as attributeName}
                    <th>{attributeName}</th>
                {/each}
            </thead>
            {#each records as record}
                <tr>
                    {#each Object.values(record) as attributeValue}
                        <td>{attributeValue || "None"}</td>
                    {/each}
                </tr>
            {/each}
        </table>
    {:else}
        <p class="text-center w-full">No result.</p>
    {/if}
</div>
