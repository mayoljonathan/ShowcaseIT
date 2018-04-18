import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,Events,ModalController } from 'ionic-angular';

import { App } from '../../../../../../shared/models';
import { AppService,FileService } from '../../../../../../shared/services';

import { DialogUtil,PlatformUtil } from '../../../../../../shared/utils';
import "rxjs/add/operator/takeWhile";

@IonicPage({segment: 'releases'})
@Component({
  selector: 'page-app-releases',
  templateUrl: 'app-releases.html',
})
export class AppReleasesPage {

  app: App;
  alive: boolean = true;

  // A copy of the app.platforms.android.releases
  releases = [];

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public modalCtrl: ModalController,
    public events: Events,
    public appService: AppService,
    public fileService: FileService,
    public dialogUtil: DialogUtil,
  ) {
    this.app = new App();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AppReleasesPage');
    this.app.uid = this.navParams.get('uid');

    this.events.subscribe('dev-app:master_app_data_received', (data)=> {
      console.log('I RECEIVED IT');
      console.log(data);
      this.app.status = data.status;
      this.app['status_cu'] = data.status_cu || null;
      if(data.platforms && data.platforms.android){
        this.releases = data.platforms.android.releases;
      }
    });

    // TWO TABS ARE CACHED INSTANTLY WHEN DETAILED-APP TABS LOADED , SO THIS WILL BE MANUALLY REQUESTING FOR AN MASTER APP DATA
    this.events.subscribe('dev-app:acknowledge_releases_app_data', (data) => {
      console.log('dev-app:acknowledge_releases_app_data in app-releases');
      this.app.status = data.status;
      this.app['status_cu'] = data.status_cu || null;

      console.log(this.app);
      // this.app.platforms.android = data.platforms.android;

      if(data.platforms && data.platforms.android){
        Object.assign(this.app.platforms.android, data.platforms.android);
        // this.app.platforms.android = data.platforms.android;
      }

      this.releases = this.app.platforms.android.releases;

      console.log('bABY====================================');
      console.log(this.releases);
      console.log('====================================');

      if(!this.app.platforms.android.releases){
        console.log('No releases in app-releases');
        this.releases = [];
      }

      // if(this.releases.length > 0){
      //   // Remove undefined values (reason: when user has deleted a release that results to an array [0,undefined,2])
      //   this.releases = this.releases.filter((id)=>{
      //     return id !== undefined;
      //   });
      // }

      // if(this.app.platforms.android.releases.length > 0){
      //   this.app.platforms.android.releases.forEach((release,index)=>{
      //     // If it reaches to the last release then make it the releaseNumber
      //     if(this.app.platforms.android.releases.length == index+1){
      //       this.androidReleaseNumber = index;
      //     }
      //   });
      // }

      this.events.publish('dev-app:app_releases_received', this.app);
    });

    console.log('PUBLISHING request');
    this.events.publish('dev-app:request_master_app_data');

    this.events.subscribe('dev-app:android_compatible_to_releases', (compatible) => {
      this.app.platforms.android.isCompatible = compatible;
    });
  }

  presentAddRelease(){
    if(this.releases.length!=0 && !this.releases[this.releases.length-1].errorParsingApk && this.releases[this.releases.length-1].packageName && this.app.platforms.android.isCompatible && this.app.status !== 'pending_publication'){
      const modal = this.modalCtrl.create('AddReleasePage', {app: this.app}, {enableBackdropDismiss: false});
      modal.present();
    }
  }

  viewRelease(release){
    console.log(release);
    if(release.isUploading || release.errorParsingApk || !release.packageName){
      return;
    }
    const modal = this.modalCtrl.create('ApkDetailsPage', {app_releases: release, app_uid: this.app.uid, app_status: this.app.status, app_status_cu: this.app['status_cu']});
    modal.present();
  }

  showMoreActions(release,index){
    console.log(release);
    new Promise(resolve=>{
      let viewHandler = function(){ resolve('view'); }
      let editHandler = function(){ resolve('edit'); }
      let downloadHandler = function(){ resolve('download'); }
      let enableHandler = function(){ resolve('enable'); }
      let disableHandler = function(){ resolve('disable'); }
      let deleteHandler = function(){ resolve('delete'); }

      let buttons = [
        { text: 'View details', icon: 'md-eye' ,handler: viewHandler },
        { text: 'Edit release name', icon: 'md-create' ,handler: editHandler },
        { text: 'Download apk for this release', icon: 'md-download' ,handler: downloadHandler },
        // { text: 'Enable release in showcase', icon: 'md-checkmark-circle' ,handler: enableHandler },
        // { text: 'Disable release in showcase', icon: 'md-close-circle' ,handler: disableHandler },
        { text: 'Delete release', icon: 'md-trash', role: 'destructive', handler: deleteHandler },
      ];
      let title = release.releaseName ? release.releaseName : 'Version: '+release.versionName;
      if(release.errorParsingApk || release.isUploading){
        buttons = buttons.slice(-1);
        title = "";
      }else if(this.app.status === 'pending_publication' || this.app['status_cu'] === 'pending_update'){
        buttons.splice(1,1); //remove edit release name
        buttons.pop(); //remove delete release
      }
      this.dialogUtil.showActionSheet(null,buttons,title);
    }).then(result=>{
      if(result === 'view'){
        this.viewRelease(release);
      }else if(result === 'edit'){
        new Promise((resolve,reject)=>{
          let promptTitle = 'Edit release name';
          let promptMsg = 'Used for identifying your release and only you can see this. (Leave blank to make version name as release name)';
          let inputs = {
            name: 'release_name',
            placeholder: 'Release name',
            value: release.releaseName || release.versionName
          };
          let buttons = [
            { text: 'Cancel', handler: reject },
            { text: 'Save', handler: resolve },
          ];
          this.dialogUtil.showPrompt(promptTitle,promptMsg,inputs,buttons);
        }).then((data:any)=>{
          if(data.release_name.trim().length > 20){
            return this.dialogUtil.showToast('Release name has a minimum characters of 20.', 4000, 'bottom');
          }
          if(data.release_name !== release.releaseName){
            this.dialogUtil.showLoader('Updating release name.');
            this.appService.updateReleaseName(data.release_name,release,this.app.uid).then(()=>{
              this.dialogUtil.showToast('Release name has been updated.', 3000,'bottom');
              this.dialogUtil.hideLoader();
            });
          }
        },()=>{});
      }else if(result === 'download'){
        this.fileService.downloadFile(release.demoDownloadURL);
      }else if(result === 'delete'){
        // AUTO DELETE WHEN ERROR PARSING APK
        if(release.errorParsingApk){
          this.dialogUtil.showLoader('Deleting release.');
          return this.appService.updateApp(`delete_release_android`,this.app,release.masterReleaseCode).then(()=>{
            this.dialogUtil.showToast('Release deleted successfully.', 3000, 'bottom');
            this.dialogUtil.hideLoader();
          });
        }
        this.presentDeleteRelease(release.masterReleaseCode,index);
      }
    });

  }

  presentDeleteRelease(releaseCode,index){
      let alertTitle = `Delete release?`;
      if(index == 0){
        alertTitle = 'Delete initial release?';
      }
      new Promise((resolve,reject)=>{
        let buttons = [
          { text: 'No', handler: reject },
          { text: 'Yes', handler: resolve },
        ];
        this.dialogUtil.showConfirm(`Are you sure you want to delete this release? This action cannot be undone.`, buttons,`${alertTitle}`);
      }).then(()=>{
        this.dialogUtil.showLoader('Deleting release.');
        this.appService.updateApp(`delete_release_android`,this.app,releaseCode).then(()=>{
          this.dialogUtil.showToast('Release deleted successfully.', 3000, 'bottom');
          this.dialogUtil.hideLoader();
        });
      },()=>{});
  }

  ngOnDestroy(){
    this.events.unsubscribe('dev-app:acknowledge_releases_app_data');
    this.events.unsubscribe('dev-app:android_compatible_to_releases');
  }

}
