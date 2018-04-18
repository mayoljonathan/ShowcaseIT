import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SignInModalPage } from './sign-in';

@NgModule({
  declarations: [
    SignInModalPage
  ],
  imports: [
    IonicPageModule.forChild(SignInModalPage)
  ],
  entryComponents: [
    SignInModalPage
  ]
})
export class SignInModule {}