import { Injectable } from '@angular/core';
import * as EmailValidator from 'email-validator';

import { BrowserTab } from '@ionic-native/browser-tab';
import { InAppBrowser } from '@ionic-native/in-app-browser';

import { PlatformUtil } from "../utils";

@Injectable()
export class HelperUtil {
    constructor(
        public platformUtil: PlatformUtil,
        private browserTab: BrowserTab,
        public iab: InAppBrowser,
    ){
        
    }

    isValidEmail(email){
        return EmailValidator.validate(email);
    }

    launchURL(url){
        let setURL = (url) =>{
            url = url.replace(/^http\:\/\//, '')
                     .replace(/^https\:\/\//, '') // remove the leading https://
            return `http://${url}`;
        }
        this.browserTab.isAvailable().then(available=>{
            available ? this.browserTab.openUrl(setURL(url)) : this.iab.create(setURL(url));
        }).catch(e=>{
            // Meaning cordova_not_available, app opened in desktop web browser
            this.iab.create(setURL(url));
        });
        
        // if(this.platformUtil.checkPlatform() === 'browser'){
        //     console.log('Downloading using native downloader in browser');
        //     window.open(url, '_blank');
        // }else if(this.platformUtil.checkPlatform() === 'android'){
        //     console.log('Downloading using native downloader in android OS');
        //     this.iab.create(url);
        // }
    }

    sortObject(object,key,asc?){
        if(asc){
            object.sort((a,b)=>{
                if(a[key] > b[key]) return -1;
                if(a[key] < b[key]) return 1;
                return 0;
            });
        }
        // Descending
        object.sort((a,b)=>{
            if(a[key] < b[key]) return -1;
            if(a[key] > b[key]) return 1;
            return 0;
        });

        return object;
    }

    generatePushID(){
        // Modeled after base64 web-safe chars, but ordered by ASCII.
        var PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';

        // Timestamp of last push, used to prevent local collisions if you push twice in one ms.
        var lastPushTime = 0;

        // We generate 72-bits of randomness which get turned into 12 characters and appended to the
        // timestamp to prevent collisions with other clients.  We store the last characters we
        // generated because in the event of a collision, we'll use those same characters except
        // "incremented" by one.
        var lastRandChars = [];

        var now = new Date().getTime();
        var duplicateTime = (now === lastPushTime);
        lastPushTime = now;

        var timeStampChars = new Array(8);
        for (var i = 7; i >= 0; i--) {
        timeStampChars[i] = PUSH_CHARS.charAt(now % 64);
        // NOTE: Can't use << here because javascript will convert to int and lose the upper bits.
        now = Math.floor(now / 64);
        }
        if (now !== 0) throw new Error('We should have converted the entire timestamp.');

        var id = timeStampChars.join('');

        if (!duplicateTime) {
        for (i = 0; i < 12; i++) {
            lastRandChars[i] = Math.floor(Math.random() * 64);
        }
        } else {
        // If the timestamp hasn't changed since last push, use the same random number, except incremented by 1.
        for (i = 11; i >= 0 && lastRandChars[i] === 63; i--) {
            lastRandChars[i] = 0;
        }
        lastRandChars[i]++;
        }
        for (i = 0; i < 12; i++) {
        id += PUSH_CHARS.charAt(lastRandChars[i]);
        }
        if(id.length != 20) throw new Error('Length should be 20.');

        return id;
    }

    // Long UID
    newGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

    // Just a short UID
    randomUid() {
        return 'xxxx4xxxyxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

}