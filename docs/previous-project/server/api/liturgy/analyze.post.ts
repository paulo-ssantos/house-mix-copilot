import {
  initializeDatabase,
  LiturgyRepository,
  LiturgyItemRepository,
  ConfigurationRepository,
} from "@church-copilot/database";
import {
  OllamaService,
  LiturgyAnalyzer,
  YouTubeAutoDownloadService,
} from "@church-copilot/ai-service";
import { AIConfig } from "@church-copilot/shared";

// Utility function to extract YouTube URLs early
function extractYouTubeUrls(text: string): string[] {
  const youtubeRegex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/gi;
  const matches = [...text.matchAll(youtubeRegex)];
  return matches.map((match) =>
    match[0].startsWith("http")
      ? match[0]
      : `https://www.youtube.com/watch?v=${match[1]}`
  );
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      rawText,
      title,
      date,
      church,
      elders,
      autoDownloadYoutube = true,
    } = body;

    if (!rawText || rawText.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Raw text is required for analysis",
      });
    }

    // Initialize database
    const db = await initializeDatabase();
    const dbInstance = db.getDb();

    const liturgyRepo = new LiturgyRepository(dbInstance);
    const liturgyItemRepo = new LiturgyItemRepository(dbInstance);
    const configRepo = new ConfigurationRepository(dbInstance);

    // Load AI configuration from settings with dynamic fallbacks
    const ollamaUrl =
      (await configRepo.getValue("OLLAMA_URL")) ||
      process.env.OLLAMA_URL ||
      "http://localhost:11434";

    // Get dynamic model with intelligent fallback
    let ollamaModel =
      (await configRepo.getValue("OLLAMA_MODEL")) || process.env.OLLAMA_MODEL;

    console.log(
      `Database OLLAMA_MODEL: ${
        (await configRepo.getValue("OLLAMA_MODEL")) || "not set"
      }`
    );
    console.log(`Environment OLLAMA_MODEL: ${process.env.OLLAMA_MODEL}`);
    console.log(`Initial ollamaModel: ${ollamaModel}`);

    // If no model configured, try to get available models from Ollama
    if (!ollamaModel) {
      try {
        const response = await fetch(`${ollamaUrl}/api/tags`);
        if (response.ok) {
          const data = await response.json();
          if (data.models && data.models.length > 0) {
            // Prefer smaller models first (1.5b > 7b) for memory efficiency
            const preferredModel =
              data.models.find(
                (m: any) => m.name.includes("1.5b") || m.name.includes("1b")
              ) ||
              data.models.find((m: any) => m.name.includes("3b")) ||
              data.models.find((m: any) => m.name.includes("7b")) ||
              data.models[0];
            ollamaModel = preferredModel.name;
            console.log(`Auto-selected Ollama model: ${ollamaModel}`);
          }
        }
      } catch (error) {
        console.warn("Failed to fetch available models from Ollama:", error);
      }

      // Final fallback if everything else fails
      if (!ollamaModel) {
        ollamaModel = "deepseek-r1:1.5b"; // Use smaller model as fallback
        console.warn(`Using hardcoded fallback model: ${ollamaModel}`);
      }
    } else {
      console.log(`Using configured model: ${ollamaModel}`);
    }

    // Get other configuration values with proper JSON parsing
    const ollamaTemperature = parseFloat(
      (await configRepo.getValue("OLLAMA_TEMPERATURE")) || "0.3"
    );

    const ollamaMaxTokens = parseInt(
      (await configRepo.getValue("OLLAMA_MAX_TOKENS")) || "2048"
    );

    const ollamaSystemPrompt =
      (await configRepo.getValue("OLLAMA_SYSTEM_PROMPT")) ||
      "You are an expert church liturgy analyzer. Help structure and improve church service liturgies.";

    // Initialize AI service with database configuration
    const aiConfig: AIConfig = {
      ollamaUrl,
      model: ollamaModel,
      temperature: ollamaTemperature,
      maxTokens: ollamaMaxTokens,
      systemPrompt: ollamaSystemPrompt,
    };

    // Extract YouTube URLs early for parallel processing
    const earlyYouTubeLinks = extractYouTubeUrls(rawText);
    console.log(
      `Early extraction found ${earlyYouTubeLinks.length} YouTube links`
    );

    // Start parallel processing: AI analysis and YouTube downloads
    const promises: Promise<any>[] = [];

    // 1. AI Analysis Promise
    const analysisPromise = (async () => {
      const ollamaService = new OllamaService(aiConfig);
      const liturgyAnalyzer = new LiturgyAnalyzer(ollamaService);

      // Check if Ollama is available
      const isOllamaAvailable = await ollamaService.isAvailable();
      if (!isOllamaAvailable) {
        console.warn(
          "Ollama service not available, falling back to basic analysis"
        );
      }

      // Analyze liturgy
      const analysis = await liturgyAnalyzer.analyzeLiturgy(rawText);
      return { analysis, isOllamaAvailable };
    })();

    promises.push(analysisPromise);

    // 2. YouTube Download Promise (if enabled and links found)
    let downloadPromise: Promise<any[]> | null = null;
    if (autoDownloadYoutube && earlyYouTubeLinks.length > 0) {
      downloadPromise = (async () => {
        try {
          const autoDownloadService = new YouTubeAutoDownloadService(
            dbInstance
          );

          // Load user's YouTube configuration to ensure correct download folder
          await autoDownloadService.getConfig(); // This ensures service uses user's settings

          const liturgyDate = date || new Date().toISOString().split("T")[0];
          const results = await autoDownloadService.downloadYouTubeLinks(
            earlyYouTubeLinks,
            liturgyDate
          );
          console.log(
            `Auto-download initiated for ${earlyYouTubeLinks.length} YouTube links`
          );
          return results;
        } catch (downloadError) {
          console.error("YouTube auto-download failed:", downloadError);
          return []; // Return empty array on error
        }
      })();

      promises.push(downloadPromise);
    }

    // Wait for all parallel processes to complete
    const results = await Promise.allSettled(promises);

    // Extract results
    const analysisResult =
      results[0].status === "fulfilled" ? results[0].value : null;
    const downloadResults: any[] =
      downloadPromise && results[1]?.status === "fulfilled"
        ? results[1].value
        : [];

    if (!analysisResult) {
      throw createError({
        statusCode: 500,
        statusMessage: "AI analysis failed",
      });
    }

    const { analysis, isOllamaAvailable } = analysisResult;

    // Create liturgy record
    const liturgyData = {
      title: title || analysis.extractedData.title || "Untitled Liturgy",
      date: date ? new Date(date) : new Date(),
      church: church || analysis.extractedData.church || undefined,
      elders:
        elders ||
        (analysis.extractedData.elders.length > 0
          ? JSON.stringify(analysis.extractedData.elders)
          : undefined),
      conductors:
        analysis.extractedData.conductors.length > 0
          ? JSON.stringify(analysis.extractedData.conductors)
          : undefined,
      rawText,
      metadata: JSON.stringify({
        analysis: {
          suggestions: analysis.suggestions,
          warnings: analysis.warnings,
          issues: analysis.issues,
          youtubeLinks: analysis.youtubeLinks,
          downloadResults:
            downloadResults.length > 0 ? downloadResults : undefined,
        },
        ollamaAvailable: isOllamaAvailable,
      }),
    };

    const liturgy = await liturgyRepo.create(liturgyData);

    // Create liturgy items
    const createdItems = [];
    for (let i = 0; i < analysis.extractedData.items.length; i++) {
      const itemData = analysis.extractedData.items[i];
      const liturgyItem = await liturgyItemRepo.create({
        liturgyId: liturgy.id,
        type: itemData.type,
        title: itemData.title,
        description: itemData.description,
        startTime: itemData.startTime,
        responsible: itemData.responsible,
        youtubeUrl: itemData.youtubeUrl,
        musicKey: itemData.musicKey,
        notes: itemData.notes,
        order: i,
      });
      createdItems.push(liturgyItem);
    }

    return {
      success: true,
      liturgy,
      items: createdItems,
      analysis: {
        suggestions: analysis.suggestions,
        warnings: analysis.warnings,
        issues: analysis.issues,
        youtubeLinks: analysis.youtubeLinks,
      },
      downloads: {
        attempted: downloadResults.length,
        successful: downloadResults.filter((r) => r.success).length,
        failed: downloadResults.filter((r) => !r.success).length,
        results: downloadResults,
      },
      ollamaAvailable: isOllamaAvailable,
    };
  } catch (error) {
    console.error("Liturgy analysis error:", error);

    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error ? error.message : "Failed to analyze liturgy",
    });
  }
});
