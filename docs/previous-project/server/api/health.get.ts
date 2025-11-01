import { initializeDatabase } from "@church-copilot/database";
import { OllamaService } from "@church-copilot/ai-service";
import { AIConfig } from "@church-copilot/shared";

export default defineEventHandler(async (event) => {
  try {
    const results = {
      database: { status: "unknown", error: null, stats: null },
      ai: { status: "unknown", error: null, models: [], testResponse: null },
    };

    // Test database connection
    try {
      const db = await initializeDatabase();
      const stats = db.getStats();
      results.database = {
        status: "connected",
        error: null,
        stats,
      };
    } catch (error) {
      results.database = {
        status: "error",
        error:
          error instanceof Error ? error.message : "Unknown database error",
        stats: null,
      };
    }

    // Test AI service
    try {
      const aiConfig: AIConfig = {
        ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
        model: process.env.OLLAMA_MODEL || "deepseek-r1:1.5b", // Use available model
        temperature: 0.3,
        maxTokens: 100,
        systemPrompt: "You are a helpful assistant.",
      };

      const ollamaService = new OllamaService(aiConfig);
      const connectionTest = await ollamaService.testConnection();

      results.ai = {
        status: connectionTest.available ? "connected" : "unavailable",
        error: connectionTest.error || null,
        models: connectionTest.models,
        testResponse: connectionTest.testResponse || null,
      };
    } catch (error) {
      results.ai = {
        status: "error",
        error:
          error instanceof Error ? error.message : "Unknown AI service error",
        models: [],
        testResponse: null,
      };
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      services: results,
      environment: {
        ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
        ollamaModel: process.env.OLLAMA_MODEL || "deepseek-r1:1.5b",
      },
    };
  } catch (error) {
    console.error("Health check error:", error);

    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error ? error.message : "Health check failed",
    });
  }
});
