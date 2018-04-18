import { Component,Input,ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams,Events} from 'ionic-angular';

import { App } from '../../../../../../shared/models';
import { AppService,FileService } from '../../../../../../shared/services';

import { DialogUtil,PlatformUtil,HelperUtil } from '../../../../../../shared/utils';
import "rxjs/add/operator/takeWhile";

@IonicPage({segment:'details'})
@Component({
  selector: 'page-app-details',
  templateUrl: 'app-details.html',
})
export class AppDetailsPage {

  @ViewChild('iconUpload') iconUpload;
  @ViewChild('screenshotUpload') screenshotUpload;

  app : App;
  categories;

  // alive: boolean = true;

  appIconFilename: string = "";
  appIconUploading: boolean = false;
  appIconUploadError: boolean = false;
  appIconProgress: number = 0;
  // @Input('appData') appData: App;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public events: Events,
    public dialogUtil: DialogUtil,
    public platformUtil: PlatformUtil,
    public fileService: FileService,
    public appService: AppService,
    public helperUtil: HelperUtil,
  ){
    this.app = new App();
    this.app.screenshots = [];

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AppDetailsPage');
    // this.app.uid = this.navParams.get('uid');
    // this.app.title = this.navParams.get('title');
    
    // this.getAppDetails();
    let counter = 0;
    this.events.subscribe('dev-app:master_app_data_received', (data) => {
      console.log('master_app_data_received in app-details');
      console.log(data);

      // Return to all applications due to some error
      if(!data.uid){
        console.log('return to all apps');
        return this.events.publish('dev-app:request_go_all_apps');
      }
      // Object.assign(this.app, data);
      // this.app = data;
      Object.assign(this.app, data);
      this.app['status_cu'] = data['status_cu'] || null;

      if(counter == 0){
        this.getAppCategories();
      }
      if(!this.app.screenshots){
        this.app.screenshots = [];
      }

      console.log(this.app);
      counter++;

      this.events.publish('dev-app:app_details_received', this.app);
    });

  }

  // getAppDetails(){
  //   this.appService.getAppDetails(this.app.uid)
  //     .takeWhile(()=>this.alive)
  //     .subscribe(data=>{
  //       console.log('RUNNING NEW FRESH APP DETAILS');
  //       // console.log('Recieved data: ');
  //       // console.log(data);
  //       this.app = Object.assign(this.app, data);
  //       console.log(this.app);
  //       this.events.publish('dev-app:title_received', {title: this.app.title});
  //   });

  // }
  
  getAppCategories(){
    console.log('Getting app categories: '+this.app.type);
    this.appService.getAppCategories(this.app.type).take(1).subscribe((data:Array<any>) => {
      data = data.filter((c)=>{ return c.status !== 0});
      this.categories = data;
    });
  }

  onAppTypeChange(type){
    console.log(type);
    this.app.category = null;
    this.categories = [];
    this.getAppCategories();
  }

  onIconChange(event: any){
    if (event.target.files && event.target.files[0]) {
      let filename = event.target.files[0]['name'];
      var reader = new FileReader();
      reader.onload = (event:any) => {
        let data = {};
        this.app.iconFileSize = event.total; 
        this.app.iconURL = event.target.result;
        data['filename'] = filename;
        this.saveImageAssets('app_icon_upload',data);
      }
      reader.readAsDataURL(event.target.files[0]);
    }
  }
  onScreenshotChange(event: any){
    if (event.target.files) {
      var files = event.target.files;

      let sumOfScreenshots = this.app.screenshots.length+files.length;
      if(sumOfScreenshots > 10){
        return this.dialogUtil.showToast(`You can only upload 10 screenshots.`,3000,'bottom');
      }

      for(let i=0;i<files.length;i++){
        let filename = event.target.files[i]['name'];
        var reader = new FileReader();
        reader.onload = (event:any) => {
          let data = {};
          data['filename'] = filename;
          data['filesize'] = event.total;
          data['high_res'] = event.target.result;
          // this.app.screenshots.push({ high: event.target.result });
          this.saveImageAssets('app_screenshot_upload',data);
        }
        reader.readAsDataURL(event.target.files[i]);
      }
    }
  }

  saveImageAssets(type,data){
    const opts = {
      app_uid: this.app.uid,
      requireThumbURL: true
    }
    if(type === 'app_icon_upload'){
      this.appIconFilename = this.helperUtil.newGuid()+"-"+data.filename;     
      this.appIconUploading = true;   
      this.appIconUploadError = false;

      this.fileService.uploadFile(type,`app/icons/${this.app.uid}`,this.app.iconURL,this.appIconFilename,opts)
        // .takeWhile(()=>this.alive)
        .subscribe((data:any)=>{
          console.log('RESULT');
          console.log(data);
          if(data.progress){
            this.appIconProgress = data.progress;
          }else if(data.downloadURL){
            this.app.iconURL = data.downloadURL;
            this.app.thumbIconURL = data.thumbURL;
            this.appIconUploading = false;   
            this.appIconProgress = 0;
            this.iconUpload.nativeElement.value = '';
            this.appService.updateApp('app_icon',this.app).then(()=>{
              this.dialogUtil.showToast('App icon saved.', 3000, 'bottom');
            });
          }else if(data.error){
            console.log('ERROR RECEIVED');
            this.app.iconURL = null;
            this.app.thumbIconURL = null;
            this.appIconFilename = null;
            this.appIconUploading = false;
            this.appIconProgress = 0;
            this.iconUpload.nativeElement.value = '';
            
            if(data.error.code !== 'storage/canceled' || data.error.code === 'function/busy'){
              this.appIconUploadError = true;
            }
          }
        });
    }else if(type === 'app_screenshot_upload'){
      // file is a base64 image url and filename is not null
      let filename = this.helperUtil.newGuid()+"-"+data.filename
      this.app.screenshots.push({
        filename: filename,
        filesize: data.filesize,
        high_res: data.high_res,
        progress: 0,
        isUploading: true,
        uploadingError: false,
      });

      this.fileService.uploadFile(type,`app/screenshots/${this.app.uid}`,data.high_res,filename,opts)
        // .takeWhile(()=>this.alive)
        .subscribe((data:any)=>{
          let screenshot = this.app.screenshots.find(t => t.filename === filename);
          if(screenshot){
            if(data.progress){
              screenshot.progress = data.progress;
            }else if(data.downloadURL){
              screenshot.high_res = data.downloadURL;
              screenshot.low_res = data.thumbURL;
              console.log('SUCCESS UPLOAD')
              // REMOVING THEM SO THAT IN FIREBASE DB, IT WILL NOT BE PASSED
              screenshot.filename = null;
              screenshot.isUploading = null;
              screenshot.progress = null;
              screenshot.uploadingError = null;
              // ADD SCREENSHOT DATA TO DB
              this.appService.updateApp('app_screenshot',this.app)
              // .then(()=>{
              //   this.dialogUtil.showToast('Screenshot saved.', 3000, 'bottom');
              // });
            }else if(data.error){
              screenshot.progress = 0;
              screenshot.isUploading = false;
              screenshot.uploadingError = true;
              console.log('ERROR FOR THIS SCREENSHOT');
              console.log(screenshot);
            }
          }
        }); 
      // So that after pushing and uploading , resets the value of input
      this.screenshotUpload.nativeElement.value = '';
    }
  }

  cancelUpload(type,args?,index?){
    //  && this.appIconFilename
    if(type === 'cancel_app_icon_upload'){
      if(this.appIconUploading){
        console.log('CANCELLING UPLOAD FOR APP ICON');
        this.app.iconURL = '';
        this.appIconUploading = false;
        this.fileService.manageUpload('cancel','app_icon_upload',this.appIconFilename);
      }else{
        console.log('REMOVING APP ICON FROM DB');
        new Promise((resolve,reject)=>{
          let buttons = [
            { text: 'No', handler: reject },
            { text: 'Yes', handler: resolve },
          ];
          this.dialogUtil.showConfirm('Do you want to remove your app icon?', buttons,'Remove app icon?');
        }).then(()=>{
          this.app.iconURL = null;
          this.app.iconFileSize = null;
          this.app.thumbIconURL = null;
          this.appService.updateApp('app_icon',this.app)
          // .then(()=>{
          //   this.dialogUtil.showToast('App icon removed.', 3000, 'bottom');
          // });
        },()=>{});
      }
    }else if(type === 'cancel_app_screenshot_upload'){
      // console.log(this.app.screenshots);
      console.log('DO THIS');
      console.log(args);
      if(args.isUploading){
        console.log('CANCELLING UPLOAD FOR SCREENSHOT: '+args.filename);
        args.isUploading = false;
        this.fileService.manageUpload('cancel','app_screenshot_upload', args.filename);
        // REMOVE FROM ARRAY
        this.app.screenshots.splice(index,1);
      }else{
        console.log('REMOVING '+index+' FROM DB');
        new Promise((resolve,reject)=>{
          let buttons = [
            { text: 'No', handler: reject },
            { text: 'Yes', handler: resolve },
          ];
          this.dialogUtil.showConfirm('Do you want to remove this screenshot?', buttons,'Remove screenshot?');
        }).then(()=>{
          this.app.screenshots.splice(index,1);
          this.appService.updateApp('app_screenshot',this.app);
        },()=>{});

      }
      // this.app.screenshots.find(s => s.file)
      // let screenshot = args.find(t => t.filename === filename);
    }
  }

  ngOnDestroy(){
    console.log('NGONDESTROY APPDETAILS');
    this.events.unsubscribe('dev-app:master_app_data_received');
    // this.alive = false;
  }

}
