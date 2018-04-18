import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DeveloperSetupPage } from './developer-setup';
import { MaterialIconsModule } from 'ionic2-material-icons';
 
@NgModule({
  declarations: [
    DeveloperSetupPage,
  ],
  imports: [
    MaterialIconsModule,
    IonicPageModule.forChild(DeveloperSetupPage),
  ],
  exports: [
    DeveloperSetupPage
  ]
})
export class DeveloperSetupModule {}