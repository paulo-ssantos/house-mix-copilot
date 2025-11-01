// Server API endpoint for client-side log forwarding
import logger from '~/utils/logger';

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const body = await readBody(event)
    const { level, message, meta } = body

    if (!level || !message) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: level and message'
      })
    }

    // Add client info to metadata
    const clientMeta = {
      ...meta,
      client: true,
      ip: getClientIP(event),
      userAgent: getHeader(event, 'user-agent'),
      timestamp: new Date().toISOString()
    }

    // Forward log to winston with appropriate level
    switch (level) {
      case 'error':
        logger.error(message, clientMeta)
        break
      case 'warn':
        logger.warn(message, clientMeta)
        break
      case 'info':
        logger.info(message, clientMeta)
        break
      case 'verbose':
        logger.verbose(message, clientMeta)
        break
      case 'debug':
        logger.debug(message, clientMeta)
        break
      default:
        logger.info(message, clientMeta)
    }

    return { success: true, message: 'Log forwarded to server' }
  } catch (error) {
    console.error('Failed to process client log:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process log'
    })
  }
})