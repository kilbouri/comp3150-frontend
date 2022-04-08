<script>
    export let type = "button";
    export let disabled = false;
    export let onclick = () => {};
    export let tooltip = "";
    export let fillSpace = false;
</script>

<button
    class={"disabled:bg-red-400 active:bg-sky-700 hover:bg-sky-600 bg-sky-500 rounded font-bold py-2 px-5 text-white" +
        (fillSpace ? " flex-grow" : "")}
    {type}
    {disabled}
    on:click={onclick}
    title={tooltip}
>
    <slot />
</button>
