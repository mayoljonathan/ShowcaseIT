import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Device } from '@ionic-native/device';

import {Observable} from 'rxjs/Observable'; 

import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

@Injectable()
export class CacheService {
    user_uid: string = '';
    userName: string = '';
    userPhotoURL: string = '';
    device_uuid: string = '';
    
    // appLoadedOnce: boolean = false;
    isDoneCheckingUserData: boolean = false;
    isDeveloper: boolean = false;
    isConnected: boolean = false;

    isSigningIn: boolean = false;

    constructor(
        public afAuth: AngularFireAuth,
        public afDB: AngularFireDatabase,
        public storage: Storage,
        private device: Device
    ){

    }

    getDeviceInfo(){
        return {
            uuid: this.device.uuid,
            cordova: this.device.cordova,
            platform: this.device.platform,
            model: this.device.model,
            os_version: this.device.version,
            manufacturer: this.device.manufacturer,
            isVirtual: this.device.isVirtual,
            serial: this.device.serial
        };
    }

    getProjectStatus(){
        return this.afDB.object(`_project/isAvailable`);
    }

    get isLoggedIn(): any {
        return !!this.user_uid;
    }

    getStorage(key){
        return this.storage.get(key);
    }

    setStorage(key,value){
        return this.storage.set(key,value);
    }

    removeStorage(key){
        return this.storage.remove(key);
    }
}