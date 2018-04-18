import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,ViewController, ModalController } from 'ionic-angular';

import { AppService, UserService,FileService } from "../../../shared/services";
import { HelperUtil } from "../../../shared/utils";
import { App } from "../../../shared/models";

import { ObjectToArray } from '../../../shared/pipes/helper/objToArray';

@IonicPage()
@Component({
  selector: 'page-download-modal',
  templateUrl: 'download-modal.html',
})
export class DownloadModalPage {

  app:App;
  appStats;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public userService: UserService,
    public modalCtrl: ModalController,
    public viewCtrl: ViewController,
    public appService: AppService,
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad DownloadModalPage');
    console.log(this.navParams);
    this.app = this.navParams.get('app');
    this.appStats = this.navParams.get('appStats');
  }

  navigateTo(type){
    this.navCtrl.push('ConfirmDownloadPage', {app: this.app, appStats: this.appStats,type: type,viewCtrl: this.viewCtrl}, {
      animate: true,
      animation: 'ios-transition'
    });
  }

  dismiss(){
    this.navParams.data.viewCtrl.dismiss();
  }

}
