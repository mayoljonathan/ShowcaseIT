import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PendingDeletionPage } from './pending-deletion';
import { PipesModule } from '../../../../../shared/pipes/pipes.module';

import { MaterialIconsModule } from 'ionic2-material-icons';

@NgModule({
  declarations: [
    PendingDeletionPage,
  ],
  imports: [
    MaterialIconsModule,
    PipesModule,
    IonicPageModule.forChild(PendingDeletionPage),
  ],
})
export class PendingDeletionPageModule {}
