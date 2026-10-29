// Copyright 2023 Fluidware srl
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

// Errors thrown by helpers/managers carry t_code, HTTPError (auth checks) carries status
export const sendError = function (res, err) {
  const status = err.t_code || err.status || 500;
  res.status(status);
  res.json({ status, reason: err.message || 'Internal Server Error' });
};

export const sendDone = function (res, done) {
  if (done) {
    res.status(201);
    res.json({ status: 201 });
  } else {
    res.status(500);
    res.json({ status: 500, reason: 'Unknown error' });
  }
};
