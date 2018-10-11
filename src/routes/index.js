import handleAccounts from './accounts';
import handleKeys from './keys';

export const initRoutes = server => {
  server.get('/', (req, res, next) => {
    res.json({ status: 200 });
  });

  // /authorized_keys
  handleKeys(server);

  // /accounts
  handleAccounts(server);
};
