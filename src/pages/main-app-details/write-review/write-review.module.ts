import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { WriteReviewPage } from './write-review';

import { PipesModule } from '../../../shared/pipes/pipes.module';
import { ComponentsModule } from '../../../components/components.module';

@NgModule({
  declarations: [
    WriteReviewPage,
  ],
  imports: [
    PipesModule,
    ComponentsModule,
    IonicPageModule.forChild(WriteReviewPage),
  ],
})
export class WriteReviewPageModule {}
