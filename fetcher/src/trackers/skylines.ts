// Skylines API.
//
// See https://github.com/skylines-project/skylines.

import { Tracker } from 'flyxc/common/protos/fetcher-state';
import {
  LIVE_MINIMAL_INTERVAL_SEC,
  removeBeforeFromLiveTrack,
  simplifyLiveTrack,
  TrackerIds,
} from 'flyxc/common/src/live-track';
import { TrackerEntity } from 'flyxc/common/src/live-track-entity';
import { TrackerModel, validateSkylinesAccount } from 'flyxc/common/src/models';
import { getTextRetry } from 'flyxc/common/src/superagent';
import { formatReqError } from 'flyxc/common/src/util';
import { Validator } from 'flyxc/common/src/vaadin/form/Validation';
import { decodeDeltas } from 'ol/format/Polyline';

import { LivePoint, makeLiveTrack } from './live-track';
import { TrackerFetcher, TrackerUpdates } from './tracker';

const SECONDS_IN_DAY = 60 * 60 * 24;

export class SkylinesFetcher extends TrackerFetcher {
  protected getTrackerId(): TrackerIds {
    return TrackerIds.Skylines;
  }

  protected async fetch(devices: number[], updates: TrackerUpdates, timeoutSec: number): Promise<void> {
    const deadlineMs = Date.now() + timeoutSec * 1000;

    while (devices.length > 0) {
      // Skylines id to Datastore id.
      const sklIdToDsId = new Map<number, number>();
      const sklIdToLastFixSec = new Map<number, number>();

      // Fetch up to 10 devices at once.
      for (const dsId of devices.splice(0, 10)) {
        const tracker = this.getTracker(dsId);
        if (tracker == null) {
          continue;
        }
        if (validateSkylinesAccount(tracker.account) === false) {
          updates.trackerErrors.set(dsId, `Invalid account ${tracker.account}`);
          continue;
        }
        const sklId = Number(tracker.account);
        sklIdToDsId.set(sklId, dsId);
        sklIdToLastFixSec.set(sklId, tracker.lastFixSec);
      }

      const url = `https://skylines.aero/api/live/${[...sklIdToDsId.keys()].join(',')}`;
      try {
        const response = await getTextRetry(url);
        if (response.ok) {
          try {
            JSON.parse(response.body).flights.forEach((flight: any) => {
              const sklId = Number(flight.sfid);
              const dsId = sklIdToDsId.get(sklId) as number;
              // Get an extra 10min of data that might not have been received (when no network coverage).
              const keepFromSec = this.getTrackerFetchFromSec(dsId, updates.startFetchSec, 600);
              const points = parse(flight);
              let track = makeLiveTrack(points);
              track = removeBeforeFromLiveTrack(track, keepFromSec);
              simplifyLiveTrack(track, LIVE_MINIMAL_INTERVAL_SEC);
              updates.trackerDeltas.set(dsId, track);
            });
            [...sklIdToDsId.values()].forEach((id) => updates.fetchedTracker.add(id));
          } catch (e) {
            updates.errors.push(`Error parsing the json for ${url}\n${e}`);
          }
        } else {
          updates.errors.push(`HTTP Status = ${response.status} for ${url}`);
        }
      } catch (e) {
        updates.errors.push(`Error ${formatReqError(e)} for url ${url}`);
      }

      if (Date.now() >= deadlineMs) {
        updates.errors.push(`Fetch timeout`);
        break;
      }
    }
  }

  protected getNextFetchAfterSec(tracker: Readonly<Tracker>): number {
    const lastFixAgeSec = Math.round(Date.now() / 1000) - tracker.lastFixSec;
    if (lastFixAgeSec > 24 * 3600) {
      return Math.floor(3 + Math.random() * 3) * 60;
    }
    return 60;
  }
}

// Parses a SkyLines flight.
export function parse(flight: any, nowMillis = Date.now()): LivePoint[] {
  const time = decodeDeltas(flight.barogram_t, 1, 1);
  const lonlat = decodeDeltas(flight.points, 2);
  const alt = decodeDeltas(flight.barogram_h, 1, 1);
  const gndAlt = decodeDeltas(flight.elevations_h, 1, 1);

  // startSeconds reference is a number of seconds since midnight UTC the day the track started.
  const startSeconds = time[0];
  // startDaySeconds is the number of seconds since previous midnight UTC.
  const startDaySeconds = time[0] % SECONDS_IN_DAY;
  // Current timestamp in seconds.
  const nowSeconds = Math.ceil(nowMillis / 1000);
  // Number of seconds since midnight UTC.
  const nowDaySeconds = nowSeconds % SECONDS_IN_DAY;
  const startedOnPreviousDay = startDaySeconds > nowDaySeconds;
  const startOfCurrentDayInSeconds = nowSeconds - nowDaySeconds;
  // Timestamp of the first fix.
  // Start of the current day - 24h if the track was started on the previous day + seconds in day of the first fix.
  const startTimestampSeconds =
    startOfCurrentDayInSeconds - (startedOnPreviousDay ? SECONDS_IN_DAY : 0) + startDaySeconds;

  return time.map((seconds: number, i: number): LivePoint => {
    const tsSeconds = startTimestampSeconds + seconds - startSeconds;
    return {
      device: TrackerIds.Skylines,
      lat: lonlat[i * 2],
      lon: lonlat[i * 2 + 1],
      alt: alt[i] - (flight.geoid ?? 0),
      gndAlt: gndAlt[i],
      timestamp: tsSeconds * 1000,
    };
  });
}

// Makes sure the account exists.
export class SkylinesValidator implements Validator<TrackerModel> {
  public message = '';
  private currentEnabled = false;
  private currentAccount = '';

  constructor(skylines: TrackerEntity | undefined) {
    if (skylines != null) {
      this.currentAccount = skylines.account;
      this.currentEnabled = skylines.enabled;
    }
  }

  async validate(tracker: TrackerModel) {
    if (tracker.enabled === this.currentEnabled && tracker.account === this.currentAccount) {
      // No need to resolve again when not changing.
      return true;
    }

    if (tracker.enabled) {
      const id = validateSkylinesAccount(tracker.account);
      if (id !== false) {
        const url = `https://skylines.aero/api/users/${id}`;
        try {
          await getTextRetry(url, { timeoutSec: 10 });
        } catch (e: any) {
          if (e?.status === 404) {
            this.message = `This skylines account does not exist.`;
            return { property: 'account' };
          }
        }
      }
    }

    return true;
  }
}
