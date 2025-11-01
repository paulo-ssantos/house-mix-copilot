/**
 * Server API endpoint for AI Liturgy Analysis
 * Handles Jina.ai API calls securely on server-side
 */

export default defineEventHandler(async (event: any) => {
  const config = useRuntimeConfig();

  console.log("[AI-LITURGY] Starting analysis request...");

  // Ensure API key is configured
  if (!config.jinaApiKey) {
    console.error("[AI-LITURGY] Jina API key not configured!");
    return {
      success: false,
      error: "Jina API key not configured",
    };
  }

  console.log("[AI-LITURGY] API key is configured:", config.jinaApiKey ? "YES" : "NO");

  try {
    const { text } = await readBody(event);

    if (!text || typeof text !== "string") {
      console.error("[AI-LITURGY] Invalid text provided:", typeof text);
      return {
        success: false,
        error: "Invalid program text provided",
      };
    }

    console.log("[AI-LITURGY] Received text for analysis:", text.length, "characters");

    // Try importing services with error handling
    console.log("[AI-LITURGY] Importing JinaClient...");
    const { JinaClient } = await import("~/server/services/jina-client");
    console.log("[AI-LITURGY] JinaClient imported successfully");

    console.log("[AI-LITURGY] Importing LiturgyAnalyzer...");
    const { LiturgyAnalyzer } = await import("~/server/services/liturgy-analyzer");
    console.log("[AI-LITURGY] LiturgyAnalyzer imported successfully");

    // Initialize Jina client and analyzer
    console.log("[AI-LITURGY] Creating JinaClient instance...");
    const jinaClient = new JinaClient({
      apiKey: config.jinaApiKey,
      baseURL: "https://api.jina.ai",
    });
    console.log("[AI-LITURGY] JinaClient created successfully");

    console.log("[AI-LITURGY] Creating LiturgyAnalyzer instance...");
    const liturgyAnalyzer = new LiturgyAnalyzer(jinaClient);
    console.log("[AI-LITURGY] LiturgyAnalyzer created successfully");

    // Perform analysis
    console.log("[AI-LITURGY] Starting liturgy analysis...");
    const analysis = await liturgyAnalyzer.analyzeLiturgyProgram({
      rawText: text,
    });
    console.log("[AI-LITURGY] Analysis completed successfully:", analysis.moments?.length, "moments found");

    return {
      success: true,
      data: analysis,
    };
  } catch (error) {
    console.error("[AI-LITURGY] Analysis error:", error);
    console.error("[AI-LITURGY] Error stack:", error instanceof Error ? error.stack : "No stack trace");

    return {
      success: false,
      error: error instanceof Error ? error.message : "Analysis failed",
    };
  }
});
