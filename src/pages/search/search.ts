import { Component,ViewChild } from '@angular/core';
import { IonicPage,NavController, NavParams,Searchbar,Content } from 'ionic-angular';

import { SearchService,AppService,UserService,CacheService } from "../../shared/services";

@IonicPage()
@Component({
  selector: 'page-search',
  templateUrl: 'search.html',
})
export class SearchPage {

  @ViewChild('searchBar') searchBar : Searchbar;
  @ViewChild('content') content : Content;

  searchInput: string = '';
  duplicateSearchInput: string = '';
  private alive:boolean = true;

  apps: Array<any> = [];
  users: Array<any> = [];

  // pageLoaded: boolean = false;
  isSearching: boolean = false;

  dim: boolean = false;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public searchService: SearchService,
    public appService: AppService,
    public userService: UserService,
    public cacheService: CacheService,
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SearchPage');

    this.searchInput = this.navParams.data['query'];
    if(this.searchInput){
      this.onSearch();
    }

    // setTimeout(()=>{
    //   this.pageLoaded = true;
    // },2000);

    // this.isSearching = false;
    // this.searchInput = 'awd';
    // this.apps = [];

    // remove this
    // this.getSearchResults('-KvBfpJZdyUFkbXrtomm');
  }

  focusSearch(){
    this.searchBar.setFocus();
    this.dim = true;
  }

  getSearchResults(queryUID){
    this.duplicateSearchInput = this.searchInput;
    console.log('Getting search results:'+queryUID);
    this.isSearching = true;
    this.searchService.getSearchResults(queryUID)
      .takeWhile(()=>this.alive)
      .subscribe(result=>{
        console.log('Search result here');
        console.log(result);
        if(result.hits){
          console.log('Results hits length:'+result.hits.length);
          if(result.hits.length > 0){
            let appLoadedCount = 0;
            result.hits.forEach((app,index)=>{
              // this.appService.getCategoryData(app.type,app.category).takeWhile(()=> this.alive).subscribe(category=>{
              //   app['category_name'] = category.name || '-';
              // });

              this.appService.getMainAppDetails(app.app_uid).takeWhile(()=> this.alive).subscribe(appData=>{
                if(appData['disabledByAdminUid'] || !appData['uid']){
                  // delete result.hits[index];
                  result.hits.splice(index,1);
                  return;
                }
                app = Object.assign(app,appData);
                
                this.userService._getUserData(app.user_uid).takeWhile(()=>this.alive).subscribe(userData=>{
                  app['developer_name'] = userData.name;
                  appLoadedCount++;
                  if(appLoadedCount === result.hits.length){
                    this.isSearching = false;
                  }
                });
              });
            });
          }
          this.apps = result.hits;
          this.isSearching = false;
        }else{
          this.apps = [];
          setTimeout(()=>{
            if(this.apps.length == 0){
              this.isSearching = false;
            }
          },30000);
        }
      });
    this.duplicateSearchInput = this.searchInput.trim();
  }

  onSearch(){
    // this.duplicateSearchInput = this.searchInput;
    if(this.searchInput && this.searchInput.trim() != this.duplicateSearchInput.trim() && this.searchInput.trim() != ''){
      // this.searchService.doSearchQuery(this.searchInput.trim()).then(snap=>{
      //   const queryUID = snap.key;
      //   this.getSearchResults(queryUID);
      // });
      this.dim = false;
      this.isSearching = true;
      this.searchService.searchQuery(this.searchInput.trim())
        .takeWhile(()=> this.alive)
        .subscribe((res:any)=>{
          if(res.id === 'apps'){
            let result = res.data;
            if(result.hits && result.hits.length > 0){
              let appLoadedCount = 0;
              result.hits.forEach((app,index)=>{
                this.appService.getMainAppDetails(app.app_uid).takeWhile(()=> this.alive).subscribe(appData=>{
                  if(appData['disabledByAdminUid'] || !appData['uid']){
                    result.hits.splice(index,1);
                    return;
                  }
                  app = Object.assign(app,appData);
                  this.userService._getUserData(app.user_uid).takeWhile(()=>this.alive).subscribe(userData=>{
                    app['developer_name'] = userData.name;
                    appLoadedCount++;
                    if(appLoadedCount === result.hits.length){
                      this.isSearching = false;
                    }
                  });
                });
              });

              this.apps = result.hits;
              this.isSearching = false;
            }else{ 
              this.apps = [];
              this.isSearching = false;
            }


          }else if(res.id === 'users'){
            let result = res.data;
            if(result.hits && result.hits.length > 0){
              let usersLoadedCount = 0;
              result.hits.forEach(user=>{
                this.userService._getUserData(user.user_uid).takeWhile(()=>this.alive).subscribe(userData=>{
                  user['name'] = userData.name;
                  user['photoURL'] = userData.photoURL;
                  usersLoadedCount++;
                  if(usersLoadedCount === result.hits.length){
                    this.isSearching = false;
                  }
                });
              });

              this.users = result.hits;
              this.isSearching = false;
            }else{
              this.users = [];
              this.isSearching = false;
            }
          }

        });

      this.duplicateSearchInput = this.searchInput.trim();
    }
  }

  navigateToUser(user_uid){
    this.navCtrl.push('UserProfilePage', {user_uid:user_uid});
  }

  goHome(){
    this.navCtrl.setRoot('HomePage', {},{
      animate: true,
      direction: 'back'
    });
  }

  ngOnDestroy(){
    this.alive = false;
  }

}
