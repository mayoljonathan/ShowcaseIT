import { Injectable } from '@angular/core';
import 'rxjs/add/operator/take';
import {Observable} from 'rxjs/Observable';

import { AngularFireDatabase } from 'angularfire2/database';
import * as firebase from 'firebase/app';

import { PlatformUtil,DialogUtil,HelperUtil } from "../utils";
// Services
import { CacheService,UserService } from './';
import * as request from 'request';
import * as algoliasearch from 'algoliasearch';

@Injectable()
export class SearchService {
    
    algolia = algoliasearch("T0UIPNLU4Y", "4ab9a76309578a6f5555f770e4868713", {protocol: 'https:'});

    constructor(
        public afDB: AngularFireDatabase,
        public dialogUtil: DialogUtil,
        public platformUtil: PlatformUtil,
        public userService: UserService,
        public helperUtil: HelperUtil,
        public cacheService: CacheService,
    ){

    }

    // doSearchQuery(query){
    //     let uid = this.cacheService.user_uid ? this.cacheService.user_uid : this.cacheService.device_uuid;
    //     return this.afDB.list(`_search/queries/${uid}`).push({query:query});
    // }

    getSearchResults(queryUID){
        let uid = this.cacheService.user_uid ? this.cacheService.user_uid : this.cacheService.device_uuid;
        return this.afDB.object(`_search/results/${uid}/${queryUID}`);
    }

    searchQuery(query){
        return new Observable(observer=>{
            let appIndex = this.algolia.initIndex('applications');
            let userIndex = this.algolia.initIndex('users');
            appIndex.setSettings({
                attributesToIndex: ['title','short_description']
            });
            userIndex.setSettings({
                attributesToIndex: ['name']
            });
            appIndex.search(query).then(res=>{
                console.log('Apps');
                console.log(res);
                observer.next({id: 'apps', data: res});
            });
            userIndex.search(query).then(res=>{
                console.log('Users');
                console.log(res);
                observer.next({id: 'users', data: res});
            });
        });

    }

}