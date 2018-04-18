import { Component,Input } from '@angular/core';
import { IonicPage, NavController, NavParams,Events,ModalController } from 'ionic-angular';

import { App } from '../../../../../../shared/models';
import { AppService,FileService } from '../../../../../../shared/services';

import { DialogUtil,HelperUtil } from '../../../../../../shared/utils';
import "rxjs/add/operator/takeWhile";

@IonicPage({segment: 'publish'})
@Component({
  selector: 'page-app-publish',
  templateUrl: 'app-publish.html',
})
export class AppPublishPage {

  app: App;
  appErrors: {};
  rootNavCtrl: NavController;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public modalCtrl: ModalController,
    public events: Events,
    public appService: AppService,
    public fileService: FileService,
    public dialogUtil: DialogUtil,
    public helperUtil: HelperUtil,
  ){
    this.app = new App();
    this.rootNavCtrl = navParams.get('rootNavCtrl');
  }

  ionViewDidEnter() {
    console.log('ionViewDidLoad AppPublishPage');
 
    this.events.subscribe('dev-app:publish_request_errors', (data) => {
      console.log('----------- PUBLISH REQUEST ERRORS ------------');
      this.appErrors = data;
      console.log(this.appErrors);
    });

    // MASTER DATA
    this.events.subscribe('dev-app:acknowledge_releases_app_data', (data) => {
      this.app = data;

      console.log('HERE IS THE MASTER DATA');
      console.log(this.app);
    });

    // IF DATA CHANGES
    // Subscribe to app-details data
    this.events.subscribe('dev-app:app_details_received', (data) => {
      this.events.publish('dev-app:publish_request');
    });
    // Subscribe to app-distributions data
    this.events.subscribe('dev-app:app_distributions_received', () => {
      this.events.publish('dev-app:publish_request');
    });

    this.events.publish('dev-app:publish_request');
    this.events.publish('dev-app:request_master_app_data');
    
  }

  navigateToApp(){
    this.rootNavCtrl.push('MainAppDetailsPage', {app_uid: this.app.uid});
  }

  togglePublish(type){
    // When published one time
    if(type === 'publish'){
      new Promise((resolve,reject)=>{
        let buttons = [
          { text: 'No', handler: reject },
          { text: 'Yes', handler: resolve },
        ];
        this.dialogUtil.showConfirm(`Your app will be available to all users of the ShowcaseIT. Publish this app?`, buttons,`Publish App?`);
      }).then(()=>{
        this.dialogUtil.showLoader('Publishing the app.');
        this.appService.togglePublish(this.app.uid,type).then(()=>{
          this.dialogUtil.showToast('Your app has been published successfully.', 4000, 'bottom');
          this.dialogUtil.hideLoader();
        });
      },()=>{});
    }else if(type === 'unpublish'){
      new Promise((resolve,reject)=>{
        let buttons = [
          { text: 'No', handler: reject },
          { text: 'Yes', handler: resolve },
        ];
        this.dialogUtil.showConfirm(`Your app will not be available to all users of the ShowcaseIT. Unpublish this app?`, buttons,`Unpublish App?`);
      }).then(()=>{
        this.dialogUtil.showLoader('Unpublishing the app.');
        this.appService.togglePublish(this.app.uid,type).then(()=>{
          this.dialogUtil.showToast('Your app has been unpublished successfully.', 4000, 'bottom');
          this.dialogUtil.hideLoader();
        });
      },()=>{});
    // Not yet published
    }else if(type === 'toggle_pr'){
      this.events.publish('dev-app:publish_request');

      if(this.app.status === 'draft'){
        console.log('You are going to publish');
        setTimeout(()=>{
          if(this.appErrors['error']){
            let errors = '';
            for(let i=0;i<this.appErrors['errors'].length;i++){
              errors += this.appErrors['errors'][i]+"<br/>";
            }
            this.dialogUtil.showAlert(errors,'Ok','Unable to publish');
          }else{
            new Promise((resolve,reject)=>{
              let buttons = [
                { text: 'No', handler: reject },
                { text: 'Yes', handler: resolve },
              ];
              this.dialogUtil.showConfirm(`Your app will be available to all users of the ShowcaseIT once approved. Publish this app?`, buttons,`Publish App?`);
            }).then(()=>{
              this.events.publish('dev-app:publish_app_request');
            },()=>{});
          }
        },200);
      }else if(this.app.status === 'pending_publication'){
        console.log('Cancel request for publish');
        new Promise((resolve,reject)=>{
          let buttons = [
            { text: 'No', handler: reject },
            { text: 'Yes', handler: resolve },
          ];
          this.dialogUtil.showConfirm(`Are you sure you want to cancel publish request?`, buttons,`Cancel publish request?`);
        }).then(()=>{
          this.dialogUtil.showLoader('Cancelling publish request.');
          this.appService.updateApp('all',this.app,'cancel_publish_request').then(()=>{
            this.dialogUtil.showToast('Cancelled publish request successfully.', 4000, 'bottom');
            this.dialogUtil.hideLoader();
          });
        },()=>{});
      }
    }

  }

  launchEmail(){
    window.open('mailto:showcase.it.team@gmail.com');
    return false;
  }

  toggleContentUpdate(type){
    if(!this.app['disabledByAdminUid']){
      if(type === 'request_cu'){
        this.events.publish('dev-app:content_update_request');
      }else if(type === 'cancel_cu'){
        new Promise((resolve,reject)=>{
          let buttons = [
            { text: 'No', handler: reject },
            { text: 'Yes', handler: resolve },
          ];
          this.dialogUtil.showConfirm(`Are you sure you want to cancel content update request?`, buttons,`Cancel content update request?`);
        }).then(()=>{
          this.dialogUtil.showLoader('Cancelling content update request.');
          this.appService.updateApp('all',this.app,type).then(()=>{
            this.dialogUtil.showToast('Cancelled content update request successfully.', 4000, 'bottom');
            this.dialogUtil.hideLoader();
          });
        },()=>{});
      }
    }
  }

  ionViewWillLeave(){
    console.log('DESTROYING APP-PUBLISH');
    this.events.unsubscribe('dev-app:acknowledge_releases_app_data');
    this.events.unsubscribe('dev-app:publish_request_errors');
    this.events.unsubscribe('dev-app:app_details_received');
    this.events.unsubscribe('dev-app:app_distributions_received');
  }

}
