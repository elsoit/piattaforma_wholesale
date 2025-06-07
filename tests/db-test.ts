import test from 'node:test';
import assert from 'node:assert/strict';
import { testConnection } from '../lib/db';

// Ensure testConnection resolves successfully
// and returns a truthy value.
test('database connection', async () => {
  const result = await testConnection();
  assert.ok(result, 'Expected testConnection() to resolve to a truthy value');
});
