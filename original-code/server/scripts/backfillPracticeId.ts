import { db } from '../db';
import { sql } from 'drizzle-orm';
import { logger } from '../../logger';

/**
 * Backfill script to populate missing practice_id values and timestamps in orders table
 * Sets practice_id = tenant_id for all orders where practice_id is NULL
 * Sets created_at and updated_at to CURRENT_TIMESTAMP for all NULL values
 */
export async function backfillPracticeId() {
  try {
    logger.info('Backfilling missing practice_id values...');
    
    const practiceIdResult = await db.execute(
      sql`UPDATE orders SET practice_id = tenant_id WHERE practice_id IS NULL`
    );
    
    logger.info({ updatedOrders: practiceIdResult.rowCount || 0 }, 'Practice ID backfill complete');
    
    logger.info('Backfilling missing timestamp values...');
    
    const timestampResult = await db.execute(
      sql`UPDATE orders 
          SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
          WHERE created_at IS NULL OR updated_at IS NULL`
    );
    
    logger.info({ updatedOrders: timestampResult.rowCount || 0 }, 'Timestamp backfill complete');
  } catch (error) {
    logger.error({ error }, 'Backfill failed');
    throw error;
  }
}