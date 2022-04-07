<script>
    import Card from "./components/Card/Card.svelte";
    import CardHeader from "./components/Card/CardHeader.svelte";
    import CardBody from "./components/Card/CardBody.svelte";
    import QueryInput from "./components/QueryInput.svelte";
    import Copyright from "./components/Copyright.svelte"
</script>

<div id="pageTitle" class="mx-auto m-8">
    <h1
        class="text-sky-500 text-center md:text-6xl sm:text-5xl text-4xl font-light"
    >
        Totally Real Energy Supplier
    </h1>
</div>
<div id="columnGuide" class="flex gap-2 lg:mx-auto mx-4 lg:w-5/6 lg:flex-row flex-col ">
    <Card>
        <CardHeader>MySQL Query</CardHeader>
        <CardBody>
            <QueryInput />
        </CardBody>
    </Card>
    <Card>
        <CardBody>
            <CardHeader>Results</CardHeader>
        </CardBody>
    </Card>
</div>

<Copyright owner="Isaac Kilbourne, Cole Fuerth, Mathew Pellarin" />

<style global lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
</style>
