import { initializeDatabase, LiturgyRepository } from '@church-copilot/database';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { page = 0, limit = 10, search, orderBy = 'date', order = 'desc' } = query;

    // Initialize database
    const db = await initializeDatabase();
    const dbInstance = db.getDb();
    const liturgyRepo = new LiturgyRepository(dbInstance);

    // Get liturgies with pagination
    const liturgies = await liturgyRepo.findAll({
      limit: Number(limit),
      offset: Number(page) * Number(limit),
      search: search as string,
      orderBy: orderBy as 'date' | 'title' | 'createdAt',
      order: order as 'asc' | 'desc'
    });

    // Get total count
    const total = await liturgyRepo.count(search as string);

    // Get database statistics
    const stats = db.getStats();

    return {
      success: true,
      liturgies,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      },
      stats
    };
  } catch (error) {
    console.error('Failed to get liturgies:', error);
    
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to get liturgies'
    });
  }
});