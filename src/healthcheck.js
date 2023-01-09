import fetch from 'node-fetch';

fetch(`http://127.0.0.1:${process.env.PORT || 9100}/healthz`, { method: 'GET' })
  .then(res => {
    if (res.ok) {
      process.exit(0);
    }
    process.exit(1);
  })
  .catch(() => {
    process.exit(1);
  });
