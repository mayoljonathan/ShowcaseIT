import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ReviewListPage } from './review-list';

import { PipesModule } from '../../../shared/pipes/pipes.module';
import { ComponentsModule } from '../../../components/components.module';
import { MasonryModule } from 'angular2-masonry';

@NgModule({
  declarations: [
    ReviewListPage,
  ],
  imports: [
    PipesModule,
    MasonryModule,
    ComponentsModule,
    IonicPageModule.forChild(ReviewListPage),
  ],
})
export class ReviewListPageModule {}
