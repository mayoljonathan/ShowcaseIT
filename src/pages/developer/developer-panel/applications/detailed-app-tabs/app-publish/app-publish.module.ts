import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AppPublishPage } from './app-publish';

import { PipesModule } from '../../../../../../shared/pipes/pipes.module';
import { MaterialIconsModule } from 'ionic2-material-icons';

@NgModule({
  declarations: [
    AppPublishPage,
  ],
  imports: [
    PipesModule,
    MaterialIconsModule,
    IonicPageModule.forChild(AppPublishPage),
  ],
})
export class AppPublishPageModule {}
