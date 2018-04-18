import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController,PopoverController  } from 'ionic-angular';
import { FirebaseListObservable } from 'angularfire2/database';

import { AllApplicationsPopoverComponent } from '../../../../components/all-applications-popover/all-applications-popover';

import { DialogUtil } from '../../../../shared/utils';
import { App } from '../../../../shared/models';
import { AppService,CacheService } from '../../../../shared/services';

@IonicPage({segment: 'development/apps'})
@Component({
  selector: 'page-applications',
  templateUrl: 'applications.html',
})
export class ApplicationsPage {

  apps: FirebaseListObservable<any>;

  filters : Array<any> = [];
  filtersDuplicate : Array<any> = [];

  alive: boolean = true;

  // rows = [
  //   { name: 'Austin', gender: 'Male', company: 'Swimlane' },
  //   { name: 'Dany', gender: 'Male', company: 'KFC' },
  //   { name: 'Molly', gender: 'Female', company: 'Burger King' },
  // ];
  // columns = [
  //   { prop: 'name' },
  //   { name: 'Gender' },
  //   { name: 'Company' }
  // ];

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public modalCtrl: ModalController,
    public popoverCtrl: PopoverController,
    public dialogUtil: DialogUtil,
    public cacheService: CacheService,
    public appService: AppService,
  ) {
    this.filters = this.createFilters();
    // this.filtersDuplicate = JSON.parse(JSON.stringify(this.filters));
  }

  ionViewDidEnter() {
    // setTimeout(()=>{
      this.getPersonalApps();

      // this.dialogUtil.hideLoader();
    // },1000);
  }

  getPersonalApps(){
    this.appService.getPersonalApps()
      .takeWhile(()=>this.alive)
      .subscribe((apps:any)=>{
        let activeApps:any = [];
        if(apps && apps.length != 0){
          apps.forEach((app,i)=>{
            app.uid = app.$key;
            app['appStats'] = {};
            if(!app.scheduledDeletion){
              console.log('Adding: '+i);
              // if(app['status'] === 'pending_publication'){
              //   app['status'] = 'Pending publication';
              // }else if(app['status'] === 'pending_update'){
              //   app['status'] = 'Pending update';
              // }
              this.appService.getReviews(app.uid,this.alive).takeWhile(()=>this.alive).subscribe((reviewsObj:any)=>{
                if(reviewsObj){
                  app['appStats']['averageStarRating'] = reviewsObj.averageStarRating;
                }
              });
              activeApps.push(app);
            }
            this.apps = activeApps;
          });
        }else{
          this.apps = activeApps;
        }
    });
  }

  navigateToApp(app){
    // this.navCtrl.push('DetailedAppTabsPage',{title: app.title, uid: app.$key});
    this.navCtrl.setRoot('DetailedAppTabsPage', {title: app.title, uid: app.$key}, {
      animate: true,
      direction: 'forward'
    });
  }
 
  navigateToMainApp(app){
    this.navCtrl.push('MainAppDetailsPage', {app_uid: app.uid});
  }

  showCreateAppModal(){
    const modal = this.modalCtrl.create('CreateApplicationPage');
    modal.present();
  }

  statusColor(status){
    if(status === 'draft'){
      return 'primary';
    }else if(status === 'pending_publication' || status === 'pending_update'){
      return 'warning';
    }else if(status === 'published'){
      return 'secondary';
    }else if(status === 'unpublished'){
      return 'disabled';
    }
  }

  statusName(status){
    if(status === 'pending_publication'){
      return 'Pending publication';
    }else if(status === 'pending_update'){
      return 'Pending update';
    }
    return status;
  }

  createFilters(){
    return [
      {name: 'Web'},{name: 'Android'},{name: 'Desktop'},
      {name: 'Downloadable'},{name: 'Open Source'},
      {name: 'Draft'},{name: 'Published'}
    ]
  }

  presentPopover(event){
    // Copy array of objects from this.filters
    let filtersDuplicate = this.createFilters();
    let popover = this.popoverCtrl.create(AllApplicationsPopoverComponent);
    popover.present({
      ev: event
    });
    popover.onWillDismiss((selectedPopover) => {
      switch(selectedPopover){
        case 'filter':
          this.dialogUtil.showCheckbox(this.filters,['Cancel','Done'],'Filter').then((selections:Array<any>)=>{
            for (let i = 0; i < selections.length ; i++){
              filtersDuplicate.forEach(type => {
                if(type.name === selections[i]){ type['checked'] = true }
              });
            }
            this.filters = filtersDuplicate;
          });
          break;
        
        case 'clear_filter':
          this.filters = this.createFilters();
          break;

        case 'sort_by':

          break;

        case 'pending_deletion':
          const modal = this.modalCtrl.create('PendingDeletionPage');
          modal.present();
          break;

      }
    })
  }

  loadedAppIcon(index){
    document.getElementById('app-icon-placeholder-'+index).className = '';
  }

  showMoreActions(app:App){
    new Promise(resolve=>{
      let viewHandler = function(){ resolve('view'); }
      let deleteHandler = function(){ resolve('delete'); }

      let buttons = [
        { text: 'View in ShowcaseIT', icon: 'md-eye' ,handler: viewHandler },
        { text: 'Delete app', icon: 'md-trash', role: 'destructive', handler: deleteHandler },
      ];
      if(app.status == 'draft' || app.status == 'pending_publication'){
        buttons.splice(0,1);
      }
      this.dialogUtil.showActionSheet(null,buttons,app.title);
    }).then(result=>{
      if(result === 'view'){
        this.navigateToMainApp(app);
      }else if(result === 'delete'){
        this.deleteApp(app);
      }
    });

  }

  deleteApp(app:App){
    new Promise((resolve,reject)=>{
      let buttons = [
        { text: 'No', handler: reject },
        { text: 'Yes', handler: resolve },
      ];
      this.dialogUtil.showConfirm('The application will be scheduled to be deleted after 7 days. Do you want to proceed?', buttons,`Delete ${app.title}?`);
    }).then(()=>{
      this.dialogUtil.showLoader('Deleting application.');
      this.appService.scheduleAppDeletion(app).then(()=>{
        this.dialogUtil.showToast(`${app.title} is been scheduled for deletion after 7 days. You can go to pending deletion if you want to restore it.`, 5000, 'bottom',true,'Ok');
        this.dialogUtil.hideLoader();
      });
    },()=>{});
  }

  ngOnDestroy(){
    console.log('Leavning application.ts');
    this.alive = false;
  }

  ionViewCanEnter(){
    if(!this.cacheService.isLoggedIn && !this.cacheService.isDeveloper){
      return false;
    }
    return true;
  }

}
