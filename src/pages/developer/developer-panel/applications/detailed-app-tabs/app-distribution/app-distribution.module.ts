import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AppDistributionPage } from './app-distribution';

import { ComponentsModule } from '../../../../../../components/components.module';
import { PipesModule } from '../../../../../../shared/pipes/pipes.module';

@NgModule({
  declarations: [
    AppDistributionPage,
  ],
  imports: [
    ComponentsModule,
    PipesModule,
    IonicPageModule.forChild(AppDistributionPage),
  ],
})
export class AppDistributionPageModule {}
