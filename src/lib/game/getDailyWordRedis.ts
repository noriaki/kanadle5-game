import { WordMaster } from '../wordMaster';
import { redis, safeRedisOperation } from '../redis';

/**
 * Default fallback word when no words are available in the database
 */
const DEFAULT_WORD = 'つきあかり';

/**
 * Gets the daily word for a specific date using Redis-based storage
 * 
 * This function implements a deterministic daily word selection system:
 * 1. Check if a word is already cached for the given date
 * 2. If cached, return the cached word
 * 3. If not cached, generate a deterministic word based on the date
 * 4. Cache the generated word for future requests
 * 
 * @param date The date to get the daily word for
 * @param wordMaster WordMaster instance for accessing the word database
 * @returns Promise<string> The daily word for the specified date
 */
export async function getDailyWordRedis(
  date: Date,
  wordMaster: WordMaster
): Promise<string> {
  try {
    // Format date as YYYY-MM-DD for cache key
    const dateKey = formatDateKey(date);
    const cacheKey = `daily_word:${dateKey}`;

    // Try to get cached word for this date
    const cachedWordId = await safeRedisOperation(
      () => redis.get(cacheKey),
      null
    );

    if (cachedWordId) {
      // Get the word entity from the word ID
      const wordEntity = await wordMaster.getWord(cachedWordId as string);
      if (wordEntity) {
        return wordEntity.word;
      }
      // If cached ID exists but word entity is missing, fall through to generate new word
    }

    // No cached word found, generate deterministic word for this date
    const selectedWord = await generateDailyWord(date, wordMaster);
    
    // Find the word entity to get its ID for caching
    const allWords = await wordMaster.getAllWords();
    const selectedWordEntity = allWords.find(w => w.word === selectedWord);
    
    if (selectedWordEntity) {
      // Cache the word ID for this date
      await safeRedisOperation(
        () => redis.set(cacheKey, selectedWordEntity.id),
        null
      );
    }

    return selectedWord;
  } catch (error) {
    console.error('Error in getDailyWordRedis:', error);
    return DEFAULT_WORD;
  }
}

/**
 * Formats a date as YYYY-MM-DD string for use as cache key
 * 
 * @private
 * @param date The date to format
 * @returns string Date in YYYY-MM-DD format
 */
function formatDateKey(date: Date): string {
  try {
    // Handle invalid dates
    if (isNaN(date.getTime())) {
      const now = new Date();
      return now.toISOString().split('T')[0];
    }
    
    return date.toISOString().split('T')[0];
  } catch {
    // Fallback to current date if date formatting fails
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
}

/**
 * Generates a deterministic daily word based on the date
 * 
 * Uses a simple algorithm to ensure the same date always produces
 * the same word, but different dates produce different words.
 * 
 * @private
 * @param date The date to generate word for
 * @param wordMaster WordMaster instance for accessing words
 * @returns Promise<string> The generated daily word
 */
async function generateDailyWord(
  date: Date,
  wordMaster: WordMaster
): Promise<string> {
  try {
    const words = await wordMaster.getAllWords();
    
    if (words.length === 0) {
      return DEFAULT_WORD;
    }

    // Create a deterministic seed from the date
    const dateString = formatDateKey(date);
    const seed = createDateSeed(dateString);
    
    // Select word based on deterministic seed
    const index = seed % words.length;
    return words[index].word;
  } catch (error) {
    console.error('Error generating daily word:', error);
    return DEFAULT_WORD;
  }
}

/**
 * Creates a numeric seed from a date string for deterministic word selection
 * 
 * @private
 * @param dateString Date string in YYYY-MM-DD format
 * @returns number Numeric seed for word selection
 */
function createDateSeed(dateString: string): number {
  // Simple hash function to convert date string to number
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Ensure positive number
  return Math.abs(hash);
}