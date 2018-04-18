import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,ViewController } from 'ionic-angular';

import { AppService, UserService,FileService,CacheService } from "../../../shared/services";
import { HelperUtil } from "../../../shared/utils";
import { User,App,Review } from "../../../shared/models";

@IonicPage()
@Component({
  selector: 'page-review-list',
  templateUrl: 'review-list.html',
})
export class ReviewListPage {

  app: App;
  reviews: Review;
  alive: boolean = true;
  constructor(
    public navCtrl: NavController, 
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public cacheService: CacheService,
    public appService: AppService,
  ) {
  }

  ionViewDidLoad() {
    this.app = this.navParams.get('app');
    // this.reviews = this.navParams.get('reviews');
    this.getReviews();
  }

  getReviews(){
    this.appService.getReviewsOnly(this.app.uid)
      .takeWhile(()=>this.alive)
      .subscribe(reviews=>{
        this.reviews = reviews;
      });
  }

  dismiss(){
    this.viewCtrl.dismiss();
  }

  ngOnDestroy(){
    this.alive = false;
  }

}
