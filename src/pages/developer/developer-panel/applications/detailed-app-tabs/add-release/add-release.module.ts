import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AddReleasePage } from './add-release';

import { ComponentsModule } from '../../../../../../components/components.module';
import { PipesModule } from '../../../../../../shared/pipes/pipes.module';

@NgModule({
  declarations: [
    AddReleasePage,
  ],
  imports: [
    ComponentsModule,
    PipesModule,
    IonicPageModule.forChild(AddReleasePage),
  ],
})
export class AddReleasePageModule {}
