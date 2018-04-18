import { Component,Input } from '@angular/core';
import { NavController } from 'ionic-angular';

import { HelperUtil,DialogUtil } from '../../shared/utils';
import { AppService,CacheService,UserService } from '../../shared/services';

@Component({
  selector: 'review',
  templateUrl: 'review.html'
})
export class ReviewComponent {

  @Input('review') review;
  @Input('app') app;
  @Input('clampText') clampText;

  shimmerRandomID = this.helperUtil.randomUid();
  reply: string;
  isEditing:boolean = false;
  alive: boolean = true;

  constructor(
    public helperUtil: HelperUtil,
    public navCtrl: NavController,
    public dialogUtil: DialogUtil,
    public cacheService: CacheService,
    public userService: UserService,
    public appService: AppService,
  ) {

  }

  ngOnInit(){
    if(this.review){
      this.userService._getUserData(this.review.user_uid).takeWhile(()=>this.alive).subscribe(userData=>{
        this.review['userPhotoURL'] = userData.photoURL;
        this.review['userName'] = userData.name;
      });
    }
    if(this.review.reply){
      this.userService._getUserData(this.review.reply.user_uid)
        .takeWhile(()=>this.alive)
        .subscribe(userData=>{
          this.review.reply['userName'] = userData.name;
          this.review.reply['userPhotoURL'] = userData.photoURL;
        });
    }

  }

  loadedUserPhoto(id){
    document.getElementById('user-photo-placeholder-'+id).classList.remove('user-photo-placeholder');
  }

  navigateToUser(user_uid){
    this.navCtrl.push('UserProfilePage', {user_uid:user_uid});
  }

  reviewOptions(type,review){
    if(type === 'reply'){
      this.isEditing = !this.isEditing;
    }else if(type === 'edit'){
      this.isEditing = !this.isEditing;
      this.reply = review.reply.comment;
    }else if(type === 'delete'){
      new Promise((resolve,reject)=>{
        let buttons = [
          { text: 'No', handler: reject },
          { text: 'Yes', handler: resolve },
        ];
        this.dialogUtil.showConfirm('Are you sure to delete your comment?', buttons,'');
      }).then(()=>{
        this.appService.deleteReplyToReview(this.app.uid, this.review.$key).then(()=>{
          this.dialogUtil.showToast('Comment deleted.',3000,'bottom');
          this.dialogUtil.hideLoader();
        },e=>{
          this.dialogUtil.showToast('Error in deleting your comment.',4000,'bottom');
          this.dialogUtil.hideLoader();
        });
      },()=>{});
    }else if(type === 'flag'){
      new Promise((resolve,reject)=>{
        let buttons = [
          { text: 'No', handler: reject },
          { text: 'Yes', handler: resolve },
        ];
        let msg = 'Are you sure to flag this review as spam/inappropriate?';
        if(review.isFlagged){ msg = 'Are you sure to remove the flag for this review?';}
        this.dialogUtil.showConfirm(msg, buttons,'');
      }).then(()=>{
        let loaderMsg = 'Flagging review.';
        if(review.isFlagged){ loaderMsg = 'Removing flag.';}
        this.dialogUtil.showLoader(loaderMsg);

        if(!review.isFlagged){
          this.appService.flagReview(this.app.uid, this.review.$key).then(()=>{
            this.dialogUtil.showAlert('Review has been flagged. Once this review has been confirmed as spam/inappropriate, it will be deleted accordingly.','Ok');
            this.dialogUtil.hideLoader();
          },e=>{
            this.dialogUtil.showAlert('Error in flagging the review.','Ok');
            this.dialogUtil.hideLoader();
          });
        }else{
          this.appService.removeFlagReview(this.app.uid, this.review.$key).then(()=>{
            this.dialogUtil.showToast('Flag has been removed.',3000,'Ok');
            this.dialogUtil.hideLoader();
          },e=>{
            this.dialogUtil.showAlert('Error in removing the flag.','Ok');
            this.dialogUtil.hideLoader();
          });
        }
      },()=>{});
    }
  }

  sendReply(){
    if(this.reply){ this.reply = this.reply.trim(); }
    if((this.reply && this.reply.length == 0) || !this.reply){
      this.dialogUtil.showToast('Please write your comment.', 3000, 'bottom');
    }else if(this.reply && this.reply.length > 1000){
      this.dialogUtil.showToast('Your comment to this review exceeds the character length of 1000.', 4000, 'bottom');
    }else{
      this.dialogUtil.showLoader('Saving comment.',true);
      this.appService.saveReplyToReview(this.app.uid, this.review.$key, this.reply).then(()=>{
        this.isEditing = false;
        this.dialogUtil.showToast(`Your comment has been saved.`, 3000, 'bottom');
        this.dialogUtil.hideLoader();
      },e=>{
        console.log('ERROR save comment',e);
        this.dialogUtil.showToast('Error in saving your comment.', 4000, 'bottom');
        this.dialogUtil.hideLoader();
      });
    }
  }

  ngOnDestroy(){
    this.alive = false;
  }
}
