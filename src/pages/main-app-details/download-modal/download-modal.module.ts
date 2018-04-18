import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DownloadModalPage } from './download-modal';

import { PipesModule } from '../../../shared/pipes/pipes.module';
import { MaterialIconsModule } from 'ionic2-material-icons';

@NgModule({
  declarations: [
    DownloadModalPage,
  ],
  imports: [
    PipesModule,
    MaterialIconsModule,
    IonicPageModule.forChild(DownloadModalPage),
  ],
})
export class DownloadModalPageModule {}
