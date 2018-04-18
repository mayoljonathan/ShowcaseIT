import { Component } from '@angular/core';
import { IonicPage,NavController, NavParams,Events } from 'ionic-angular';

import { CacheService,UserService } from '../../../shared/services';
import { DialogUtil,HelperUtil } from '../../../shared/utils';

@IonicPage({segment: 'development/setup'})
@Component({
  selector: 'page-developer-setup',
  templateUrl: 'developer-setup.html',
})
export class DeveloperSetupPage {

  perks: Array<any> = [];

  isAgree: boolean = false;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public events: Events,
    public dialogCtrl: DialogUtil,
    public userService: UserService,
    public cacheService: CacheService,
    public helperUtil: HelperUtil,
  ) {
    this.perks = [
      [
        {
          icon: "cloud_upload",
          description: "Upload and showcase your app from different platforms (web, android, desktop)"
        },{
          icon: "thumb_up",
          description: "Gather feedbacks from different users in your app"
        },{
          icon: "build",
          description: "Manage your apps, update version and add release notes for android apps"
        },{
          icon: "code",
          description: "Provide your actual application and you can also provide source codes to your apps, upload it here or just put the external link"
        }
        // ,{
        //   icon: "storage",
        //   description: "You will have a 2 GB free storage space in your account for your application files and images."
        // },
      ],
      // PERK B
      // [
      //   {
      //     icon: "people",
      //     description: "Create or join a developer team to collaborate with other developers"
      //   },{
      //     icon: "chat",
      //     description: "Chat with other members through group messaging"
      //   },{
      //     icon: "insert_drive_file",
      //     description: "Upload your project's assets and resources to share it with your team"
      //   },{
      //     icon: "photo",
      //     description: "Share your screenshots and photos in your team"
      //   }
      // ]
    ];
  }

  ionViewCanEnter(){
    if(!this.cacheService.isLoggedIn || this.cacheService.isDeveloper){
      return false;
    }
    return true;
  }

  setUserAsDeveloper(){
    if(this.isAgree){
      this.dialogCtrl.showLoader();
      this.userService.setUserAsDeveloper(this.cacheService.user_uid).then(success=>{
        if(success){
          this.events.publish('user:becomes_developer');
          this.dialogCtrl.showToast(`Congrats, you're now a developer. Start showcasing your apps!`, 4000, 'bottom');          
        }else{
          this.dialogCtrl.handleErrors();
        }
        this.dialogCtrl.hideLoader();
      });
    }
  }

}
