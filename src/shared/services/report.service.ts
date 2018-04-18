import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';

import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

// Services
import { CacheService,UserService } from './';
// Models
import { App } from "../models"; 

@Injectable()
export class ReportService {

    // app: App;

    constructor(
        public afAuth: AngularFireAuth,
        public afDB: AngularFireDatabase,
        public cacheService: CacheService,
    ){

    }

    sendReport(email,problem){
        return this.afDB.list(`_reports/problem/`).push({
            email: email,
            problem: problem,
            user_uid: this.cacheService.user_uid || null,
            dateReported: firebase.database.ServerValue.TIMESTAMP
        });
    }
   
}