import { Component,ViewChild } from '@angular/core';
import { IonicPage,NavController,Searchbar } from 'ionic-angular';

import { AppService,UserService } from '../../shared/services';
import { App } from '../../shared/models';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild('searchBar') searchBar:Searchbar;

  isSearching: boolean = true;
  searchInput: string = "";
  dim: boolean = false;

  apps: Array<any> = [];

  private alive: boolean = true;
  loadedApps: boolean = false;

  constructor(
    public navCtrl: NavController,
    public appService: AppService,  
    public userService: UserService,
  ) {
  }

  ngOnInit(){
    this.loadedApps = false;
    this.appService.getPublishedApps('new_showcased',12)
      .takeWhile(()=> this.alive) 
      .subscribe((apps:any)=>{
        if(apps.length > 0){
          apps.forEach((app,index)=>{
            if(app['disabledByAdminUid']){
              delete apps[index];
              // apps.splice(index,1);
              return;
            }
            this.appService.getCategoryData(app.type,app.category).takeWhile(()=> this.alive).subscribe(category=>{
              app['category_name'] = category.name || '-';
            });

            this.userService._getUserData(app.user_uid).takeWhile(()=>this.alive).subscribe(userData=>{
              app['developer_name'] = userData.name;
            });
          });
          this.loadedApps = true;
        }else{
          this.loadedApps = true;
        }
        this.apps = apps;
      });
  }

  onSearch(){
    if(this.searchInput.trim().length != 0){
      this.dim = false;
      this.navCtrl.setRoot('SearchPage', {query: this.searchInput},{
        animate: true,
        direction: 'forward'
      });
    }
  }
  
  filterApps(type){
    this.navCtrl.setRoot('FilteredAppsPage', {type: type},{
      animate: true,
      direction: 'forward'
    });
  }

  seeMore(type){
    this.navCtrl.setRoot('FilteredAppsPage', {type: type},{
      animate: true,
      direction: 'forward'
    });
  }

  ngOnDestroy(){
    this.alive = false;
  }

}
