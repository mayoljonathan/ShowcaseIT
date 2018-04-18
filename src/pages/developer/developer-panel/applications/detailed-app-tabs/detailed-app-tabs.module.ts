import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SuperTabsModule } from 'ionic2-super-tabs';
import { DetailedAppTabsPage } from './detailed-app-tabs';

@NgModule({
  declarations: [
    DetailedAppTabsPage,
  ],
  imports: [
    SuperTabsModule,
    IonicPageModule.forChild(DetailedAppTabsPage),
  ],
})
export class DetailedAppTabsModule {}
