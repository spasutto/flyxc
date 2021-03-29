import { trackerDisplayNames, TrackerIds, trackerPropNames } from 'flyxc/common/src/live-track';
import { AccountFormModel, AccountModel } from 'flyxc/common/src/models';
import { customElement, html, LitElement, property, TemplateResult } from 'lit-element';

import { Binder } from '@vaadin/form/Binder';
import { CheckedFieldStrategy, field, VaadinFieldStrategy } from '@vaadin/form/Field';

// Card for a single tracker.
@customElement('device-card')
export class TrackerPanel extends LitElement {
  @property()
  label = '';

  @property({ attribute: false })
  hint?: TemplateResult;

  @property()
  inputMode = 'text';

  @property({ attribute: false })
  binder!: Binder<AccountModel, AccountFormModel>;

  @property({ attribute: false })
  tracker!: TrackerIds;

  protected render(): TemplateResult {
    const trackerName = trackerDisplayNames[this.tracker];
    const property = trackerPropNames[this.tracker];
    const model = (this.binder.model as any)[property];

    return html`
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/line-awesome@1/dist/line-awesome/css/line-awesome.min.css"
      />
      <ion-card class="ion-padding-bottom">
        <ion-card-header>
          <ion-card-title color="primary"><i class="las la-calculator"></i> ${trackerName}</ion-card-title>
        </ion-card-header>
        <flow-ion-check label="Enabled" labelOff="Disabled" ...=${field(model.enabled)}></flow-ion-check>
        ${model.enabled.valueOf()
          ? html`${this.hint} <flow-ion-input label=${this.label} ...=${field(model.account)}> ></flow-ion-input>`
          : null}
      </ion-card>
    `;
  }

  createRenderRoot(): HTMLElement {
    return this;
  }
}

// Text field with Vaadin Flow support.
@customElement('flow-ion-input')
export class FlowIonInput extends LitElement {
  // Flow form integration.
  static strategy = VaadinFieldStrategy;

  @property()
  label?: string;

  @property()
  inputMode = 'text';

  @property({ attribute: false })
  invalid = false;

  @property({ attribute: false })
  errorMessage = '';

  @property({ attribute: false })
  value = '';

  protected render(): TemplateResult {
    return html`
      <ion-item lines="full">
        <ion-label position="floating">${this.label}</ion-label>
        <ion-input
          @input=${this.handleInput}
          type="text"
          value=${this.value}
          inputmode=${this.inputMode}
          .color=${this.errorMessage ? 'danger' : undefined}
        ></ion-input>
      </ion-item>
      ${this.errorMessage
        ? html`<ion-text class="ion-padding-horizontal block" color="danger"
            ><i class="las la-exclamation-circle"></i> ${this.errorMessage}</ion-text
          >`
        : null}
    `;
  }

  private handleInput(e: InputEvent) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
  }

  createRenderRoot(): HTMLElement {
    return this;
  }
}

// Text field with Vaadin Flow support.
@customElement('flow-ion-check')
export class FlowIonCheck extends LitElement {
  // Flow form integration.
  static strategy = CheckedFieldStrategy;

  @property()
  label?: string;

  @property()
  labelOff?: string;

  @property({ attribute: false })
  checked = false;

  protected render(): TemplateResult {
    return html`
      <ion-item button lines="full" @click=${this.handleClick}>
        <ion-label>${this.checked ? this.label : this.labelOff ?? this.label}</ion-label>
        <ion-toggle @change=${this.handleClick} slot="end" .checked=${this.checked}></ion-toggle>
      </ion-item>
    `;
  }

  private handleClick() {
    this.checked = !this.checked;
    this.dispatchEvent(new Event('change'));
  }

  createRenderRoot(): HTMLElement {
    return this;
  }
}
