class AuthTokenManager {
  constructor(db) {
    this.db = db;
  }
  async getAll() {
    const sql = 'select token, type from auth_tokens';
    const tokens = await this.db.all(sql);
    const agentTokens = [];
    const adminTokens = [];
    tokens.forEach(token => {
      if (token.type === 'agent') {
        agentTokens.push(token.token);
      } else if (token.type === 'admin') {
        adminTokens.push(token.token);
      }
    });
    return {
      admins: adminTokens,
      clients: agentTokens
    };
  }
  create(token, type) {
    const sql = 'insert into auth_tokens (token, type, created_at) values (?, ?, ?) ';
    return this.db.run(sql, [token, type, new Date().getTime()]);
  }
  delete() {
    const sql = 'delete from auth_tokens';
    return this.db.delete(sql);
  }
}

export default AuthTokenManager;
