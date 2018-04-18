import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AppDetailsPage } from './app-details';

import { MaterialIconsModule } from 'ionic2-material-icons';
// import { TooltipsModule } from 'ionic-tooltips';
import { IonicImageViewerModule } from 'ionic-img-viewer';

import { ComponentsModule } from '../../../../../../components/components.module';

@NgModule({
  declarations: [
    AppDetailsPage,
  ],
  imports: [
    MaterialIconsModule,
    // TooltipsModule,
    IonicImageViewerModule,
    ComponentsModule,
    IonicPageModule.forChild(AppDetailsPage),
  ],
})
export class AppDetailsPageModule {}
