import { WordEntity, WordMasterEntry, isValidWordEntity } from '../types/wordEntity';
import { redis, safeRedisOperation } from './redis';

/**
 * Word Master Database Manager
 * 
 * Handles CRUD operations for the word master database using Redis.
 * Manages word entities and their master database metadata.
 */
export class WordMaster {
  private readonly WORD_KEY_PREFIX = 'word:';
  private readonly MASTER_ENTRIES_KEY = 'word_master_entries';

  /**
   * Adds a word to the master database
   * 
   * @param wordEntity The word entity to add
   * @returns Promise<boolean> True if successfully added, false otherwise
   */
  async addWord(wordEntity: WordEntity): Promise<boolean> {
    return safeRedisOperation(async () => {
      const wordKey = `${this.WORD_KEY_PREFIX}${wordEntity.id}`;
      
      // Check if word already exists
      const exists = await redis.exists(wordKey);
      if (exists) {
        return false;
      }

      // Create master entry
      const masterEntry: WordMasterEntry = {
        ...wordEntity,
        addedToMaster: new Date().toISOString(),
        lastAssigned: null,
        assignmentCount: 0,
      };

      // Store word entity and master entry
      await redis.set(wordKey, JSON.stringify(wordEntity));
      await redis.hset(this.MASTER_ENTRIES_KEY, wordEntity.id, JSON.stringify(masterEntry));

      return true;
    }, false);
  }

  /**
   * Retrieves a word by ID
   * 
   * @param wordId The word ID to retrieve
   * @returns Promise<WordEntity | null> The word entity or null if not found
   */
  async getWord(wordId: string): Promise<WordEntity | null> {
    return safeRedisOperation(async () => {
      const wordKey = `${this.WORD_KEY_PREFIX}${wordId}`;
      const result = await redis.get(wordKey);
      
      if (!result) {
        return null;
      }

      try {
        const parsed = JSON.parse(result as string);
        return isValidWordEntity(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }, null);
  }

  /**
   * Removes a word from the master database
   * 
   * @param wordId The word ID to remove
   * @returns Promise<boolean> True if successfully removed, false otherwise
   */
  async removeWord(wordId: string): Promise<boolean> {
    return safeRedisOperation(async () => {
      const wordKey = `${this.WORD_KEY_PREFIX}${wordId}`;
      
      const deletedCount = await redis.del(wordKey);
      if (deletedCount === 0) {
        return false;
      }

      await redis.hdel(this.MASTER_ENTRIES_KEY, wordId);
      return true;
    }, false);
  }

  /**
   * Retrieves all words from the master database
   * 
   * @returns Promise<WordEntity[]> Array of all word entities
   */
  async getAllWords(): Promise<WordEntity[]> {
    return safeRedisOperation(async () => {
      const keys = await redis.keys(`${this.WORD_KEY_PREFIX}*`);
      
      if (keys.length === 0) {
        return [];
      }

      const results = await redis.mget(...keys);
      const words: WordEntity[] = [];

      for (const result of results) {
        if (result) {
          try {
            const parsed = JSON.parse(result as string);
            if (isValidWordEntity(parsed)) {
              words.push(parsed);
            }
          } catch {
            // Skip invalid entries
          }
        }
      }

      return words;
    }, []);
  }

  /**
   * Gets the total count of words in the database
   * 
   * @returns Promise<number> The number of words in the database
   */
  async getWordCount(): Promise<number> {
    return safeRedisOperation(async () => {
      const keys = await redis.keys(`${this.WORD_KEY_PREFIX}*`);
      return keys.length;
    }, 0);
  }

  /**
   * Retrieves a word master entry by ID
   * 
   * @param wordId The word ID to retrieve master entry for
   * @returns Promise<WordMasterEntry | null> The master entry or null if not found
   */
  async getMasterEntry(wordId: string): Promise<WordMasterEntry | null> {
    return safeRedisOperation(async () => {
      const entries = await redis.hgetall(this.MASTER_ENTRIES_KEY);
      const entryData = entries[wordId];
      
      if (!entryData) {
        return null;
      }

      try {
        return JSON.parse(entryData as string) as WordMasterEntry;
      } catch {
        return null;
      }
    }, null);
  }

  /**
   * Updates the assignment count for a word
   * 
   * @param wordId The word ID to update
   * @returns Promise<boolean> True if successfully updated, false otherwise
   */
  async updateAssignmentCount(wordId: string): Promise<boolean> {
    return safeRedisOperation(async () => {
      const masterEntry = await this.getMasterEntry(wordId);
      if (!masterEntry) {
        return false;
      }

      const updatedEntry: WordMasterEntry = {
        ...masterEntry,
        lastAssigned: new Date().toISOString(),
        assignmentCount: masterEntry.assignmentCount + 1,
      };

      await redis.hset(this.MASTER_ENTRIES_KEY, wordId, JSON.stringify(updatedEntry));
      return true;
    }, false);
  }
}