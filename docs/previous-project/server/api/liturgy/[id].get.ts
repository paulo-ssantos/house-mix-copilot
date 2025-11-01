import { initializeDatabase, LiturgyRepository } from '@church-copilot/database';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Liturgy ID is required'
      });
    }

    // Initialize database
    const db = await initializeDatabase();
    const dbInstance = db.getDb();
    const liturgyRepo = new LiturgyRepository(dbInstance);

    // Get liturgy with items
    const liturgyWithItems = await liturgyRepo.getWithItems(id);

    if (!liturgyWithItems) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Liturgy not found'
      });
    }

    // Parse metadata if it exists
    let metadata = null;
    if (liturgyWithItems.metadata) {
      try {
        metadata = JSON.parse(liturgyWithItems.metadata);
      } catch (error) {
        console.warn('Failed to parse liturgy metadata:', error);
      }
    }

    return {
      success: true,
      liturgy: {
        ...liturgyWithItems,
        metadata
      }
    };
  } catch (error) {
    console.error('Failed to get liturgy:', error);
    
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to get liturgy'
    });
  }
});