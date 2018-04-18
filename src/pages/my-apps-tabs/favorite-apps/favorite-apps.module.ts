import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { FavoriteAppsPage } from './favorite-apps';

import { MasonryModule } from 'angular2-masonry';
import { PipesModule } from '../../../shared/pipes/pipes.module';
import { ComponentsModule } from '../../../components/components.module';

@NgModule({
  declarations: [
    FavoriteAppsPage,
  ],
  imports: [
    MasonryModule,
    PipesModule,
    ComponentsModule,
    IonicPageModule.forChild(FavoriteAppsPage),
  ],
})
export class FavoriteAppsPageModule {}
