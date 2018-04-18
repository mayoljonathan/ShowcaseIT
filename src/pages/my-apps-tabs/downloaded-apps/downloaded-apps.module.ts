import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DownloadedAppsPage } from './downloaded-apps';

import { PipesModule } from '../../../shared/pipes/pipes.module';

@NgModule({
  declarations: [
    DownloadedAppsPage,
  ],
  imports: [
    PipesModule,
    IonicPageModule.forChild(DownloadedAppsPage),
  ],
})
export class DownloadedAppsPageModule {}
