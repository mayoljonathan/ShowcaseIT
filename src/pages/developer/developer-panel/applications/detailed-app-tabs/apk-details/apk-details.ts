import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,ViewController } from 'ionic-angular';

import { App } from '../../../../../../shared/models';
import { AppService,FileService } from '../../../../../../shared/services';

import { DialogUtil } from '../../../../../../shared/utils';

@IonicPage()
@Component({
  selector: 'page-apk-details',
  templateUrl: 'apk-details.html',
})
export class ApkDetailsPage {

  app: App;
  permissionExpanded: boolean = false;
  screenExpanded: boolean = false;
  supportsScreens = [];

  isEditingRN: boolean = false;

  clonedReleaseNotes: string = '';

  readOnly: boolean = false;

  constructor(
    public navCtrl: NavController, 
    public viewCtrl: ViewController,
    public appService: AppService,
    public dialogUtil: DialogUtil,
    public fileService: FileService,
    public navParams: NavParams
  ) {
    this.app = new App();
  }

  get supportScreensLength(){
    return Object.keys(this.app.platforms.android.releases[0].supportsScreens).length;
  }

  ionViewDidLoad() {
    this.app.platforms.android.releases[0] = {};
    this.app.uid = this.navParams.get('app_uid');
    this.app.platforms.android.releases[0] = this.navParams.get('app_releases');
    this.app.status = this.navParams.get('app_status');
    this.app['status_cu'] = this.navParams.get('app_status_cu');
    this.readOnly = this.navParams.get('readOnly');
    // Object.assign(this.app.platforms.android.releases[0], this.navParams.get('app_releases'));

    console.log(this.readOnly);

    // console.log('##########');
    // console.log(this.app);

    // this.app.platforms.android.releases[0] = this.app.platforms.android.releases.pop();
    if(!this.readOnly){
      this.clonedReleaseNotes = this.app.platforms.android.releases[0].releaseNotes || '';
    }
  }

  downloadApk(url){
    this.fileService.downloadFile(url);
  }

  supportsScreenExpand(){
    this.screenExpanded = !this.screenExpanded;
    
    if(this.app.platforms.android.releases[0].supportsScreens && this.supportsScreens.length == 0){
      Object.keys(this.app.platforms.android.releases[0].supportsScreens).map(key=>{
        let value = this.app.platforms.android.releases[0].supportsScreens[key];

        let size = key.split('Screens');
        key = size[0];
        key += " screen";

        this.supportsScreens.push({key: key, value: value});
      });
    }
  }

  toggleReleaseNotes(){
    if(this.app.status !== 'pending_publication'){
      if(!this.isEditingRN){
        this.isEditingRN = true;
      }else{
        if(this.app.platforms.android.releases[0].releaseNotes === this.clonedReleaseNotes){
          return this.isEditingRN = false;
        }else{
          if(this.clonedReleaseNotes.trim().length > 2000){
            return this.dialogUtil.showToast('Your release notes exceeds the maximum length of 2000 characters.', 4000, 'bottom');
          }
          this.app.platforms.android.releases[0].releaseNotes = this.clonedReleaseNotes;
          this.dialogUtil.showLoader('Updating release notes.');
          this.appService.updateReleaseNotes(this.app).then(()=>{
            this.isEditingRN = false;
            this.dialogUtil.showToast('Release notes has been updated.', 4000,'bottom');
            this.dialogUtil.hideLoader();
          });
        }
      }
    }
  }

  dismiss(){
    this.viewCtrl.dismiss();
  }

}
