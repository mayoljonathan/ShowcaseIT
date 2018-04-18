import { Component,ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams,Events,ModalController } from 'ionic-angular';

import { App } from '../../../../../../shared/models';
import { AppService,FileService } from '../../../../../../shared/services';

import { DialogUtil,PlatformUtil,HelperUtil } from '../../../../../../shared/utils';
import "rxjs/add/operator/takeWhile";

@IonicPage({segment: 'distribution'})
@Component({
  selector: 'page-app-distribution',
  templateUrl: 'app-distribution.html',
})
export class AppDistributionPage {

  @ViewChild('apkUpload') apkUpload;
  @ViewChild('desktopUpload') desktopUpload;
  @ViewChild('sourceCodeUpload') sourceCodeUpload;

  app: App;
  
  platforms = [];
  alive: boolean = true;

  loadedOnce: boolean = false;

  // in MB
  apkSizeLimit: number = 100;
  desktopArchiveSizeLimit: number = 300;
  sourceCodeArchiveSizeLimit: number = 500;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public modalCtrl: ModalController,
    public events: Events,
    public appService: AppService,
    public fileService: FileService,
    public helperUtil: HelperUtil,
    public dialogUtil: DialogUtil,
  ){
    this.app = new App();

    // this.app.platforms.android['isUploading'] = true;
    // this.app.platforms.android['uploadingError'] = false;
    // this.app.platforms.android['progress'] = 5;
    // this.app.platforms.android.demoFilename = "Just a test app.apk";
    // this.app.platforms.android.demoFileSize = 105920; // in Bytes
    
    this.platforms = [
      {
        name: 'web',
        icon: 'md-globe',
        color: 'web_app',
      },
      {
        name: 'android',
        icon: 'logo-android',
        color: 'android',
      },
      {
        name: 'desktop',
        icon: 'md-desktop',
      },
    ];
  }

  get platformSelected(){
    if(this.app.platforms.web.isCompatible || this.app.platforms.android.isCompatible || this.app.platforms.desktop.isCompatible){
      return true;
    }
    return false;
  }

  get androidReleaseNumber(){
    return this.app.platforms.android.releases.length-1 == -1 ? 0 : this.app.platforms.android.releases.length-1;
  }

  // set androidReleaseNumber(releaseNumber){
  //   console.log('INCREMENTING!!!');
  //   // releaseNumber++;
  //   releaseNumber = this.fileService.randomUid();
  //   console.log(this.androidReleaseNumber);
  // }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AppDistributionPage');
    this.app.uid = this.navParams.get('uid');

    this.events.subscribe('dev-app:master_app_data_received', (data) => {
      console.log('master_app_data_received in app-distribution');
      this.app.status = data.status;
      this.app['status_cu'] = data.status_cu || null;

      console.log('HERE-NEW====================================');
      console.log(data);
      console.log('====================================');

      // console.log('HERE-OLD=========================');
      // console.log(this.app);
      // console.log('===================');

      

      if(!this.loadedOnce){
        console.log(this.app.platforms);
        // this.app.platforms.android = null;
        // this.app.platforms.web = null;
        // this.app.platforms.desktop = null;
        this.app.platforms.android = data.platforms.android;
        this.loadedOnce = !this.loadedOnce;
      }

      // IF opensource was deleted in database
      if(!data.openSource){
        console.log('CLEARING SOURCE');
        this.clearUploadData('source',true);
      }

      if(data.platforms){
        // Object.assign(this.app.openSource, data.openSource);
        // if(this.app.platforms.android.releases && this.app.platforms.android.releases.length != 0){
          // Object.assign(this.app.platforms.android, data.platforms.android);
          this.app.platforms.android = data.platforms.android;

        if(!this.app.platforms.web){
          this.app.platforms.web.isCompatible = false;
        }else{
          this.app.platforms.web = data.platforms.web;
        }
        // }
        if(!this.app.platforms.desktop['isUploading']){
          console.log('DO THIS IN DESKTOP');
          console.log(data.platforms.desktop);
          // if(!data.platforms.desktop){
            // this.app.platforms.desktop = ;
          // }else{
            this.app.platforms.desktop = data.platforms.desktop;
          // }
          // Object.assign(this.app.platforms.desktop, data.platforms.desktop);
        }
        if(!this.app.openSource['isUploading']){
          console.log('DO THIS IN OPENSOURCE');
          console.log(data.openSource);
          Object.assign(this.app.openSource, data.openSource);
        }

        // BUG SPOTTED
        // this.app.platforms.web = data.platforms.web;


        // this.app.platforms = Object.assign(this.app.platforms, data.platforms);

        console.log('====================================');
        console.log(this.app);
        console.log('====================================');

        // this.app.platforms = data.platforms;
        // this.app.openSource = data.openSource;
      }


      

      // GET THE LATEST RELEASE
      if(!this.app.platforms.android.releases){
        console.log('No release');
        this.app.platforms.android.releases = [];
        
      }else{
      // else if(this.app.platforms.android.releases.length > 0){
        console.log('Having releases');
        
        this.app.platforms.android.releases = Object.keys(this.app.platforms.android.releases).map((key) => {
          this.app.platforms.android.releases[key]['releaseCode'] = key;
          return this.app.platforms.android.releases[key];
        });
        // SORT BY DATE;
        this.app.platforms.android.releases = <any>this.helperUtil.sortObject(this.app.platforms.android.releases,'dateCreated');
      }

      this.events.publish('dev-app:app_distributions_received', this.app);
    });

    this.events.subscribe('dev-app:request_android_compatible', () => {
      console.log('Request if app is compatible to android');
      this.events.publish('dev-app:android_compatible_to_releases', (this.app.platforms.android.isCompatible));
    });

  }

  selectPlatform(platform){
    if(!this.app.platforms[platform.name].isUploading && this.app.status !== 'pending_publication' && this.app['status_cu'] !== 'pending_update'){
      this.app.platforms[platform.name].isCompatible = !this.app.platforms[platform.name].isCompatible;
    }
  }

  // Dragged file
  uploadFile(type,file){
    this.dialogUtil.hideLoader();

    if(type === 'apk'){
      this.apkUpload.nativeElement.value = '';
      
      this.app.platforms.android.releases.push({
        isUploading: true,
        uploadingError: false,
        paused: false,
        progress: 0,
        bytesTransferred: 0,
        demoFilename: file.name,
        demoFileSize: file.size
      });
    }else if(type === 'archive_desktop'){
      this.desktopUpload.nativeElement.value = '';

      this.app.platforms.desktop['isUploading'] = true;
      this.app.platforms.desktop['uploadingError'] = false;
      this.app.platforms.desktop['paused'] = false;
      this.app.platforms.desktop['progress'] = 0;
      this.app.platforms.desktop['bytesTransferred'] = 0;
      this.app.platforms.desktop.demoFilename = file.name;
      this.app.platforms.desktop.demoFileSize = file.size;
    }else{
      this.sourceCodeUpload.nativeElement.value = '';

      this.app.openSource['isUploading'] = true;
      this.app.openSource['uploadingError'] = false;
      this.app.openSource['paused'] = false;
      this.app.openSource['progress'] = 0;
      this.app.openSource['bytesTransferred'] = 0;
      this.app.openSource.sourceCodeFilename = file.name;
      this.app.openSource.sourceCodeFilesize = file.size;
    }

    const opts = {
      app_uid: this.app.uid,
    }
    
    this.fileService.uploadFile(type,`app/distributions/${this.app.uid}`,file.path,file.name,opts)
      .takeWhile(()=>this.alive)
      .subscribe((data:any)=>{
        console.log('RESULT');
        console.log(data);
        if(type === 'apk'){
          if(data.progress){
            this.app.platforms.android.releases[this.androidReleaseNumber]['progress'] = data.progress;
            this.app.platforms.android.releases[this.androidReleaseNumber]['bytesTransferred'] = data.transferred;
          }else if(data.downloadURL){
            this.app.platforms.android.releases[this.androidReleaseNumber]['isUploading'] = false;
            this.app.platforms.android.releases[this.androidReleaseNumber]['demoDownloadURL'] = data.downloadURL;
            this.app.platforms.android.releases[this.androidReleaseNumber]['progress'] = 0;

            console.log('BEFORE UPDATING');
            // console.log(this.app.platforms.android.releases);
            console.log(this.app.platforms.android.releases[this.androidReleaseNumber].demoDownloadURL);

            this.appService.updateApp('demo_android',this.app,this.androidReleaseNumber).then(()=>{
              this.dialogUtil.showToast('Demo app for android uploaded successfully.', 4000, 'bottom');
            });
          }else if(data.error){
            console.log('ERROR RECEIVED IN ANDROID');
            console.log(this.app.platforms.android.releases[this.androidReleaseNumber]);
            // this.app.platforms.android.releases[this.androidReleaseNumber].demoFilename = null;
            // this.app.platforms.android.releases[this.androidReleaseNumber].demoFileSize = null;
            // this.app.platforms.android.releases[this.androidReleaseNumber].progress = null;
            // this.app.platforms.android.releases[this.androidReleaseNumber].bytesTransferred = null;
         
            if(data.error.code !== 'storage/canceled' || data.error.code === 'function/busy'){
              this.app.platforms.android.releases[this.androidReleaseNumber].isUploading = false;
              this.app.platforms.android.releases[this.androidReleaseNumber]['uploadingError'] = true;
            }
          }

        }else if(type === 'archive_desktop'){
          if(data.progress){
            this.app.platforms.desktop['progress'] = data.progress;
            this.app.platforms.desktop['bytesTransferred'] = data.transferred;
          }else if(data.downloadURL){
            this.app.platforms.desktop['demoDownloadURL'] = data.downloadURL;
            // this.app.platforms.desktop['isUploading'] = false;
            // this.app.platforms.desktop['progress'] = 0;
            this.clearUploadData('desktop');
            
            this.appService.updateApp('demo_desktop',this.app).then(()=>{
              this.dialogUtil.showToast('Demo app for desktop uploaded successfully.', 4000, 'bottom');
            });
          }else if(data.error){
            console.log('ERROR RECEIVED IN DESKTOP');
            // this.app.platforms.desktop.demoFilename = null;
            // this.app.platforms.desktop.demoFileSize = null;
            // this.app.platforms.desktop['isUploading'] = false;
            // this.app.platforms.desktop['progress'] = null;
            // this.app.platforms.desktop['bytesTransferred'] = null;

            if(data.error.code !== 'storage/canceled' || data.error.code === 'function/busy'){
              this.app.platforms.desktop['isUploading'] = false;
              this.app.platforms.desktop['uploadingError'] = true;
            }
          }
        }else if(type === 'archive_source'){
          if(data.progress){
            this.app.openSource['progress'] = data.progress;
            this.app.openSource['bytesTransferred'] = data.transferred;
          }else if(data.downloadURL){
            this.app.openSource.sourceCodeDownloadURL = data.downloadURL;
            this.clearUploadData('source');
            
            console.log('nani nani');
            console.log(this.app);

            this.appService.updateApp('source_code',this.app).then(()=>{
              this.dialogUtil.showToast('Source code uploaded successfully.', 4000, 'bottom');
            });
          }else if(data.error){
            console.log('ERROR RECEIVED IN OPEN SOURCE');
            // this.app.platforms.desktop.demoFilename = null;
            // this.app.platforms.desktop.demoFileSize = null;
            // this.app.platforms.desktop['isUploading'] = false;
            // this.app.platforms.desktop['progress'] = null;
            // this.app.platforms.desktop['bytesTransferred'] = null;

            if(data.error.code !== 'storage/canceled' || data.error.code === 'function/busy'){
              this.app.openSource['isUploading'] = false;
              this.app.openSource['uploadingError'] = true;
            }
          }
        }
    });

  }

  clearUploadData(platform,full?: boolean){
    if(platform === 'desktop'){
      this.app.platforms.desktop['isUploading'] = null;
      this.app.platforms.desktop['uploadingError'] = null;
      this.app.platforms.desktop['paused'] = null;
      this.app.platforms.desktop['progress'] = 0;
      this.app.platforms.desktop['bytesTransferred'] = 0;

      // this.app.platforms.desktop.demoFilename = null;
      // this.app.platforms.desktop.demoFileSize = null;
    }else if(platform === 'source'){
      this.app.openSource['isUploading'] = null;
      this.app.openSource['uploadingError'] = null;
      this.app.openSource['paused'] = null;
      this.app.openSource['progress'] = null;
      this.app.openSource['bytesTransferred'] = null;

      // if(full){
      //   this.app.openSource.sourceCodeDownloadURL = null;
      //   this.app.openSource.sourceCodeFilename = null;
      //   this.app.openSource.sourceCodeFilesize = null;
      // }
    }
  }

  // Browse Button Click
  onCustomUploadChange(e,type,fileSizeLimit){
    console.log('Type: '+type);
    let file = e.target.files[0];

    if(file){
      let fileExtension = this.fileService.getExtension(file.name);
      if(type === 'apk' && fileExtension !== type){
        return this.dialogUtil.showToast('Please select an apk file.',3000,'bottom');
      }else if (type === 'archive_desktop' || type === 'archive_source'){
        if(fileExtension !== 'rar' && fileExtension !== 'zip'){
          return this.dialogUtil.showToast('Please select a zip or rar file.',3000,'bottom');
        }
      }

      if(this.fileService.sizeLimitExceeded(file.size,fileSizeLimit)){
        return this.dialogUtil.showToast('Your selected file exceeds to the required size limit.',4000,'bottom');
      }
      
      this.dialogUtil.showLoader('Processing file...');

      var reader = new FileReader();
      reader.onload = (event:any) => {
        file['path'] = event.target.result;
        this.uploadFile(type,file);
      }
      reader.readAsDataURL(file);
    }
  }  


  presentApkDetails(){
    const modal = this.modalCtrl.create('ApkDetailsPage', {app_releases: this.app.platforms.android.releases[this.androidReleaseNumber], app_uid: this.app.uid, app_status: this.app.status, app_status_cu: this.app['status_cu']});
    modal.present();
  }

  removeParseError(releaseCode){
    this.appService.updateApp('remove_error_android',this.app,releaseCode);
  }
  presentDeleteRelease(platform, releaseNumber?){
    if(this.app.status !== 'pending_publication'){
      // if(platform === 'android'){
      //   let alertTitle = `Delete release : ${releaseNumber}`;
      //   if(releaseNumber == '0' || releaseNumber == 0){
      //     alertTitle = 'Delete initial release?';
      //   }
      //   new Promise((resolve,reject)=>{
      //     let buttons = [
      //       { text: 'No', handler: reject },
      //       { text: 'Yes', handler: resolve },
      //     ];
      //     this.dialogUtil.showConfirm(`Are you sure you want to delete this release? This action cannot be undone.`, buttons,`${alertTitle}`);
      //   }).then(()=>{
      //     this.appService.updateApp(`delete_release_${platform}`,this.app,releaseNumber).then(()=>{
      //       this.dialogUtil.showToast('Release deleted successfully.', 3000, 'bottom');
      //     });
      //   },()=>{});

      // }
      if(platform === 'desktop'){
        new Promise((resolve,reject)=>{
          let buttons = [
            { text: 'No', handler: reject },
            { text: 'Yes', handler: resolve },
          ];
          this.dialogUtil.showConfirm(`Are you sure you want to delete this demo app? This action cannot be undone.`, buttons,`Delete demo app?`);
        }).then(()=>{
          this.appService.updateApp(`delete_${platform}`,this.app).then(()=>{
            this.dialogUtil.showToast('Desktop demo app deleted successfully.', 3000, 'bottom');
          });
        },()=>{});
      }else if(platform === 'source_code'){
        new Promise((resolve,reject)=>{
          let buttons = [
            { text: 'No', handler: reject },
            { text: 'Yes', handler: resolve },
          ];
          this.dialogUtil.showConfirm(`Are you sure you want to delete this source code archive? This action cannot be undone.`, buttons,`Delete source code archive?`);
        }).then(()=>{
          this.appService.updateApp(`delete_${platform}`,this.app).then(()=>{
            this.app.openSource.sourceCodeDownloadURL = null;
            this.app.openSource.sourceCodeFilename = null;
            this.app.openSource.sourceCodeFilesize = null;
            this.clearUploadData('source');
            this.dialogUtil.showToast('Source code archive deleted successfully.', 3000, 'bottom');
          });
        },()=>{});
      }
    }
  }

  changeUploadState(type,state,filename){
    // type is apk,archive_source,archive_desktop
    let parts = type.split('_');
    let platform = parts.pop();

    if(state === 'cancel'){
      new Promise((resolve,reject)=>{
        let buttons = [
          { text: 'No', handler: reject },
          { text: 'Yes', handler: resolve },
        ];

        let alertTitle = 'Stop demo apk upload?';
        if(platform === 'desktop'){
          alertTitle = 'Stop desktop demo app upload?';
        }else if (platform === 'source'){
          alertTitle = 'Stop source code upload?';
        }
        this.dialogUtil.showConfirm(`Are you sure you want to stop the upload?`, buttons,`${alertTitle}`);
      }).then(()=>{
        this.fileService.manageUpload(state,type,filename).then(()=>{
          if(platform === 'desktop' || platform === 'source'){
            this.clearUploadData(platform);
          }else{
            this.app.platforms.android.releases.splice(this.androidReleaseNumber,1);
          }
        }).catch(()=>{
          this.dialogUtil.showToast('An error has occured.', 3000, 'bottom');
        });
      },()=>{});
    }else{
      this.fileService.manageUpload(state,type,filename).then(()=>{
        if(type === 'apk'){
          this.app.platforms.android.releases[this.androidReleaseNumber]['paused'] = state === 'pause' ? true : false;
        }else if(type === 'archive_desktop'){
          this.app.platforms[platform]['paused'] = state === 'pause' ? true : false;
        }else if(type === 'archive_source'){
          this.app.openSource['paused'] = state === 'pause' ? true : false;
        }
      }).catch(()=>{
        this.dialogUtil.showToast('An error has occured.', 3000, 'bottom');
      });
    }
  }

  downloadFile(url){
    this.fileService.downloadFile(url);
  }

  ngOnDestroy(){
    this.alive = false;
    this.events.unsubscribe('dev-app:master_app_data_received');
    this.events.unsubscribe('dev-app:request_android_compatible');
  }

}
