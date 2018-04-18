import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AppService,UserService } from '../../shared/services';

import { App } from '../../shared/models';

@IonicPage({segment: 'filter/:type'})
@Component({
  selector: 'page-filtered-apps',
  templateUrl: 'filtered-apps.html',
})
export class FilteredAppsPage {

  filter: string = '';

  alive: boolean = true;
  pageLoaded: boolean = false;
  apps: Array<App>;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public appService: AppService,  
    public userService: UserService,
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad FilteredAppsPage');
    this.filter = this.navParams.data['type'];
  
    this.getAppsByFilter(this.filter);
  }

  // loadedAppIcon(i){
  //   document.getElementById('app-icon-placeholder-'+i).className = '';
  // }

  setFilterTitle(){
    if(this.filter == 'web'){
      return 'Web Apps';
    }else if(this.filter == 'android'){
      return 'Android Apps';
    }else if(this.filter == 'desktop'){
      return 'Desktop Apps';
    }else if(this.filter == 'games'){
      return 'Games';
    }else if(this.filter == 'downloadable'){
      return 'Downloadable Apps';
    }else if(this.filter == 'opensource'){
      return 'Open Source Apps';
    }else if(this.filter == 'new_showcased'){
      return 'New Showcased Apps';
    }
  }

  getAppsByFilter(type='all'){
    this.pageLoaded = false;
    this.appService.getPublishedApps(type)
      .takeWhile(()=>this.alive)
      .subscribe(apps=>{
        let filteredApps = [];
        if(apps.length > 0){
          if(this.filter == 'web' || this.filter == 'android' || this.filter == 'desktop'){
            filteredApps = apps.filter((a) => a['platforms'][this.filter]['isCompatible'] === true)
          }else if(this.filter == 'games'){
            filteredApps = apps.filter((a) => a['type'] === 'games')
          }else if(this.filter == 'downloadable'){
            filteredApps = apps.filter((a,i) => {
                return a.platforms.android.releases || a.platforms.android.demoURL ||
                       a.platforms.desktop.demoURL || a.platforms.android.demoDownloadURL || 
                       a.openSource && (a.openSource.sourceCodeURL || a.openSource.sourceCodeDownloadURL);
            });
          }else if(this.filter == 'opensource'){
            filteredApps = apps.filter((a) => a['openSource'] && (a['openSource']['sourceCodeURL'] || a['openSource']['sourceCodeDownloadURL']))
          }else if(this.filter == 'new_showcased'){
            filteredApps = apps;
          }
        }

        // GET USERDATA
        if(filteredApps.length > 0){
          filteredApps.forEach((app,index)=>{
            if(app['disabledByAdminUid']){
              delete filteredApps[index];
              // filteredApps.splice(index,1);
              return;
            }
            // this.appService.getCategoryData(app.type,app.category).takeWhile(()=> this.alive).subscribe(category=>{
            //   app['category_name'] = category.name || '-';
            // });
            this.userService._getUserData(app.user_uid).takeWhile(()=>this.alive).subscribe(userData=>{
              app['developer_name'] = userData.name;
            });
          });
        }
        this.apps = filteredApps;
        this.pageLoaded = true;
        console.log(this.apps);
    });
  }

  goHome(){
    this.navCtrl.setRoot('HomePage', {},{
      animate: true,
      direction: 'back'
    });
  }

}
