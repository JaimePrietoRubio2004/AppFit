import { Component } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  trendingUpOutline,
  calendarOutline,
  settingsOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-pestanas',
  templateUrl: './pestanas.component.html',
  styleUrls: ['./pestanas.component.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class PestanasComponent {
  constructor() {
    addIcons({
      homeOutline,
      trendingUpOutline,
      calendarOutline,
      settingsOutline,
    });
  }
}
