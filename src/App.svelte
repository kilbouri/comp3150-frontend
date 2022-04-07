<script>
    import Card from "./components/Card/Card.svelte";
    import CardHeader from "./components/Card/CardHeader.svelte";
    import CardBody from "./components/Card/CardBody.svelte";
    import QueryInput from "./components/QueryInput.svelte";
    import QueryResults from "./components/QueryResults.svelte";
    import Copyright from "./components/Copyright.svelte"
    import LoadingSpinner from "./components/LoadingSpinner.svelte"

    import { makeMySQLQuery } from "./scripts/queries.js";

    let queryResults = [];
    let queryHasBeenMade = false;
    let isLoading = false;

    // test query: SELECT * FROM employees;
    const doQuery = async (query) => {
        queryHasBeenMade = isLoading = true;
        queryResults = await makeMySQLQuery(query);
        isLoading = false;
    }
</script>

<div id="pageTitle" class="mx-auto m-8">
    <h1
        class="text-sky-500 text-center text-5xl font-light"
    >
        Totally Real Energy Supplier
    </h1>
</div>
<!-- flex flex-shriugap-2 lg:mx-auto mx-4 lg:w-5/6 lg:flex-row flex-col  -->
<div id="columnGuide" class="flex flex-col gap-4 px-4 md:w-5/6 mx-auto">
    <Card>
        <CardHeader>MySQL Query</CardHeader>
        <CardBody>
            <QueryInput onSubmit={doQuery} />
        </CardBody>
    </Card>
    <Card>
        <CardHeader>Results</CardHeader>
        <CardBody>
            {#if !queryHasBeenMade}
                <p class="text-gray-500/80">Enter a MySQL query and press <b>Submit</b>. The result will appear here.</p>
            {:else if isLoading}
                <LoadingSpinner />
            {:else}
                <QueryResults records={queryResults}></QueryResults>
            {/if}
        </CardBody>
    </Card>
</div>

<Copyright owner="Isaac Kilbourne, Cole Fuerth, Mathew Pellarin" />

<style global lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
</style>
