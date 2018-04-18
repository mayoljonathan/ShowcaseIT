import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { DialogUtil } from '../../../../shared/utils';
import { App } from '../../../../shared/models';
import { AppService,CacheService } from '../../../../shared/services';
import { Sort } from '../../../../shared/pipes/helper/sort';

@IonicPage({ segment: 'development/dashboard'})
@Component({
  selector: 'page-dashboard',
  templateUrl: 'dashboard.html',
})
export class DashboardPage {

  apps: Array<App>;

  alive: boolean = true;

  publishedApps: number = 0;
  unpublishedApps: number = 0;
  pendingPublicationApps: number = 0;
  pendingUpdateApps: number = 0;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    // public modalCtrl: ModalController,
    public dialogUtil: DialogUtil,
    public cacheService: CacheService,
    public appService: AppService,
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad DashboardPage');
    this.getPersonalApps();
  }

  getPersonalApps(){
    this.appService.getPersonalApps()
      .takeWhile(()=>this.alive)
      .subscribe((apps:any)=>{
        let activeApps:any = [];
        if(apps && apps.length != 0){
          apps.forEach((app,i)=>{
            app.uid = app.$key;
            app['appStats'] = {};
            if(!app.scheduledDeletion){
              if(app.status === 'published'){
                this.publishedApps++;
              }else if(app.status === 'unpublished'){
                this.unpublishedApps++;
              }else if(app.status === 'pending_publication'){
                this.pendingPublicationApps++;
              }else if(app.status === 'pending_update'){
                this.pendingUpdateApps++;
              }

              this.appService.getReviews(app.uid,this.alive).takeWhile(()=>this.alive).subscribe((reviewsObj:any)=>{
                if(reviewsObj){
                  app['appStats']['averageStarRating'] = reviewsObj.averageStarRating;
                }
              });
              activeApps.push(app);
            }
            this.apps = activeApps;
            this.apps = new Sort().transform(this.apps, 'dateCreated', 'desc');
          });
        }else{
          this.apps = activeApps;
        }
    });
  }

  onAppChange(val){
    console.log(val);
  }

}
