import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { StartupLoadingPage } from './startup-loading';

@NgModule({
  declarations: [
    StartupLoadingPage,
  ],
  imports: [
    IonicPageModule.forChild(StartupLoadingPage),
  ],
})
export class StartupLoadingPageModule {}
