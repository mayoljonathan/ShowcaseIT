import { Component,ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams,ViewController } from 'ionic-angular';
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl }   from '@angular/forms';

import { AppService,UserService,CacheService,FileService } from "../../shared/services/";
import { DialogUtil } from "../../shared/utils/";

import { User } from '../../shared/models';

@IonicPage()
@Component({
  selector: 'page-change-profile',
  templateUrl: 'change-profile.html',
})
export class ChangeProfilePage {

  @ViewChild('photoUpload') photoUpload;

  user: User;

  private form: FormGroup;
  submitAttempt:boolean = false;

  alive: boolean = true;

  isUploading: boolean = false;
  errorUpload: boolean = false;
  progress: number= 0;

  constructor(
    public formBuilder: FormBuilder,
    public navCtrl: NavController,
    public navParams: NavParams,
    public userService: UserService,
    public viewCtrl: ViewController,
    public dialogUtil: DialogUtil,
    public cacheService: CacheService,
    public fileService: FileService,
  ) {
    this.form = new FormGroup({
        // name: new FormControl('', [Validators.required,Validators.maxLength(50)]),
        bio: new FormControl('', [Validators.maxLength(1000)]),
    });
  }

  ionViewDidLoad() {
    this.userService._getUserData(this.cacheService.user_uid)
      .takeWhile(()=>this.alive)
      .subscribe(userData=>{
        this.user = userData;
      });
  }

  onPhotoChange(event:any){
    if (event.target.files) {
      let filename = event.target.files[0]['name'];
      var reader = new FileReader();
      reader.onload = (event:any) => {
        this.uploadPhoto(event.target.result,filename);
      }
      reader.readAsDataURL(event.target.files[0]);
    }
  }
  uploadPhoto(data,filename){
    this.isUploading = true;
    this.fileService.updateProfilePhoto(`user/photo/${this.cacheService.user_uid}`,data,filename)
        // .takeWhile(()=>this.alive)
        .subscribe((data:any)=>{
          if(data.progress){
            this.progress = data.progress;
          }else if(data.downloadURL){
            this.isUploading = false;
            this.user.photoURL = data.downloadURL;
            this.photoUpload.nativeElement.value = '';
            this.progress = 0;
            this.userService.updateProfile(this.cacheService.user_uid, this.user).then(()=>{
              this.dialogUtil.showToast('Photo has been saved.', 3000, 'bottom');
            },e=>{
              this.dialogUtil.showToast('Error in saving the photo.', 3000, 'bottom');
            });
          }else if(data.error){
            this.isUploading = false;
            this.errorUpload = true;
            this.progress = 0;
            this.photoUpload.nativeElement.value = '';
            if(data.error.code !== 'storage/canceled' || data.error.code === 'function/busy'){
              this.errorUpload = true;
            }
          }
        });

  }

  submitForm(form){
    this.submitAttempt = true;
    if(form.valid){
      this.user.bio = form.value.bio ? form.value.bio : null;
      this.dialogUtil.showLoader('Updating profile.');
      this.userService.updateProfile(this.cacheService.user_uid,this.user).then(()=>{
        this.dialogUtil.hideLoader();
        this.dialogUtil.showToast('Profile updated successfully.', 3000, 'bottom');
      },e=>{
        this.dialogUtil.hideLoader();
        this.dialogUtil.showToast(`An error has occured. ${e}`, 4000, 'bottom');
      });
    }
  }
  
  dismiss(){
    this.viewCtrl.dismiss();
  }

  ngOnDestroy(){
    this.alive = false;
  }

}
