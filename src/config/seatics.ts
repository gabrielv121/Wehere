/**
 * Seatics Maps API config (see Seatics Maps API Integration Guide).
 * When set, event pages can show the Seatics interactive seat map with our listings.
 */

const websiteConfigId = import.meta.env.VITE_SEATICS_WEBSITE_CONFIG_ID as string | undefined;
const consumerKey = import.meta.env.VITE_SEATICS_CONSUMER_KEY as string | undefined;
const sandbox = import.meta.env.VITE_SEATICS_SANDBOX !== 'false' && import.meta.env.VITE_SEATICS_SANDBOX !== '0';

export const isSeaticsEnabled =
  typeof websiteConfigId === 'string' &&
  websiteConfigId.length > 0 &&
  typeof consumerKey === 'string' &&
  consumerKey.length > 0;

export const seaticsConfig = {
  websiteConfigId: websiteConfigId ?? '',
  consumerKey: consumerKey ?? '',
  sandbox,
  /** TN APIs base URL */
  apiBaseUrl: sandbox ? 'https://sandbox.tn-apis.com' : 'https://www.tn-apis.com',
  /** Mapwidget framework script (required for Custom UI) */
  frameworkScriptUrl: sandbox
    ? 'https://mapwidget3-sandbox.seatics.com/Api/framework'
    : 'https://mapwidget3.seatics.com/Api/framework',
};

/** Format event date to Seatics dateTime: yyyyMMddHHmm (local time) */
export function formatSeaticsDateTime(isoDate: string): string {
  const d = new Date(isoDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}${m}${day}${h}${min}`;
}
