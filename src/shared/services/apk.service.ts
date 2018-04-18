import { Injectable } from '@angular/core';

import { PlatformUtil } from "../utils";

// Services
import { CacheService } from './';
// Models
import { App } from "../models"; 

@Injectable()
export class ApkService {
    constructor(
        public platformUtil: PlatformUtil,
        public cacheService: CacheService,
    ){
    }
    
    compareVersion(version1,version2){
		var result = false;
		if(typeof version1!=='object'){ version1=version1.toString().split('.'); }
		if(typeof version2!=='object'){ version2=version2.toString().split('.'); }
		for(var i=0;i<(Math.max(version1.length,version2.length));i++){
			if(version1[i]==undefined){ version1[i]=0; }
			if(version2[i]==undefined){ version2[i]=0; }
			if(Number(version1[i])<Number(version2[i])){
				result=true;
				break;
			}
			if(version1[i]!=version2[i]){
				break;
			}
		}
		return(result);
	}
}