import assert from 'assert';
import { describe, it } from 'mocha';
import { convertToPSSyntax } from '../src/lib/rdbms/postgres';

describe('Test postgres', function () {
  describe('convertToPSSyntax', function () {
    const tests = [
      {
        in: 'select a, b, c from t where a = ?',
        out: 'select a, b, c from t where a = $1'
      },
      {
        in: 'select a, b, c from t where a = ? and b > ?',
        out: 'select a, b, c from t where a = $1 and b > $2'
      },
      {
        in: 'update t set a = ? where a = ? and b > ?',
        out: 'update t set a = $1 where a = $2 and b > $3'
      },
      {
        in: 'update t set a =? where a = ? and b >?',
        out: 'update t set a =$1 where a = $2 and b >$3'
      },
      {
        in: 'update t set a=? where a=? and b>?',
        out: 'update t set a=$1 where a=$2 and b>$3'
      },
      {
        in: `select distinct a.id, a.email, p.host, p.user, p.ssh_options
       from accounts a, tgroups g, groups_accounts ga, permissions p
       where ? like p.host and ? like p.user 
      and k.account_id = a.id
      and g.id = p.group_id
      and g.id = ga.group_id 
      and a.id = ga.account_id 
      and a.active = 1
      and g.active = 1
      and (a.expire_at = 0 or a.expire_at > ?)`,
        out: `select distinct a.id, a.email, p.host, p.user, p.ssh_options
       from accounts a, tgroups g, groups_accounts ga, permissions p
       where $1 like p.host and $2 like p.user 
      and k.account_id = a.id
      and g.id = p.group_id
      and g.id = ga.group_id 
      and a.id = ga.account_id 
      and a.active = 1
      and g.active = 1
      and (a.expire_at = 0 or a.expire_at > $3)`
      }
    ];
    tests.forEach(function (test, i) {
      it(`must convert correctly test ${i}`, function () {
        const out = convertToPSSyntax(test.in);
        assert.strictEqual(out, test.out);
      });
    });
  });
});
