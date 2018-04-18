import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,ViewController } from 'ionic-angular';

import { AppService, UserService,FileService,CacheService } from "../../../shared/services";
import { HelperUtil,DialogUtil } from "../../../shared/utils";
import { User,App,Review } from "../../../shared/models";

@IonicPage()
@Component({
  selector: 'page-write-review',
  templateUrl: 'write-review.html',
})
export class WriteReviewPage {

  app: App;
  user: User;
  review: Review;
  duplicateComment: string = '';
  
  alive: boolean = true;
  isEditing: boolean = false;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public viewCtrl: ViewController,  
    public userService: UserService,
    public appService: AppService,
    public cacheService: CacheService,
    public dialogUtil: DialogUtil,
  ) {
    this.app = this.navParams.get('app');
    this.isEditing = this.navParams.get('edit');
    if(this.navParams.get('myReview') && this.isEditing){
      this.review = this.navParams.get('myReview');
      this.duplicateComment = this.review.comment;
    }else{
      this.review = {
        stars: 0,
        comment: '',
        dateReviewed: null
      };
    }
  }

  ionViewDidLoad() {
    this.getUserData();
  }

  getUserData(){
    this.userService._getUserData(this.cacheService.user_uid).takeWhile(()=>this.alive).subscribe(userData=>{
      this.user = userData;
    });
  }

  onUserPhotoLoad(){
    document.getElementById('user-photo-placeholder').classList.remove('shimmer');
  }

  onGetRatingStars(ev){
    this.review.stars = ev;
  }

  submitReview(){
    if(this.duplicateComment){ this.review.comment = this.duplicateComment.trim(); }
    // if(this.review.comment.length == 0){
    //   this.dialogUtil.showToast('Please write your review to this app.', 3000, 'bottom');
    // }
    if(this.review.stars == 0){
      this.dialogUtil.showToast('Please rate this app.', 3000, 'bottom');
    }else if(this.review.comment && this.review.comment.length > 1000){
      this.dialogUtil.showToast('Your review to this app exceeds the character length of 1000.', 4000, 'bottom');
    }else{
      this.dialogUtil.showLoader('Submitting review.',true);
      this.appService.setReview(this.app.uid, this.review, this.isEditing).catch((e)=>{
        console.log('ERROR REVIEW');
        this.dialogUtil.hideLoader();
        this.dialogUtil.showToast('Error in saving your review.', 4000, 'bottom');
      }).then(()=>{
        this.dialogUtil.hideLoader();
        this.dismiss();
        this.dialogUtil.showToast(`Your review has been ${this.isEditing ? 'updated': 'saved'}.`, 3000, 'bottom');
      });
    }
  }

  dismiss(){
    this.viewCtrl.dismiss();
  }

  ngOnDestroy(){
    this.alive = false;
  }

}
