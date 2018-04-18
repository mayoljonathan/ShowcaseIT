import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChangeProfilePage } from './change-profile';

import { IonicImageViewerModule } from 'ionic-img-viewer';

@NgModule({
  declarations: [
    ChangeProfilePage,
  ],
  imports: [
    IonicImageViewerModule,
    IonicPageModule.forChild(ChangeProfilePage),
  ],
})
export class ChangeProfilePageModule {}
