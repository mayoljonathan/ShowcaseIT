import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MasonryModule } from 'angular2-masonry';
import { StarRatingModule } from 'angular-star-rating';

import { FullscreenContentComponent } from './fullscreen-content/fullscreen-content';
import { DetailedAppPopoverComponent } from './detailed-app-popover/detailed-app-popover';
import { AllApplicationsPopoverComponent } from './all-applications-popover/all-applications-popover';
import { ProgressBarComponent } from './progress-bar/progress-bar';
import { FileDropboxComponent } from './file-dropbox/file-dropbox';
import { ExpandableComponent } from './expandable/expandable';

import { PipesModule } from '../shared/pipes/pipes.module';
import { AppCardComponent } from './app-card/app-card';
import { StarComponent } from './star/star';
import { ReviewComponent } from './review/review';

@NgModule({
	declarations: [
		FullscreenContentComponent,
		DetailedAppPopoverComponent,
		AllApplicationsPopoverComponent,
   		ProgressBarComponent,
		FileDropboxComponent,
		ExpandableComponent,
		AppCardComponent,
		StarComponent,
		ReviewComponent,
	],
	imports: [
		PipesModule,
		MasonryModule,
		StarRatingModule.forRoot(),
		IonicPageModule.forChild(ComponentsModule)
	],
	entryComponents:[
    	DetailedAppPopoverComponent,
		AllApplicationsPopoverComponent,
	],
	exports: [
		FullscreenContentComponent,
		DetailedAppPopoverComponent,
		AllApplicationsPopoverComponent,
    	ProgressBarComponent,
		FileDropboxComponent,
		ExpandableComponent,
		AppCardComponent,
		StarComponent,
		ReviewComponent,
	]
})
export class ComponentsModule {}
