import { WordMaster } from '../wordMaster';
import { getDailyWordRedis } from './getDailyWordRedis';

/**
 * Gets the daily word for a specific date
 *
 * This is the main interface for daily word functionality.
 * Uses Redis-based caching and deterministic word selection.
 *
 * @param date - The date to get the word for
 * @returns Promise<string> The daily word for the specified date
 */
export async function getDailyWord(date: Date): Promise<string> {
  try {
    // Create WordMaster instance for accessing word database
    const wordMaster = new WordMaster();

    // Use Redis-based implementation
    return await getDailyWordRedis(date, wordMaster);
  } catch (error) {
    console.error('Error in getDailyWord:', error);
    // Fallback to default word
    return 'つきあかり';
  }
}
