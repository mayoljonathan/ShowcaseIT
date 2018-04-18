import { Injectable } from '@angular/core';
import 'rxjs/add/operator/take';
import {Observable} from 'rxjs/Observable';

import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

import { PlatformUtil,DialogUtil,HelperUtil } from "../utils";

// Services
import { CacheService,UserService } from './';
// Models
import { App } from "../models"; 

import { ObjectToArray } from '../pipes/helper/objToArray';
import * as request from 'request';

@Injectable()
export class AppService {

    // app: App;

    constructor(
        public afAuth: AngularFireAuth,
        public afDB: AngularFireDatabase,
        public dialogUtil: DialogUtil,
        public platformUtil: PlatformUtil,
        public userService: UserService,
        public helperUtil: HelperUtil,
        public cacheService: CacheService,
    ){

    }

    createApp(app:App){
        app.status = 'draft';
        app.dateCreated = <number>firebase.database.ServerValue.TIMESTAMP;
        app.dateUpdated = app.dateCreated;
        return new Promise((resolve,reject)=>{
            this.afDB.list(`users/developer_data/${this.cacheService.user_uid}/user_personal_apps`).push(app).then(snapshot=>{
                let uid = snapshot.key;
                this.afDB.object(`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${uid}`).update({
                    uid: snapshot.key,
                    platforms: {
                        web: { isCompatible: false },
                        android: { isCompatible: false },
                        desktop: { isCompatible: false }
                    }
                }).then(()=>{
                    resolve(snapshot);
                });
            }).catch(e=>{
                reject(e);
            });
        });
    }

    getPendingDeletion(type){
        console.log('Getting Pending Deletion for: '+type);
        if(type === 'personal'){
            return this.afDB.list(`_server/pending_deletion/user_personal_apps/`,{
                query: {
                    orderByChild: 'user_uid',
                    equalTo: this.cacheService.user_uid
                }
            });
        }
    }

    restorePendingDeletion(type, apps:Array<App>){
        if(type === 'personal'){
            let data = {};
            apps.forEach(app=>{
                data[`_server/pending_deletion/user_personal_apps/${app.uid}`] = null;
                data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/scheduledDeletion`] = null;
            });
            return this.afDB.object('/').update(data);
        }
    }

    scheduleAppDeletion(app:App){
        // return this.afDB.object(`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}`).update({scheduledDeletion: firebase.database.ServerValue.TIMESTAMP}).then(()=>{
        //     return this.afDB.object(`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/scheduledDeletion`).take(1).subscribe(snapshot=>{
        //         let scheduledDeletion = snapshot.$value+86400;
        //         console.log('Updating the scheduled deletion to be set 7days');
        //         return this.afDB.object(`_server/pending_deletion/user_personal_apps/${app.uid}`).update({
        //             uid: app.uid,
        //             scheduledDeletion: scheduledDeletion,
        //         });
        //         // return this.afDB.object(`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}`).update({scheduledDeletion:scheduledDeletion});
        //     });
        // });

        // Copy the object, coz updates from the current will reflect here
        console.log("Scheduling app deletion");
        let setCurrentServerTime = this.afDB.object(`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}`).update({scheduledDeletion: firebase.database.ServerValue.TIMESTAMP});
        let setScheduledTime = this.afDB.object(`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/scheduledDeletion`).take(1).subscribe(snapshot=>{
            let scheduledDeletion = snapshot.$value+604800000;
            let setPendingDeletion = this.afDB.object(`_server/pending_deletion/user_personal_apps/${app.uid}`).update({
                uid: app.uid,
                scheduledDeletion: scheduledDeletion,
                user_uid: this.cacheService.user_uid
            });
            let updateScheduledDeletion = this.afDB.object(`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}`).update({scheduledDeletion:scheduledDeletion});
            return Promise.all([setPendingDeletion,updateScheduledDeletion]);
        });
        return Promise.all([setCurrentServerTime,setScheduledTime]);
    }

    updateApp(type,app:App,args?){
        if(type === 'app_icon'){
            console.log('UPDATING APP_ICON');
            return this.afDB.object(`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}`).update({
                iconURL: app.iconURL,
                thumbIconURL: app.thumbIconURL,
                iconFileSize: app.iconFileSize,
                dateUpdated: firebase.database.ServerValue.TIMESTAMP
            });
            // NICE TO HAVE
            // let operation = app.iconUrl ? 'add' : 'remove'; 
            // let fileSize = app.iconFileSize;
            // app.iconFileSize = app.iconUrl ? app.iconFileSize : null;
            
            // var updateData = {};
            // updateData[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/iconUrl`] = app.iconUrl;
            // updateData[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/iconFileSize`] = app.iconFileSize;
            // updateData[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/dateUpdated`] = firebase.database.ServerValue.TIMESTAMP;

            // return this.afDB.object('/').update(updateData).then(()=>{
            //     return this.userService.transactQuota('storage_quota',operation,fileSize,changed);
            // });
        }else if(type === 'app_screenshot'){
            console.log('UPDATING SCREENSHOTS');
            console.log(app);
            
            var updateData = {};
            updateData[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/dateUpdated`] = firebase.database.ServerValue.TIMESTAMP;
            updateData[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/screenshots/`] = app.screenshots;
            return this.afDB.object('/').update(updateData);
        }else if(type === 'demo_android' || type === 'demo_desktop'){
            let parts = type.split('_');
            let platform = parts.pop();
        


            console.log(`UPDATING DEMO IN PLATFORM ${platform}`);
            // console.log(app);

            let data = {};
            data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/platforms/${platform}/isCompatible`] = true;
            data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/platforms/${platform}/demoURL`] = app.platforms[platform].demoURL || null;
    
            if(platform === 'android'){
                // Send a queue for parseApk request
                let releaseNumber = args;

                data[`_server/pending_request/parseApk/${app.uid}`] = {
                    user_uid: this.cacheService.user_uid,
                    app_uid: app.uid,
                    remoteFilepath: `app/distributions/${app.uid}/${app.platforms[platform].releases[releaseNumber].demoFilename}`,
                    releaseCode: this.helperUtil.generatePushID(),
                    demoDownloadURL: encodeURIComponent(app.platforms.android.releases[releaseNumber].demoDownloadURL),
                    demoFilename: app.platforms[platform].releases[releaseNumber].demoFilename,
                    demoFileSize: app.platforms[platform].releases[releaseNumber].demoFileSize,
                };
            }else if(platform === 'desktop'){
                data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/platforms/${platform}/demoDownloadURL`] = app.platforms[platform].demoDownloadURL;
                data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/platforms/${platform}/demoFilename`] = app.platforms[platform].demoFilename;
                data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/platforms/${platform}/demoFileSize`] = app.platforms[platform].demoFileSize;
                data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/platforms/${platform}/dateCreated`] = firebase.database.ServerValue.TIMESTAMP;
            }

            return this.afDB.object('/').update(data);
        }else if(type === 'source_code'){
            // HERE
            let data = {};
            data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/openSource/`] = {
                dateCreated: firebase.database.ServerValue.TIMESTAMP,
                sourceCodeURL: app.openSource.sourceCodeURL, 
                sourceCodeDownloadURL: app.openSource.sourceCodeDownloadURL,
                sourceCodeFilename: app.openSource.sourceCodeFilename,
                sourceCodeFilesize: app.openSource.sourceCodeFilesize
            };

            return this.afDB.object('/').update(data);
        }else if(type === 'delete_release_android' || type === 'remove_error_android'){
            let releaseCode = args;
            return this.afDB.object(`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/platforms/android/releases/${releaseCode}`).remove();
        // DELETING THE DESKTOP APP DEMO
        }else if(type === 'delete_desktop'){
            let parts = type.split('_');
            let platform = parts.pop();
            
            let data = {};
            data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/platforms/${platform}/dateCreated`] = null;
            data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/platforms/${platform}/demoDownloadURL`] = null;
            data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/platforms/${platform}/demoFileSize`] = null;
            data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/platforms/${platform}/demoFilename`] = null;
            
            return this.afDB.object('/').update(data);
        // DELETING THE SOURCE CODE ARCHIVE
        }else if(type === 'delete_source_code'){
            // PREVENT UPLOADING DATA TO BE SAVED
            return this.afDB.object(`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/openSource`).remove().then(()=>{
                return this.afDB.object(`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/openSource/`).update({
                    sourceCodeURL: app.openSource.sourceCodeURL
                });
            });
        }else if(type === 'all'){
            app.dateUpdated = <number>firebase.database.ServerValue.TIMESTAMP;
            console.log('UPDATING ALL DATA FOR APP');
            console.log('====================================');
            console.log(app);
            console.log('====================================');

            if(app.platforms.android.releases && app.platforms.android.releases.length != 0){
                let container = {};
                for(let i=0;i<app.platforms.android.releases.length;i++){
                    let releaseCode = app.platforms.android.releases[i]['masterReleaseCode'];
                    // app.platforms.android.releases[i]['masterReleaseCode'] = null;
                    app.platforms.android.releases[i]['releaseCode'] = null;
                    container[releaseCode] = app.platforms.android.releases[i];
                }
                app.platforms.android.releases = <any>container;
            }

            let data = {};
            if(args === 'cancel_publish_request'){
                let userAppsRoot = `users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}`;
                data[`${userAppsRoot}/request_dateCreated`] = null;
                data[`${userAppsRoot}/status`] = 'draft';
                data[`${userAppsRoot}/request_status`] = 'cancelled';
                data[`_requests/publish_requests/${app['request_uid']}`] = null;
                return this.afDB.object('/').update(data);
            }
            // Added for cancelling content update request // #10/7/2017
            else if(args === 'cancel_cu'){
                let userAppsRoot = `users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}`;
                data[`${userAppsRoot}/cu_request_dateCreated`] = null;
                data[`${userAppsRoot}/cu_request_status`] = 'cancelled';
                data[`${userAppsRoot}/status_cu`] = null;
                data[`_requests/content_update_requests/${app['request_uid']}`] = null;
                return this.afDB.object('/').update(data);
            }

            // IF saving draft/publish_request
            data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}`] = app;
            if(args === 'publish_request'){
                let key = '';
                if(!app['request_uid']){ key = this.helperUtil.generatePushID();}
                let pq = {
                    dateCreated: firebase.database.ServerValue.TIMESTAMP,
                    app_uid: app.uid,
                    user_uid: this.cacheService.user_uid
                };
                app.status = 'pending_publication';
                app['datePublished'] = null; //
                app['request_uid'] = key || app['request_uid'];
                app['request_status'] = null;
                app['request_dateCreated'] = firebase.database.ServerValue.TIMESTAMP;
                data[`_requests/publish_requests/${app['request_uid']}`] = pq;
            }
            //Added in content update request // #10/7/2017
            else if(args === 'content_update_request'){
                let key = '';
                if(!app['request_uid']){ key = this.helperUtil.generatePushID();}
                let cq = {
                    dateCreated: firebase.database.ServerValue.TIMESTAMP,
                    app_uid: app.uid,
                    user_uid: this.cacheService.user_uid
                };
                app['status_cu'] = 'pending_update';
                // app['datePublished'] = null; //
                app['request_uid'] = app['request_uid'] || key;
                app['cu_request_status'] = null;
                app['cu_request_dateCreated'] = firebase.database.ServerValue.TIMESTAMP;
                data[`_requests/content_update_requests/${app['request_uid']}`] = cq;
            }
            return this.afDB.object('/').update(data);
        }
    }

    // works in adding releases, previewing an apk before it was saved in the database
    previewApk(app:App, args){
        return new Promise((resolve,reject)=>{
            const apiKey = 'AIzaSyDsUKRYcTMx0EI2jtLAKY84j2dM9vTKW68';

            let requestData = {
                user_uid: this.cacheService.user_uid,
                app_uid: app.uid,
                remoteFilepath: `app/distributions/${app.uid}/${app.platforms.android.releases[args].demoFilename}`,
                releaseCode: this.helperUtil.generatePushID(),
                demoDownloadURL: encodeURIComponent(app.platforms.android.releases[args].demoDownloadURL),
                demoFilename: app.platforms.android.releases[args].demoFilename,
                demoFileSize: app.platforms.android.releases[args].demoFileSize,
                preview: true
            }

            request(`https://us-central1-showcase-it.cloudfunctions.net/parseApk?apiKey=${apiKey}&user_uid=${this.cacheService.user_uid}&app_uid=${requestData.app_uid}&remoteFilepath=${requestData.remoteFilepath}&releaseCode=${requestData.releaseCode}&demoDownloadURL=${requestData.demoDownloadURL}&demoFilename=${requestData.demoFilename}&demoFileSize=${requestData.demoFileSize}&preview=${requestData.preview}` , { json: true }, (err, res, body) => {
                if (err) { return reject(err); }
                if(body.code === 200){
                    resolve({result: body.code, data:body.data})
                }else if(body.code === 415){
                    resolve({result: body.code, error: 'Error in parsing the Apk, file is invalid.'});
                }else{
                    console.log(`Status code is ${body.code}: Error in doing the request for parsing the Apk`);
                    reject('Error in parsing the Apk. Please try again.');
                }
            });

        });
    }

    addRelease(app_uid,appData){
        let releaseCode = this.helperUtil.generatePushID();
        appData['dateCreated'] = firebase.database.ServerValue.TIMESTAMP;
        return this.afDB.object(`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app_uid}/platforms/android/releases/${releaseCode}`).set(appData);
    }

    updateReleaseNotes(app:App){
        let releaseCode = app.platforms.android.releases[0].masterReleaseCode;
        let releaseNotes = app.platforms.android.releases[0].releaseNotes;
        let data = {};
        data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/dateUpdated`] = firebase.database.ServerValue.TIMESTAMP;
        data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app.uid}/platforms/android/releases/${releaseCode}/releaseNotes`] = releaseNotes.trim();

        return this.afDB.object('/').update(data);
    }

    updateReleaseName(release_name,release:any,app_uid){
        let releaseCode = release.masterReleaseCode;
        let data = {};
        data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app_uid}/dateUpdated`] = firebase.database.ServerValue.TIMESTAMP;
        data[`users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app_uid}/platforms/android/releases/${releaseCode}/releaseName`] = release_name.trim();
        return this.afDB.object('/').update(data);
    }

    togglePublish(app_uid,type){
        // type = publish,unpublish
        let data = {};
        let userAppsRoot = `users/developer_data/${this.cacheService.user_uid}/user_personal_apps/${app_uid}`;
        let applicationsRoot = `applications/${app_uid}`;
        data[userAppsRoot+`/status`] = type+'ed';
        data[userAppsRoot+`/request_dateCreated`] = null;
        data[applicationsRoot+`/status`] = type+'ed';
        return this.afDB.object('/').update(data);
    }

    getPersonalApps(){
        return this.afDB.list(`users/developer_data/${this.cacheService.user_uid}/user_personal_apps`);
    }

    // USED IN DEV GET APP DETAILS
    getAppDetails(app_uid,user_uid){
        return this.afDB.object(`users/developer_data/${user_uid}/user_personal_apps/${app_uid}`);
    }
    // USED IN GETTIGN APP DETAILS IN MAIN// NOT IN DEV
    getMainAppDetails(app_uid){
        return this.afDB.object(`applications/${app_uid}`);
    }

    getAppCategories(type){
        return this.afDB.list(`_category/${type}`, {
            query: {
                orderByChild: 'name'
            }
        });
    }

    getTotalViews(app_uid){
        return this.afDB.list(`applications_stats/views/${app_uid}/`);
    }
    incrementViews(app_uid){
        return this.afDB.list(`applications_stats/views/${app_uid}/`).push({
            user_uid: this.cacheService.user_uid || null,
            dateViewed: firebase.database.ServerValue.TIMESTAMP
        });
    }

    // type = Android App,Desktop App,Source Code
    incrementDownloads(type,app_uid,release?){
        if(app_uid && this.cacheService.user_uid){
            let data = {
                user_uid: this.cacheService.user_uid,
                dateDownloaded: firebase.database.ServerValue.TIMESTAMP
            }
            if(type === 'source_code' || type === 'desktop'){
                return this.afDB.list(`applications_stats/downloads/${type}/${app_uid}`).push(data);
            }else if(type === 'android'){
                return this.afDB.list(`applications_stats/downloads/${type}/${app_uid}/${release['masterReleaseCode']}`).push(data);
            }
        }
    }
    
    // returns an object
    // {
    //     totalDownloads: 123,
    //     downloads: {
    //         source_code: 1,
    //         desktop: 1,
    //         android: 1,
    //         android_releases: {
    //             'releaseCode1': 123,
    //             'releaseCode2': 123,
    //         }
    //     }
    // }
    getTotalDownloads(app_uid,alive){
        return new Observable(observer=>{
            let types = ['source_code','desktop','android'];
            let downloadsObj = {
                totalDownloads: 0,
                downloads: {
                    source_code: 0,
                    desktop: 0,
                    android: 0,
                    android_releases: {}
                }
            };
            for(let i=0;i<types.length;i++){
                this.afDB.list(`applications_stats/downloads/${types[i]}/${app_uid}`).takeWhile(()=>alive).subscribe(data=>{
                    if(types[i] == 'android'){
                        // $key is the releaseCode
                        // data returns an array of downloaders in that release
                        if(data && data.length > 0){
                            // Reset the androids count because for every change in realtime, it will doubles the count
                            downloadsObj['downloads'][types[i]] = 0;
                            data.forEach(release=>{
                                let releaseDownloadersCount = Object.keys(release).length;
                                // Passes the length of downloads to the android_releases/releaseCode
                                downloadsObj['downloads']['android_releases'][release.$key] = releaseDownloadersCount;
                                // For every release , add the length of the downloads
                                downloadsObj['downloads'][types[i]] += releaseDownloadersCount;
                            });
                        }
                    }else{
                        downloadsObj['downloads'][types[i]] = data.length;
                    }
                    downloadsObj.totalDownloads = downloadsObj.downloads.android + downloadsObj.downloads.desktop + downloadsObj.downloads.source_code;
                    observer.next(downloadsObj);
                });
            }
        });
    }
    
    getCategoryData(app_type,category_uid){
        return this.afDB.object(`_category/${app_type}/${category_uid}`);
    }

    // GET ALL APPLICATIONS IN SHOWCASE IT (PUBLISHED)
    // new_showcased,most_liked
    // web,android,desktop,games,downloadable,opensource
    getPublishedApps(filter_type,limit?){
        let query = {};
        if(filter_type == 'new_showcased'){
            query = { orderByChild: 'status', equalTo: 'published' };
            if(limit){ query['limitToLast'] = limit; }
        }else if(filter_type == 'all'){
            return this.afDB.list(`applications`);
        }
        return this.afDB.list(`applications/`, { query: query });
    }


    // GETTING USER'S SHOWCASED APPS
    getUserShowcasedApps(user_uid){
        return this.afDB.list(`applications/`, {
            query: {
                orderByChild: 'user_uid',
                equalTo: user_uid
            }
        });
    }

    // REVIEW
    setReview(app_uid,review,isEditing=false){
        review.dateReviewed = firebase.database.ServerValue.TIMESTAMP;
        if(!isEditing){
            review.user_uid = this.cacheService.user_uid;
            return this.afDB.list(`applications_stats/reviews/${app_uid}/`).push(review);
        }
        return this.afDB.object(`applications_stats/reviews/${app_uid}/${review.key}`).update(review);
    }

    removeReview(app_uid,review_key){
        let data = {};
        data[`applications_stats/reviews/${app_uid}/${review_key}`] = null;
        data[`_reports/flag_reviews/${app_uid}/${review_key}`] = null;
        return this.afDB.object('/').update(data);
    }

    // With calculation
    getReviews(app_uid,alive?){
        return new Observable(observer=>{
            this.afDB.list(`applications_stats/reviews/${app_uid}`).takeWhile(()=>alive).subscribe(reviews=>{
                if(reviews && reviews.length > 0){
                    let stars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                    let averageStarRating = 0;
                    let overallRating = 0;
                    let totalReviews = 0;
                    // Tally for each review star to the stars object
                    reviews.forEach((review)=>{ stars[review.stars]++; });
                    for(let i=1;i<=5;i++){
                        overallRating += i * stars[i];
                        totalReviews += stars[i];
                    }
                    averageStarRating = overallRating / totalReviews;

                    let data = {
                        totalReviews: totalReviews,
                        averageStarRating: averageStarRating.toFixed(1),
                        reviews: reviews,
                        stars: stars
                    };
                    observer.next(data);
                }else{
                    observer.next({
                        totalReviews: 0,
                        averageStarRating: 0,
                        reviews: [],
                        stars: 0,
                    });
                }
            });
        });
    }
    // No calculation
    getReviewsOnly(app_uid){
        return this.afDB.list(`applications_stats/reviews/${app_uid}`);
    }

    flagReview(app_uid,review_key){
        let data = {};
        data[`applications_stats/reviews/${app_uid}/${review_key}/isFlagged`] = true;
        data[`_reports/flag_reviews/${app_uid}/${review_key}`] = {
            user_uid: this.cacheService.user_uid,
            dateFlagged: firebase.database.ServerValue.TIMESTAMP
        }; 
        return this.afDB.object('/').update(data);
    }
    removeFlagReview(app_uid,review_key){
        let data = {};
        data[`applications_stats/reviews/${app_uid}/${review_key}/isFlagged`] = null;
        data[`_reports/flag_reviews/${app_uid}/${review_key}`] = null;
        return this.afDB.object('/').update(data);
    }
    saveReplyToReview(app_uid,review_key,reply){
        return this.afDB.object(`applications_stats/reviews/${app_uid}/${review_key}/reply`).update({
            comment: reply,
            dateReplied: firebase.database.ServerValue.TIMESTAMP,
            user_uid: this.cacheService.user_uid
        });
    }
    deleteReplyToReview(app_uid,review_key){
        return this.afDB.object(`applications_stats/reviews/${app_uid}/${review_key}/reply`).remove();
    }
}