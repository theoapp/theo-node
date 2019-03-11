import { SSHFingerprint } from '../lib/utils/sshUtils';

export const runV12migration = async client => {
  const rows = await client.all('select id, public_key from public_keys');
  for (let i = 0; i < rows.length; i++) {
    const { public_key, id } = rows[i];
    const fp = SSHFingerprint(public_key);
    await client.run('update public_keys set fingerprint = ? where id = ? ', [fp, id]);
  }
};
