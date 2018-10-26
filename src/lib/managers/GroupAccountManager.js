class GroupAccountManager {
  constructor(db) {
    this.db = db;
  }

  getAll(group_id, limit, offset) {
    let sql =
      'select ga.id, g.id, g.name, g.active from groups_accounts ga, groups g where g.id = ga.group_id and g.id = ? order by name asc';
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    return new Promise((resolve, reject) => {
      this.db.all(sql, [group_id], (err, rows) => {
        if (err) {
          return reject(err);
        }
        return resolve(rows);
      });
    });
  }

  create(group_id, account_id) {
    const sql = 'insert into groups_accounts (group_id, account_id, created_at) values (?, ?, ?) ';
    return new Promise((resolve, reject) => {
      this.db.run(sql, [group_id, account_id, new Date().getTime()], async function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      });
    });
  }

  delete(group_id, account_id) {
    const sql = 'delete from groups_accounts where group_id = ? and account_id = ?';
    return new Promise((resolve, reject) => {
      this.db.run(sql, [group_id, account_id], async function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes);
      });
    });
  }

  getAllByAccount(account_id, limit, offset) {
    let sql =
      'select ga.id, g.id, g.name, g.active from groups_accounts ga, groups g where g.id = ga.group_id and ga.account_id = ? order by name asc';
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    return new Promise((resolve, reject) => {
      this.db.all(sql, [account_id], (err, rows) => {
        if (err) {
          return reject(err);
        }
        return resolve(rows);
      });
    });
  }
}

export default GroupAccountManager;
