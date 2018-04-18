import { Component,ViewChild,Output,EventEmitter } from '@angular/core';
import { IonicPage, NavController, NavParams,PopoverController,Events } from 'ionic-angular';

import { DialogUtil,HelperUtil } from '../../../../../shared/utils';
import { App } from '../../../../../shared/models';
import { AppService,CacheService } from '../../../../../shared/services';

import { DetailedAppPopoverComponent } from '../../../../../components/detailed-app-popover/detailed-app-popover';

@IonicPage({segment: 'dev-panel/app/:uid'})
@Component({
  selector: 'page-detailed-app-tabs',
  templateUrl: 'detailed-app-tabs.html',
})
export class DetailedAppTabsPage {

  @ViewChild('superTabs') superTabs; 
  @Output() appData: EventEmitter<any> = new EventEmitter();

  app: App;
  alive: boolean = true;

  detailsData: {};
  distributionsData: {};
  releasesData: {};

  tab1 = 'AppDetailsPage';
  tab2 = 'AppDistributionPage';
  tab3 = 'AppReleasesPage';
  tab4 = 'AppPublishPage';

  constructor(
    public navCtrl: NavController, 
    public popoverCtrl: PopoverController,
    public events: Events,
    public appService: AppService,
    public dialogUtil: DialogUtil,
    public cacheService: CacheService,
    public helperUtil: HelperUtil,
    public navParams: NavParams
  ){
    this.app = new App();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad DetailedAppTabsPage');
    this.superTabs.enableTabsSwipe(false);
    this.app.uid = this.navParams.data['uid'];
    this.app.title = this.navParams.data['title'];

    // this.events.subscribe('dev-app:title_received', (data) => {
    //   this.app.title = data.title;
    // });

    // Subscribe to app-details when failing to get data
    this.events.subscribe('dev-app:request_go_all_apps', () => {
      this.goBack();
    });

    // Subscribe to app-details data
    this.events.subscribe('dev-app:app_details_received', (data) => {
      console.log('app_details received in detailed-app tabs');
      this.detailsData = data;
    });

    // Subscribe to app-distributions data
    this.events.subscribe('dev-app:app_distributions_received', (data) => {
      console.log('app_distributions received in detailed-app tabs');
      this.distributionsData = data;
    });


    // Subscribe to app-releases request to get master app data
    this.events.subscribe('dev-app:request_master_app_data', ()=>{
      this.events.publish('dev-app:acknowledge_releases_app_data', this.app);
    });

    // Checking for errors in publish request
    this.events.subscribe('dev-app:publish_request', ()=>{
      let master_app = new App();
      Object.assign(master_app, this.detailsData, this.distributionsData);

      this.validateAppData('publish_app', this.trimAppData(master_app)).then((res:any)=>{
        this.events.publish('dev-app:publish_request_errors', (res));
      });
    });

    // IF GOING TO PUBLISH APP (when confirmed)
    this.events.subscribe('dev-app:publish_app_request', ()=>{
      this.updateAppData('publish_request');
    });
    this.events.subscribe('dev-app:content_update_request', ()=>{
      this.updateAppData('content_update_request');
    });

    this.getAppDetails();
  }

  getAppDetails(){
    let counter = 0;
    this.dialogUtil.showLoader('Loading application data.',true);
    this.appService.getAppDetails(this.app.uid,this.cacheService.user_uid)
      .takeWhile(()=>this.alive)
      .subscribe(data=>{
        console.log('RUNNING NEW FRESH APP DETAILED APP TABS');
        // this.app = Object.assign(this.app, data);

        // If it fails to get data
        if(!data.uid){
          console.log('return to all apps');
          return this.events.publish('dev-app:request_go_all_apps');
        }

        this.app = data;
        console.log('====================================');
        console.log(this.app);
        console.log('====================================');

        if(this.app.platforms && this.app.platforms.android && this.app.platforms.android.releases){
          this.app.platforms.android.releases = Object.keys(this.app.platforms.android.releases).map((key) => {
            this.app.platforms.android.releases[key]['releaseCode'] = key; // it gets the index, i dont know why
            this.app.platforms.android.releases[key]['masterReleaseCode'] = key;
            return this.app.platforms.android.releases[key];
          });
        }

        // Set a delay for other components to load first for subscribing the master_app_data_received
        setTimeout(()=>{
          if(counter == 0){
            this.dialogUtil.hideLoader();
          }

          // SEND NEW UPDATES
          this.events.publish('dev-app:master_app_data_received', this.app);
          this.events.publish('dev-app:acknowledge_releases_app_data', this.app);
          counter++;
        },1500);

    });

  }


  onTabSelect(args){
    // Going to releases tab
    if(args.index === 2){
      this.events.publish('dev-app:request_android_compatible');
    }
  }

  trimAppData(app:App){
    app.title = app.title.trim();
    app.short_description = app.short_description ? app.short_description.trim() : null;
    app.full_description = app.full_description ? app.full_description.trim() : null;
    app.website = app.website ? app.website.trim() : null;
    app.email = app.email ? app.email.trim() : null;
    return app;
  }

  updateAppData(type){

    // if((this.detailsData['status'] !== 'pending_publication' || this.app.status !== 'pending_publication') && (this.detailsData['status_cu'] !== 'pending_update' || this.app['status_cu'] !== 'pending_update')){
    if(this.app.status !== 'pending_publication' && this.app['status_cu'] !== 'pending_update'){
      // Remove status_cu for fix bug
      this.detailsData['status_cu'] = null;
      this.detailsData['cu_request_dateCreated'] = null;
      
      // type === save_draft, publish_request
      let master_app = new App();
      Object.assign(master_app, this.detailsData, this.distributionsData);
      // console.log(master_app);

      this.validateAppData(type, this.trimAppData(master_app)).then((res:any)=>{
        console.log('RESULT IN VALIDATING');
        console.log(res)

        if(res.error){
          let errors = '';
          for(let i=0;i<res.errors.length;i++){
            errors += res.errors[i]+"<br/>";
          }
          this.dialogUtil.showAlert(errors,'Ok','Unable to save draft');
        }else{
          let loaderTitle = 'Saving changes.';
          let toastMsg = 'Your changes has been saved.';
          if(type === 'publish_request'){
            loaderTitle = 'Sending publish request.';
            toastMsg = 'Publish request sent successfully.';
          }
          else if(type === 'content_update_request'){
            loaderTitle = 'Sending content update request.';
            toastMsg = 'Content update request sent successfully.';
          }

          this.dialogUtil.showLoader(loaderTitle);
          this.appService.updateApp('all',master_app,type).then(()=>{
            this.dialogUtil.showToast(toastMsg, 4000, 'bottom');
            this.dialogUtil.hideLoader();
          });
        }
      });
    }
  }

  validateAppData(type,app:App){
    return new Promise(resolve=>{
      console.log('VALIDATING APP DATA');
      console.log(app);

      let maxTitleLength = 50;
      let maxSDLength = 80; // Short desc
      let maxFDLength = 3000; // Full desc
      
      let errors = [];

      if(app.screenshots){
        // Stops the loop if it founds a screenshot that is uploading
        app.screenshots.some(screenshot=>{
          if(screenshot.isUploading && !screenshot['low_res']){
            errors.push('Some screenshots are still uploading.');
            return true;
          }
        });
      }
      // IF ANDROID PLATFORM, Check for releases, if there are uploading
      if(app.platforms.android.releases && app.platforms.android.releases.length > 0){
        app.platforms.android.releases.some(release=>{
          if(release.isUploading){
            errors.push('A release is still uploading.');
            return true;
          }
          if(release.errorParsingApk){
            errors.push('Error in parsing the apk. Please check in releases tab.');
            return true;
          }
          if(!release.packageName){
            errors.push('Apk is still being parsed by the server.');
            return true;
          }
        });
      }
      // IF DESKTOP PLATFORM, Check if it was uploading
      if(app.platforms.desktop && app.platforms.desktop['isUploading']){
        errors.push('Desktop app archive is still uploading.');
      }
      // IF OPENSOURCE, Check if it was uploading
      if(app.openSource['isUploading']){
        errors.push('Source code archive is still uploading.');
      }

      if(app.title.trim().length == 0){ errors.push('App title is required.');}
      if(app.title.trim().length > maxTitleLength){ errors.push(`App title exceeds the maximum length of ${maxTitleLength} characters.`);}
      if(app.short_description && app.short_description.trim().length > maxSDLength){ errors.push(`Short description exceeds the maximum length of ${maxSDLength} characters.`);}
      if(app.full_description && app.full_description.trim().length > maxFDLength){ errors.push(`Full description exceeds the maximum length of ${maxSDLength} characters.`);}
      
      if(type === 'publish_app'){
        let fields = [
          {key: 'short_description',value: 'Short description is required.'},
          {key: 'full_description',value: 'Full description is required.'},
          {key: 'type',value: 'Application type is required.'},
          {key: 'category',value: 'Application category is required.'},
          {key: 'iconURL',value: 'App icon is required.'},
          {key: 'screenshots'},
          {key: 'email',value: 'Contact email address is required.'},
          {key: 'platforms'},
        ];

        for(let i=0;i<fields.length;i++){
          if(fields[i]['key'] === 'screenshots' && app[fields[i]['key']].length < 3){
            errors.push('Minimum of 3 screenshots are required.');
          }else if(fields[i]['key'] === 'platforms'){
            let count = 0;
            let platforms = ['web','android','desktop'];
            for(let x=0;x<platforms.length;x++){
              if(app[fields[i]['key']][platforms[x]]['isCompatible']){ count++ }
            }
            if(count === 0){
              errors.push('Platforms is required.');
            }
            // IF ANDROID PLATFORM, Check for releases, if there are uploading
            // if(app.platforms.android.releases.length > 0){
            //   app.platforms.android.releases.some(release=>{
            //     console.log(release);
            //     if(release.isUploading){
            //       errors.push('A release is still uploading.');
            //       return true;
            //     }
            //     if(release.errorParsingApk){
            //       errors.push('Error in parsing the apk. Please check in releases tab.');
            //       return true;
            //     }
            //   });
            // }
          }else if(fields[i]['key'] === 'email'){
            if(!this.helperUtil.isValidEmail(app[fields[i]['key']])){
              errors.push('Email address is not valid');
            }
          }else if(!app[fields[i]['key']]){
            errors.push(fields[i]['value']);
          }
        }

      }
      
      resolve({error: errors.length == 0 ? false : true ,errors: errors});
    });
  }

  // presentPopover(event){
  //   let popover = this.popoverCtrl.create(DetailedAppPopoverComponent);
  //   popover.present({
  //     ev: event
  //   });
  //   popover.onWillDismiss((selectedPopover) => {
  //     switch(selectedPopover){
  //       case 'save':
  //         console.log('Saving this data');

  //         console.log('DETAILSDATA');
  //         console.log(this.detailsData);
  //         console.log('------------');
  //         console.log('DISTRIBUTIONSDATA');
  //         console.log(this.distributionsData);

  //         let master_app = {};
  //         Object.assign(master_app, this.detailsData, this.distributionsData);
  //         console.log(master_app);

  //         this.updateAppData(master_app);

  //       case 'publish':
  //         console.log('publish');
  //         break;
  //     }
  //   })
  // }

  goBack(){
    this.navCtrl.setRoot('ApplicationsPage',{},{
      animate: true,
      direction: 'back'
    });
  }

  ngOnDestroy(){
    console.log('LEAVING detailed-app-tabs');
    this.alive = false;

    this.events.unsubscribe('dev-app:request_go_all_apps');

    this.events.unsubscribe('dev-app:app_details_received');
    this.events.unsubscribe('dev-app:app_distributions_received');

    this.events.unsubscribe('dev-app:request_master_app_data');

    this.events.unsubscribe('dev-app:publish_request');
    this.events.unsubscribe('dev-app:publish_app_request');
    this.events.unsubscribe('dev-app:content_update_request');
  }
}
