import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';

@Injectable()
export class PlatformUtil {
    constructor(
        public platform: Platform,
    ){
    }

    checkPlatform(){
        if(this.platform.is('core') || this.platform.is('mobileweb')) {
            console.log("Using a browser");
            return "browser";
		}else if(this.platform.is("android")){
			console.log("You are using a android app");
            return "android";
		}else{
			console.log("Action is not supported in this platform");
            return null;
		}
    }

    isTouchDevice(){
        if(this.platform.is('core')){
            return false;
        }else if(this.platform.is('android') || this.platform.is('mobile') || this.platform.is('mobileweb') || this.platform.is('tablet') || this.platform.is('phablet')){
            return true;
        }
    }
    
}