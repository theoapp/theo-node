import { NodeSDK } from '@opentelemetry/sdk-node';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { MySQL2Instrumentation } from '@opentelemetry/instrumentation-mysql2';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { NAME } from './version';

// eslint-disable-next-line n/no-process-env
const serviceName = process.env.OTEL_SERVICE_NAME ?? NAME;

const otelSDKConfig = {
  serviceName,
  instrumentations: [
    new HttpInstrumentation({
      ignoreIncomingRequestHook: request => {
        return ['/healthz', '/metrics'].includes(request.url);
      }
    }),
    new MySQL2Instrumentation(),
    new PinoInstrumentation(),
    new UndiciInstrumentation(),
    new RedisInstrumentation(),
    new PgInstrumentation()
  ]
};

const sdk = new NodeSDK(otelSDKConfig);

sdk.start();

async function stop() {
  try {
    await sdk.shutdown();
  } catch (_e) {
    //
  }
}

process.once('SIGTERM', async () => {
  await stop();
});

process.once('SIGINT', async () => {
  await stop();
});

import('./index');
