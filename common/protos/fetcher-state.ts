// @generated by protobuf-ts 2.1.0 with parameter long_type_number,force_optimize_code_size
// @generated from protobuf file "fetcher-state.proto" (syntax proto3)
// tslint:disable
//
// Fetcher state.
//
// All int64 are JS_NUMBER.
//
import { MessageType } from '@protobuf-ts/runtime';

import { LiveTrack } from './live-track';

/**
 * State of the fetcher
 *
 * @generated from protobuf message FetcherState
 */
export interface FetcherState {
  /**
   * @generated from protobuf field: int64 version = 1;
   */
  version: number;
  /**
   * @generated from protobuf field: int64 started_sec = 2;
   */
  startedSec: number;
  /**
   * @generated from protobuf field: int64 re_started_sec = 3;
   */
  reStartedSec: number;
  /**
   * @generated from protobuf field: int64 stopped_sec = 4;
   */
  stoppedSec: number;
  /**
   * @generated from protobuf field: int64 last_tick_sec = 5;
   */
  lastTickSec: number;
  /**
   * Number of ticks since last start.
   *
   * @generated from protobuf field: int64 num_ticks = 6;
   */
  numTicks: number;
  /**
   * @generated from protobuf field: int64 num_starts = 7;
   */
  numStarts: number;
  /**
   * Max updated value of all the pilots.
   *
   * @generated from protobuf field: int64 last_updated_ms = 8;
   */
  lastUpdatedMs: number;
  /**
   * Sync to files and from datastore.
   *
   * @generated from protobuf field: int64 next_partial_sync_sec = 9;
   */
  nextPartialSyncSec: number;
  /**
   * @generated from protobuf field: int64 next_full_sync_sec = 10;
   */
  nextFullSyncSec: number;
  /**
   * @generated from protobuf field: int64 next_export_sec = 11;
   */
  nextExportSec: number;
  /**
   * @generated from protobuf field: int64 mem_rss_mb = 12;
   */
  memRssMb: number;
  /**
   * @generated from protobuf field: int64 mem_heap_mb = 13;
   */
  memHeapMb: number;
  /**
   * Tick ongoing ?
   *
   * @generated from protobuf field: bool in_tick = 14;
   */
  inTick: boolean;
  /**
   * @generated from protobuf field: map<int64, Pilot> pilots = 15;
   */
  pilots: {
    [key: string]: Pilot;
  };
}
/**
 * @generated from protobuf message Pilot
 */
export interface Pilot {
  /**
   * @generated from protobuf field: string name = 1;
   */
  name: string;
  /**
   * @generated from protobuf field: LiveTrack track = 2;
   */
  track?: LiveTrack;
  /**
   * Whether to share positions with partners.
   *
   * @generated from protobuf field: bool share = 3;
   */
  share: boolean;
  /**
   * Whether to display the user on flyxc.
   *
   * @generated from protobuf field: bool enabled = 4;
   */
  enabled: boolean;
  /**
   * Trackers.
   * The name must be in sync with TrackerProps.
   *
   * @generated from protobuf field: Tracker inreach = 5;
   */
  inreach?: Tracker;
  /**
   * @generated from protobuf field: Tracker spot = 6;
   */
  spot?: Tracker;
  /**
   * @generated from protobuf field: Tracker skylines = 7;
   */
  skylines?: Tracker;
  /**
   * @generated from protobuf field: Tracker flyme = 8;
   */
  flyme?: Tracker;
  /**
   * @generated from protobuf field: Tracker flymaster = 9;
   */
  flymaster?: Tracker;
}
/**
 * @generated from protobuf message Tracker
 */
export interface Tracker {
  /**
   * @generated from protobuf field: bool enabled = 1;
   */
  enabled: boolean;
  /**
   * @generated from protobuf field: string account = 2;
   */
  account: string;
  /**
   * Last time the tracker was fetched (whether ok or not).
   *
   * @generated from protobuf field: int64 last_fetch_sec = 3;
   */
  lastFetchSec: number;
  /**
   * Last fix for this tracker.
   *
   * @generated from protobuf field: int64 last_fix_sec = 4;
   */
  lastFixSec: number;
  /**
   * Next time the tracker should be fetcher.
   *
   * @generated from protobuf field: int64 next_fetch_sec = 5;
   */
  nextFetchSec: number;
  /**
   * Requests and errors.
   *
   * @generated from protobuf field: int64 num_errors = 6;
   */
  numErrors: number;
  /**
   * @generated from protobuf field: int64 num_requests = 7;
   */
  numRequests: number;
  /**
   * @generated from protobuf field: int64 num_consecutive_errors = 8;
   */
  numConsecutiveErrors: number;
}
// @generated message type with reflection information, may provide speed optimized methods
class FetcherState$Type extends MessageType<FetcherState> {
  constructor() {
    super('FetcherState', [
      { no: 1, name: 'version', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 2, name: 'started_sec', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 3, name: 're_started_sec', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 4, name: 'stopped_sec', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 5, name: 'last_tick_sec', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 6, name: 'num_ticks', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 7, name: 'num_starts', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 8, name: 'last_updated_ms', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 9, name: 'next_partial_sync_sec', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 10, name: 'next_full_sync_sec', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 11, name: 'next_export_sec', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 12, name: 'mem_rss_mb', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 13, name: 'mem_heap_mb', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 14, name: 'in_tick', kind: 'scalar', T: 8 /*ScalarType.BOOL*/ },
      { no: 15, name: 'pilots', kind: 'map', K: 3 /*ScalarType.INT64*/, V: { kind: 'message', T: () => Pilot } },
    ]);
  }
}
/**
 * @generated MessageType for protobuf message FetcherState
 */
export const FetcherState = new FetcherState$Type();
// @generated message type with reflection information, may provide speed optimized methods
class Pilot$Type extends MessageType<Pilot> {
  constructor() {
    super('Pilot', [
      { no: 1, name: 'name', kind: 'scalar', T: 9 /*ScalarType.STRING*/ },
      { no: 2, name: 'track', kind: 'message', T: () => LiveTrack },
      { no: 3, name: 'share', kind: 'scalar', T: 8 /*ScalarType.BOOL*/ },
      { no: 4, name: 'enabled', kind: 'scalar', T: 8 /*ScalarType.BOOL*/ },
      { no: 5, name: 'inreach', kind: 'message', T: () => Tracker },
      { no: 6, name: 'spot', kind: 'message', T: () => Tracker },
      { no: 7, name: 'skylines', kind: 'message', T: () => Tracker },
      { no: 8, name: 'flyme', kind: 'message', T: () => Tracker },
      { no: 9, name: 'flymaster', kind: 'message', T: () => Tracker },
    ]);
  }
}
/**
 * @generated MessageType for protobuf message Pilot
 */
export const Pilot = new Pilot$Type();
// @generated message type with reflection information, may provide speed optimized methods
class Tracker$Type extends MessageType<Tracker> {
  constructor() {
    super('Tracker', [
      { no: 1, name: 'enabled', kind: 'scalar', T: 8 /*ScalarType.BOOL*/ },
      { no: 2, name: 'account', kind: 'scalar', T: 9 /*ScalarType.STRING*/ },
      { no: 3, name: 'last_fetch_sec', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 4, name: 'last_fix_sec', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 5, name: 'next_fetch_sec', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 6, name: 'num_errors', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 7, name: 'num_requests', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
      { no: 8, name: 'num_consecutive_errors', kind: 'scalar', T: 3 /*ScalarType.INT64*/, L: 2 /*LongType.NUMBER*/ },
    ]);
  }
}
/**
 * @generated MessageType for protobuf message Tracker
 */
export const Tracker = new Tracker$Type();
