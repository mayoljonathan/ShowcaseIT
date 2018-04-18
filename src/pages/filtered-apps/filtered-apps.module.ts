import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { FilteredAppsPage } from './filtered-apps';

import { MasonryModule } from 'angular2-masonry';
import { PipesModule } from '../../shared/pipes/pipes.module';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    FilteredAppsPage,
  ],
  imports: [
    MasonryModule,
    PipesModule,
    ComponentsModule,
    IonicPageModule.forChild(FilteredAppsPage),
  ],
})
export class FilteredAppsPageModule {}
