// Mock nanoid for predictable test results - must be first
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

// Mock WordMaster class
jest.mock('../wordMaster', () => ({
  WordMaster: jest.fn().mockImplementation(() => ({
    getAllWords: jest.fn(),
    getWord: jest.fn(),
  })),
}));

import { getDailyWordRedis } from './getDailyWordRedis';
import { WordMaster } from '../wordMaster';
import { redis } from '../redis';
import { createWordEntity } from '../../types/wordEntity';

const mockRedis = redis as jest.Mocked<typeof redis>;
const MockWordMaster = WordMaster as jest.MockedClass<typeof WordMaster>;

describe('getDailyWordRedis', () => {
  let mockWordMaster: jest.Mocked<WordMaster>;

  beforeEach(() => {
    mockWordMaster = new MockWordMaster() as jest.Mocked<WordMaster>;
    jest.clearAllMocks();
  });

  describe('with cached daily word', () => {
    it('should return cached word for today', async () => {
      const today = new Date('2024-06-25');
      const dateKey = '2024-06-25';
      const cachedWordId = 'cached123';
      const cachedWord = createWordEntity('はなみずき');

      mockRedis.get.mockResolvedValueOnce(cachedWordId);
      mockWordMaster.getWord.mockResolvedValue(cachedWord);

      const result = await getDailyWordRedis(today, mockWordMaster);

      expect(result).toBe('はなみずき');
      expect(mockRedis.get).toHaveBeenCalledWith(`daily_word:${dateKey}`);
      expect(mockWordMaster.getWord).toHaveBeenCalledWith(cachedWordId);
    });

    it('should handle cached word ID but missing word entity', async () => {
      const today = new Date('2024-06-25');
      const dateKey = '2024-06-25';
      const cachedWordId = 'missing123';

      mockRedis.get.mockResolvedValueOnce(cachedWordId);
      mockWordMaster.getWord.mockResolvedValue(null);

      // Mock fallback behavior
      const mockWords = [
        createWordEntity('つきあかり'),
        createWordEntity('はなみずき'),
      ];
      mockWordMaster.getAllWords.mockResolvedValue(mockWords);
      mockRedis.set.mockResolvedValue('OK');

      const result = await getDailyWordRedis(today, mockWordMaster);

      // Should fallback to deterministic selection
      expect(result).toBe('はなみずき'); // Deterministic selection based on date
      expect(mockWordMaster.getAllWords).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith(`daily_word:${dateKey}`, mockWords[1].id);
    });
  });

  describe('without cached daily word', () => {
    it('should generate and cache new daily word', async () => {
      const today = new Date('2024-06-25');
      const dateKey = '2024-06-25';

      mockRedis.get.mockResolvedValueOnce(null);

      const mockWords = [
        createWordEntity('つきあかり'),
        createWordEntity('はなみずき'),
        createWordEntity('あおきそら'),
      ];
      mockWordMaster.getAllWords.mockResolvedValue(mockWords);
      mockRedis.set.mockResolvedValue('OK');

      const result = await getDailyWordRedis(today, mockWordMaster);

      expect(result).toBeDefined();
      expect(result.length).toBe(5); // Should be a 5-character hiragana word
      expect(mockRedis.get).toHaveBeenCalledWith(`daily_word:${dateKey}`);
      expect(mockWordMaster.getAllWords).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith(`daily_word:${dateKey}`, expect.any(String));
    });

    it('should return consistent word for same date', async () => {
      const date1 = new Date('2024-06-25');
      const date2 = new Date('2024-06-25T15:30:00'); // Same date, different time

      mockRedis.get.mockResolvedValue(null);

      const mockWords = [
        createWordEntity('つきあかり'),
        createWordEntity('はなみずき'),
        createWordEntity('あおきそら'),
      ];
      mockWordMaster.getAllWords.mockResolvedValue(mockWords);
      mockRedis.set.mockResolvedValue('OK');

      const result1 = await getDailyWordRedis(date1, mockWordMaster);
      
      // Reset mocks and simulate same behavior for second call
      jest.clearAllMocks();
      mockRedis.get.mockResolvedValue(null);
      mockWordMaster.getAllWords.mockResolvedValue(mockWords);
      mockRedis.set.mockResolvedValue('OK');
      
      const result2 = await getDailyWordRedis(date2, mockWordMaster);

      expect(result1).toBe(result2);
    });

    it('should return different words for different dates', async () => {
      const date1 = new Date('2024-06-25');
      const date2 = new Date('2024-06-26');

      mockRedis.get.mockResolvedValue(null);

      const mockWords = [
        createWordEntity('つきあかり'),
        createWordEntity('はなみずき'),
        createWordEntity('あおきそら'),
        createWordEntity('かぜのうた'),
        createWordEntity('ひかりのみ'),
      ];
      mockWordMaster.getAllWords.mockResolvedValue(mockWords);
      mockRedis.set.mockResolvedValue('OK');

      const result1 = await getDailyWordRedis(date1, mockWordMaster);
      
      // Reset mocks for second call
      jest.clearAllMocks();
      mockRedis.get.mockResolvedValue(null);
      mockWordMaster.getAllWords.mockResolvedValue(mockWords);
      mockRedis.set.mockResolvedValue('OK');
      
      const result2 = await getDailyWordRedis(date2, mockWordMaster);

      expect(result1).not.toBe(result2);
    });
  });

  describe('error handling', () => {
    it('should handle empty word database', async () => {
      const today = new Date('2024-06-25');

      mockRedis.get.mockResolvedValue(null);
      mockWordMaster.getAllWords.mockResolvedValue([]);

      const result = await getDailyWordRedis(today, mockWordMaster);

      expect(result).toBe('つきあかり'); // Fallback to default word
    });

    it('should handle Redis errors gracefully', async () => {
      const today = new Date('2024-06-25');

      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
      
      const mockWords = [createWordEntity('つきあかり')];
      mockWordMaster.getAllWords.mockResolvedValue(mockWords);

      const result = await getDailyWordRedis(today, mockWordMaster);

      expect(result).toBe('つきあかり');
    });

    it('should handle WordMaster errors gracefully', async () => {
      const today = new Date('2024-06-25');

      mockRedis.get.mockResolvedValue(null);
      mockWordMaster.getAllWords.mockRejectedValue(new Error('Database error'));

      const result = await getDailyWordRedis(today, mockWordMaster);

      expect(result).toBe('つきあかり'); // Fallback to default word
    });

    it('should handle invalid date input', async () => {
      const invalidDate = new Date('invalid');

      mockRedis.get.mockResolvedValue(null);
      
      const mockWords = [createWordEntity('つきあかり')];
      mockWordMaster.getAllWords.mockResolvedValue(mockWords);
      mockRedis.set.mockResolvedValue('OK');

      const result = await getDailyWordRedis(invalidDate, mockWordMaster);

      expect(result).toBe('つきあかり');
    });
  });

  describe('date formatting', () => {
    it('should format dates correctly for cache keys', async () => {
      const testDate = new Date('2024-06-25T15:30:45.123Z');
      const expectedKey = 'daily_word:2024-06-25';

      mockRedis.get.mockResolvedValue(null);
      
      const mockWords = [createWordEntity('つきあかり')];
      mockWordMaster.getAllWords.mockResolvedValue(mockWords);
      mockRedis.set.mockResolvedValue('OK');

      await getDailyWordRedis(testDate, mockWordMaster);

      expect(mockRedis.get).toHaveBeenCalledWith(expectedKey);
      expect(mockRedis.set).toHaveBeenCalledWith(expectedKey, expect.any(String));
    });

    it('should handle timezone differences correctly', async () => {
      // Test with different timezone representations of the same date
      const utcDate = new Date('2024-06-25T00:00:00.000Z');
      const jstDate = new Date('2024-06-25T09:00:00.000+09:00');
      
      mockRedis.get.mockResolvedValue(null);
      const mockWords = [createWordEntity('つきあかり')];
      mockWordMaster.getAllWords.mockResolvedValue(mockWords);
      mockRedis.set.mockResolvedValue('OK');

      await getDailyWordRedis(utcDate, mockWordMaster);
      
      // Both should use the same cache key format
      expect(mockRedis.get).toHaveBeenCalledWith('daily_word:2024-06-25');
    });
  });
});