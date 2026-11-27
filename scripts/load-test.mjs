/**
 * Load test: boots the built server, hammers the hot endpoints, and fails
 * (exit 1) if any request errors or latency exceeds the budget.
 *
 *   npm run build && npm run loadtest
 *
 * Tunables: LOADTEST_CONNECTIONS, LOADTEST_SECONDS, LOADTEST_P99_MS.
 */
import { spawn } from 'node:child_process';
import autocannon from 'autocannon';

const port = Number(process.env.LOADTEST_PORT ?? 3999);
const connections = Number(process.env.LOADTEST_CONNECTIONS ?? 200);
const duration = Number(process.env.LOADTEST_SECONDS ?? 15);
const p99BudgetMs = Number(process.env.LOADTEST_P99_MS ?? 500);
// autocannon counts sockets cut when the run stops as errors; allow 0.1%.
const maxErrorRate = Number(process.env.LOADTEST_MAX_ERROR_RATE ?? 0.001);
const base = `http://127.0.0.1:${port}`;

const server = spawn('node', ['dist/main.js'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
    // The test comes from one IP; lift the per-IP limit for it only.
    RATE_LIMIT_PER_MINUTE: '100000000',
  },
  stdio: ['ignore', 'ignore', 'inherit'],
});

async function waitForHealth() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Server did not become healthy');
}

function run(title, path) {
  return new Promise((resolve, reject) => {
    autocannon(
      { url: `${base}${path}`, connections, duration, title },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
  });
}

let failed = false;
try {
  await waitForHealth();
  for (const [title, path] of [
    ['catalog version', '/api/v1/catalog/version'],
    ['full catalog', '/api/v1/catalog'],
    ['model schedule', '/api/v1/catalog/models/quick'],
  ]) {
    const r = await run(title, path);
    const errors = r.errors + r.timeouts + r.non2xx;
    if (errors > 0) {
      console.log(
        `  errors=${r.errors} timeouts=${r.timeouts} non2xx=${r.non2xx} statusCodes=${JSON.stringify(r.statusCodeStats)}`,
      );
    }
    console.log(
      `${title}: ${Math.round(r.requests.average)} req/s, ` +
        `p99 ${r.latency.p99} ms, errors ${errors}`,
    );
    const errorRate = errors / Math.max(1, r.requests.total);
    if (errorRate > maxErrorRate || r.latency.p99 > p99BudgetMs) failed = true;
  }
} finally {
  server.kill('SIGTERM');
}

if (failed) {
  console.error(
    `Load test failed: error rate over ${maxErrorRate * 100}% or p99 over ${p99BudgetMs} ms`,
  );
  process.exit(1);
}
console.log('Load test passed');
