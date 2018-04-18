import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,ViewController,ModalController } from 'ionic-angular';

import { AppService, UserService,FileService } from "../../shared/services";
import { HelperUtil,DialogUtil,PlatformUtil } from "../../shared/utils";
import { App } from "../../shared/models";

import { ObjectToArray } from '../../shared/pipes/helper/objToArray';

@IonicPage()
@Component({
  selector: 'page-confirm-download',
  templateUrl: 'confirm-download.html',
})
export class ConfirmDownloadPage {
  app:App;
  appStats;
  type: string; //default

  enableDownload: boolean = false;
  objToArr = new ObjectToArray();

  request = {
    externalDownloadURL: null,
    directDownloadURL: null,
    appFileSize: null,
  };

  // Site key for browser
  site_key: string = '6LccuTIUAAAAAAugEDmzXRx_N-qLWlcuSTRusWgl';

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public helperUtil: HelperUtil,
    public fileService: FileService,
    public modalCtrl: ModalController,
    public dialogUtil: DialogUtil,
    public userService: UserService,
    public viewCtrl: ViewController,
    public platformUtil: PlatformUtil,
    public appService: AppService,
  ) {
    // Set recaptcha_site_key
    if(this.platformUtil.checkPlatform() === 'android'){
      this.site_key = '6LcbhjMUAAAAANIPk_wlryXJCcAXtC5TGa4aGZtN';
    }
  }

  get latestAndroidApp(){
    if(this.app && this.app.platforms){
      let releases = this.objToArr.transform(this.app.platforms.android.releases);
      return releases[releases.length-1];
    }
  }

  ionViewDidLoad() {
    this.app = this.navParams.get('app');
    this.appStats= this.navParams.get('appStats');
    if(this.navParams.get('type') == 'android'){
      this.type = 'Android App';
      if(this.latestAndroidApp){
        this.passRequestData(this.app.platforms.android.demoURL, this.latestAndroidApp.demoDownloadURL, this.latestAndroidApp.demoFileSize, this.appStats.downloads.android ,this.latestAndroidApp);
      }else{
        this.passRequestData(this.app.platforms.android.demoURL, null, null, this.appStats.downloads.android ,null);
      }
    }else if(this.navParams.get('type') == 'desktop'){
      this.type = 'Desktop App';
      this.passRequestData(this.app.platforms.desktop.demoURL, this.app.platforms.desktop.demoDownloadURL, this.app.platforms.desktop.demoFileSize, this.appStats.downloads.desktop);
    }else if(this.navParams.get('type') == 'opensource'){
      this.type = 'Source Code';
      this.passRequestData(this.app.openSource.sourceCodeURL, this.app.openSource.sourceCodeDownloadURL, this.app.openSource.sourceCodeFilesize, this.appStats.downloads.source_code);
    }
  }

  passRequestData(ext,dir,size,downloads,release?){
    this.request['externalDownloadURL'] = ext || null;
    this.request['directDownloadURL'] = dir || null;
    this.request['appFileSize'] = size || null;
    this.request['downloads'] = downloads || 0;
    // Only in android
    this.request['release'] = release || null;
  }

  launchURL(url){
    if(this.enableDownload){
      this.helperUtil.launchURL(url);
    }
  }
  // release is only available if type == 'Android App'
  downloadFile(url,type,release?){
    if(this.enableDownload){
      this.dialogUtil.showLoader('Requesting the file.',true);
      return this.fileService.downloadFile(url).then(()=>{
        this.dialogUtil.showToast('Downloading.',3000,'bottom');
        if(type == 'Source Code'){
          type = 'source_code';
        }else if(type == 'Android App'){
          type = 'android';
        }else if(type == 'Desktop App'){
          type = 'desktop'
        }
        this.dialogUtil.hideLoader();
        this.appService.incrementDownloads(type,this.app.uid,release);
        this.userService.addToDownloads(this.app.uid);
        this.dismiss();
      },e=>{
        this.dialogUtil.hideLoader();
        this.dialogUtil.showToast('An error has occured. Download link may be a broken.',4000,'bottom');
      });
    }
    this.dialogUtil.showToast("Please verify you're a human first.", 3000, 'bottom');
  }

  viewRelease(release){
    const modal = this.modalCtrl.create('ApkDetailsPage', {app_releases: release, app_uid: this.app.uid, readOnly: true});
    modal.present();
  }

  handleCorrectCaptcha(e){
    this.enableDownload = true;
  }
  captchExpired(e){
    this.enableDownload = false;
  }

  dismiss(){
    this.navCtrl.pop();
  }

}
