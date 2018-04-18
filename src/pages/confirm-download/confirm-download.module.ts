import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ConfirmDownloadPage } from './confirm-download';

import { ReCaptchaModule } from 'angular2-recaptcha';
import { PipesModule } from '../../shared/pipes/pipes.module';
import { MaterialIconsModule } from 'ionic2-material-icons';

@NgModule({
  declarations: [
    ConfirmDownloadPage,
  ],
  imports: [
    ReCaptchaModule,
    PipesModule,
    MaterialIconsModule,
    IonicPageModule.forChild(ConfirmDownloadPage),
  ],
})
export class ConfirmDownloadPageModule {}
