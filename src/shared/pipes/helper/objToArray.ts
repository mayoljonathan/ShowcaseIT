import { Pipe,PipeTransform } from '@angular/core';

@Pipe({ 
  name: 'objToArr',
  pure: false 
})
export class ObjectToArray implements PipeTransform{
  transform (value, args?) {
    let arr = [];
    for (let key in value) {
      value[key]['key']= key;
      arr.push(value[key]);
    }
    return arr;
  }
}