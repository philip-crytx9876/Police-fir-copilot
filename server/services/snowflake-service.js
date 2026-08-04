import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const warehouseData = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'data', 'snowflake-cases.json'), 'utf8')
);

export function getSnowflakeDemoData() {
  const cases = (warehouseData.cases || []).map((item) => ({
    ...item,
    caseLink: item.case_id,
    timeline: item.timeline || [],
  }));

  const totalAlerts = cases.reduce((sum, item) => sum + (item.metrics?.alerts || 0), 0);
  const openCases = cases.filter((item) => item.status === 'Open').length;
  const sumRisk = cases.reduce((sum, item) => {
    const riskMap = { Low: 1, Medium: 2, High: 3, Critical: 4 };
    return sum + (riskMap[item.risk] || 1);
  }, 0);

  return {
    ok: true,
    provider: 'Snowflake',
    warehouse: warehouseData.warehouse,
    environment: warehouseData.environment,
    region: warehouseData.region,
    summary: {
      totalCases: cases.length,
      openCases,
      totalAlerts,
      avgRisk: cases.length ? (sumRisk / cases.length).toFixed(1) : '0.0',
    },
    notes: [
      'Snowflake is the analytical warehouse layer for cross-case intelligence, allowing fast joins across FIR metadata, offender history, and event timelines.',
      'cocoCLI acts as the command-line companion for validating warehouse exports, checking metadata consistency, and moving a clean dataset into downstream reporting.',
      'This demo uses synthetic police intelligence data to show how a warehouse view can turn raw case records into decision-ready insights.',
    ],
    cases,
  };
}
