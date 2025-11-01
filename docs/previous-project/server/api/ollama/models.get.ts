import {
  initializeDatabase,
  ConfigurationRepository,
} from "@church-copilot/database";
import { OllamaService } from "@church-copilot/ai-service";
import { AIConfig } from "@church-copilot/shared";

export default defineEventHandler(async (event) => {
  try {
    // Initialize database
    const db = await initializeDatabase();
    const dbInstance = db.getDb();
    const configRepo = new ConfigurationRepository(dbInstance);

    // Get Ollama configuration
    const ollamaUrl =
      (await configRepo.getValue("OLLAMA_URL")) ||
      process.env.OLLAMA_URL ||
      "http://localhost:11434";

    // Initialize Ollama service
    const aiConfig: AIConfig = {
      ollamaUrl,
      model: "dummy", // Not used for listing
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt: "dummy",
    };

    const ollamaService = new OllamaService(aiConfig);

    // Check if Ollama is available
    const isAvailable = await ollamaService.isAvailable();
    if (!isAvailable) {
      return {
        success: false,
        error: "Ollama service not available",
        models: [],
      };
    }

    // Get available models
    const models = await ollamaService.listModels();

    return {
      success: true,
      models: models.map((model) => ({
        label:
          model.charAt(0).toUpperCase() + model.slice(1).replace(/[:_]/g, " "),
        value: model,
      })),
      ollamaUrl,
    };
  } catch (error) {
    console.error("Failed to get Ollama models:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      models: [],
    };
  }
});
