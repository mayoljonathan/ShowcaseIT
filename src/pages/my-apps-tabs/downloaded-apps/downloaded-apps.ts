import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AppService, UserService,FileService,CacheService } from "../../../shared/services";
import { HelperUtil,DialogUtil } from "../../../shared/utils";
import { App } from "../../../shared/models";

@IonicPage({segment:'downloaded'})
@Component({
  selector: 'page-downloaded-apps',
  templateUrl: 'downloaded-apps.html',
})
export class DownloadedAppsPage {

  apps: Array<App>;

  alive: boolean = true;
  pageLoaded = false;
  rootNavCtrl: NavController;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public userService: UserService,
    public appService: AppService,
  ) {
    this.rootNavCtrl = navParams.get('rootNavCtrl');
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad DownloadedAppsPage');
    this.getDownloadedApps();
  }

  getDownloadedApps(){
    this.pageLoaded = false;
    this.userService.getDownloadedApps()
      .takeWhile(()=>this.alive)
      .subscribe(downloadedApps=>{
        if(downloadedApps && downloadedApps.length > 0){
          downloadedApps.forEach((app,index)=>{
            this.appService.getMainAppDetails(app.$key).takeWhile(()=>this.alive).subscribe(appData=>{
              app = Object.assign(app, appData);

              if(index == downloadedApps.length-1){
                this.pageLoaded = true;
              }
            }); 
          });
        }else{
          this.pageLoaded = true;
        }

        this.apps = downloadedApps;
        console.log('DOWNLOADED');
        console.log(this.apps);
      });
  }

  navigateToApp(i){
    this.rootNavCtrl.push('MainAppDetailsPage', {app_uid: this.apps[i].uid});
  }

  loadedAppIcon(index){
    document.getElementById('app-icon-placeholder-'+index).className = '';
  }

  ngOnDestroy(){
    this.alive = false;
  }
}
