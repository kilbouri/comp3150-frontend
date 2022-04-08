<script>
    export let tableName = "Table Name";
</script>

<table class="my-3">
    <tr>
        <th
            class="p-1 text-right bg-slate-300/25 dark:bg-slate-200/10 dark:text-slate-200/90 border-2 border-gray-500/40 dark:border-gray-100/30"
        >
            {tableName}
        </th>
        <slot />
    </tr>
</table>
