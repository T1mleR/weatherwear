/**
 * Minimal dependency-free OpenTelemetry Protocol (OTLP/HTTP JSON) emitter.
 * Three real OTLP signals: cumulative custom metrics, request traces and logs.
 *
 * This is a manual OTLP instrument, not the OpenTelemetry JS SDK/auto-instrumentation.
 * It avoids a lockfile dependency change for the coursework prototype.
 * For production-scale distributed tracing, adopt the official OTel SDK.
 */
import { randomBytes } from "node:crypto";

type Result = "success" | "invalid_input" | "upstream_error";

const boundaries = [100, 250, 500, 1000, 2500, 5000, 10000];
const processStartNs = String(Date.now()) + "000000";
let totalRequests = 0;
let totalFailures = 0;
let totalDuration = 0;
const buckets = Array<number>(boundaries.length + 1).fill(0);

function attr(key: string, value: string) {
  return { key, value: { stringValue: value } };
}

function resource() {
  return {
    attributes: [
      attr("service.name", "weatherwear"),
      attr("deployment.environment", process.env.DEPLOYMENT_ENVIRONMENT || "development"),
      attr("service.version", process.env.SERVICE_VERSION || "coursework"),
    ],
  };
}

function nanos() {
  return String(Date.now()) + "000000";
}

async function exportSignal(
  endpoint: string,
  signal: "metrics" | "traces" | "logs",
  payload: unknown
): Promise<void> {
  const url = endpoint.replace(/\/+$/, "") + "/v1/" + signal;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(1500),
  });
  if (!response.ok) {
    throw new Error("OTLP " + signal + " export rejected: HTTP " + response.status);
  }
}

export async function recordSearchTelemetry(
  result: Result,
  durationMs: number
): Promise<void> {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return; // Safe on Render/AWS until a private collector is configured.

  const elapsed = Math.max(0, Math.round(durationMs));
  totalRequests++;
  if (result === "upstream_error") totalFailures++;
  totalDuration += elapsed;
  let index = boundaries.findIndex((boundary) => elapsed <= boundary);
  if (index === -1) index = boundaries.length;
  buckets[index]++;

  const now = nanos();
  const traceId = randomBytes(16).toString("hex");
  const spanId = randomBytes(8).toString("hex");
  const successful = result === "success";
  const startNs = String(Math.max(0, Number(now.slice(0, -6)) - elapsed)) + "000000";
  const common = [attr("http.route", "/api/recommendations"), attr("app.result", result)];
  const point = {
    startTimeUnixNano: processStartNs,
    timeUnixNano: now,
    attributes: [],
  };

  const metrics = {
    resourceMetrics: [{
      resource: resource(),
      scopeMetrics: [{
        scope: { name: "weatherwear.otlp" },
        metrics: [
          {
            name: "weatherwear_search_requests",
            description: "Total search requests including invalid input",
            unit: "1",
            sum: {
              dataPoints: [{ ...point, asInt: String(totalRequests) }],
              aggregationTemporality: 2,
              isMonotonic: true,
            },
          },
          {
            name: "weatherwear_search_failures",
            description: "Failed upstream weather searches",
            unit: "1",
            sum: {
              dataPoints: [{ ...point, asInt: String(totalFailures) }],
              aggregationTemporality: 2,
              isMonotonic: true,
            },
          },
          {
            name: "weatherwear_search_duration_ms",
            description: "Search latency, milliseconds",
            unit: "ms",
            histogram: {
              dataPoints: [{
                ...point,
                count: String(totalRequests),
                sum: totalDuration,
                bucketCounts: buckets.map(String),
                explicitBounds: boundaries,
              }],
              aggregationTemporality: 2,
            },
          },
        ],
      }],
    }],
  };
  const traces = {
    resourceSpans: [{
      resource: resource(),
      scopeSpans: [{
        scope: { name: "weatherwear.otlp" },
        spans: [{
          traceId,
          spanId,
          name: "POST /api/recommendations",
          kind: 2,
          startTimeUnixNano: startNs,
          endTimeUnixNano: now,
          attributes: common.concat(attr("app.component", "weather-search")),
          status: { code: successful ? 1 : 2 },
        }],
      }],
    }],
  };
  const logs = {
    resourceLogs: [{
      resource: resource(),
      scopeLogs: [{
        scope: { name: "weatherwear.otlp" },
        logRecords: [{
          timeUnixNano: now,
          observedTimeUnixNano: now,
          traceId,
          spanId,
          severityNumber: successful ? 9 : 17,
          severityText: successful ? "INFO" : "ERROR",
          body: {
            stringValue: successful
              ? "WeatherWear search completed"
              : "WeatherWear search did not complete successfully",
          },
          attributes: common,
        }],
      }],
    }],
  };

  // Telemetry failure must never break weather search or database writes.
  await Promise.allSettled([
    exportSignal(endpoint, "metrics", metrics),
    exportSignal(endpoint, "traces", traces),
    exportSignal(endpoint, "logs", logs),
  ]);
}
