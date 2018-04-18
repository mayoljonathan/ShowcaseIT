import { Component,ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams,ModalController } from 'ionic-angular';

import { AppService, UserService,FileService,CacheService } from "../../shared/services";
import { HelperUtil,DialogUtil } from "../../shared/utils";
import { App } from "../../shared/models";

import { ObjectToArray } from '../../shared/pipes/helper/objToArray';
import { ShareButton, ShareProvider } from 'ngx-sharebuttons';

import { AngularFireAuth } from 'angularfire2/auth';

@IonicPage({segment:'app/:app_uid'})
@Component({
  selector: 'page-main-app-details',
  templateUrl: 'main-app-details.html',
})
export class MainAppDetailsPage {

  @ViewChild('appIconPlaceHolder') appIconPlaceHolder;

  app:App;

  private alive:boolean = true;

  private lastComponent: string = '';

  objToArr = new ObjectToArray();

  pageLoaded:boolean = false;
  errorLoad: boolean = false;
  appNotAvailable: boolean = false;
  totalShare: number = 0;

  isFavorited: boolean = false;
  myReview = null;
  appStats = {
    totalViews: 0,
    totalDownloads: 0,
    downloads: {}, //an object containing downloads from different platforms
    averageStarRating: 0,
    totalReviews: 0,
    reviews: [],
    stars: {1:0,2:0,3:0,4:0,5:0}
  };
  stars = [5,4,3,2,1];

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public userService: UserService,
    public afAuth: AngularFireAuth,
    public appService: AppService,
    public cacheService: CacheService,
    public helperUtil: HelperUtil,
    public dialogUtil: DialogUtil,
    public fileService: FileService,
    public modalCtrl: ModalController,
  ) {
    this.app = new App();
  }

  // Total share
  sumCounts(count){
    this.totalShare += count;
  }

  get isOwnApp(){
    return this.app['user_uid'] === this.cacheService.user_uid;
  }

  get latestAndroidApp(){
    let releases = this.objToArr.transform(this.app.platforms.android.releases);
    return releases[releases.length-1];
  }

  get downloadAvailable(){
    return this.app.openSource && (this.app.openSource.sourceCodeDownloadURL || this.app.openSource.sourceCodeURL) ||
           this.app.platforms.android.demoURL || this.app.platforms.android.releases ||
           this.app.platforms.desktop.demoURL || this.app.platforms.desktop.demoDownloadURL;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MainAppDetailsPage');
    this.lastComponent = this.navCtrl.last().name;
    this.getAppData();
  }

  incrementViews(){
    if(!this.isOwnApp){ this.appService.incrementViews(this.app.uid);}
  }

  toggleFavorite(){
    let action = 'add';
    action = this.isFavorited ? 'remove' : 'add';
    this.userService.toggleFavorite(this.app.uid, action).then(()=>{
      if(action == 'add'){
        return this.dialogUtil.showToast('Added to favorites.',3000,'bottom');
      }
      return this.dialogUtil.showToast('Removed from favorites.',3000,'bottom');
    });
  }

  getAppStats(){
    this.appService.getTotalViews(this.app.uid).takeWhile(()=>this.alive).subscribe(views=>{
      this.appStats.totalViews = views.length;
    });
    this.appService.getTotalDownloads(this.app.uid,this.alive).takeWhile(()=>this.alive).subscribe((downloadsObj:any)=>{
      this.appStats.totalDownloads = downloadsObj.totalDownloads;
      this.appStats.downloads = downloadsObj.downloads;
    });

    this.appService.getReviews(this.app.uid,this.alive).takeWhile(()=>this.alive).subscribe((reviewsObj:any)=>{
      if(reviewsObj){
        this.appStats.averageStarRating = reviewsObj.averageStarRating;
        this.appStats.stars = reviewsObj.stars;
        this.appStats.totalReviews = reviewsObj.totalReviews;

        // For each reviews, get the user data and append it
        this.appStats.reviews = reviewsObj.reviews;
        if(this.appStats.reviews && this.appStats.reviews.length > 0){
          this.appStats.reviews.forEach(review=>{
            if(this.cacheService.user_uid == review.user_uid){ this.myReview = review; }
            this.userService._getUserData(review.user_uid).takeWhile(()=>this.alive).subscribe(userData=>{
              review['userPhotoURL'] = userData.photoURL;
              review['userName'] = userData.name;
            });
          });
        }
      }
    });

    this.getMyReview();
  }

  getMyReview(){
    this.afAuth.authState.takeWhile(()=>this.alive).subscribe((user) => {
      if(user){ this.myReview = this.appStats.reviews.filter(r=> r.user_uid === this.cacheService.user_uid)[0];
      }else{ this.myReview = null; }
    });
  }

  loadedUserPhoto(id){
    document.getElementById('user-photo-placeholder-'+id).classList.remove('user-photo-placeholder');
  }

  getIsFavorited(){
    this.userService.getIsFavorited(this.app.uid).takeWhile(()=>this.alive).subscribe(isFavorited=>{
      this.isFavorited = isFavorited['dateFavorited'] ? true : false;
    });
  }
  
  getAppData(){
    this.app.uid = this.navParams.get('app_uid');
    if(!this.app.uid){ return this.goBack(); }
    this.appService.getMainAppDetails(this.app.uid)
      .takeWhile(()=> this.alive)
      .subscribe(appData=>{
        if(!appData.uid || (appData.status != 'published' && appData.user_uid != this.cacheService.user_uid || appData['disabledByAdminUid'])){
          this.pageLoaded = true;
          this.errorLoad = false;
          return this.appNotAvailable = true;
        }

        this.appService.getCategoryData(appData.type, appData.category).takeWhile(()=> this.alive).subscribe(categoryData=>{
          appData['category_name'] = categoryData['name'];
        });
        this.userService._getUserData(appData.user_uid).takeWhile(()=>this.alive).subscribe(userData=>{
          appData['userName'] = userData['name'];
          appData['userPhotoURL'] = userData['photoURL'];
          this.pageLoaded = true;
          this.errorLoad = false;
        });
        this.app = appData;
        console.log(this.app);

        // Follow up
        this.getAppStats();
        this.getIsFavorited();

        this.incrementViews();

    });

    // WHEN FAILED TO LOAD
    var timeout = setInterval(()=>{
      if(!this.app['userName']){
        this.errorLoad = true;
      }
      clearInterval(timeout);
    },30000);
  }

  retry(){
    this.errorLoad = false;
    this.pageLoaded = false;
    this.getAppData();
  }

  onScreenshotLoaded(index){
    document.getElementById('shimmer-'+index).classList.remove('shimmer');
  }

  loadedAppIcon(){
    this.appIconPlaceHolder.nativeElement.classList.remove('app-icon-placeholder')
  }

  launchURL(url){
    this.helperUtil.launchURL(url);
  }

  launchEmail(email){
    window.open('mailto:'+email);
    return false;
  }

  navigateToUser(user_uid){
    this.navCtrl.push('UserProfilePage', {user_uid:user_uid});
  }

  showDownloadModal(){
    if(!this.cacheService.isLoggedIn){
      return this.modalCtrl.create('SignInModalPage', {requireNote: true}).present();
    }
    this.modalCtrl.create('DownloadRootPage', {app: this.app, appStats: this.appStats}).present();
  }

  showWriteReviewModal(edit=false){
    if(!this.cacheService.isLoggedIn){
      return this.modalCtrl.create('SignInModalPage', {requireNote: true}).present();
    }
    let reviewCopy = {};
    if(this.myReview){
      reviewCopy = Object.assign(this.myReview, {key: this.myReview.$key});
    }
    this.modalCtrl.create('WriteReviewPage', {app: this.app,edit:edit,myReview: reviewCopy}).present();
  }

  showReviewList(){
    //  reviews: this.appStats.reviews
    this.modalCtrl.create('ReviewListPage', {app: this.app}).present();
  }

  presentRemoveReview(){
    new Promise((resolve,reject)=>{
      let buttons = [
        { text: 'No', handler: reject },
        { text: 'Yes', handler: resolve },
      ];
      this.dialogUtil.showConfirm('Are you sure to delete your own review?', buttons,'');
    }).then(()=>{
      this.dialogUtil.showLoader('Deleting review.');
      this.appService.removeReview(this.app.uid, this.myReview.$key).then(()=>{
        this.myReview = null;
        this.dialogUtil.showToast(`Review deleted successfully`, 3000, 'bottom');
        this.dialogUtil.hideLoader();
      },e=>{
        this.dialogUtil.showToast(`Error in deleting your review.`, 3000, 'bottom');
        this.dialogUtil.hideLoader();
      });
    },()=>{});
  }

  goBack(){
    // Triggers only if first load of web app is on maindetailedapp
    if(this.lastComponent == 'SearchPage' || this.lastComponent == 'FilteredAppsPage'){
      this.navCtrl.pop();
    }else{
      this.navCtrl.setRoot('HomePage', {},{
        animate: true,
        direction: 'back'
      });
    }
  }

}
