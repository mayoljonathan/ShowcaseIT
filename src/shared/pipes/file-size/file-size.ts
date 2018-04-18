import {Pipe} from "@angular/core";
import {PipeTransform} from "@angular/core";

@Pipe({name: 'fileSize'})
export class FileSize implements PipeTransform {
    private units = [
        'B',
        'KB',
        'MB',
        'GB',
        'TB',
        'PB'
    ];

    transform(bytes: number) : string {
        let precision: number = 2 
        if (!isFinite( bytes ) ){ return '?'}
        let unit = 0;

        while ( bytes >= 1024 ) {
            bytes /= 1024;
            unit ++;
        }

        if(bytes){
            return bytes.toFixed( + precision ) + ' ' + this.units[ unit ];
        }
    }

}