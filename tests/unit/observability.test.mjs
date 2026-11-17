import assert from "node:assert/strict";
import test from "node:test";
import { recordSearchTelemetry } from "../../lib/observability.ts";

test("exports OTLP metrics, traces and logs over HTTP/JSON", async () => {
  const originalFetch = globalThis.fetch;
  const originalEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const observed = new Map();
  try {
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://collector.example:4318";
    globalThis.fetch = async (url, options) => {
      observed.set(new URL(url).pathname, JSON.parse(options.body));
      assert.equal(options.headers["content-type"], "application/json");
      return { ok: true };
    };
    await recordSearchTelemetry("upstream_error", 320);
    assert.deepEqual([...observed.keys()].sort(), ["/v1/logs", "/v1/metrics", "/v1/traces"]);
    const metrics = observed.get("/v1/metrics").resourceMetrics[0].scopeMetrics[0].metrics;
    assert.equal(metrics.length, 3);
    assert.equal(metrics.find((m) => m.name === "weatherwear_search_failures").sum.dataPoints[0].asInt, "1");
    assert.equal(metrics.find((m) => m.name === "weatherwear_search_requests").sum.isMonotonic, true);
    assert.equal(metrics.find((m) => m.name === "weatherwear_search_duration_ms").histogram.dataPoints[0].bucketCounts.length, 8);
    assert.equal(observed.get("/v1/traces").resourceSpans[0].scopeSpans[0].spans[0].status.code, 2);
    const record = observed.get("/v1/logs").resourceLogs[0].scopeLogs[0].logRecords[0];
    assert.equal(record.severityText, "ERROR");
    assert.equal(record.traceId.length, 32);
    assert.equal(record.spanId.length, 16);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalEndpoint === undefined) delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    else process.env.OTEL_EXPORTER_OTLP_ENDPOINT = originalEndpoint;
  }
});
