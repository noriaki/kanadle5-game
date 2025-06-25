// Mock fs for reading words.json - must be first
const mockReadFile = jest.fn();
jest.mock('fs/promises', () => ({
  readFile: mockReadFile,
}));

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

// Mock Redis for unit tests
jest.mock('./redis', () => {
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
    pipeline: jest.fn(() => ({
      set: jest.fn().mockReturnThis(),
      hset: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    })),
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

import { WordSync, FileReader } from './wordSync';
import { WordMaster } from './wordMaster';
import { createWordEntity } from '../types/wordEntity';
import { redis } from './redis';

// Mock nanoid for predictable test results
jest.mock('nanoid', () => ({
  customAlphabet: () => {
    let counter = 0;
    return () => `test${String(counter++).padStart(4, '0')}`;
  },
}));

const mockRedisClient = redis as jest.Mocked<typeof redis>;
// mockReadFile is already defined above

describe('WordSync', () => {
  let wordSync: WordSync;
  let wordMaster: WordMaster;
  let mockFileReader: jest.MockedFunction<FileReader>;

  beforeEach(() => {
    wordMaster = new WordMaster();
    mockFileReader = jest.fn();
    wordSync = new WordSync(wordMaster, '/fake/path/words.json', mockFileReader);
    jest.clearAllMocks();
  });

  describe('loadWordsFromJson', () => {
    it('should load words from words.json file', async () => {
      const mockWordsData = [
        { kana: 'つきあかり', word: '月明かり' },
        { kana: 'はなみずき', word: '花水木' },
        { kana: 'あいうえお', word: 'アイウエオ' },
      ];

      mockFileReader.mockResolvedValue(JSON.stringify(mockWordsData));

      const result = await wordSync.loadWordsFromJson();

      expect(result).toEqual(mockWordsData);
      expect(mockFileReader).toHaveBeenCalledWith('/fake/path/words.json', 'utf8');
    });

    it('should handle file read errors', async () => {
      mockFileReader.mockRejectedValue(new Error('File not found'));

      const result = await wordSync.loadWordsFromJson();

      expect(result).toEqual([]);
    });

    it('should handle invalid JSON data', async () => {
      mockFileReader.mockResolvedValue('invalid json');

      const result = await wordSync.loadWordsFromJson();

      expect(result).toEqual([]);
    });

    it('should filter out invalid word entries', async () => {
      const mockWordsData = [
        { kana: 'つきあかり', word: '月明かり' }, // valid
        { kana: 'short', word: '短い' }, // invalid - too short
        { kana: 'はなみずき', word: '花水木' }, // valid
        { kana: 'toolong123', word: '長すぎる' }, // invalid - too long
      ];

      mockFileReader.mockResolvedValue(JSON.stringify(mockWordsData));

      const result = await wordSync.loadWordsFromJson();

      expect(result).toEqual([
        { kana: 'つきあかり', word: '月明かり' },
        { kana: 'はなみずき', word: '花水木' },
      ]);
    });

    it('should filter out words with invalid hiragana characters', async () => {
      const mockWordsData = [
        { kana: 'つきあかり', word: '月明かり' }, // valid
        { kana: 'test123ab', word: 'テスト' }, // invalid - contains latin chars
        { kana: 'はなみずき', word: '花水木' }, // valid
        { kana: 'あいうえを', word: 'アイウエヲ' }, // invalid - contains 'を'
      ];

      mockFileReader.mockResolvedValue(JSON.stringify(mockWordsData));

      const result = await wordSync.loadWordsFromJson();

      expect(result).toEqual([
        { kana: 'つきあかり', word: '月明かり' },
        { kana: 'はなみずき', word: '花水木' },
      ]);
    });
  });

  describe('syncWordsToMaster', () => {
    it('should sync new words to master database', async () => {
      const words = [
        { kana: 'つきあかり', word: '月明かり' },
        { kana: 'はなみずき', word: '花水木' },
      ];

      // Mock WordMaster methods
      const mockAddWord = jest.spyOn(wordMaster, 'addWord').mockResolvedValue(true);
      const mockGetWordCount = jest.spyOn(wordMaster, 'getWordCount').mockResolvedValue(0);

      const result = await wordSync.syncWordsToMaster(words);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(2);
      expect(result.added).toBe(2);
      expect(result.skipped).toBe(0);
      expect(mockAddWord).toHaveBeenCalledTimes(2);
    });

    it('should skip duplicate words', async () => {
      const words = [
        { kana: 'つきあかり', word: '月明かり' },
        { kana: 'はなみずき', word: '花水木' },
      ];

      // Mock first word as duplicate, second as new
      const mockAddWord = jest
        .spyOn(wordMaster, 'addWord')
        .mockResolvedValueOnce(false) // duplicate
        .mockResolvedValueOnce(true); // new
      const mockGetWordCount = jest.spyOn(wordMaster, 'getWordCount').mockResolvedValue(1);

      const result = await wordSync.syncWordsToMaster(words);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(2);
      expect(result.added).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it('should handle errors gracefully', async () => {
      const words = [
        { kana: 'つきあかり', word: '月明かり' },
        { kana: 'はなみずき', word: '花水木' },
      ];

      const mockAddWord = jest
        .spyOn(wordMaster, 'addWord')
        .mockRejectedValue(new Error('Redis error'));
      const mockGetWordCount = jest.spyOn(wordMaster, 'getWordCount').mockResolvedValue(0);

      const result = await wordSync.syncWordsToMaster(words);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should handle empty word list', async () => {
      const result = await wordSync.syncWordsToMaster([]);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(0);
      expect(result.added).toBe(0);
      expect(result.skipped).toBe(0);
    });
  });

  describe('performFullSync', () => {
    it('should perform complete sync from file to master database', async () => {
      const mockWordsData = [
        { kana: 'つきあかり', word: '月明かり' },
        { kana: 'はなみずき', word: '花水木' },
      ];

      mockFileReader.mockResolvedValue(JSON.stringify(mockWordsData));
      const mockAddWord = jest.spyOn(wordMaster, 'addWord').mockResolvedValue(true);

      const result = await wordSync.performFullSync();

      expect(result.success).toBe(true);
      expect(result.loaded).toBe(2);
      expect(result.sync.processed).toBe(2);
      expect(result.sync.added).toBe(2);
      expect(mockAddWord).toHaveBeenCalledTimes(2);
    });

    it('should handle file loading errors', async () => {
      mockFileReader.mockRejectedValue(new Error('File not found'));

      const result = await wordSync.performFullSync();

      expect(result.success).toBe(false);
      expect(result.loaded).toBe(0);
      expect(result.error).toContain('No valid words found');
    });
  });

  describe('validateWordEntry', () => {
    it('should validate correct word entries', () => {
      const validEntry = { kana: 'つきあかり', word: '月明かり' };
      expect(wordSync.validateWordEntry(validEntry)).toBe(true);
    });

    it('should reject entries with wrong kana length', () => {
      const shortEntry = { kana: 'つき', word: '月' };
      const longEntry = { kana: 'つきあかりが', word: '月明かりが' };

      expect(wordSync.validateWordEntry(shortEntry)).toBe(false);
      expect(wordSync.validateWordEntry(longEntry)).toBe(false);
    });

    it('should reject entries with invalid hiragana', () => {
      const invalidEntry = { kana: 'test1', word: 'テスト' };
      expect(wordSync.validateWordEntry(invalidEntry)).toBe(false);
    });

    it('should reject entries with "を" character', () => {
      const woEntry = { kana: 'あいうえを', word: 'アイウエヲ' };
      expect(wordSync.validateWordEntry(woEntry)).toBe(false);
    });

    it('should reject entries with missing fields', () => {
      const missingKana = { word: '月明かり' } as any;
      const missingWord = { kana: 'つきあかり' } as any;

      expect(wordSync.validateWordEntry(missingKana)).toBe(false);
      expect(wordSync.validateWordEntry(missingWord)).toBe(false);
    });
  });
});
