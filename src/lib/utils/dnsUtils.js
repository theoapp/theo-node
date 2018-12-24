import dns from 'dns';

export const dnsReverse = function(ip) {
  return new Promise((resolve, reject) => {
    dns.reverse(ip, function(err, res) {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
};
