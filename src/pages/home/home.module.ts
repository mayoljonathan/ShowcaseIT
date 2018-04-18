import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
// import { SuperTabsModule } from 'ionic2-super-tabs';
import { ComponentsModule } from '../../components/components.module';
import { MasonryModule } from 'angular2-masonry';
import { PipesModule } from '../../shared/pipes/pipes.module';

import { HomePage } from './home';

@NgModule({
  declarations: [
    HomePage,
  ],
  imports: [
    // SuperTabsModule,
    ComponentsModule,
    MasonryModule,
    PipesModule,
    IonicPageModule.forChild(HomePage),
  ],
  exports: [
    HomePage
  ]
})
export class HomePageModule {}