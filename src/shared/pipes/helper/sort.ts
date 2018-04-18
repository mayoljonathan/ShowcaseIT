import { Pipe,PipeTransform } from '@angular/core';

@Pipe({ 
  name: 'sort'
})
export class Sort implements PipeTransform{
  transform(array: any[], field: string, sortBy: string): any[] {
    if(array){
      if(sortBy === 'asc'){
        array.sort((a: any, b: any) => {
          if (a[field] < b[field]){ return -1;}
          else if (a[field] > b[field]){ return 1;}
          return 0;
        });
        return array;
      }else{
        array.sort((a: any, b: any) => {
          if (a[field] > b[field]){ return -1;}
          else if (a[field] < b[field]){ return 1;}
          return 0;
        });
        return array;
      }
    }
  }
}