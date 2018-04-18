import { Component } from '@angular/core';
import { IonicPage, NavParams, ViewController  } from 'ionic-angular';
// Service
import { UserService,CacheService } from "../../services";

import { DialogUtil } from "../../utils";

@IonicPage()
@Component({
  selector: 'sign-in',
  templateUrl: 'sign-in.html'
})
export class SignInModalPage {

	socialButtons : Array<any> = [];

  requireNote: boolean = false;

  constructor(
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public dialogUtil: DialogUtil,
    public cacheService: CacheService,
    public userService: UserService,
  ) {
		this.socialButtons = [
      { name: 'facebook', icon:"logo-facebook"},
      { name: 'google', icon:"logo-google"},
      { name: 'github', icon:"logo-github"},
    ];
  }

  ionViewDidLoad(){
    this.requireNote = this.navParams.get('requireNote');
  }

  loginWith(provider: String){
    this.cacheService.isSigningIn = true;
    this.dialogUtil.showLoader('Signing in.');
    this.userService.loginWith(provider).then(result=>{
      this.cacheService.isSigningIn = false;
      if(result.code){
        if(result.code === 'auth/popup-closed-by-user'){
          this.dialogUtil.showAlert('Sign in failed. Please try again.', 'Ok','Notice');
        }else{
          this.dialogUtil.showAlert(result.message, 'Ok','Notice');
        }
      }else if(result.canLogin == false) {
        this.dialogUtil.showAlert(result.message, 'Ok','Notice');
      }else if(result.canLogin){
        this.dismiss();
        let msg = 'Welcome ';
        result.newUser ? msg = msg+result.name : msg = msg+`back ${result.name}`;
        this.dialogUtil.showToast(msg, 3000, 'bottom')
      }else{
        this.dialogUtil.showAlert(result.message, 'Ok','Error');
      }
      this.dialogUtil.hideLoader();
    }).catch(err=>{
      this.dialogUtil.hideLoader();
    });
  }

  dismiss(data?: any) {
    this.viewCtrl.dismiss(data);
  }
}
