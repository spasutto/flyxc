// Import all used ionic components.

import { initialize } from '@ionic/core/components';
import { IonAlert } from '@ionic/core/components/ion-alert';
import { IonApp } from '@ionic/core/components/ion-app';
import { IonBackdrop } from '@ionic/core/components/ion-backdrop';
import { IonBadge } from '@ionic/core/components/ion-badge';
import { IonButton } from '@ionic/core/components/ion-button';
import { IonButtons } from '@ionic/core/components/ion-buttons';
import { IonCard } from '@ionic/core/components/ion-card';
import { IonCardHeader } from '@ionic/core/components/ion-card-header';
import { IonCardTitle } from '@ionic/core/components/ion-card-title';
import { IonContent } from '@ionic/core/components/ion-content';
import { IonFabButton } from '@ionic/core/components/ion-fab-button';
import { IonFooter } from '@ionic/core/components/ion-footer';
import { IonHeader } from '@ionic/core/components/ion-header';
import { IonInput } from '@ionic/core/components/ion-input';
import { IonItem } from '@ionic/core/components/ion-item';
import { IonItemDivider } from '@ionic/core/components/ion-item-divider';
import { IonLabel } from '@ionic/core/components/ion-label';
import { IonList } from '@ionic/core/components/ion-list';
import { IonMenu } from '@ionic/core/components/ion-menu';
import { IonMenuButton } from '@ionic/core/components/ion-menu-button';
import { IonMenuToggle } from '@ionic/core/components/ion-menu-toggle';
import { IonModal } from '@ionic/core/components/ion-modal';
import { IonNav } from '@ionic/core/components/ion-nav';
import { IonNote } from '@ionic/core/components/ion-note';
import { IonPopover } from '@ionic/core/components/ion-popover';
import { IonProgressBar } from '@ionic/core/components/ion-progress-bar';
import { IonRange } from '@ionic/core/components/ion-range';
import { IonRoute } from '@ionic/core/components/ion-route';
import { IonRouter } from '@ionic/core/components/ion-router';
import { IonSelect } from '@ionic/core/components/ion-select';
import { IonSelectOption } from '@ionic/core/components/ion-select-option';
import { IonSelectPopover } from '@ionic/core/components/ion-select-popover';
import { IonText } from '@ionic/core/components/ion-text';
import { IonTitle } from '@ionic/core/components/ion-title';
import { IonToast } from '@ionic/core/components/ion-toast';
import { IonToggle } from '@ionic/core/components/ion-toggle';
import { IonToolbar } from '@ionic/core/components/ion-toolbar';

export function ionicInit(): void {
  initialize();

  const elements = new Map([
    ['ion-alert', IonAlert],
    ['ion-app', IonApp],
    ['ion-backdrop', IonBackdrop],
    ['ion-badge', IonBadge],
    ['ion-button', IonButton],
    ['ion-buttons', IonButtons],
    ['ion-card', IonCard],
    ['ion-card-header', IonCardHeader],
    ['ion-card-title', IonCardTitle],
    ['ion-content', IonContent],
    ['ion-fab-button', IonFabButton],
    ['ion-footer', IonFooter],
    ['ion-header', IonHeader],
    ['ion-input', IonInput],
    ['ion-item-divider', IonItemDivider],
    ['ion-item', IonItem],
    ['ion-label', IonLabel],
    ['ion-list', IonList],
    ['ion-menu-button', IonMenuButton],
    ['ion-menu-toggle', IonMenuToggle],
    ['ion-menu', IonMenu],
    ['ion-modal', IonModal],
    ['ion-nav', IonNav],
    ['ion-note', IonNote],
    ['ion-popover', IonPopover],
    ['ion-progress-bar', IonProgressBar],
    ['ion-range', IonRange],
    ['ion-route', IonRoute],
    ['ion-router', IonRouter],
    ['ion-select-option', IonSelectOption],
    ['ion-select-popover', IonSelectPopover],
    ['ion-select', IonSelect],
    ['ion-text', IonText],
    ['ion-title', IonTitle],
    ['ion-toast', IonToast],
    ['ion-toggle', IonToggle],
    ['ion-toolbar', IonToolbar],
  ]);

  for (const [tag, element] of elements) {
    customElements.define(tag, element);
  }
}
