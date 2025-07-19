import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

const provider = new NodeTracerProvider();
provider.register();

registerInstrumentations({
  instrumentations: [
    new PgInstrumentation({ addSqlCommenterCommentToQueries: true }),
  ],
});

console.log("OpenTelemetry initialized");
