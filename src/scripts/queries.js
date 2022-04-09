const requestBaseUrl = "http://colef.club:6969/";
const method = "get";
const mode = "cors";
const headers = {};

const makeMySQLQuery = async (query) => {
    const urlEncodedQuery = encodeURI(query);
    const requestUrl = `${requestBaseUrl}?sql=${urlEncodedQuery}`;

    const res = await fetch(requestUrl, { method, mode, headers }) //
        .then((res) => res.json());

    console.log(res);
    console.dir({ data: res, sqlErr: res.sqlMessage });
    return { data: res, sqlErr: res.sqlMessage };
};

const queries = [
    {
        name: "Overpaid Invoices",
        tooltip:
            "Select the names, emails, and phone numbers of all customers who have overpaid invoices, as well as the invoice number and amount overpaid of those overdue invoices.",
        query: [
            "SELECT",
            "    name AS 'Customer Name',",
            "    email AS 'Customer Email',",
            "    phoneNumber AS 'Customer Phone Number',",
            "    invoiceID AS 'Invoice Number',",
            "    amountPaid-amountOwed AS 'Amount Overpaid'",
            "FROM Invoice",
            "JOIN PrimaryContact ON Invoice.billedTo = PrimaryContact.customerID",
            "WHERE",
            "    amountOwed < amountPaid AND",
            "    amountOwed > 0",
            "GROUP BY invoiceID;",
        ],
    },
    {
        name: "Overdue Invoices",
        tooltip:
            "Select the names, emails, and phone numbers of all customers with overdue payments, as well as the invoice number and amount owing of those overdue invoices.",
        query: [
            "SELECT",
            "    name AS 'Customer Name',",
            "    email AS 'Customer Email',",
            "    phoneNumber AS 'Customer Phone Number',",
            "    invoiceID AS 'Invoice Number',",
            "    amountOwed-amountPaid AS 'Amount Owing'",
            "FROM Invoice",
            "JOIN PrimaryContact ON Invoice.billedTo = PrimaryContact.customerID",
            "WHERE",
            "    amountOwed > amountPaid AND",
            "    dateIssued < CURRENT_DATE AND",
            "    amountOwed > 0",
            "GROUP BY invoiceID;",
        ],
    },
    {
        name: "Account Balances",
        tooltip: "Select the balance of each customer account.",
        query: [
            "SELECT ",
            "    PrimaryContact.customerID AS 'Customer ID',",
            "    PrimaryContact.name AS 'Customer Name',",
            "    SUM(Invoice.amountOwed) AS 'Amount Owed', ",
            "    SUM(Invoice.amountPaid) AS 'Amount Paid',",
            "    SUM(Invoice.amountOwed) - SUM(Invoice.amountPaid) AS 'Balance'",
            "FROM Invoice",
            "JOIN PrimaryContact ON Invoice.billedTo = PrimaryContact.customerID",
            "GROUP BY PrimaryContact.customerID",
            "ORDER BY PrimaryContact.customerID;",
        ],
    },
    {
        name: "Owners of Multiple Locations",
        tooltip:
            "Select the name and region name of all customers with more than one serviced location.",
        query: [
            "SELECT",
            "    PrimaryContact.name AS 'Customer Name',",
            "    Region.name AS 'Region Name',",
            "    COUNT(*) AS 'Locations Owned'",
            "FROM ServicedLocation",
            "JOIN PrimaryContact ON ServicedLocation.primaryContact = PrimaryContact.customerID",
            "JOIN Region ON ServicedLocation.regionID = Region.regionID",
            "GROUP BY",
            "    Region.regionID,",
            "    PrimaryContact.customerID",
            "HAVING COUNT(*) > 1",
            "ORDER BY -COUNT(*);",
        ],
    },
    {
        name: "Last Quarter Finances",
        tooltip: "Select the net finances by region for the last quarter.",
        query: [
            "SELECT",
            "    Region.regionID AS 'Region ID',",
            "    Region.name AS 'Name',",
            "    SUM(FacilityTransaction.cost) AS 'Export Profit'",
            "FROM",
            "    FacilityTransaction,",
            "    Region,",
            "    ServicedLocation,",
            "    SuppliesRegion",
            "WHERE",
            "    FacilityTransaction.facilityID = SuppliesRegion.facilityID AND",
            "    SuppliesRegion.regionID = Region.regionID AND",
            "    FacilityTransaction.isImport = false AND",
            "    FacilityTransaction.dateCreated >= '2021-09-01' AND",
            "    FacilityTransaction.dateCreated < '2021-12-31'",
            "GROUP BY Region.regionID",
            "ORDER BY Region.regionID;",
        ],
    },
    {
        name: "Net Income of Facilities",
        tooltip: "Select the net income (or loss) of each facility.",
        query: [
            "SELECT",
            "    PowerFacility.facilityID AS 'Facility ID',",
            "    PowerFacility.name AS 'Facility Name',",
            "    SUM(IF(FacilityTransaction.isImport = 0, FacilityTransaction.cost, 0)) AS 'Export Cost',",
            "    SUM(IF(FacilityTransaction.isImport = 1, FacilityTransaction.cost, 0)) AS 'Import Cost',",
            "    (SUM(IF(FacilityTransaction.isImport = 0, FacilityTransaction.cost, 0))-SUM(IF(FacilityTransaction.isImport = 1, FacilityTransaction.cost, 0))) AS 'Profit'",
            "FROM PowerFacility",
            "JOIN FacilityTransaction ON PowerFacility.facilityID = FacilityTransaction.facilityID",
            "WHERE",
            "    FacilityTransaction.dateCreated >= '2021-09-01' AND",
            "    FacilityTransaction.dateCreated < '2021-12-31'",
            "GROUP BY PowerFacility.facilityID",
            "ORDER BY PowerFacility.facilityID;",
        ],
    },
    {
        name: "All Power Facilities",
        tooltip: "Selects all power facilities.",
        query: [
            "SELECT",
            "    facilityID AS 'Facility ID',",
            "    name AS 'Facility Name',",
            "    address AS 'Facility Location',",
            "    volumeGenerated AS 'Nameplate Capacity',",
            "    energyForm AS 'Energy Form'",
            "FROM PowerFacility ",
            "ORDER BY PowerFacility.facilityID;",
        ],
    },
];

module.exports = {
    makeMySQLQuery,
    queries,
};
