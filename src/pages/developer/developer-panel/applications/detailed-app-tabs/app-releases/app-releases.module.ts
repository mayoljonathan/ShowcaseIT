import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AppReleasesPage } from './app-releases';

import { MaterialIconsModule } from 'ionic2-material-icons';
// import { TooltipsModule } from 'ionic-tooltips';
// import { TooltipModule } from 'angular2-tooltips';

import { ComponentsModule } from '../../../../../../components/components.module';
import { PipesModule } from '../../../../../../shared/pipes/pipes.module';

@NgModule({
  declarations: [
    AppReleasesPage,
  ],
  imports: [
    // TooltipsModule,
    MaterialIconsModule,
    ComponentsModule,
    PipesModule,
    IonicPageModule.forChild(AppReleasesPage),
  ],
})
export class AppReleasesPageModule {}
