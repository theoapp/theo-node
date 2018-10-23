import handleAccounts from './accounts';
import handleKeys from './keys';
import handleGroups from './groups';

export const initRoutes = server => {
  server.get('/', (req, res, next) => {
    res.json({ status: 200 });
  });

  // /authorized_keys
  handleKeys(server);

  // Groups
  handleGroups(server);

  // /accounts
  handleAccounts(server);
};
