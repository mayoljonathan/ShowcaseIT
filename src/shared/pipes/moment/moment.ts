import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';

@Pipe({
  name: 'timeFromNow',
})
export class TimeFromNow implements PipeTransform {

  transform(value: string, ...args) {
    return moment(value).fromNow();
  }
}

@Pipe({
  name: 'toDate',
})
export class ToDate implements PipeTransform {

  transform(value: string, ...args) {
    return moment(value).format('ll');
  }
}

@Pipe({
  name: 'toFullDateAndTime',
})
export class ToFullDateAndTime implements PipeTransform {

  transform(value: string, ...args) {
    return moment(value).format('lll');
  }
}

