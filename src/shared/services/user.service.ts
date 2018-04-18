import { Injectable } from '@angular/core';
import 'rxjs/add/operator/take';
import { Observable } from 'rxjs/Observable';
import { Events,MenuController } from 'ionic-angular';

import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { Facebook,FacebookLoginResponse } from '@ionic-native/facebook';
import { Network } from '@ionic-native/network';

import { PlatformUtil,DialogUtil } from "../utils";

// Services
import { CacheService } from './';
// Models
import { User } from "../models"; 

@Injectable()
export class UserService {

    appFirstLoaded: boolean = false;

    user: User;

    constructor(
        public afAuth: AngularFireAuth,
        public afDB: AngularFireDatabase,
        public fb: Facebook,
        public network: Network,
        public dialogUtil: DialogUtil,
        public menuCtrl: MenuController,
        public platformUtil: PlatformUtil,
        public cacheService: CacheService,
    ){

    }

    loginWith(provider: String){
        if(this.platformUtil.checkPlatform() === "browser"){ 
            return this.browserLoginWith(provider).then(result=>{
                return result;
            });
        }
        else if (this.platformUtil.checkPlatform() === "android"){ return this.androidLoginWith(provider)}
        else{ this.dialogUtil.showAlert("Sign in is not supported in this platform","Ok");}
    }
    
    browserLoginWith(provider: String){
        const passUserData = (res,provider)=>{
            const firebaseUid = res.user.uid;
            const data = res.user.providerData[0];
            this.user = Object.assign({
                uid: firebaseUid,
                name: data.displayName,
                email: data.email,
                photoURL: data.photoURL,
                dateCreated: firebase.database.ServerValue.TIMESTAMP,
            });
            this.user[provider+"_id"] = data.uid;
        }

        let authProvider = null;
        if(provider === "facebook"){ authProvider = new firebase.auth.FacebookAuthProvider();}
        else if(provider === "google"){ authProvider = new firebase.auth.GoogleAuthProvider();}
        else if(provider === "github"){ authProvider = new firebase.auth.GithubAuthProvider();}

        return this.afAuth.auth.signInWithPopup(authProvider).then(res => {
            passUserData(res,provider);
            return this.getUserData(this.user.uid);
        }).then(userData => {
            //If userData doesn't exists in Firebase Database , then add the userData
            let value = {};
            if(!userData){
                this.addUserData(this.user);
                value['name'] = this.user.name;
                value['canLogin'] = true; // return true to say that you can login
                value['newUser'] = true;
                return value;
            }else{
                return this.getUserStatus(userData.uid).then(status=>{
                    if(status === 'active'){
                        console.log("Active account");
                        value['name'] = userData.name;
                        value['canLogin'] = true;
                        value['newUser'] = false;
                    }else if(status === 'banned'){
                        this.signOut();
                        value['canLogin'] = false;
                        value['message'] = `You're account has been banned. Please contact the administrator.`;
                    }else if(status === 'disabled'){
                        this.signOut();
                        value['canLogin'] = false;
                        value['message'] = `You're account has been disabled. Please contact the administrator.`;
                    }else{
                        this.signOut();
                        value['canLogin'] = null;
                        value['message'] = `An error has occured. Please contact the administrator.`;
                    }
                    return value;
                });
            }
        }).catch(reason => {
            return reason;
        });
    }

    androidLoginWith(provider: String){
        console.log("Android: Logging in using "+provider);
        return this.fb.login(['email', 'public_profile']).then((res:FacebookLoginResponse) => {
            console.log('====================================');
            console.log(res);
            console.log('====================================');
            const facebookCredential = firebase.auth.FacebookAuthProvider.credential(res.authResponse.accessToken);
            return this.afAuth.auth.signInWithCredential(facebookCredential);
        });
        // return Promise.resolve();
    }

    getUserStatus(user_uid){
        return firebase.database().ref(`users/user_data/${user_uid}/status`).once('value').then(snapshot=>{
            // returns 'active' || 'banned';
            return snapshot.val();
        });
    }

    // return UserData from Firebase Database, return null if not exists
    getUserData(user_uid){
        // Traditional way of querying once
        return firebase.database().ref(`users/user_data/${user_uid}`).once('value').then(snapshot=>{
            return snapshot.val();
        });
        // Bad query 
        // this.afDB.object(`users/user_data/${data.uid}`).take(1).subscribe(data=>{
        //     console.log(data);  
        // });
    }

    _getUserData(user_uid){
        return this.afDB.object(`users/user_data/${user_uid}`);
    }

    setUserAsDeveloper(user_uid){
        return this.afDB.object(`users/developer_data/${user_uid}/developerDateCreated`).set(firebase.database.ServerValue.TIMESTAMP).then(()=>{
            return true;
        }).catch(()=>{
            return false;
        });
    }

    _getUserIsDeveloper(user_uid){
        return this.afDB.object(`users/developer_data/${user_uid}/developerDateCreated`);
    }

    setOnlineState(user_uid,anonymous?){
        console.log('Set online state for: '+user_uid);
        let imOnline = firebase.database().ref('.info/connected');
        if(anonymous){
            return imOnline.on('value', (snapshot) => {
                this.cacheService.isConnected = snapshot.val();
            });
        }
        let userRef = firebase.database().ref(`_server/user_presence/${user_uid}`);
        imOnline.on('value', (snapshot) => {
            this.cacheService.isConnected = snapshot.val();
            if(this.appFirstLoaded && this.cacheService.isConnected){
                this.dialogUtil.showToast('You are now connected.',4000,'bottom');
            }
            if(!this.cacheService.isConnected){
                this.dialogUtil.showToast('You are not connected to the server right now.',4000,'bottom');
            }
            if(!this.appFirstLoaded){ this.appFirstLoaded = true }
            console.log('Online status: '+this.cacheService.isConnected);
            if (snapshot.val()) {
                userRef.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
                userRef.set(true);
            }
        });
    }
    
    getOnlineState(user_uid){
        return this.afDB.object(`_server/user_presence/${user_uid}`);
    }

    addUserData(data:User){
        console.log("Adding the userData to Firebase Database");
        data.status = 'active';
        return this.afDB.object(`users/user_data/${data.uid}`).update(data);
    }
    
    transactQuota(type,state,data,changed?){
        // NICE TO HAVE
        // console.log('TRANSACTION TYPE: '+type);
        // if(type === 'storage_quota'){
        //     const bytesUsedRef = this.afDB.database.ref(`users/quota_data/${this.cacheService.user_uid}/${type}/bytes_used`);
        //     if(state === 'add'){
        //         return bytesUsedRef.transaction(bytes_used => bytes_used + data);
        //     }
        //     return bytesUsedRef.transaction(bytes_used => {
        //         let value = bytes_used - data;
        //         if(value > 0){
        //             return value;
        //         }
        //     });
        // }
    }

    signOut(){
        console.log('Signing out');
        if(this.cacheService.user_uid){
            let userRef = firebase.database().ref(`_server/user_presence/${this.cacheService.user_uid}`);
            userRef.set(firebase.database.ServerValue.TIMESTAMP);
        }
        this.cacheService.removeStorage('user_uid');
        return this.afAuth.auth.signOut();
    }

    // APP -USER
    toggleFavorite(app_uid,action){
        if(action == 'add'){
            return this.afDB.object(`users/user_favorites/${this.cacheService.user_uid}/${app_uid}`).update({
                dateFavorited: firebase.database.ServerValue.TIMESTAMP
            });
        }else{
            return this.afDB.object(`users/user_favorites/${this.cacheService.user_uid}/${app_uid}`).remove();
        }
    }
    addToDownloads(app_uid){
        return this.afDB.object(`users/user_downloads/${this.cacheService.user_uid}/${app_uid}`).update({
            dateLastDownloaded: firebase.database.ServerValue.TIMESTAMP
        });
    }
    getDownloadedApps(){
        return this.afDB.list(`users/user_downloads/${this.cacheService.user_uid}`);
    }

    getIsFavorited(app_uid){
        return this.afDB.object(`users/user_favorites/${this.cacheService.user_uid}/${app_uid}`);
    }

    getFavoriteApps(){
        return this.afDB.list(`users/user_favorites/${this.cacheService.user_uid}`);
    }

    updateProfile(user_uid,user){
        return this.afDB.object(`users/user_data/${user_uid}`).update(user);
    }

}