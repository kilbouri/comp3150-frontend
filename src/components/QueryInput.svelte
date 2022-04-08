<script>
    import Button from "./Button.svelte";
    export let onSubmit = console.log;
    export let placeholder =
        'SELECT * FROM information_schema.tables WHERE table_schema = "powerCompany";';
    export let query = "";

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
        bind:value={query}
        {placeholder}
    />

    <div class="w-full flex flex-wrap gap-2">
        <Button
            fillSpace={true}
            tooltip="Select the names, emails, and phone numbers of all customers with overdue payments."
        >
            Overdue Accounts
        </Button>
        <Button fillSpace={true} tooltip="Select the balance of each customer account.">
            Account Balances
        </Button>
        <Button
            fillSpace={true}
            tooltip="Select the phone number of all customers with more than one serviced location."
        >
            Owners of Multiple Locations
        </Button>
        <Button fillSpace={true} tooltip="Select the net finances for the last quarter.">
            Last Quarter's Finances
        </Button>
        <Button fillSpace={true} tooltip="Select the net income (or loss) of each facility.">
            Net Income or Loss of Facilities
        </Button>
        <Button
            fillSpace={true}
            tooltip="Selects all power facilities. Mainly meant for debugging."
            onclick={() => {
                query = "SELECT * FROM PowerFacility;";
            }}
        >
            All Power Facilities
        </Button>
    </div>
    <div id="submitContainer" class="flex flex-wrap items-center w-full my-2 gap-2">
        <Button disabled={!query} type="submit" tooltip="Evaluate the given query.">Submit</Button>

        {#if !query}
            <p class="inline text-red-400">You must provide a query.</p>
        {/if}
    </div>
</form>
