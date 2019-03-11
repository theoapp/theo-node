import { SSHFingerprint } from '../lib/utils/sshUtils';
import assert from 'assert';

const keys = [
  {
    k:
      'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCgSW1myQsEQd5nAz8eJjn93xXqNgJj0p9gbj5L7M71ITH9Ti7NzMoUZdn0wMGgI7PLb5sxlrv0/m05pRkmG0qoQaUuZACS4xMSBSjkb+z0KcdAZgE7f4slKQzBarfugNsWpLWEKV6NTn2JqV4gXBDTSDsbhXXllbVeUSyuKo7d8KlAov4GZKnCe025hCh1fJScHdWJvHouCQx2LUkzcayL3fxImEs+no9GTN7Hp81BrBUcLq3LWTcJpMxYoiLjO0lZaEwhR/NPof0mwqvnmgRYT2Bk3scAGiGma0pHpIBjvY1A5FlnCEBEgT0//XoSe5QGVorhoffhrdMA6EOh1fOR/Zwatx35xZG9cHWRBkgn+3DBYq9orVxbjra4Tf2HXVJXGB9cFn/y7nOyLALXCdvk4/jpcLvOKVUcXJ6NMpCV4ELLLj7/b4XuW5s8THEvU4wc31fnfH03sU70rr24zvQ47vxVMJU72kT25uuQYRepZ/sMh5MaP19ZV7zXhUv4dgg/z7Me8i4HNFsrdmTNlFmk1jXnVPQ2ICrFEr04VzIFPsgUS+0/R2Ab8Oi14WUPWAcNem5C2oVzgMztuOVZL2SSfu/1t4kEgxR+ei/RqRu2HR/g1/8JJKFNYpG2B4kQ21vuXQnet4aoMxOGxACL+6+V1MGxNejbp9p+BDuci9PSYw== macno@habanero',
    fp: 'SHA256:jVnggyF95YXyPgNpeeMA++T8Oko+FhDKpUGoKlRV0z0'
  },
  {
    k:
      'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCcHb8ko2Hrd/QKWvem7UP26XXuNUWnD2hm/X//Q4wznPwj2sUQCEpuFtn6+9w2hWD/wWlZjCq30i+X+D9rF5SBN5vVdxPn4RNArmMcevtbTrBt7nBCA/kiNJW0pinLJa/45/RC3TejZB+vtEKgrQiV5MDPucUQzGlfIFXZMxtn2KfYNcsUTwtzQlEK+gW94DnxsxH3kZM+FWl1+ra9XJ9urJSoizQPq1ALKuc8YH/Rx6+qezBhMmCJrw4dIRt+epyENqt09I6A6k9BgpOn7qg3eC4bQT/zwqvJH7eD0Q4fHaMuj+JPewhpIo6EclcLLkvuCmz7i6R2y7eHrFqPScEBanMBiX7Re+qznNaXTDWZUZ+VlFMGbZWsVTrq4h0/WpmE6HTCEIZH8qF25CnRTTMhsxmwTjLdj6uDFVksedqXZICT0wfR89jXT0WiC38Uyk2hPIBj0+yplDmzQyvWabc+xgqxaqJ7ofxJtQFP2xPel7Md6D0beWKv1hLGFScKfBBFS4JM+Xt6p4RBjdxXYiQ5Vlh2CON+xeBlflqUSCKkEYqnADV+PvAInq0fSbxJ1aKmVTst4LqLTL2PpAqdc0x0ieTGXr4hNosriJkXyPyuh3rsl3JOjUDmOA7480yf71W4pVj31PK0wvfs862a2yaDMgYGbdyAx56Ha+M2IP9uOw==',
    fp: 'SHA256:nzfiS3UxNnfffvF48FrTN7cTWIDUT8P/ymxFID5q4tY'
  }
];
describe('SSHUtils', function() {
  for (let i = 0; i < keys.length; i++) {
    it('should return the correct fingerprint', function() {
      const fp = SSHFingerprint(keys[i].k);
      assert.strictEqual(fp, keys[i].fp);
    });
  }
});
