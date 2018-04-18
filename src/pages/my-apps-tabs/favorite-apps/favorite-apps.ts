import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AppService, UserService,FileService,CacheService } from "../../../shared/services";
import { HelperUtil,DialogUtil } from "../../../shared/utils";
import { App } from "../../../shared/models";

@IonicPage({segment:'favorites'})
@Component({
  selector: 'page-favorite-apps',
  templateUrl: 'favorite-apps.html',
})
export class FavoriteAppsPage {

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
    this.getFavoriteApps();
  }

  getFavoriteApps(){
    this.pageLoaded = false;
    this.userService.getFavoriteApps()
      .takeWhile(()=>this.alive)
      .subscribe(favoriteApps=>{

        if(favoriteApps && favoriteApps.length > 0){
          favoriteApps.forEach(app=>{
            this.appService.getMainAppDetails(app.$key).takeWhile(()=>this.alive).subscribe(appData=>{
              app = Object.assign(app, appData);
              this.userService._getUserData(app.user_uid).takeWhile(()=>this.alive).subscribe(userData=>{
                app['developer_name'] = userData.name;
              });
            }); 
          });
        }

        this.apps = favoriteApps;
        this.pageLoaded = true;
      });
  }

  ngOnDestroy(){
    this.alive = false;
  }

}
