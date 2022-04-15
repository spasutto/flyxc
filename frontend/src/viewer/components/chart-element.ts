import { ticks } from 'd3-array';
import { airspaceCategory, Flags } from 'flyxc/common/src/airspaces';
import { sampleAt } from 'flyxc/common/src/math';
import { RuntimeTrack } from 'flyxc/common/src/runtime-track';
import { css, CSSResult, html, LitElement, PropertyValues, svg, SVGTemplateResult, TemplateResult } from 'lit';
import { customElement, query, queryAll, state } from 'lit/decorators.js';
import { connect } from 'pwa-helpers';

import { DistanceUnit, formatUnit, SpeedUnit, Units } from '../logic/units';
import { setAirspacesOnGraph } from '../redux/airspace-slice';
import { ChartYAxis, setChartYAxis } from '../redux/app-slice';
import * as sel from '../redux/selectors';
import { RootState, store } from '../redux/store';

const MIN_SPEED_FACTOR = 16;
const MAX_SPEED_FACTOR = 4096;
const PLAY_INTERVAL_MILLIS = 50;

@customElement('chart-element')
export class ChartElement extends connect(store)(LitElement) {
  @state()
  private tracks: RuntimeTrack[] = [];
  @state()
  private chartYAxis: ChartYAxis = ChartYAxis.Altitude;
  @state()
  private timeSec = 0;
  @state()
  private width = 0;
  @state()
  private height = 0;
  @state()
  private units?: Units;
  @state()
  private showRestricted = false;
  @state()
  private currentTrackId?: string;
  @state()
  private playSpeed = 64;
  @state()
  private playTimer?: number;
  @state()
  private trackColors: { [id: string]: string } = {};

  private lastPlayTimestamp = 0;

  @queryAll('path.asp')
  private aspPathElements?: NodeList;

  @query('svg#chart')
  private svgContainer?: SVGSVGElement;

  @query('#thumb')
  private thumbElement?: SVGLineElement;

  // mins, maxs and offsets are in seconds.
  private minTimeSec = 0;
  private maxTimeSec = 1;
  private offsetSeconds: { [id: string]: number } = {};
  // Throttle timestamp and airspace updates.
  private nextAspUpdate = 0;
  private nextTimestampUpdate = 0;
  private sizeListener = () => this.updateSize();

  stateChanged(state: RootState): void {
    this.tracks = sel.tracks(state);
    this.chartYAxis = state.app.chartYAxis;
    this.timeSec = state.app.timeSec;
    this.minTimeSec = sel.minTimeSec(state);
    this.maxTimeSec = sel.maxTimeSec(state);
    this.units = state.units;
    this.offsetSeconds = sel.offsetSeconds(state);
    this.showRestricted = state.airspace.showRestricted;
    this.currentTrackId = state.track.currentTrackId;
    this.trackColors = sel.trackColors(state);
  }

  private get minY(): number {
    const state = store.getState();
    switch (this.chartYAxis) {
      case ChartYAxis.Speed:
        return sel.minSpeed(state);
      case ChartYAxis.Vario:
        return sel.minVario(state);
      default:
        return sel.minAlt(state);
    }
  }

  private get maxY(): number {
    const state = store.getState();
    switch (this.chartYAxis) {
      case ChartYAxis.Speed:
        return sel.maxSpeed(state);
      case ChartYAxis.Vario:
        return sel.maxVario(state);
      default:
        return sel.maxAlt(state);
    }
  }

  // time is in seconds.
  private getY(track: RuntimeTrack, timeSec: number): number {
    switch (this.chartYAxis) {
      case ChartYAxis.Speed:
        return sampleAt(track.timeSec, track.vx, timeSec);
      case ChartYAxis.Vario:
        return sampleAt(track.timeSec, track.vz, timeSec);
      default:
        return sampleAt(track.timeSec, track.alt, timeSec);
    }
  }

  private getYUnit(): DistanceUnit | SpeedUnit {
    const units = this.units as Units;
    switch (this.chartYAxis) {
      case ChartYAxis.Speed:
        return units.speed;
      case ChartYAxis.Vario:
        return units.vario;
      default:
        return units.altitude;
    }
  }

  static get styles(): CSSResult[] {
    return [
      css`
        :host {
          display: block;
          width: 100%;
          height: 100%;
          position: relative;
          font: 12px 'Nobile', verdana, sans-serif;
        }
        #chart {
          touch-action: none;
        }
        .paths {
          fill: none;
        }
        .gnd {
          stroke: #755445;
          fill: #755445;
          fill-opacity: 0.8;
        }
        .asp {
          stroke: #808080;
          fill: #808080;
          fill-opacity: 0.2;
          stroke-opacity: 0.3;
        }
        .asp.prohibited {
          stroke: #bf4040;
          fill: #bf4040;
        }
        .asp.restricted {
          stroke: #bfbf40;
          fill: #bfbf40;
        }
        .asp.danger {
          stroke: #bf8040;
          fill: #bf8040;
        }
        .axis {
          stroke: lightgray;
          fill: none;
          stroke-width: 0.5px;
        }
        .ticks {
          font: 10px sans-serif;
          user-select: none;
          pointer-events: none;
          stroke-width: 0.5px;
          fill: black;
          stroke: white;
          stroke-width: 0;
        }
        #thumb {
          stroke: gray;
          fill: none;
          stroke-width: 1.5px;
        }
        path {
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-opacity: 0.6;
          stroke-width: 1;
        }
        path.active {
          stroke-width: 1.5;
          stroke-opacity: 1;
        }
        #ct {
          position: absolute;
          top: 3px;
          right: 3px;
          height: 1px;
        }
        select {
          font: inherit;
          clear: both;
          float: right;
        }
        .control {
          display: block;
          float: right;
          border: 1px inset #555;
          padding: 4px;
          margin: 2px 2px 0 0;
          text-align: right;
          border-radius: 4px;
          opacity: 0.5;
          user-select: none;
          background-color: white;
          clear: both;
          cursor: pointer;
        }
        .control:hover {
          background-color: #adff2f;
          opacity: 0.9;
        }
        .hidden-mobile {
          display: inline-block;
        }
        @media (max-width: 767px) {
          .hidden-mobile {
            display: none;
          }
        }
      `,
    ];
  }

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('resize', this.sizeListener);
    // Sometimes the SVG has a 0x0 size when opened in a new window.
    if (document.visibilityState != 'visible') {
      document.addEventListener('visibilitychange', () => setTimeout(this.sizeListener, 500));
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.sizeListener);
    document.removeEventListener('visibilitychange', this.sizeListener);
  }

  shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('timeSec')) {
      if (this.thumbElement) {
        const x = String(this.getXAtTimeSec(this.timeSec));
        this.thumbElement.setAttribute('x1', x);
        this.thumbElement.setAttribute('x2', x);
      }
      changedProps.delete('timeSec');
    }
    return super.shouldUpdate(changedProps);
  }

  protected render(): TemplateResult {
    return html`
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/line-awesome@1/dist/line-awesome/css/line-awesome.min.css"
      />
      <svg
        id="chart"
        xmlns="http://www.w3.org/2000/svg"
        @pointermove=${this.handlePointerMove}
        @pointerdown=${this.handlePointerDown}
        @wheel=${this.handleMouseWheel}
        width=${this.width}
        height=${this.height}
      >
        <defs>
          <filter id="shadow-active">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"></feGaussianBlur>
            <feMerge>
              <feMergeNode></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
          <filter id="shadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.5"></feGaussianBlur>
            <feMerge>
              <feMergeNode></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="white" />
        <g class="paths">${this.paths()}</g>
        <g class="axis">${this.axis()}</g>
        <g class="ticks">${this.yTexts()}</g>
        <g class="ticks">${this.xTexts()}</g>
        <line id="thumb" x1="0" x2="0" y2="100%"></line>
      </svg>
      <div id="ct">
        <select @change=${this.handleYChange}>
          <option value=${ChartYAxis.Altitude} selected>Altitude</option>
          <option value=${ChartYAxis.Speed}>Speed</option>
          <option value=${ChartYAxis.Vario}>Vario</option>
        </select>
        <div class="control">
          <i
            class="la la-2x la-chevron-down"
            @click=${() => (this.playSpeed = Math.max(MIN_SPEED_FACTOR, this.playSpeed / 2))}
            style=${`visibility: ${this.playSpeed == MIN_SPEED_FACTOR ? 'hidden' : 'visible'}`}
          ></i>
          <span class="hidden-mobile" style="vertical-align: .3em;">${this.playSpeed}x</span>
          <i
            class="la la-2x la-chevron-up"
            @click=${() => (this.playSpeed = Math.min(MAX_SPEED_FACTOR, this.playSpeed * 2))}
            style=${`visibility: ${this.playSpeed == MAX_SPEED_FACTOR ? 'hidden' : 'visible'}`}
          ></i>
          <i class=${`la la-2x ${this.playTimer ? 'la-pause' : 'la-play'}`} @click="${this.handlePlay}"></i>
        </div>
      </div>
    `;
  }

  protected firstUpdated(): void {
    // Wait for the element to get a size.
    // Then `updateSize()` will trigger a re-render by updating properties.
    // It helps with Safari which needs explicit width and height.
    // See
    const timeout = Date.now() + 5000;
    const waitForSize = () => {
      if (this.clientWidth > 0) {
        this.updateSize();
      } else if (Date.now() < timeout) {
        setTimeout(waitForSize, 50);
      }
    };
    waitForSize();
  }

  private paths(): TemplateResult[] {
    const paths: TemplateResult[] = [];

    // Dot not render before the width is set.
    if (this.tracks.length == 0 || this.width < 50) {
      return paths;
    }

    let activePath: SVGTemplateResult | undefined;

    // Display the gnd elevation only if there is a single track & mode is altitude

    const displayGndAlt = this.tracks.length == 1 && this.chartYAxis == ChartYAxis.Altitude;

    this.tracks.forEach((track) => {
      if (track.timeSec.length < 5) {
        return;
      }
      // Span of the track on the X axis.
      const offsetSeconds = this.offsetSeconds[track.id];
      const minX = this.getXAtTimeSec(track.timeSec[0], offsetSeconds);
      const maxX = this.getXAtTimeSec(track.timeSec[track.timeSec.length - 1], offsetSeconds);

      const trackCoords: string[] = [];
      const gndCoords = [`${minX},${this.getYAtHeight(this.minY).toFixed(1)}`];

      if (displayGndAlt && track.gndAlt) {
        paths.push(...this.airspacePaths(track));
      }
      for (let x = minX; x < maxX; x++) {
        const timeSec = this.getTimeSecAtX(x) + offsetSeconds;
        const y = this.getY(track, timeSec);
        trackCoords.push(`${x.toFixed(1)},${this.getYAtHeight(y).toFixed(1)}`);
        if (displayGndAlt && track.gndAlt) {
          const gndAlt = sampleAt(track.timeSec, track.gndAlt, timeSec);
          gndCoords.push(`${x.toFixed(1)},${this.getYAtHeight(gndAlt).toFixed(1)}`);
        }
      }
      gndCoords.push(`${maxX},${this.getYAtHeight(this.minY).toFixed(1)}`);
      if (displayGndAlt) {
        paths.push(svg`<path class=gnd d=${`M${gndCoords.join('L')}`}></path>`);
      }
      if (track.id == this.currentTrackId) {
        activePath = svg`<path class='active' stroke=${this.trackColors[track.id]} filter=url(#shadow-active) 
          d=${`M${trackCoords.join('L')}`}></path>`;
      } else {
        paths.push(
          svg`<path stroke=${this.trackColors[track.id]} d=${`M${trackCoords.join('L')}`} filter=url(#shadow)></path>`,
        );
      }
    });

    // The active path should be drawn last to be on top of others.
    if (activePath) {
      paths.push(activePath);
    }

    return paths;
  }

  // Compute the SVG paths for the airspaces.
  private airspacePaths(track: RuntimeTrack): SVGTemplateResult[] {
    const asp = track.airspaces;
    if (asp == null) {
      return [];
    }
    const paths: SVGTemplateResult[] = [];

    for (let i = 0; i < asp.startSec.length; i++) {
      const flags = asp.flags[i];
      if (!this.showRestricted && flags & Flags.AirspaceRestricted) {
        continue;
      }
      const startSec = asp.startSec[i];
      const endSec = asp.endSec[i];
      const top = asp.top[i];
      const bottom = asp.bottom[i];
      const topRefGnd = flags & Flags.TopRefGnd;
      const bottomRefGnd = flags & Flags.FloorRefGnd;
      const clampTo: { minAlt?: number; maxAlt?: number } = {};
      if (bottomRefGnd && !topRefGnd) {
        clampTo.maxAlt = top;
      }
      if (topRefGnd && !bottomRefGnd) {
        clampTo.minAlt = bottom;
      }
      const coords = [
        ...this.aspLine(track, startSec, endSec, bottom, bottomRefGnd, clampTo),
        ...this.aspLine(track, endSec, startSec, top, topRefGnd, clampTo),
      ];
      if (coords.length < 4) {
        continue;
      }
      coords.push(coords[0]);
      const path = coords
        .map(([timeSec, alt]) => {
          const x = this.getXAtTimeSec(timeSec);
          const y = this.getYAtHeight(alt);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join('L');
      paths.push(
        svg`<path data-start=${startSec} data-end=${endSec} title=${`[${asp.category[i]}] ${asp.name[i]}`}  class=${`asp ${airspaceCategory(
          flags,
        )}`} d=${'M' + path}></path>`,
      );
    }

    return paths;
  }

  private aspLine(
    track: RuntimeTrack,
    startSec: number,
    endSec: number,
    alt: number,
    refGnd: number,
    clampTo: { minAlt?: number; maxAlt?: number },
  ): Array<[number, number]> {
    if (!refGnd || !track.gndAlt) {
      return [
        [startSec, alt],
        [endSec, alt],
      ];
    }
    let reverse = false;
    if (startSec > endSec) {
      [startSec, endSec] = [endSec, startSec];
      reverse = true;
    }
    const startX = this.getXAtTimeSec(startSec);
    const endX = this.getXAtTimeSec(endSec);
    const points: Array<[number, number]> = [];
    const { minAlt, maxAlt } = clampTo;
    for (let x = startX; x < endX; x++) {
      const timeSec = this.getTimeSecAtX(x);
      const gndAlt = sampleAt(track.timeSec, track.gndAlt, timeSec);
      let altitude = alt + gndAlt;
      if (maxAlt != null) {
        altitude = Math.min(maxAlt, altitude);
      }
      if (minAlt != null) {
        altitude = Math.max(minAlt, altitude);
      }
      points.push([timeSec, altitude]);
    }
    return reverse ? points.reverse() : points;
  }

  private axis(): TemplateResult[] {
    const axis: TemplateResult[] = [];

    if (this.tracks) {
      const tks = ticks(this.minY, this.maxY, 4);

      tks.forEach((tick) => {
        // Draw line
        const y = this.getYAtHeight(tick);
        axis.push(svg`<line y1=${y.toFixed(1)} x2=${this.width} y2=${y}></line>`);
      });
    }

    return axis;
  }

  private yTexts(): TemplateResult[] {
    const texts: TemplateResult[] = [];

    if (this.tracks) {
      const tks = ticks(this.minY, this.maxY, 4);

      tks.forEach((tick) => {
        const y = this.getYAtHeight(tick);
        texts.push(
          svg`<text stroke-width=3 x=5 y=${y.toFixed(1)} dy=-2>${formatUnit(tick, this.getYUnit())}</text>
          <text x=5 y=${y.toFixed(1)} dy=-2>${formatUnit(tick, this.getYUnit())}</text>`,
        );
      });
    }

    return texts;
  }

  private xTexts(): TemplateResult[] {
    const texts: TemplateResult[] = [];

    if (this.tracks) {
      const minute = 60 * 1000;
      const hour = 60 * minute;

      // Push minTs 50px right to avoid writing over the alt scale
      const minSec = this.getTimeSecAtX(50);
      const timeSpan = this.maxTimeSec - minSec;
      const tickSpan = Math.ceil(timeSpan / hour / 6) * hour;
      const date = new Date(minSec * 1000);
      const startTime =
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + 1).getTime() / 1000;

      for (let timeSec = startTime; timeSec < this.maxTimeSec; timeSec += tickSpan) {
        const x = this.getXAtTimeSec(timeSec);
        const date = new Date(timeSec * 1000).toLocaleTimeString();
        texts.push(
          svg`<text text-anchor=middle stroke-width=3 y=${this.height} x=${x.toFixed(1)} dy=-4>${date}</text>
          <text text-anchor=middle y=${this.height} x=${x.toFixed(1)} dy=-4>${date}</text>`,
        );
      }
    }

    return texts;
  }

  private updateSize(): void {
    this.width = this.clientWidth;
    this.height = this.clientHeight;
  }

  private handlePlay() {
    console.log('handlePlay');
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = undefined;
    } else {
      // Restart from the beginning if play has not been used for 30s,
      if (this.lastPlayTimestamp < Date.now() - 30 * 1000 || this.timeSec == this.maxTimeSec) {
        this.dispatchEvent(new CustomEvent('move', { detail: { timeSec: this.minTimeSec } }));
      }
      this.playTick();
      this.playTimer = window.setInterval(() => this.playTick(), PLAY_INTERVAL_MILLIS);
    }
  }

  private playTick() {
    this.lastPlayTimestamp = Date.now();
    let timeSec = this.timeSec + (PLAY_INTERVAL_MILLIS * this.playSpeed) / 1000;
    if (timeSec >= this.maxTimeSec) {
      timeSec = this.maxTimeSec;
      clearInterval(this.playTimer);
      this.playTimer = undefined;
    }
    this.dispatchEvent(new CustomEvent('move', { detail: { timeSec } }));
  }

  private handleYChange(e: Event): void {
    const y: ChartYAxis = Number((e.target as HTMLSelectElement).value);
    store.dispatch(setChartYAxis(y));
  }

  private getXAtTimeSec(timeSec: number, offsetSec = 0): number {
    return Math.round(((timeSec - offsetSec - this.minTimeSec) / (this.maxTimeSec - this.minTimeSec)) * this.width);
  }

  private getTimeSecAtX(x: number) {
    return (x / this.width) * (this.maxTimeSec - this.minTimeSec) + this.minTimeSec;
  }

  private getYAtHeight(height: number) {
    return ((this.maxY - height) / (this.maxY - this.minY)) * this.height;
  }

  private handlePointerDown(e: MouseEvent): void {
    const { timeSec } = this.getCoordinatesFromEvent(e);
    this.dispatchEvent(new CustomEvent('pin', { detail: { timeSec } }));
    this.dispatchEvent(new CustomEvent('move', { detail: { timeSec } }));
  }

  private handleMouseWheel(e: WheelEvent): void {
    const { timeSec } = this.getCoordinatesFromEvent(e);
    this.dispatchEvent(new CustomEvent('zoom', { detail: { timeSec, deltaY: e.deltaY } }));
    e.preventDefault();
  }

  private handlePointerMove(e: MouseEvent): void {
    if (this.playTimer == null) {
      const now = Date.now();
      if (now > this.nextTimestampUpdate) {
        const { x, y, timeSec } = this.getCoordinatesFromEvent(e);
        this.dispatchEvent(new CustomEvent('move', { detail: { timeSec } }));
        this.nextTimestampUpdate = now + 20;
        if (now > this.nextAspUpdate) {
          this.updateAirspaces(x, y, timeSec);
          this.nextAspUpdate = now + 40;
        }
      }
    }
  }

  private getCoordinatesFromEvent(e: MouseEvent): { x: number; y: number; timeSec: number } {
    // The event target could be any of the children of the element with the listener.
    const { left, top } = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    return { x, y, timeSec: this.getTimeSecAtX(x) };
  }

  private updateAirspaces(x: number, y: number, timeSec: number): void {
    const airspaces: string[] = [];
    if (this.svgContainer && this.aspPathElements) {
      const point = this.svgContainer.createSVGPoint();
      point.x = x;
      point.y = y;
      this.aspPathElements?.forEach((node: Node) => {
        const geometry = node as SVGGeometryElement;
        const startSec = Number(geometry.getAttribute('data-start'));
        const endSec = Number(geometry.getAttribute('data-end'));
        if (timeSec >= startSec && timeSec <= endSec && geometry.isPointInFill(point)) {
          airspaces.push(geometry.getAttribute('title') as string);
        }
      });
    }
    store.dispatch(setAirspacesOnGraph(airspaces));
  }
}
