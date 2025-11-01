/**
 * Test endpoint for AI Liturgy Analysis - Debug version
 * Returns mock data to test the endpoint structure
 */

export default defineEventHandler(async (event) => {
  try {
    const { text } = await readBody(event);

    if (!text || typeof text !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid program text provided",
      });
    }

    console.log("[TEST] Received text for analysis:", text.substring(0, 100) + "...");

    // Return mock analysis for testing
    const mockAnalysis = {
      moments: [
        {
          id: "moment_0",
          title: "Prelúdio Musical",
          type: "Prelúdio",
          description: "Momento de preparação musical",
          startTime: "19:00",
          duration: 3,
          responsible: "Ministério de Música",
          confidence: 0.95,
        },
        {
          id: "moment_1", 
          title: "Abertura e Oração",
          type: "Oração",
          description: "Abertura do culto com oração",
          startTime: "19:15",
          duration: 5,
          responsible: "Pastor",
          confidence: 0.90,
        }
      ],
      totalDuration: 8,
      confidence: 0.925,
      sourceText: text,
    };

    console.log("[TEST] Returning mock analysis with", mockAnalysis.moments.length, "moments");

    return {
      success: true,
      data: mockAnalysis,
    };
  } catch (error) {
    console.error("[TEST] AI liturgy analysis error:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "Analysis failed",
    });
  }
});
