<script>
    import Card from "./components/Card/Card.svelte";
    import CardHeader from "./components/Card/CardHeader.svelte";
    import CardBody from "./components/Card/CardBody.svelte";
    import QueryInput from "./components/QueryInput.svelte";
    import QueryResults from "./components/QueryResults.svelte";
    import Copyright from "./components/Copyright.svelte";
    import LoadingSpinner from "./components/LoadingSpinner.svelte";
    import PrimaryText from "./components/PrimaryText.svelte";
    import SchemaTable from "./components/Schema/SchemaTable.svelte";
    import PrimaryKeyAttribute from "./components/Schema/PrimaryKeyAttribute.svelte";
    import Attribute from "./components/Schema/Attribute.svelte";

    import { makeMySQLQuery } from "./scripts/queries.js";

    let queryResults = [];
    let queryError = "";
    let queryHasBeenMade = false;
    let isLoading = false;

    const doQuery = async (query) => {
        queryHasBeenMade = isLoading = true;
        queryResults = [];
        queryError = "";

        try {
            queryResults = await makeMySQLQuery(query);
        } catch (err) {
            queryError = "Unable to make query. This isn't an issue with your query.";
        }

        isLoading = false;
    };
</script>

<div id="pageTitle" class="mx-auto m-8">
    <h1 class="text-sky-500 text-center text-5xl font-light">Totally Real Energy Supplier</h1>
</div>

<div id="columnGuide" class="flex flex-col gap-4 px-4 md:w-5/6 mx-auto">
    <Card>
        <CardHeader>MySQL Query</CardHeader>
        <CardBody>
            <PrimaryText>
                This frontend is not secured in the slightest, please be responsible.
            </PrimaryText>
            <QueryInput onSubmit={doQuery} />
        </CardBody>
    </Card>
    <Card>
        <CardHeader>Results</CardHeader>
        <CardBody>
            {#if !queryHasBeenMade}
                <PrimaryText>
                    Enter a MySQL query or select a preset and press
                    <b>Submit</b>. The result will appear here.
                </PrimaryText>
            {:else if isLoading}
                <LoadingSpinner />
            {:else}
                <QueryResults {queryResults} {queryError} />
            {/if}
        </CardBody>
    </Card>
    <Card>
        <CardHeader>Schema</CardHeader>
        <PrimaryText>
            These are the tables and attributes of the database. A blue underline indicates the
            attribute is part of the primary key.
        </PrimaryText>
        <div class="overflow-auto">
            <SchemaTable tableName="PrimaryContact">
                <PrimaryKeyAttribute attributeName="customerID" />
                <Attribute attributeName="email" />
                <Attribute attributeName="phoneNumber" />
                <Attribute attributeName="name" />
            </SchemaTable>
            <SchemaTable tableName="Region">
                <PrimaryKeyAttribute attributeName="regionID" />
                <Attribute attributeName="name" />
                <Attribute attributeName="unitCost" />
            </SchemaTable>
            <SchemaTable tableName="PowerFacility">
                <PrimaryKeyAttribute attributeName="facilityID" />
                <Attribute attributeName="name" />
                <Attribute attributeName="address" />
                <Attribute attributeName="volumeGenerated" />
                <Attribute attributeName="energyForm" />
            </SchemaTable>
            <SchemaTable tableName="SuppliesRegion">
                <PrimaryKeyAttribute attributeName="facilityID" />
                <PrimaryKeyAttribute attributeName="regionID" />
            </SchemaTable>
            <SchemaTable tableName="ServicedLocation">
                <PrimaryKeyAttribute attributeName="locationID" />
                <Attribute attributeName="energyUsed" />
                <Attribute attributeName="address" />
                <Attribute attributeName="primaryContact" />
                <Attribute attributeName="regionID" />
            </SchemaTable>
            <SchemaTable tableName="Invoice">
                <PrimaryKeyAttribute attributeName="invoiceID" />
                <Attribute attributeName="dateIssued" />
                <Attribute attributeName="amountOwed" />
                <Attribute attributeName="amountPaid" />
                <Attribute attributeName="billedTo" />
            </SchemaTable>
            <SchemaTable tableName="FacilityTransaction">
                <PrimaryKeyAttribute attributeName="expenseID" />
                <Attribute attributeName="cost" />
                <Attribute attributeName="isImport" />
                <Attribute attributeName="reason" />
                <Attribute attributeName="dateCreated" />
                <Attribute attributeName="facilityID" />
            </SchemaTable>
        </div>
    </Card>
</div>

<Copyright owner="Isaac Kilbourne, Cole Fuerth, Mathew Pellarin" />

<style global lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
</style>
