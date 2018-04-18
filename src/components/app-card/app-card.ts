import { Component,Input } from '@angular/core';
import { NavController, NavParams} from 'ionic-angular';

import { App } from '../../shared/models';
import { HelperUtil } from '../../shared/utils';
import { AppService } from '../../shared/services';

@Component({
  selector: 'app-card',
  templateUrl: 'app-card.html'
})
export class AppCardComponent {

  @Input('app') app;
  @Input('hideDeveloperName') hideDeveloperName;
  @Input('rootNavCtrl') rootNavCtrl;

  shimmerRandomID = this.helperUtil.randomUid();
  alive: boolean = true;
  appStats = {
    totalViews: 0,
    totalDownloads: 0,
    averageStarRating: 0,
  };

  constructor(
    public navCtrl: NavController,
    public helperUtil: HelperUtil,
    public appService: AppService,
  ) {
    setTimeout(()=>{
      if(this.app && this.app.uid){
        this.appService.getTotalViews(this.app.uid).takeWhile(()=>this.alive).subscribe(views=>{
          this.appStats.totalViews = views.length;
        });
        this.appService.getTotalDownloads(this.app.uid,this.alive).takeWhile(()=>this.alive).subscribe((downloadsObj:any)=>{
          this.appStats.totalDownloads = downloadsObj.totalDownloads;
        });
        this.appService.getReviews(this.app.uid,this.alive).takeWhile(()=>this.alive).subscribe((reviewsObj:any)=>{
          this.appStats.averageStarRating = reviewsObj.averageStarRating;
        });
      }
    });
  }

  loadedAppIcon(id){
    document.getElementById('app-icon-placeholder-'+id).classList.remove('app-icon-placeholder');
  }
  loadedAppThumbnail(id){
    document.getElementById('app-thumbnail-placeholder-'+id).classList.remove('app-thumbnail-placeholder');
  }
  goToApp(app){
    if(this.rootNavCtrl){
      this.rootNavCtrl.push('MainAppDetailsPage', {app_uid: app.uid});
    }else{
      this.navCtrl.push('MainAppDetailsPage', {app_uid: app.uid});
    }
  }

  ngOnDestroy(){
    this.alive = false;
  }

}
