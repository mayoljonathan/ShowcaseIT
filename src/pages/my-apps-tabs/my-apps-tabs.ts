import { Component,ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { DialogUtil,HelperUtil } from '../../shared/utils';
import { App } from '../../shared/models';
import { AppService,CacheService } from '../../shared/services';

@IonicPage({segment:'my-apps'})
@Component({
  selector: 'page-my-apps-tabs',
  templateUrl: 'my-apps-tabs.html',
})
export class MyAppsTabsPage {

  @ViewChild('superTabs') superTabs; 

  tab1 = 'DownloadedAppsPage';
  tab2 = 'FavoriteAppsPage';

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MyAppsTabsPage');
    setTimeout(()=>{
      this.superTabs.enableTabsSwipe(false);
    },250);
  }

}
