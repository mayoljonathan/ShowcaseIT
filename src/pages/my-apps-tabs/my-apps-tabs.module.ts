import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MyAppsTabsPage } from './my-apps-tabs';
import { SuperTabsModule } from 'ionic2-super-tabs';

@NgModule({
  declarations: [
    MyAppsTabsPage,
  ],
  imports: [
    SuperTabsModule,
    IonicPageModule.forChild(MyAppsTabsPage),
  ],
})
export class MyAppsTabsPageModule {}
