import {Pipe} from "@angular/core";
import {PipeTransform} from "@angular/core";

@Pipe({name: 'filter'})
export class FilterPipe implements PipeTransform {
    transform(items: any[], searchText : string, searchBy: string): any {  
        if (searchText.trim() == "") return items;        
        return this.filterItem(this.escapeRegExp(searchText), items, searchBy);
    }

    filterItem(key, array,searchBy) {
        var results = [];
        for (var i = 0; i < array.length; i++) {
            if(array[i][searchBy].toLowerCase().search(key.trim().toLowerCase()) !== -1){ results.push(array[i]) }
        }
        return results;
    }

    escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
}