import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SearchPage } from './search';
 
import { MasonryModule } from 'angular2-masonry';
import { PipesModule } from '../../shared/pipes/pipes.module';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    SearchPage,
  ],
  imports: [
    MasonryModule,
    PipesModule,
    ComponentsModule,
    IonicPageModule.forChild(SearchPage),
  ]
})
export class SearchPageModule {}