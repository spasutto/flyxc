import '../ui/google-btn';

import { trackerPropNames } from 'flyxc/common/src/live-track';
import { round } from 'flyxc/common/src/math';
import { Keys } from 'flyxc/common/src/redis';
import { customElement, html, internalProperty, LitElement, property, TemplateResult } from 'lit-element';

const REFRESH_MIN = 15;

const GQL_URL = `https://console.cloud.google.com/datastore/entities;kind=LiveTrack;ns=__$DEFAULT$__/query/gql;gql=SELECT%2520*%2520FROM%2520LiveTrack%2520WHERE%2520{name}.enabled%253Dtrue?project=fly-xc`;

const ICON_SVG = (
  count = 0,
) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
<path fill="none" stroke="#000" d="M5 12V6h9M27 17v11h-4"/>
<path fill="#4e525d" stroke="#000" d="M19.86 16.86h0l-.07.06a5.72 5.72 0 01-5.43 1.5h0v-4.7L12 15.28 9.64 13.7v4.72h0a5.72 5.72 0 01-5.43-1.5l-.07-.07h0A7.86 7.86 0 001 23.14h0a3.41 3.41 0 013.93 3.93h0a5.4 5.4 0 016.67 3l.4.93.4-.93a5.4 5.4 0 016.67-3h0A3.41 3.41 0 0123 23.14h0a7.86 7.86 0 00-3.14-6.28z"/>
${
  count > 0
    ? `<text x="19" y="10" font-size="20px" font-family="sans-serif" alignment-baseline="middle" font-weight="bolder" fill="#f60" stroke="none">${
        count > 9 ? '+' : count
      }</text>`
    : `<circle cx="25" cy="7" r="4" fill="#f23c50" stroke="#000" />
<path fill="none" stroke="#000" d="M29 7h3M19 7h3M27.83 4.17l1.41-1.41M20.76 11.24l1.41-1.41M25 3V1M25 13v-2M22.17 4.17l-1.41-1.41M29.24 11.24l-1.41-1.41"/>`
}  
</svg>`;

@customElement('admin-page')
export class AdminPage extends LitElement {
  @internalProperty()
  private isLoading = true;

  @internalProperty()
  private connected = false;

  @internalProperty()
  private values: unknown;

  private timer: any;
  private lastFetch = 0;

  connectedCallback(): void {
    super.connectedCallback();
    this.fetch();
    this.timer = setInterval(() => {
      const ageMin = (Date.now() - this.lastFetch) / (60 * 1000);
      if (ageMin > REFRESH_MIN) {
        this.fetch();
      }
    }, 1000 * 60);
  }

  disconnectedCallback(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  render(): TemplateResult {
    const parts: TemplateResult[] = [];

    if (this.isLoading) {
      parts.push(html`<ion-progress-bar type="indeterminate"></ion-progress-bar>`);
    } else if (!this.connected) {
      parts.push(html`<google-btn override="admin" style="margin-top: 10px"></google-btn>`);
    } else if (this.values) {
      parts.push(html`<dash-summary .values=${this.values}></dash-summary>`);
      for (const name of Object.values(trackerPropNames)) {
        parts.push(html`<dash-tracker .values=${this.values} name=${name}></dash-tracker>`);
      }
    }

    return html`<ion-header>
        <ion-toolbar color="primary">
          <ion-title>FlyXC admin</ion-title>
          <ion-title size="small">Dashboard</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>${parts}</ion-content>
      <ion-footer>
        <ion-toolbar color="light">
          <ion-buttons slot="primary">
            <ion-button @click=${this.fetch}>Refresh</ion-button>
          </ion-buttons>
          <ion-buttons slot="secondary">
            <ion-button href="/logout">Logout</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-footer>`;
  }

  private fetch() {
    this.isLoading = true;
    this.lastFetch = Date.now();
    fetch(`/_admin.json`).then(async (response) => {
      this.isLoading = false;
      this.connected = response.ok;
      if (response.ok) {
        this.values = await response.json();
      }
    });
  }

  createRenderRoot(): HTMLElement {
    return this;
  }
}

@customElement('dash-summary')
export class DashSummary extends LitElement {
  @property({ attribute: false })
  values: any;

  private link?: HTMLLinkElement;
  private timer: any;

  connectedCallback(): void {
    super.connectedCallback();
    this.link = document.createElement('link');
    this.link.setAttribute('rel', 'shortcut icon');
    this.link.href = `data:image/svg+xml;base64,${btoa(ICON_SVG())}`;
    document.head.append(this.link);
    this.timer = setInterval(() => {
      this.requestUpdate();
    }, 10 * 1000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.link) {
      this.link.remove();
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  render(): TemplateResult {
    const trackerH1 = this.values[Keys.trackerIncrementalSize];
    if (this.link) {
      this.link.href = `data:image/svg+xml;base64,${btoa(ICON_SVG(trackerH1))}`;
    }
    return html` <ion-card>
      <ion-card-header>
        <ion-card-title color="primary"><i class="las la-heartbeat"></i> Summary</ion-card-title>
      </ion-card-header>
      <ion-item lines="full">
        <ion-label style="margin: 0">
          <p>Total trackers</p>
          <h3>
            <a
              href="https://console.cloud.google.com/datastore/entities;kind=LiveTrack;ns=__$DEFAULT$__;sortCol=created;sortDir=DESCENDING/query/kind?project=fly-xc"
              target="_blank"
              >${this.values[Keys.dashboardTotalTrackers]}</a
            >
          </h3>
        </ion-label>
      </ion-item>
      <ion-item lines="full">
        <ion-label style="margin: 0">
          <p>Trackers h24</p>
          <h3>${this.values[Keys.trackerFullSize]}</h3>
        </ion-label>
      </ion-item>
      <ion-item lines="full">
        <ion-label style="margin: 0">
          <p>Trackers h1</p>
          <h3>${trackerH1}</h3>
        </ion-label>
      </ion-item>
      <ion-item lines="full">
        <ion-label style="margin: 0">
          <p>Uploaded tracks</p>
          <h3>${this.values[Keys.dashboardTotalTracks]}</h3>
        </ion-label>
      </ion-item>
      <ion-item lines="full">
        <ion-label style="margin: 0">
          <p>Last refresh</p>
          <h3>${relativeTime(this.values[Keys.trackerUpdateSec])}</h3>
        </ion-label>
      </ion-item>
    </ion-card>`;
  }

  createRenderRoot(): HTMLElement {
    return this;
  }
}

@customElement('dash-tracker')
export class DashTracker extends LitElement {
  @property({ attribute: false })
  values: any;

  @property()
  name = '';

  render(): TemplateResult {
    const oldTimeSec = Date.now() / 1000 - 24 * 3 * 3600;
    const number = this.values[Keys.dashboardNumTrackers.replace('{name}', this.name)] ?? 0;
    const fetchTimes = this.values[Keys.trackerLogsTime.replace('{name}', this.name)].map(relativeTime);
    const durations = this.values[Keys.trackerLogsDuration.replace('{name}', this.name)];
    const numDevices = this.values[Keys.trackerLogsSize.replace('{name}', this.name)];
    const topErrors: [string, string][] = [];
    (this.values[Keys.dashboardTopErrors.replace('{name}', this.name)] ?? '').split(',').forEach((entry: string) => {
      const m = entry.match(/id=(\d+) errors=(\d+)/i);
      if (m) {
        topErrors.push([m[1], m[2]]);
      }
    });
    const errorsById: [string, string, string][] = [];
    const oldErrorsById: [string, string, string][] = [];
    this.values[Keys.trackerLogsErrorsById.replace('{name}', this.name)].forEach((entry: string) => {
      const m = entry.match(/\[(\d+)\] id=(\d+) (.*)/i);
      if (m) {
        const timeSec = Number(m[1]);
        if (timeSec < oldTimeSec) {
          oldErrorsById.push([relativeTime(Number(m[1])), m[2], m[3]]);
        } else {
          errorsById.push([relativeTime(Number(m[1])), m[2], m[3]]);
        }
      }
    });
    const oldErrors: TemplateResult[] = [];
    const errors: TemplateResult[] = [];
    this.values[Keys.trackerLogsErrors.replace('{name}', this.name)].forEach((entry: string) => {
      const m = entry.match(/\[(\d+)\] (.*)/i);
      if (m) {
        const timeSec = Number(m[1]);
        if (timeSec < oldTimeSec) {
          oldErrors.push(html`${relativeTime(Number(m[1]))} <ion-text color="medium"> ${m[2]}</ion-text>`);
        } else {
          errors.push(html`${relativeTime(Number(m[1]))} <ion-text color="medium"> ${m[2]}</ion-text>`);
        }
      }
    });

    return html` <ion-card>
      <ion-card-header>
        <ion-card-title color="primary"><i class="las la-calculator"></i> ${this.name}</ion-card-title>
      </ion-card-header>

      <ion-item lines="full">
        <ion-label style="margin: 0">
          <p>Trackers</p>
          <h3><a href=${GQL_URL.replace('{name}', this.name)} target="_blank">${number}</a></h3>
        </ion-label>
      </ion-item>

      <ion-item lines="full">
        <ion-label style="margin: 0">
          <p>Fetch times</p>
          <h3>${fetchTimes.join(', ')}</h3>
        </ion-label>
      </ion-item>

      <ion-item lines="full">
        <ion-label style="margin: 0">
          <p>Duration of fetches</p>
          <h3>${durations.join(', ')}</h3>
        </ion-label>
      </ion-item>

      <ion-item lines="full">
        <ion-label style="margin: 0">
          <p>Number of fetches</p>
          <h3>${numDevices.join(', ')}</h3>
        </ion-label>
      </ion-item>

      <ion-item lines="full">
        <ion-label style="margin: 0">
          <p>Top Errors</p>
          ${topErrors.length == 0
            ? html`<h3>-</h3>`
            : html`${topErrors.map(
                ([id, error]) => html`<h3><a href=${entityHref(id)} target="_blank">${id}</a> ${error}</h3>`,
              )}`}
        </ion-label>
      </ion-item>
      <ion-item lines="full">
        <ion-label style="margin: 0" class="ion-text-wrap">
          <p>Device Errors</p>
          ${errorsById.length == 0
            ? html`<h3>-</h3>`
            : html`${errorsById.map(
                ([time, id, error]) =>
                  html`<h3>
                    ${time} <a href=${entityHref(id)} target="_blank">${id}</a>
                    <ion-text color="medium">${error}</ion-text>
                  </h3>`,
              )}`}
        </ion-label>
      </ion-item>
      ${oldErrorsById.length > 0
        ? html`
            <ion-item lines="full">
              <ion-label style="margin: 0" class="ion-text-wrap">
                <p>Old device Errors</p>
                ${oldErrorsById.map(
                  ([time, id, error]) =>
                    html`<h3>
                      ${time} <a href=${entityHref(id)} target="_blank">${id}</a>
                      <ion-text color="medium"> ${error}</ion-text>
                    </h3>`,
                )}
              </ion-label>
            </ion-item>
          `
        : null}

      <ion-item lines="full">
        <ion-label style="margin: 0">
          <p>Errors</p>
          ${errors.length == 0 ? html`<h3>-</h3>` : html`${errors.map((error) => html`<h3>${error}</h3>`)}`}
        </ion-label>
      </ion-item>

      ${oldErrors.length > 0
        ? html`<ion-item lines="full">
            <ion-label style="margin: 0">
              <p>Old errors</p>
              ${oldErrors.map((error) => html`<h3>${error}</h3>`)}
            </ion-label>
          </ion-item> `
        : null}
    </ion-card>`;
  }

  createRenderRoot(): HTMLElement {
    return this;
  }
}

// Returns readable relative time.
function relativeTime(timeSec: number): string {
  const delta = Date.now() / 1000 - timeSec;
  if (delta >= 24 * 3600 * 7) {
    return `-${round(delta / (24 * 3600 * 7), 1)}w`;
  }
  if (delta >= 24 * 3600) {
    return `-${round(delta / (24 * 3600), 1)}d`;
  }
  if (delta >= 3600) {
    return `-${round(delta / 3600, 1)}h`;
  }
  if (delta >= 60) {
    return `-${round(delta / 60, 0)}min`;
  }
  return `-${round(delta, 0)}s`;
}

// Link to the entity in the cloud console.
function entityHref(id: string) {
  const key = btoa(`key('LiveTrack',${id})`.replace(/=/g, '.'));
  return `https://console.cloud.google.com/datastore/entities;kind=LiveTrack;ns=__$DEFAULT$__/query/kind;filter=%5B%227%2F__key__%7CKEY%7CEQ%7C48%2F${key}%22%5D?project=fly-xc`;
}
