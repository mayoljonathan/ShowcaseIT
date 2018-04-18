import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams,ViewController,Events } from 'ionic-angular';

import { App } from '../../../../../../shared/models';
import { AppService,FileService,ApkService } from '../../../../../../shared/services';
import { Sort } from '../../../../../../shared/pipes/helper/sort';

import { DialogUtil,PlatformUtil } from '../../../../../../shared/utils';

@IonicPage({segment: 'add-release'})
@Component({
  selector: 'page-add-release',
  templateUrl: 'add-release.html',
})
export class AddReleasePage {

  @ViewChild('apkUpload') apkUpload;

  app: App;

  // A copy of app.platforms.android.releases
  // newRelease = {};

  apkSizeLimit: number = 100;
  alive : boolean = true;

  errorParseApk: boolean = false;
  errorParseMsg: string = '';

  appPreview = null;
  hasUploadedPreview: boolean  = false;
  validAppPackageName: boolean = false;
  validAppVersionName: boolean = false;

  // Old apk data(your first release)
  appPackageName = '';
  appVersionName = 0;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public events: Events,
    public viewCtrl: ViewController,
    public dialogUtil: DialogUtil,
    public appService: AppService,
    public apkService: ApkService,
    public fileService: FileService,
  ) {
    this.app = new App();
  }

  get androidReleaseNumber(){
    // this.app.platforms.android.releases = new Sort().transform(this.app.platforms.android.releases,'dateCreated','desc');
    // return 0;
    return this.app.platforms.android.releases.length-1 == -1 ? 0 : this.app.platforms.android.releases.length-1;
    // return new Sort().transform(this.app.platforms.android.releases,'dateCreated','desc').pop();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AddReleasePage');

    Object.assign(this.app, this.navParams.get('app'));
    // this.app = this.navParams.get('app');
    console.log('GET GET GET');
    console.log(this.app);

    this.appPackageName = this.app.platforms.android.releases[this.androidReleaseNumber].packageName;
    this.appVersionName = this.app.platforms.android.releases[this.androidReleaseNumber].versionName;
   
    this.events.subscribe('dev-app:acknowledge_releases_app_data', (data) => {
      console.log('dev-app:acknowledge_releases_app_data in ADD_RELEASE');
      Object.assign(this.app.platforms.android.releases, data.platforms.android.releases);
      // console.log(this.app.platforms.android.releases);
      this.app['status_cu'] = data.status_cu || null;
      // this.setNewRelease();
      if(this.app['status_cu'] === 'pending_update'){
        this.dismiss();
      }
    });

  }

  // setNewRelease(){
  //   this.newRelease = this.app.platforms.android.releases[this.androidReleaseNumber];
  // }

  // Dragged file
  uploadFile(file){
    this.dialogUtil.hideLoader();
    this.apkUpload.nativeElement.value = '';
    
    this.app.platforms.android.releases.push({
      isUploading: true,
      uploadingError: false,
      paused: false,
      progress: 0,
      bytesTransferred: 0,
      demoFilename: file.name,
      demoFileSize: file.size,
      // dateCreated: Date.now() // patch for the androidReleaseNumber
    });

    const opts = {
      app_uid: this.app.uid,
    }

    this.fileService.uploadFile('apk',`app/distributions/${this.app.uid}`,file.path,file.name,opts)
      .takeWhile(()=>this.alive)
      .subscribe((data:any)=>{
        console.log('RESULT');
        console.log(data);

        if(data.progress){
          this.app.platforms.android.releases[this.androidReleaseNumber]['progress'] = data.progress;
          this.app.platforms.android.releases[this.androidReleaseNumber]['bytesTransferred'] = data.transferred;
        }else if(data.downloadURL){
          this.hasUploadedPreview = true;

          this.app.platforms.android.releases[this.androidReleaseNumber]['isUploading'] = false;
          this.app.platforms.android.releases[this.androidReleaseNumber]['demoDownloadURL'] = data.downloadURL;
          this.app.platforms.android.releases[this.androidReleaseNumber]['progress'] = 0;

          this.appService.previewApk(this.app,this.androidReleaseNumber).then((res:any)=>{
            if(res.result === 200){
              this.appPreview = res.data;
              this.appPreview['releaseNotes'] = '';
              if(this.appPreview.packageName === this.appPackageName){ this.validAppPackageName = true }
              if(this.apkService.compareVersion(this.appVersionName,this.appPreview.versionName)){ this.validAppVersionName = true }
            }else if(res.result === 415){
              this.hasUploadedPreview = false;
              this.errorParseApk = true;
              this.errorParseMsg = res.error;
              this.app.platforms.android.releases.splice(this.androidReleaseNumber,1);
            }
          }).catch(e=>{
            this.hasUploadedPreview = false;
            this.errorParseApk = true;
            this.errorParseMsg = e;
            this.app.platforms.android.releases.splice(this.androidReleaseNumber,1);
          });
          
        }else if(data.error){
          console.log('ERROR RECEIVED IN ANDROID');
          console.log(this.app.platforms.android.releases[this.androidReleaseNumber]);
          if(data.error.code !== 'storage/canceled' || data.error.code === 'function/busy'){
            this.app.platforms.android.releases[this.androidReleaseNumber].isUploading = false;
            this.app.platforms.android.releases[this.androidReleaseNumber]['uploadingError'] = true;
          }
        }
    });

  }

  // Browse Button Click
  onCustomUploadChange(e,fileSizeLimit){
    let file = e.target.files[0];

    if(file){
      let fileExtension = this.fileService.getExtension(file.name);
      if(fileExtension !== 'apk'){
        return this.dialogUtil.showToast('Please select an apk file.',3000,'bottom');
      }
      if(this.fileService.sizeLimitExceeded(file.size,fileSizeLimit)){
        return this.dialogUtil.showToast('Your selected file exceeds to the required size limit.',4000,'bottom');
      }
      
      this.dialogUtil.showLoader('Processing file...');

      var reader = new FileReader();
      reader.onload = (event:any) => {
        file['path'] = event.target.result;
        this.uploadFile(file);
      }
      reader.readAsDataURL(file);
    }
  }  

  clearAppPreview(){
    this.appPreview = null;
    this.hasUploadedPreview = false;
    this.app.platforms.android.releases.splice(this.androidReleaseNumber,1);
  }

  confirmRelease(){
    if(this.validAppPackageName && this.validAppVersionName){
      if(this.appPreview.releaseNotes.trim().length > 2000){
        return this.dialogUtil.showToast('Your release notes exceeds the maximum length of 2000 characters.', 4000, 'bottom');
      }

      this.dialogUtil.showLoader('Adding release.');
      this.appService.addRelease(this.app.uid,this.appPreview).then(()=>{
        this.dialogUtil.hideLoader();
        this.dialogUtil.showToast('Release added successfully.', 3000, 'bottom');
        // So that i can leave without alert showing
        this.hasUploadedPreview = false;
        this.dismiss();
      });
    }
  }

  changeUploadState(state,filename){
    if(state === 'cancel'){
      new Promise((resolve,reject)=>{
        let buttons = [
          { text: 'No', handler: reject },
          { text: 'Yes', handler: resolve },
        ];

        this.dialogUtil.showConfirm(`Are you sure you want to stop the upload?`, buttons,'Stop upload?');
      }).then(()=>{
        this.fileService.manageUpload(state,'apk',filename).then(()=>{
            this.app.platforms.android.releases.splice(this.androidReleaseNumber,1);
        }).catch(()=>{
          this.dialogUtil.showToast('An error has occured.', 3000, 'bottom');
        });
      },()=>{});
    }else{
      this.fileService.manageUpload(state,'apk',filename).then(()=>{
        this.app.platforms.android.releases[this.androidReleaseNumber]['paused'] = state === 'pause' ? true : false;
      }).catch(()=>{
        this.dialogUtil.showToast('An error has occured.', 3000, 'bottom');
      });
    }
  }

  dismiss(data?: any) {
    this.viewCtrl.dismiss(data);
  }

  ionViewCanLeave() : boolean | Promise<boolean>{
    if(!this.app.platforms.android.releases[this.androidReleaseNumber].isUploading && !this.hasUploadedPreview){
      return true;
    }

    return new Promise((resolve,reject)=>{
      let buttons = [
        { text: 'No', handler: reject },
        { text: 'Yes', handler: resolve },
      ];
      this.dialogUtil.showConfirm('Are you sure you want to discard your release?',buttons,'Discard release?');
    }).then(()=>{
      this.fileService.manageUpload('cancel','apk',this.app.platforms.android.releases[this.androidReleaseNumber].demoFilename).then(()=>{
        this.clearAppPreview();
      }).catch(()=>{
        this.clearAppPreview();
        // this.dialogUtil.showToast('An error has occured.', 3000, 'bottom');
      });

      return true;
    });
  }

}
