import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { ScreenOrientation } from '@ionic-native/screen-orientation';

@Injectable()
export class OrientationUtil {
    // constructor(
    //     public platform: Platform,
    //     public screenOrientation: ScreenOrientation
    // ){
        
    // }

    // showTabIcons(max){
    //     return new Promise(resolve=>{
    //     this.platform.ready().then(()=>{
    //             setTimeout(()=>{
    //                 // alert(this.platform.height());
    //                 // this.platform.height() > max ? resolve(true) : resolve(false);
    //                 alert(window.screen.height);
    //                 window.screen.height > max ? resolve(true):resolve(false);
    //             },250);
    //         });
    //     });
    //     // this.screenOrientation.onChange().subscribe(
    //     //     (data) => {
    //     //         console.log("Orientation Changed");
    //     //         alert(this.platform.height());
    //     //         alert(data);
    //     //     }
    //     // );
    // }
    
}