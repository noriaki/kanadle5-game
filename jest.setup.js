import '@testing-library/jest-dom';

// Global mock for nanoid
jest.mock('nanoid', () => ({
  customAlphabet: () => {
    let counter = 0;
    return () => `test${String(counter++).padStart(4, '0')}`;
  },
}));

// Mock @upstash/redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    hset: jest.fn(),
    hgetall: jest.fn(),
    hdel: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
    mget: jest.fn(),
  })),
}));