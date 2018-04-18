import { Injectable } from '@angular/core';
import 'rxjs/add/operator/take';
import {Observable} from 'rxjs/Observable';

import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import 'firebase/storage';

import { InAppBrowser } from '@ionic-native/in-app-browser';
import { PlatformUtil } from "../utils";

// Services
import { CacheService } from './';
// Models
import { App } from "../models"; 

import * as request from 'request'

@Injectable()
export class FileService {

    app: App;
    storageRef;

    public uploadTasks = [
        // {
        //     taskType: 'app_icon_upload',
        //     filename: '123.jpg',
        //     uploadTask: null,
        // },
        // {
        //     taskType: 'app_icon_upload',
        //     filename: '1235.jpg',
        //     uploadTask: null,
        // },
        // {
        //     taskType: 'stop_upload',
        //     filename: 'this.jpg',
        //     uploadTask: null,
        // }
    ];

    constructor(
        public afAuth: AngularFireAuth,
        public afDB: AngularFireDatabase,
        public iab: InAppBrowser,
        public platformUtil: PlatformUtil,
        public cacheService: CacheService,
    ){
        this.storageRef = firebase.storage().ref();
    }
    
    uploadFile(taskType,remotePath,localPath,filename?,args?:any){
        
        var uploadTask = this.storageRef.child(`${remotePath}/${filename}`).putString(localPath, 'data_url');
        this.uploadTasks.push({
            taskType: taskType, 
            filename:filename, 
            uploadTask: uploadTask,
            app_uid: args.app_uid
        });
        console.log(`START UPLOADING FOR: ${remotePath}/${filename}`);
      
        // uploadTask.pause();

        return new Observable(observer=>{
            uploadTask.on('state_changed', (snapshot:any)=>{
                console.log(snapshot);
                var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + Math.round(progress) + '% done');
                observer.next({
                    progress: Math.round(progress),
                    transferred: snapshot.bytesTransferred
                });
            },(error)=>{
                observer.next({error: error});
                console.log('====================================');
                console.log(error);
                console.log('====================================');
            }, ():any=>{
                // Remove from uploadTask after uploading
                console.log('Removing from the uploadtask');
                let index = this.uploadTasks.findIndex(t => t.filename === filename);
                if(index != undefined){
                    this.uploadTasks.splice(index,1);
                    var downloadURL = uploadTask.snapshot.downloadURL;
                    if(args.requireThumbURL){
                        this.getThumbUrl(remotePath,`thumb_${filename}`).then(thumb_url=>{
                            observer.next({
                                downloadURL: downloadURL,
                                thumbURL: thumb_url,
                            });
                        }).catch(e=>{
                            observer.next({error: {code: 'function/busy'}});
                        });
                    }else{
                        observer.next({downloadURL: downloadURL});
                    }
                }
            });
        });
        
    }

    downloadFile(url){
        return new Promise((resolve,reject)=>{
            console.log('Downloading using native downloader in browser');
            request(url, { json: true }, (err, res, body) => {
                if(err || res.statusCode == 403 || res.statusCode == 500 || res.statusCode != 200){ return reject();}
                if(this.platformUtil.checkPlatform() === 'browser'){
                    window.open(url, '_self');
                    resolve();
                }else if(this.platformUtil.checkPlatform() === 'android'){
                    this.iab.create(url);
                    resolve();
                }
            });
        });

        // var urlRef = firebase.storage().refFromURL(url);

        // This can be downloaded directly:
        // var xhr = new XMLHttpRequest();
        // xhr.responseType = 'blob';
        // xhr.onload = function(event) {
        //     var blob = xhr.response;
        //     console.log(blob);
        // };
        // xhr.open('GET', url);
        // xhr.send();
    }

    getThumbUrl(path,filename) : Promise<any>{
        return new Promise((resolve,reject)=>{
            let counter = 0;
            let urlListener = setInterval(()=>{
                this.storageRef.child(`${path}/${filename}`).getDownloadURL().then(url=>{
                    console.log("ThumbURL is now available, COUNTER: "+counter);
                    clearInterval(urlListener);
                    resolve(url);
                }).catch(err=>{
                    console.log('ThumbURL is not available yet, COUNTER: '+counter);
                    counter++;
                    if(counter == 60){
                        clearInterval(urlListener);
                        return reject();
                    }
                });
            },1000);
        });
    }

    updateProfilePhoto(remotePath,localPath,filename?,args?:any){
        var uploadTask = this.storageRef.child(`${remotePath}/${filename}`).putString(localPath, 'data_url');
        return new Observable(observer=>{
            uploadTask.on('state_changed', (snapshot:any)=>{
                var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                observer.next({
                    progress: Math.round(progress),
                    transferred: snapshot.bytesTransferred
                });
            },(error)=>{
                observer.next({error: error});
            },():any=>{
                var downloadURL = uploadTask.snapshot.downloadURL;
                observer.next({downloadURL: downloadURL});
                // this.getThumbUrl(remotePath,`thumb_${filename}`).then(thumb_url=>{
                //     observer.next({
                //         downloadURL: downloadURL,
                //         thumbURL: thumb_url,
                //     });
                // }).catch(e=>{
                //     observer.next({error: {code: 'function/busy'}});
                // });
            });
        });
    }

    manageUpload(changeState,taskType,filename){
        console.log('HERE');
        console.log(this.uploadTasks);
        return new Promise((resolve,reject)=>{
            let task = this.uploadTasks.find(t => t.filename === filename && t.taskType === taskType);
            console.log(task);
            if(!task){
                console.log('REJECTING');
                return reject();
            }
                console.log('RESOLVING');
            if(changeState === "pause"){
                console.log(`PAUSING THE UPLOAD FOR: ${task.filename}`);
                task.uploadTask.pause();
            }else if(changeState === "resume"){
                console.log(`RESUMING THE UPLOAD FOR:${task.filename}`);
                task.uploadTask.resume();
            }else if(changeState === "cancel"){
                console.log(`CANCELLING THE UPLOAD FOR:${task.filename}`);
                if(task.uploadTask.snapshot.state === "paused"){ task.uploadTask.resume() }
                task.uploadTask.cancel();

                // FIND INDEX
                let deletedTaskIndex = this.uploadTasks.findIndex(t => t.filename === filename && t.taskType === taskType);
                this.uploadTasks.splice(deletedTaskIndex,1);
            }
            resolve();
        });
    }
    
    getExtension(filename){
        return filename.split('.').pop();
    }

    sizeLimitExceeded(filesize,limit){
        // filesize is in bytes, limit is in MB
        return filesize > this.convertMBToBytes(limit);
    }

    convertMBToBytes(size){
        // MB is in binary
        return size*1048576;
    }
}