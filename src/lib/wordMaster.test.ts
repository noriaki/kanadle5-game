// Mock Redis for unit tests - must be at the top before any imports
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

import { WordMaster } from './wordMaster';
import { WordEntity, WordMasterEntry, createWordEntity } from '../types/wordEntity';
import { redis } from './redis';

// Mock nanoid for predictable test results
jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'test1234',
}));

const mockRedis = redis as jest.Mocked<typeof redis>;

describe('WordMaster', () => {
  let wordMaster: WordMaster;

  beforeEach(() => {
    wordMaster = new WordMaster();
    jest.clearAllMocks();
  });

  describe('addWord', () => {
    it('should add a word to the master database', async () => {
      const wordEntity = createWordEntity('つきあかり');
      mockRedis.exists.mockResolvedValue(0);
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.hset.mockResolvedValue(1);

      const result = await wordMaster.addWord(wordEntity);

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        `word:${wordEntity.id}`,
        JSON.stringify(wordEntity)
      );
      expect(mockRedis.hset).toHaveBeenCalledWith(
        'word_master_entries',
        wordEntity.id,
        expect.stringContaining('"assignmentCount":0')
      );
    });

    it('should reject duplicate words', async () => {
      const wordEntity = createWordEntity('つきあかり');
      mockRedis.exists.mockResolvedValue(1);

      const result = await wordMaster.addWord(wordEntity);

      expect(result).toBe(false);
      expect(mockRedis.set).not.toHaveBeenCalled();
      expect(mockRedis.hset).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      const wordEntity = createWordEntity('つきあかり');
      mockRedis.exists.mockRejectedValue(new Error('Redis connection failed'));

      const result = await wordMaster.addWord(wordEntity);

      expect(result).toBe(false);
    });
  });

  describe('getWord', () => {
    it('should retrieve a word by ID', async () => {
      const wordEntity = createWordEntity('つきあかり');
      mockRedis.get.mockResolvedValue(JSON.stringify(wordEntity));

      const result = await wordMaster.getWord(wordEntity.id);

      expect(result).toEqual(wordEntity);
      expect(mockRedis.get).toHaveBeenCalledWith(`word:${wordEntity.id}`);
    });

    it('should return null for non-existent word', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await wordMaster.getWord('nonexist');

      expect(result).toBeNull();
    });

    it('should handle invalid JSON gracefully', async () => {
      mockRedis.get.mockResolvedValue('invalid json');

      const result = await wordMaster.getWord('test1234');

      expect(result).toBeNull();
    });
  });

  describe('removeWord', () => {
    it('should remove a word from the master database', async () => {
      const wordId = 'test1234';
      mockRedis.del.mockResolvedValue(1);
      mockRedis.hdel.mockResolvedValue(1);

      const result = await wordMaster.removeWord(wordId);

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith(`word:${wordId}`);
      expect(mockRedis.hdel).toHaveBeenCalledWith('word_master_entries', wordId);
    });

    it('should return false if word does not exist', async () => {
      mockRedis.del.mockResolvedValue(0);

      const result = await wordMaster.removeWord('nonexist');

      expect(result).toBe(false);
    });
  });

  describe('getAllWords', () => {
    it('should retrieve all words from the master database', async () => {
      const wordEntity1 = createWordEntity('つきあかり');
      const wordEntity2 = createWordEntity('はなみずき');

      mockRedis.keys.mockResolvedValue([`word:${wordEntity1.id}`, `word:${wordEntity2.id}`]);
      mockRedis.mget.mockResolvedValue([JSON.stringify(wordEntity1), JSON.stringify(wordEntity2)]);

      const result = await wordMaster.getAllWords();

      expect(result).toEqual([wordEntity1, wordEntity2]);
      expect(mockRedis.keys).toHaveBeenCalledWith('word:*');
    });

    it('should handle empty database', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const result = await wordMaster.getAllWords();

      expect(result).toEqual([]);
    });

    it('should filter out invalid entries', async () => {
      const wordEntity = createWordEntity('つきあかり');

      mockRedis.keys.mockResolvedValue([`word:${wordEntity.id}`, 'word:invalid']);
      mockRedis.mget.mockResolvedValue([JSON.stringify(wordEntity), 'invalid json']);

      const result = await wordMaster.getAllWords();

      expect(result).toEqual([wordEntity]);
    });
  });

  describe('getWordCount', () => {
    it('should return the total number of words', async () => {
      mockRedis.keys.mockResolvedValue(['word:1', 'word:2', 'word:3']);

      const result = await wordMaster.getWordCount();

      expect(result).toBe(3);
      expect(mockRedis.keys).toHaveBeenCalledWith('word:*');
    });

    it('should return 0 for empty database', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const result = await wordMaster.getWordCount();

      expect(result).toBe(0);
    });
  });

  describe('getMasterEntry', () => {
    it('should retrieve word master entry', async () => {
      const wordId = 'test1234';
      const masterEntry = {
        id: wordId,
        word: 'つきあかり',
        createdAt: '2025-01-01T00:00:00.000Z',
        isActive: true,
        addedToMaster: '2025-01-01T00:00:00.000Z',
        lastAssigned: null,
        assignmentCount: 0,
      };

      mockRedis.hgetall.mockResolvedValue({
        [wordId]: JSON.stringify(masterEntry),
      });

      const result = await wordMaster.getMasterEntry(wordId);

      expect(result).toEqual(masterEntry);
      expect(mockRedis.hgetall).toHaveBeenCalledWith('word_master_entries');
    });

    it('should return null for non-existent entry', async () => {
      mockRedis.hgetall.mockResolvedValue({});

      const result = await wordMaster.getMasterEntry('nonexist');

      expect(result).toBeNull();
    });
  });

  describe('updateAssignmentCount', () => {
    it('should increment assignment count for a word', async () => {
      const wordId = 'test1234';
      const existingEntry: WordMasterEntry = {
        id: wordId,
        word: 'つきあかり',
        createdAt: '2025-01-01T00:00:00.000Z',
        isActive: true,
        addedToMaster: '2025-01-01T00:00:00.000Z',
        lastAssigned: null,
        assignmentCount: 0,
      };

      mockRedis.hgetall.mockResolvedValue({
        [wordId]: JSON.stringify(existingEntry),
      });
      mockRedis.hset.mockResolvedValue(1);

      const result = await wordMaster.updateAssignmentCount(wordId);

      expect(result).toBe(true);
      expect(mockRedis.hset).toHaveBeenCalledWith(
        'word_master_entries',
        wordId,
        expect.stringContaining('"assignmentCount":1')
      );
      expect(mockRedis.hset).toHaveBeenCalledWith(
        'word_master_entries',
        wordId,
        expect.stringContaining('"lastAssigned":')
      );
    });

    it('should return false for non-existent word', async () => {
      mockRedis.hgetall.mockResolvedValue({});

      const result = await wordMaster.updateAssignmentCount('nonexist');

      expect(result).toBe(false);
    });
  });
});
