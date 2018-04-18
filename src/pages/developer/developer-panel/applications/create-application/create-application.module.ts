import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CreateApplicationPage } from './create-application';

@NgModule({
  declarations: [
    CreateApplicationPage,
  ],
  imports: [
    IonicPageModule.forChild(CreateApplicationPage),
  ],
  entryComponents: [
    CreateApplicationPage
  ]
})
export class CreateApplicationPageModule {}
