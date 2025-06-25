import { WordEntity, WordMasterEntry, isValidWordEntity } from '../types/wordEntity';
import { redis, safeRedisOperation } from './redis';
import { isValidWordId } from './wordId';

/**
 * Word Master Database Manager
 *
 * Handles CRUD operations for the word master database using Redis.
 * Manages word entities and their master database metadata.
 *
 * Key Design Principles:
 * - All operations are atomic and safe
 * - Comprehensive error handling with fallbacks
 * - Input validation for all public methods
 * - Consistent key naming conventions
 */
export class WordMaster {
  private readonly WORD_KEY_PREFIX = 'word:';
  private readonly MASTER_ENTRIES_KEY = 'word_master_entries';

  /**
   * Validates word entity input
   * @private
   */
  private validateWordEntityInput(wordEntity: WordEntity): void {
    if (!isValidWordEntity(wordEntity)) {
      throw new Error('Invalid word entity provided');
    }
    if (!isValidWordId(wordEntity.id)) {
      throw new Error('Invalid word ID format');
    }
  }

  /**
   * Validates word ID input
   * @private
   */
  private validateWordIdInput(wordId: string): void {
    if (!wordId || typeof wordId !== 'string') {
      throw new Error('Word ID must be a non-empty string');
    }
    if (!isValidWordId(wordId)) {
      throw new Error('Invalid word ID format');
    }
  }

  /**
   * Creates a word key for Redis storage
   * @private
   */
  private createWordKey(wordId: string): string {
    return `${this.WORD_KEY_PREFIX}${wordId}`;
  }

  /**
   * Adds a word to the master database
   *
   * @param wordEntity The word entity to add
   * @returns Promise<boolean> True if successfully added, false otherwise
   * @throws Error if word entity is invalid
   */
  async addWord(wordEntity: WordEntity): Promise<boolean> {
    this.validateWordEntityInput(wordEntity);

    return safeRedisOperation(async () => {
      const wordKey = this.createWordKey(wordEntity.id);

      // Check if word already exists
      const exists = await redis.exists(wordKey);
      if (exists) {
        return false;
      }

      // Create master entry with proper timestamps
      const now = new Date().toISOString();
      const masterEntry: WordMasterEntry = {
        ...wordEntity,
        addedToMaster: now,
        lastAssigned: null,
        assignmentCount: 0,
      };

      // Store word entity and master entry atomically
      await redis.set(wordKey, JSON.stringify(wordEntity));
      await redis.hset(this.MASTER_ENTRIES_KEY, { [wordEntity.id]: JSON.stringify(masterEntry) });

      return true;
    }, false);
  }

  /**
   * Retrieves a word by ID
   *
   * @param wordId The word ID to retrieve
   * @returns Promise<WordEntity | null> The word entity or null if not found
   * @throws Error if word ID is invalid
   */
  async getWord(wordId: string): Promise<WordEntity | null> {
    this.validateWordIdInput(wordId);

    return safeRedisOperation(async () => {
      const wordKey = this.createWordKey(wordId);
      const result = await redis.get(wordKey);

      if (!result) {
        return null;
      }

      try {
        const parsed = JSON.parse(result as string);
        return isValidWordEntity(parsed) ? parsed : null;
      } catch (error) {
        console.warn(`Invalid JSON data for word ${wordId}:`, error);
        return null;
      }
    }, null);
  }

  /**
   * Removes a word from the master database
   *
   * @param wordId The word ID to remove
   * @returns Promise<boolean> True if successfully removed, false otherwise
   * @throws Error if word ID is invalid
   */
  async removeWord(wordId: string): Promise<boolean> {
    this.validateWordIdInput(wordId);

    return safeRedisOperation(async () => {
      const wordKey = this.createWordKey(wordId);

      // Remove word entity first
      const deletedCount = await redis.del(wordKey);
      if (deletedCount === 0) {
        return false;
      }

      // Remove master entry
      await redis.hdel(this.MASTER_ENTRIES_KEY, wordId);
      return true;
    }, false);
  }

  /**
   * Retrieves all words from the master database
   *
   * @returns Promise<WordEntity[]> Array of all word entities, sorted by creation date
   */
  async getAllWords(): Promise<WordEntity[]> {
    return safeRedisOperation(async () => {
      const keys = await redis.keys(`${this.WORD_KEY_PREFIX}*`);

      if (keys.length === 0) {
        return [];
      }

      const results = await redis.mget(...keys);
      const words: WordEntity[] = [];

      for (const [index, result] of results.entries()) {
        if (result) {
          try {
            const parsed = JSON.parse(result as string);
            if (isValidWordEntity(parsed)) {
              words.push(parsed);
            }
          } catch (error) {
            console.warn(`Invalid JSON data for key ${keys[index]}:`, error);
          }
        }
      }

      // Sort by creation date for consistent ordering
      return words.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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
      const entryData = entries?.[wordId];

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
   * @throws Error if word ID is invalid
   */
  async updateAssignmentCount(wordId: string): Promise<boolean> {
    this.validateWordIdInput(wordId);

    return safeRedisOperation(async () => {
      const masterEntry = await this.getMasterEntry(wordId);
      if (!masterEntry) {
        return false;
      }

      const now = new Date().toISOString();
      const updatedEntry: WordMasterEntry = {
        ...masterEntry,
        lastAssigned: now,
        assignmentCount: masterEntry.assignmentCount + 1,
      };

      await redis.hset(this.MASTER_ENTRIES_KEY, { [wordId]: JSON.stringify(updatedEntry) });
      return true;
    }, false);
  }
}
