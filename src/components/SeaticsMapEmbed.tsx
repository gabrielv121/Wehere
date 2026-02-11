/**
 * Seatics Maps API embed (Custom UI). Loads the Seatics framework, fetches event/venue
 * map data via EventAndVenueInfo, then creates the map and adds our ticket data.
 * See Seatics Maps API Integration Guide (TicketNetwork).
 */

import { useEffect, useRef, useState } from 'react';
import { isSeaticsEnabled, seaticsConfig, formatSeaticsDateTime } from '../config/seatics';
import type { TicketListing } from '../types';

declare global {
  interface Window {
    jQuery?: unknown;
    Seatics?: {
      MapComponent?: {
        create: (config: unknown) => void;
        addTicketData: (tickets: unknown[], disclaimers?: unknown, disclaimerMap?: unknown) => void;
      };
    };
    __seaticsEventAndVenueCallback?: (data: unknown) => void;
  }
}

/** Convert our listings to Seatics ticket group format (tgUserSec, tgUserRow, tgQty, tgPrice, etc.) */
function toSeaticsTicketGroups(listings: TicketListing[]): unknown[] {
  return listings.map((t, i) => ({
    tgUserSec: t.section?.startsWith('Section') ? t.section : `Section ${t.section ?? ''}`.trim(),
    tgUserRow: t.row ?? '',
    tgUserSeats: '',
    tgQty: t.quantity,
    tgPrice: t.pricePerTicket,
    tgID: i + 1,
    tgNotes: t.ada ? 'Wheelchair accessible' : undefined,
    tgMark: 0,
    tgType: 1, // event ticket
    tgClientData: t.listingId ?? t.id,
  }));
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function ensureJQuery(): Promise<void> {
  if (typeof window.jQuery === 'function') return Promise.resolve();
  return loadScript('https://code.jquery.com/jquery-3.6.0.min.js');
}

interface SeaticsMapEmbedProps {
  eventName: string;
  venueName: string;
  eventDateIso: string;
  listings: TicketListing[];
  className?: string;
  /** Min height for the map container (px) */
  minHeight?: number;
}

export function SeaticsMapEmbed({
  eventName,
  venueName,
  eventDateIso,
  listings,
  className = '',
  minHeight = 500,
}: SeaticsMapEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listingsRef = useRef(listings);
  listingsRef.current = listings;
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'no-map' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const mapCreatedRef = useRef(false);

  useEffect(() => {
    if (!isSeaticsEnabled || !containerRef.current) return;

    const config = seaticsConfig;
    const dateTime = formatSeaticsDateTime(eventDateIso);

    let cancelled = false;

    async function init() {
      setStatus('loading');
      setMessage('Loading seat map…');

      try {
        await ensureJQuery();
        if (cancelled) return;
        await loadScript(config.frameworkScriptUrl);
        if (cancelled) return;
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setMessage(e instanceof Error ? e.message : 'Failed to load map scripts');
        }
        return;
      }

      if (!window.Seatics?.MapComponent) {
        if (!cancelled) {
          setStatus('error');
          setMessage('Seatics map component not available');
        }
        return;
      }

      const callbackName = `__seaticsEventAndVenueCallback_${Date.now()}`;
      const url = new URL(`${config.apiBaseUrl}/maps/v3/EventAndVenueInfo`);
      url.searchParams.set('callback', callbackName);
      url.searchParams.set('websiteConfigId', config.websiteConfigId);
      url.searchParams.set('consumerKey', config.consumerKey);
      url.searchParams.set('eventName', eventName);
      url.searchParams.set('venue', venueName);
      url.searchParams.set('dateTime', dateTime);

      (window as unknown as Record<string, (data: unknown) => void>)[callbackName] = (data: unknown) => {
        if (cancelled || mapCreatedRef.current) return;
        try {
          const arr = Array.isArray(data) ? data : [];
          const eventInfo = arr[0];
          const mapData = arr[1];
          if (!eventInfo || !mapData) {
            setStatus('no-map');
            setMessage('No interactive map for this event. Seatics may not have a map for this venue/date.');
            return;
          }
          const container = containerRef.current;
          if (!container || !window.Seatics?.MapComponent) return;

          const ev = eventInfo as Record<string, unknown>;
          const mapImage = (ev.mapImage as string) ?? '';
          const mapName = (ev.mapName as string) ?? '';

          window.Seatics.MapComponent.create({
            imgSrc: mapImage,
            tickets: [],
            mapData,
            vfsUrl: 'https://vfs.seatics.com',
            container,
            presentationInterface: {
              updateTicketsList: () => {},
            },
            mapWidth: container.clientWidth || 600,
            mapHeight: Math.max(minHeight, container.clientHeight || 500),
            mapName,
            eventInfo,
          });

          const ticketGroups = toSeaticsTicketGroups(listingsRef.current);
          window.Seatics.MapComponent.addTicketData(ticketGroups);
          mapCreatedRef.current = true;
          setStatus('ready');
          setMessage('');
        } finally {
          delete (window as unknown as Record<string, unknown>)[callbackName];
        }
      };

      const script = document.createElement('script');
      script.src = url.toString();
      script.async = true;
      script.onerror = () => {
        if (!cancelled) {
          setStatus('error');
          setMessage('Could not load event map data');
        }
        delete (window as unknown as Record<string, unknown>)[callbackName];
      };
      document.head.appendChild(script);
    }

    init();
    return () => {
      cancelled = true;
      mapCreatedRef.current = false;
    };
  }, [eventName, venueName, eventDateIso, minHeight]);

  if (!isSeaticsEnabled) return null;

  return (
    <div className={`seatics-map-embed ${className}`}>
      <div
        ref={containerRef}
        style={{ minHeight: status === 'loading' || status === 'no-map' || status === 'error' ? minHeight : undefined }}
        className="w-full bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center"
      >
        {status === 'loading' && (
          <p className="text-slate-500 p-8">Loading seat map…</p>
        )}
        {status === 'no-map' && (
          <p className="text-slate-600 p-8 text-center max-w-md">
            {message}
          </p>
        )}
        {status === 'error' && (
          <p className="text-amber-700 p-8 text-center max-w-md">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
