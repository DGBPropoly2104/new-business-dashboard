// Pulls live counts for 8 Salesforce reports on every request.
// No caching, no database — this is intentional (see chat context: no history needed).

const REPORTS = [
  { id: "00OTv00000AYz6XMAT", label: "Goodlord Clients" },
  { id: "00OTv00000AEvblMAD", label: "Goodlord contracts due 90 days" },
  { id: "00OTv00000AiHNZMA3", label: "Goodlord contracts due 3-6 months" },
  { id: "00OTv00000AiHdhMAF", label: "Goodlord contracts due 6 months+" },
  { id: "00OTv00000AdsdtMAB", label: "Rightmove Clients" },
  { id: "00OTv000007DjUjMAK", label: "Street CRM Clients" },
  { id: "00OTv00000Ah2QmMAJ", label: "Propoly Tier C Prospects" },
  { id: "00OTv00000Ah5bNMAR", label: "Propoly Tier B Prospects" },
  { id: "00OTv00000AkiI5MAJ", label: "Build To Rent Agents" },
  { id: "00OTv00000AkoNRMAZ", label: "Reapit CRM Clients" },
];

const API_VERSION = "v60.0";

async function getAccessToken() {
  const loginUrl = process.env.SF_LOGIN_URL || "https://login.salesforce.com";
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.SF_CLIENT_ID,
    client_secret: process.env.SF_CLIENT_SECRET,
  });

  const res = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Salesforce auth failed (${res.status}): ${text}`);
  }

  return res.json(); // { access_token, instance_url, ... }
}

async function runReport(instanceUrl, accessToken, report) {
  const url = `${instanceUrl}/services/data/${API_VERSION}/analytics/reports/${report.id}?includeDetails=false`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    return { id: report.id, label: report.label, error: `${res.status}: ${text}` };
  }

  const data = await res.json();
  const reportName = report.label;

  // Total row count lives in the grand total aggregate for summary/matrix/tabular reports.
  let count = null;
  try {
    count = data.factMap["T!T"].aggregates[0].value;
  } catch {
    // Fallback: some tabular reports without a grand total row expose row count differently.
    count = Array.isArray(data?.factMap?.["T!T"]?.rows) ? data.factMap["T!T"].rows.length : null;
  }

  return { id: report.id, label: reportName, count };
}

export default async function handler(request) {
  try {
    const { access_token, instance_url } = await getAccessToken();

    const results = await Promise.all(
      REPORTS.map((report) => runReport(instance_url, access_token, report))
    );

    return new Response(JSON.stringify({ generatedAt: new Date().toISOString(), results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const config = { path: "/api/get-reports" };
