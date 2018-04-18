import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AppService, UserService,FileService,CacheService } from "../../shared/services";
import { HelperUtil } from "../../shared/utils";
import { User,App } from "../../shared/models";

// import { ObjectToArray } from '../../shared/pipes/helper/objToArray';

@IonicPage({segment: 'user-profile/:user_uid'})
@Component({
  selector: 'page-user-profile',
  templateUrl: 'user-profile.html',
})
export class UserProfilePage {

  user: User;
  apps: Array<App> = [];

  alive: boolean = true;

  isDeveloper: boolean = false;

  pageLoaded: boolean = false;
  errorLoad: boolean = false;

  user_uid: string;

  isOnline: boolean = false;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public userService: UserService,
    public appService: AppService,
  ) {
  }

  ionViewDidLoad() {
    this.user_uid = this.navParams.get('user_uid');
    if(!this.user_uid){
      return this.navCtrl.setRoot('HomePage');
    }

    this.getUserData();
  }

  getUserData(){
    this.pageLoaded = false;
    this.userService._getUserData(this.user_uid)
    .takeWhile(()=>this.alive)
    .subscribe(userData=>{

      this.userService._getUserIsDeveloper(this.user_uid).takeWhile(()=>this.alive).subscribe(res=>{
        if(typeof res['$value'] === 'number'){
          this.isDeveloper = true;
        }else{
          this.isDeveloper = false;
        }
      }); 

      this.appService.getUserShowcasedApps(this.user_uid).takeWhile(()=> this.alive).subscribe(userApps=>{
        this.apps = userApps;
        this.pageLoaded = true;
      });

      this.userService.getOnlineState(this.user_uid).takeWhile(()=>this.alive).subscribe(online=>{
        if(online['$value'] === true){
          this.isOnline = true;
        }else{
          this.isOnline = false;
        }
      });

      this.user = userData;
    });
  }

  onUserPhotoLoad(){
    document.getElementById('user-photo-placeholder').classList.remove('shimmer');
  }

  retry(){
    this.errorLoad = false;
    this.pageLoaded = false;
    this.getUserData();
  }

  ngOnDestroy(){
    this.alive = false;
  }

}
