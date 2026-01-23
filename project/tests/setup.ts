import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test setup
beforeAll(async () => {
  // Setup global test environment
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup global test environment
  console.log('Cleaning up test environment...');
});

beforeEach(() => {
  // Reset any global state before each test
});

afterEach(() => {
  // Cleanup after each test
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.SUPABASE_PROJECT_URL = 'https://test.supabase.co';
process.env.SUPABASE_API_KEY = 'test-anon-key';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters-long';