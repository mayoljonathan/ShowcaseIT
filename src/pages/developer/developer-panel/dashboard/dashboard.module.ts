import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DashboardPage } from './dashboard';
import { MaterialIconsModule } from 'ionic2-material-icons';
 
@NgModule({
  declarations: [
    DashboardPage,
  ],
  imports: [
    MaterialIconsModule,
    IonicPageModule.forChild(DashboardPage),
  ],
  exports: [
    DashboardPage
  ]
})
export class DashboardModule {}