import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,MenuController } from 'ionic-angular';

import { CacheService } from '../../shared/services';

@IonicPage({segment: 'startup'})
@Component({
  selector: 'page-startup-loading',
  templateUrl: 'startup-loading.html',
})
export class StartupLoadingPage {

  timeoutCounter: number = 0;
  connectionError: boolean = false;
  isMaintenance: boolean = false;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public cacheService: CacheService,
    public menuCtrl: MenuController,
  ) {
    this.isMaintenance = this.navParams.get('maintenance');
    if(this.isMaintenance){
      menuCtrl.enable(false);
      return;
    }
    menuCtrl.enable(false);

    // let url = window.location.href;
    // var parts = url.split('/');
    // var lastSegment = parts.pop();  // handle potential trailing slash

    // console.log(lastSegment);

    let redirectUrl = this.getParameterByName('req',window.location.href)
    setTimeout(()=>{
      if(redirectUrl){
      redirectUrl = redirectUrl
                    .replace(/^http\:\/\//, '') // remove the leading http:// (temporarily)
                    .replace(/\/+/g, '/')       // replace consecutive slashes with a single slash
                    .replace(/\/+$/, '');       // remove trailing slashes  
      }
      console.log(redirectUrl); 
      // redirectUrl = redirectUrl.replace(/\//g, "");
      if(!redirectUrl || redirectUrl == null || redirectUrl == 'undefined' || redirectUrl == 'startup'){
        redirectUrl = 'home';
      }
      console.log(`Redirecting to : #${redirectUrl}`);
      this.menuCtrl.enable(true);
      window.location.href = `#${redirectUrl}`;
    },1000);
  }

  retry(){
    this.navCtrl.setRoot('HomePage');
  }

  getParameterByName(name, url) {
      if (!url) url = window.location.href;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
          results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad StartupLoadingPage');
    this.listenConnection();
  }

  listenConnection(){
    let listener = setInterval(()=>{
      if(this.timeoutCounter == 60){
        this.connectionError = true;
        clearInterval(listener);
      }
      if(this.cacheService.isConnected && this.cacheService.isDoneCheckingUserData){
        clearInterval(listener);
        // this.navCtrl.setRoot('HomePage');
      }
      this.timeoutCounter++;
    },500);
  }

}
