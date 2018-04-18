import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ApkDetailsPage } from './apk-details';

import { PipesModule } from '../../../../../../shared/pipes/pipes.module';
import { ComponentsModule } from '../../../../../../components/components.module';

@NgModule({
  declarations: [
    ApkDetailsPage,
  ],
  imports: [
    PipesModule,
    ComponentsModule,
    IonicPageModule.forChild(ApkDetailsPage),
  ],
})
export class ApkDetailsPageModule {}
