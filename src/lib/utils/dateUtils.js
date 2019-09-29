// Copyright 2019 AuthKeys srl
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export const getTimestampFromISO8601 = string => {
  if (!string) {
    return 0;
  }
  let ret = 0;
  const type = typeof string;
  if (type === 'string') {
    const d = new Date(string);
    const ts = d.getTime();
    if (isNaN(ts)) {
      throw new Error('Invalid date string');
    }
    ret = ts;
  } else if (type === 'object') {
    if (string instanceof Date) {
      ret = string.getTime();
    } else {
      throw new Error('Invalid object');
    }
  } else {
    ret = string;
  }
  return ret;
};

export function millisecondsToStr(milliseconds) {
  function numberEnding(number) {
    return number > 1 ? 's' : '';
  }
  let temp = Math.floor(milliseconds / 1000);
  const years = Math.floor(temp / 31536000);
  if (years) {
    return years + ' year' + numberEnding(years);
  }
  const days = Math.floor((temp %= 31536000) / 86400);
  if (days) {
    return days + ' day' + numberEnding(days);
  }
  const hours = Math.floor((temp %= 86400) / 3600);
  if (hours) {
    return hours + ' hour' + numberEnding(hours);
  }
  const minutes = Math.floor((temp %= 3600) / 60);
  if (minutes) {
    return minutes + ' minute' + numberEnding(minutes);
  }
  const seconds = temp % 60;
  if (seconds) {
    return seconds + ' second' + numberEnding(seconds);
  }
  return 'less than a second';
}
