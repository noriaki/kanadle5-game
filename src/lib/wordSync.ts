import { readFile } from 'fs/promises';
import { join } from 'path';
import { WordMaster } from './wordMaster';
import { createWordEntity } from '../types/wordEntity';
import { WordEntry } from '../types/words';

/**
 * Word synchronization result for individual sync operation
 */
export type WordSyncResult = {
  success: boolean;
  processed: number;
  added: number;
  skipped: number;
  errors: string[];
};

/**
 * Full synchronization result including file loading
 */
export type FullSyncResult = {
  success: boolean;
  loaded: number;
  sync: WordSyncResult;
  error?: string;
};

/**
 * File reader function type for dependency injection
 */
export type FileReader = (filePath: string, encoding: string) => Promise<string>;

/**
 * Word Synchronization Manager
 * 
 * Handles synchronization of words from words.json file to the Redis-based
 * word master database. Provides validation and error handling for the sync process.
 * 
 * Key Features:
 * - File-based word loading with validation
 * - Bulk synchronization with progress tracking
 * - Comprehensive error handling and reporting
 * - Game-specific word validation rules
 */
export class WordSync {
  private readonly wordsFilePath: string;
  private readonly fileReader: FileReader;

  constructor(
    private wordMaster: WordMaster,
    wordsFilePath?: string,
    fileReader?: FileReader
  ) {
    // Path to the words.json file
    this.wordsFilePath = wordsFilePath || join(process.cwd(), 'src', 'data', 'words.json');
    this.fileReader = fileReader || readFile;
  }

  /**
   * Loads and validates words from the words.json file
   * 
   * @returns Promise<WordEntry[]> Array of valid word entries
   */
  async loadWordsFromJson(): Promise<WordEntry[]> {
    try {
      const fileContent = await this.fileReader(this.wordsFilePath, 'utf8');
      const rawWords = JSON.parse(fileContent);

      if (!Array.isArray(rawWords)) {
        console.warn('Words file does not contain an array');
        return [];
      }

      // Filter and validate word entries with statistics
      const validWords = rawWords.filter((entry: unknown) => this.validateWordEntry(entry));
      const invalidCount = rawWords.length - validWords.length;
      
      if (invalidCount > 0) {
        console.warn(`Filtered out ${invalidCount} invalid entries from word list`);
      }
      console.log(`Loaded ${validWords.length} valid words from ${rawWords.length} total entries`);
      
      return validWords;
    } catch (error) {
      console.error('Failed to load words from JSON file:', error);
      return [];
    }
  }

  /**
   * Validates a word entry from the JSON file
   * 
   * @param entry The entry to validate
   * @returns boolean True if valid, false otherwise
   */
  validateWordEntry(entry: unknown): entry is WordEntry {
    if (!entry || typeof entry !== 'object') {
      return false;
    }

    const wordEntry = entry as Record<string, unknown>;

    // Check required fields
    if (typeof wordEntry.kana !== 'string' || typeof wordEntry.word !== 'string') {
      return false;
    }

    return this.isValidKana(wordEntry.kana);
  }

  /**
   * Validates if a string is valid hiragana for the game
   * 
   * @private
   * @param kana The kana string to validate
   * @returns boolean True if valid, false otherwise
   */
  private isValidKana(kana: string): boolean {
    // Check kana length (must be exactly 5 characters)
    if (kana.length !== 5) {
      return false;
    }

    // Check if kana contains only hiragana characters
    const hiraganaRegex = /^[\u3041-\u3096]+$/;
    if (!hiraganaRegex.test(kana)) {
      return false;
    }

    // Exclude words containing 'を' character (game rule)
    if (kana.includes('を')) {
      return false;
    }

    return true;
  }

  /**
   * Synchronizes word entries to the master database
   * 
   * @param words Array of word entries to sync
   * @returns Promise<WordSyncResult> Result of the sync operation
   */
  async syncWordsToMaster(words: WordEntry[]): Promise<WordSyncResult> {
    const result: WordSyncResult = {
      success: true,
      processed: 0,
      added: 0,
      skipped: 0,
      errors: [],
    };

    if (words.length === 0) {
      return result;
    }

    for (const wordEntry of words) {
      try {
        result.processed++;

        // Create word entity from the word entry
        const wordEntity = createWordEntity(wordEntry.kana, {
          source: 'words.json',
          category: 'dictionary',
        });

        // Attempt to add to master database
        const added = await this.wordMaster.addWord(wordEntity);
        
        if (added) {
          result.added++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        const errorMsg = `Failed to sync word '${wordEntry.kana}': ${error instanceof Error ? error.message : String(error)}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // If there were any errors, mark the operation as failed
    if (result.errors.length > 0) {
      result.success = false;
    }

    return result;
  }

  /**
   * Performs a complete synchronization from words.json to master database
   * 
   * @returns Promise<FullSyncResult> Result of the full sync operation
   */
  async performFullSync(): Promise<FullSyncResult> {
    try {
      // Load words from JSON file
      const words = await this.loadWordsFromJson();
      
      if (words.length === 0) {
        return {
          success: false,
          loaded: 0,
          sync: {
            success: false,
            processed: 0,
            added: 0,
            skipped: 0,
            errors: ['No valid words found in the file'],
          },
          error: 'No valid words found in the file',
        };
      }

      // Sync words to master database
      const syncResult = await this.syncWordsToMaster(words);

      return {
        success: syncResult.success,
        loaded: words.length,
        sync: syncResult,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        loaded: 0,
        sync: {
          success: false,
          processed: 0,
          added: 0,
          skipped: 0,
          errors: [errorMsg],
        },
        error: errorMsg,
      };
    }
  }
}