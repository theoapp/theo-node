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

import { SSHFingerprint } from '../lib/utils/sshUtils';

export const runV12migration = async client => {
  const rows = await client.all('select id, public_key from public_keys');
  for (let i = 0; i < rows.length; i++) {
    const { public_key, id } = rows[i];
    const fp = SSHFingerprint(public_key);
    await client.run('update public_keys set fingerprint = ? where id = ? ', [fp, id]);
  }
};
