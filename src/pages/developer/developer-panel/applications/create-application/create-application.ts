import { Component,ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController,AlertController } from 'ionic-angular';

import { App } from '../../../../../shared/models';
import { DialogUtil } from '../../../../../shared/utils';
import { AppService } from '../../../../../shared/services';

@IonicPage()
@Component({
  selector: 'page-create-application',
  templateUrl: 'create-application.html',
})
export class CreateApplicationPage {

  @ViewChild('form') form;

  app: App;
  titleMaxLength = 50;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public dialogUtil: DialogUtil,
    public alertCtrl: AlertController,
    public appService: AppService,
  ) {
    this.app = new App();
  }

  ionViewDidLoad() {
    this.app.title = '';
  }
 
  submitForm(form) {
    if(this.app.title.length > this.titleMaxLength){
      this.dialogUtil.showToast('Character length of your title should not be greater than 50.',4000,'bottom');
    }
    if(form.valid){
      this.dialogUtil.showLoader('Creating your application');
      this.appService.createApp(this.app).then(()=>{
        this.dialogUtil.showToast('Application has been created.',3000, 'bottom');
        this.dismiss();
        this.dialogUtil.hideLoader();
      }).catch((e)=>{
        this.dialogUtil.handleErrors(e);
        this.dialogUtil.hideLoader();
      });
    }
  }

  dismiss(data?: any) {
    this.viewCtrl.dismiss(data);
  }

  ionViewCanLeave() : boolean | Promise<boolean>{
    this.app.title = this.app.title.trim();
    if(this.app.title.length === 0 || (this.form.submitted && this.form.valid)){
      return true;
    }

    return new Promise((resolve,reject)=>{
      let buttons = [
        { text: 'No', handler: reject },
        { text: 'Yes', handler: resolve },
      ];
      this.dialogUtil.showConfirm('Are you sure you want to discard your application?',buttons,'Discard application?');
    });
  }

}
