// Mock nanoid for predictable test results
jest.mock('nanoid', () => ({
  customAlphabet: () => {
    let counter = 0;
    return () => `test${String(counter++).padStart(4, '0')}`;
  },
}));

// Mock Redis for unit tests
jest.mock('../redis', () => {
  const mockRedis = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    hset: jest.fn(),
    hgetall: jest.fn(),
    hdel: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
    mget: jest.fn(),
  };

  return {
    redis: mockRedis,
    resetRedisClient: jest.fn(),
    safeRedisOperation: async <T>(operation: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        return await operation();
      } catch (error) {
        console.error('Redis operation failed:', error);
        return fallback;
      }
    },
  };
});

// Mock WordMaster
jest.mock('../wordMaster', () => ({
  WordMaster: jest.fn().mockImplementation(() => ({
    getAllWords: jest.fn().mockResolvedValue([]),
    getWord: jest.fn().mockResolvedValue(null),
  })),
}));

import { getDailyWord } from './getDailyWord';
import { WordMaster } from '../wordMaster';
import { redis } from '../redis';

const mockRedis = redis as jest.Mocked<typeof redis>;
const MockWordMaster = WordMaster as jest.MockedClass<typeof WordMaster>;

describe('getDailyWord', () => {
  let mockWordMaster: jest.Mocked<WordMaster>;

  beforeEach(() => {
    mockWordMaster = new MockWordMaster() as jest.Mocked<WordMaster>;
    jest.clearAllMocks();
  });

  it('should return fallback word when no words in database', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockWordMaster.getAllWords.mockResolvedValue([]);

    const result = await getDailyWord(new Date());
    expect(result).toBe('つきあかり');
  });

  it('should handle Redis errors gracefully', async () => {
    mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

    const result = await getDailyWord(new Date());
    expect(result).toBe('つきあかり');
  });

  it('should handle WordMaster errors gracefully', async () => {
    mockWordMaster.getAllWords.mockRejectedValue(new Error('Database error'));

    const result = await getDailyWord(new Date());
    expect(result).toBe('つきあかり');
  });

  it('should handle invalid dates gracefully', async () => {
    const invalidDate = new Date('invalid');
    mockRedis.get.mockResolvedValue(null);
    mockWordMaster.getAllWords.mockResolvedValue([]);

    const result = await getDailyWord(invalidDate);
    expect(result).toBe('つきあかり');
  });

  it('should handle null or undefined dates gracefully', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockWordMaster.getAllWords.mockResolvedValue([]);

    const wordWithNull = await getDailyWord(null as unknown as Date);
    const wordWithUndefined = await getDailyWord(undefined as unknown as Date);

    expect(wordWithNull).toBe('つきあかり');
    expect(wordWithUndefined).toBe('つきあかり');
  });
});
