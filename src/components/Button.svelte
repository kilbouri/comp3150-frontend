<script>
    export let onclick;
</script>

<!-- class="bg-slate-900 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 text-white font-semibold h-12 px-6 rounded-lg w-full flex items-center justify-center sm:w-auto dark:bg-sky-500 dark:highlight-white/20 dark:hover:bg-sky-400" -->
<button
    class="active:bg-sky-700 hover:bg-sky-600 bg-sky-500 rounded font-bold py-3 px-5 text-white"
    on:click={onclick}
>
    <slot />
</button>
