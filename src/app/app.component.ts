import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, ModalController,Events,MenuController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { Storage } from '@ionic/storage';
import { SplashScreen } from '@ionic-native/splash-screen';

import { AngularFireAuth } from 'angularfire2/auth';

// Models
import { User } from '../shared/models';

import { PlatformUtil,HelperUtil,DialogUtil } from "../shared/utils";
// Services
import { CacheService,UserService } from "../shared/services";

export interface PageInterface {
  title: string;
  segment: string;
  component: any;
  index: number;
  icon: string;
  requiresLogin?: boolean;
  requiresDev?: boolean;
}

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = "StartupLoadingPage";
  currentComponent: any = 'StartupLoadingPage';

  selectedSideMenuIndex: number = 0;

  pages: PageInterface[];
  devPanelPages: PageInterface[];
  morePages: PageInterface[];

  user: User;

  // alive: boolean = true;

  constructor(
    public platform: Platform, 
    public statusBar: StatusBar, 
    public splashScreen: SplashScreen,
    public storage: Storage,
    public events: Events,
    public menuCtrl: MenuController,
    public modalCtrl: ModalController,
    public afAuth: AngularFireAuth,
    public platformUtil: PlatformUtil,
    public cacheService: CacheService,
    public helperUtil: HelperUtil,
    public userService: UserService,
    public dialogUtil: DialogUtil,
  ) {
    this.initializeApp();

    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'Home', segment: 'home', component: "HomePage", index: 0, icon: 'home' },
      { title: 'My Apps', segment: 'my-apps', component: "MyAppsTabsPage", index: 1, icon: 'apps' , requiresLogin: true},
      // Both dev and not,
      { title: 'Report a Problem', segment: 'report-problem', component: "ReportProblemPage", index: 3, icon: 'bug_report' },
      // { title: 'Help', segment: 'help', component: "ListPage", index: 4, icon: 'help' },
      // { title: 'About Showcase It', segment: 'about', component: "ListPage", index: 5, icon: 'info' },
      // Not a developer
      { title: 'Become a Developer', segment: 'development/setup', component: "DeveloperSetupPage", index: 100, icon: 'code', requiresLogin: true },
      // Is a developer
      // { title: 'Developer Panel', segment: 'developer-panel', component: "DashboardPage", index: 101, icon: 'developer_board', requiresLogin: true , requiresDev: true},
    ];

    this.devPanelPages = [
      // { title: 'Back to Showcase It', segment: null, component: "HomePage", index: 10, icon: 'arrow_back' },
      // { title: 'Dashboard', segment: 'development/dashboard', component: "DashboardPage", index: 11, icon: 'dashboard' },
      { title: 'All Applications', segment: 'development/apps', component: "ApplicationsPage", index: 12, icon: 'format_list_bulleted' },
      // { title: 'Storage Quota', segment: 'development/storage', component: "ListPage", index: 13, icon: 'storage' },
    ];

    this.morePages = [
      { title: 'Terms of Service', segment: null, component: null, index: 200, icon: 'description' },
      { title: 'Privacy Policy', segment: null, component: null, index: 201, icon: 'lock' },
      { title: 'App Content Guidelines', segment: null, component: null, index: 202, icon: 'playlist_add_check' },
      { title: 'About', segment: null, component: null, index: 203, icon: 'info' },
    ]; 

  }

  initializeApp() {
    this.dialogUtil.showAlert("This is a test environment for ShowcaseIT. Anything saved here do not reflect to the production environment.","OK","Note");
    // GETTING THE USER_UID FIRST IN STORAGE
    // this.cacheService.getStorage('user_uid').then(val=>{
    //   console.log('UID is: '+ val);
    //   if(val != null){
    //     this.cacheService.user_uid = val;
    //   }
    // });

    //CHECK IF USER HAS LOGGEDIN      
    console.log('Going to check authState');
    this.afAuth.authState.subscribe(user => {
       if(user){
        console.log('Triggered authState'); 
        this.cacheService.user_uid = user.uid;
        // if(!this.cacheService.user_uid){
        //   this.cacheService.getStorage('user_uid').then(val=>{
        //     console.log('user_uid is: '+ val);
        //     if(val == null){
        //       this.cacheService.setStorage('user_uid',user.uid);
        //     }
        //   });
        // }

        this.getUserData();
      }else{
        this.cacheService.user_uid = '';
        this.cacheService.isDoneCheckingUserData = true;
        // this.nav.setRoot('HomePage');
        this.userService.setOnlineState(null,true);
      }

    });

    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

            // CODE IS BUGGY HERE, NEED TO HAVE GUARDS IN ROUTING
      this.cacheService.getProjectStatus().subscribe((available)=>{
        if(available.$value === false){
          this.nav.setRoot('StartupLoadingPage', {maintenance: true});
          this.menuCtrl.enable(false);
          this.dialogUtil.showAlert('System is on maintenance mode. Please try again later.','Ok','Notice');
          this.signOut();
        }else{
          // this.nav.setRoot('HomePage');
          this.menuCtrl.enable(true);
        }
      });


      this.events.subscribe('user:becomes_developer', () => {
        this.openPage(this.devPanelPages[0]);
      });

      // GETS THE DEVICE UID
      if(this.platformUtil.checkPlatform() == 'android'){
        const device = this.cacheService.getDeviceInfo();
        console.log(device);
        this.cacheService.device_uuid = device.uuid;
      }else{
        // generates a random uid if using a browser
        this.cacheService.device_uuid = this.helperUtil.randomUid();
        console.log('DEVICE UID');
        console.log(this.cacheService.device_uuid);
      }

      this.nav.viewDidEnter.subscribe(view=>{
        // console.log(view);
        this.currentComponent = view.id;
        let foundPagesComponent = this.pages.filter((page:PageInterface) => page.segment === this.currentComponent);
        if(foundPagesComponent.length!=0){
          let pageData:PageInterface = foundPagesComponent[0];
          if(pageData){
            this.selectedSideMenuIndex = pageData.index;
            // this.nav.setRoot(pageData.component);
          }
        }else{
          let foundDevPagesComponent = this.devPanelPages.filter((page:PageInterface) => page.segment === this.currentComponent);
          if(foundDevPagesComponent.length != 0){
            let pageData:PageInterface = foundDevPagesComponent[0];
            if(pageData){
              this.selectedSideMenuIndex = pageData.index;
              // this.nav.setRoot(pageData.component);
            }
          }
        }
      });

      // Subscribe to page change
      // this.nav.viewDidLoad.subscribe( view=> {
      //   this.currentComponent = view.instance.constructor.name;
      //   // this.currentComponent = view.id;
      //   // this.nav.getActive().name
      //   console.log('Changed pageSegment now on: '+this.currentComponent);
      //   // this.devPanelPages.map((page))

      //   // var pagePosition = this.devPanelPages.map((page:PageInterface)=> { 
      //   //   return page.segment 
      //   // }).indexOf(this.currentComponent);
      //   // var objectFound = this.devPanelPages[pagePosition];
        
      //   let foundComponent = this.devPanelPages.filter((page:PageInterface) => page.component === this.currentComponent);
      //   let pageData:PageInterface = foundComponent[0];
      //   console.log(pageData);
      //   this.selectedSideMenuIndex = pageData.index;
      //   this.nav.setRoot(pageData.component);
      //   if(pageData.index >= 11){
      //     return this.isDeveloperMode = true;
      //   }
      //   this.isDeveloperMode = false;
      // });

      
    });
  }

  getUserData(){
    this.userService._getUserData(this.cacheService.user_uid)
      // .takeWhile(()=> this.alive)
      .subscribe((res:User)=>{
        console.log(res);
        console.log('GET USER DATA');
        if(res.status === 'active'){
          this.user = res;
          this.cacheService.userName = <any>this.user.name;
          this.cacheService.userPhotoURL = <any>this.user.photoURL;
          if(this.cacheService.user_uid){
            this.userService.setOnlineState(this.cacheService.user_uid);
          }
          this.checkIfUserIsDeveloper();
        }else{
          if(!this.cacheService.isSigningIn){
            let msg;
            if(res.status === 'banned'){
              msg = 'Your account has been banned by the administrator.';
            }else if(res.status === 'disabled'){
              msg = 'Your account has been disabled by the administrator.';
            }else{
              msg = 'You have been logout. Please sign in again.';
            }
            this.signOut().then(()=>{
              this.dialogUtil.showAlert(msg,'Ok','Notice');
              this.nav.setRoot('HomePage');
            });
          }
        }   
    });
  }

  checkIfUserIsDeveloper(){
    this.userService._getUserIsDeveloper(this.cacheService.user_uid)
      // .takeWhile(()=> this.alive)
      .subscribe(res=>{
        console.log('CHECK IF USER IS DEVELOPER');
        // res['$value'] should return a developerDateCreated=epoch number
        if(typeof res['$value'] === 'number'){
          console.log('DEV YES');
          this.cacheService.isDeveloper = true;
        }else{
          console.log('DEV NO');
          this.cacheService.isDeveloper = false;
        }
        this.cacheService.isDoneCheckingUserData = true;
        // this.nav.setRoot('HomePage');
    });
  }

  get providerName(){
    if(this.user.facebook_id){
      return 'logo-facebook';
    }else if(this.user.google_id){
      return 'logo-google';
    }else if(this.user.github_id){
      return 'logo-github';
    }
  }
  
  get providerContainerClass(){
    if(this.user.facebook_id){
      return 'user-provider-container-fb';
    }else if(this.user.google_id){
      return 'user-provider-container-google';
    }else if(this.user.github_id){
      return 'user-provider-container-github';
    }
  }

  openPage(page) {
    if(page.index >= 200){
      if(page.index == 200){
        this.helperUtil.launchURL('https://showcase-it.firebaseapp.com/terms_of_service/');
      }else if(page.index == 201){
        this.helperUtil.launchURL('https://showcase-it.firebaseapp.com/privacy_policy/');
      }else if(page.index == 202){
        this.helperUtil.launchURL('https://showcase-it.firebaseapp.com/app_content_guidelines/');
      }else if(page.index == 203){
        this.helperUtil.launchURL('https://showcase-it.firebaseapp.com/about/');
      }
    }else{
      this.selectedSideMenuIndex = page.index;
      this.nav.setRoot(page.component);
    }
  }

  navigateToUser(){
    this.nav.push('UserProfilePage', {user_uid:this.cacheService.user_uid});
  }

  changeProfileData(){
    this.modalCtrl.create('ChangeProfilePage').present();
  }

  showSignInModal(){
    const modal = this.modalCtrl.create('SignInModalPage');
    modal.present();
  }

  signOut(){
    this.selectedSideMenuIndex = 0;
    this.nav.setRoot('HomePage');
    // this.alive = false;
    // this.userSubscription.unsubscribe();
    // this.userDeveloperSubscription.unsubscribe();
    return this.userService.signOut();
  }
}
