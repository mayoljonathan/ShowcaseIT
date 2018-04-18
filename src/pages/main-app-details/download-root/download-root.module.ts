import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DownloadRootPage } from './download-root';

@NgModule({
  declarations: [
    DownloadRootPage,
  ],
  imports: [
    IonicPageModule.forChild(DownloadRootPage),
  ],
})
export class DownloadRootPageModule {}
