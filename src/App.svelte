<script>
    import Card from "./components/Card/Card.svelte";
    import CardHeader from "./components/Card/CardHeader.svelte";
    import CardBody from "./components/Card/CardBody.svelte";
    import QueryInput from "./components/QueryInput.svelte";
</script>

<div id="pageTitle" class="mx-auto m-8">
    <h1
        class="text-sky-500 text-center md:text-6xl sm:text-5xl text-4xl font-light"
    >
        Totally Real Energy Supplier
    </h1>
</div>
<div id="columnGuide" class=" w-full mx-auto lg:w-4/5">
    <Card class="xl:inline gap-3">
        <CardHeader>Query</CardHeader>
        <CardBody>
            <QueryInput />
        </CardBody>
    </Card>
    <Card class="xl:inline gap-3">
        <CardBody>
            <CardHeader>Results</CardHeader>
        </CardBody>
    </Card>
</div>

<!-- copyright -->
<div id="copy" class="mx-auto fixed fixed bottom-4 left-0 right-0">
    <p class="text-center w-full text-sm text-slate-500/90">
        &copy; Isaac Kilbourne, Cole Fuerth, Mathew Pellarin 2022
    </p>
</div>

<style global lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
</style>
