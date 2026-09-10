import { get, set, update } from 'idb-keyval';

export const OFFLINE_KEY = 'ddma_offline_reports';

export async function saveReportOffline(report: any) {
  await update(OFFLINE_KEY, (val) => {
    const reports = val || [];
    return [...reports, report];
  });
}

export async function getOfflineReports() {
  return (await get(OFFLINE_KEY)) || [];
}

export async function clearOfflineReport(id: string) {
  await update(OFFLINE_KEY, (val) => {
    return (val || []).filter((r: any) => r.id !== id);
  });
}
