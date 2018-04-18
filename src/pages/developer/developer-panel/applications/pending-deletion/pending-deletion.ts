import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,ViewController } from 'ionic-angular';

import { App } from '../../../../../shared/models';
import { DialogUtil } from '../../../../../shared/utils';
import { AppService,CacheService } from '../../../../../shared/services';

@IonicPage()
@Component({
  selector: 'page-pending-deletion',
  templateUrl: 'pending-deletion.html',
})
export class PendingDeletionPage {

  apps: any;

  selectedApps:Array<any> = [];

  fetchLoaded: boolean = false;
  alive: boolean = true;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public dialogUtil: DialogUtil,
    public cacheService: CacheService,
    public appService: AppService,
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PendingDeletionPage');
    this.getPendingDeletion();
  }

  get isRestoreEnabled(){
    let selected = this.apps.filter((app)=> app['selected']).length;
    return selected == 0 ? false : true;
  }

  getPendingDeletion(){
    this.appService.getPendingDeletion('personal')
      .takeWhile(()=>this.alive)
      .subscribe((apps:Array<App>)=>{

        apps.forEach((value,index)=>{
          this.appService.getAppDetails(value.uid,this.cacheService.user_uid)
            .takeWhile(()=>this.alive)
            .subscribe((appData:App)=>{
              apps[index].title = appData.title;
              apps[index].thumbIconURL = appData.thumbIconURL;
          });
        });
        
        this.apps = apps;
        this.fetchLoaded = true;
      });
  }

  loadedAppIcon(index){
    document.getElementById('pending-app-icon-placeholder-'+index).className='';
  }

  onAppSelected(index){
    this.apps[index]['selected'] = this.apps[index]['selected'] ? false : true;
  }

  isInSelectedApps(app_uid): boolean{
    let check: boolean = false;
    for(let i=0;i<this.selectedApps.length;i++){
      if(this.selectedApps[i] === app_uid){
        check = true;
      }
    }
    return check;    
  }

  restoreApps(){
    let selectedApps = this.apps.filter((app)=> app['selected']);
    if(selectedApps.length !== 0){
      this.dialogUtil.showLoader(selectedApps.length==1 ? 'Restoring app': 'Restoring apps');
      this.appService.restorePendingDeletion('personal',selectedApps).then(()=>{
        if(selectedApps.length == 1){
          this.dialogUtil.showToast(`${selectedApps[0].title} has been successfully restored.`,3000,'bottom');
        }else{
          this.dialogUtil.showToast(`${selectedApps.length} apps has been successfully restored.`,3000,'bottom');
        }
        this.dialogUtil.hideLoader();
      });
    }
  }

  dismiss(data?: any) {
    this.viewCtrl.dismiss(data);
  }

  ngOnDestroy(){
    console.log('Destroying pending deletion');
    this.alive = false;
  }

}
