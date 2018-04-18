import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { UserProfilePage } from './user-profile';

import { PipesModule } from '../../shared/pipes/pipes.module';
import { IonicImageViewerModule } from 'ionic-img-viewer';
import { MaterialIconsModule } from 'ionic2-material-icons';

import { MasonryModule } from 'angular2-masonry';

// import { ShareButtonsModule } from 'ngx-sharebuttons';

import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    UserProfilePage,
  ],
  imports: [
    MasonryModule,
    PipesModule,
    IonicImageViewerModule,
    ComponentsModule,
    IonicPageModule.forChild(UserProfilePage),
  ],
})
export class UserProfilePageModule {}
