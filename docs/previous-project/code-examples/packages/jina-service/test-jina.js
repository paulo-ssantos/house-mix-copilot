import {
  createJinaClient,
  LiturgyAnalyzer,
  ResourceFinder,
  VideoResearcher,
  TimelineGenerator,
} from "./dist/index.js";

/**
 * Test script for Jina AI services
 * Get your Jina AI API key for free: https://jina.ai/?sui=apikey
 */
async function testJinaServices() {
  console.log("🧪 Testing Jina AI Services for Church Liturgy Automation");

  try {
    // Create Jina client
    console.log("\n1. Creating Jina client...");
    const jinaClient = createJinaClient();

    // Test connection
    console.log("2. Testing API connection...");
    const isConnected = await jinaClient.testConnection();
    if (!isConnected) {
      console.error(
        "❌ Failed to connect to Jina AI. Check your JINA_API_KEY environment variable."
      );
      return;
    }
    console.log("✅ Connected to Jina AI successfully!");

    // Test LiturgyAnalyzer
    console.log("\n3. Testing LiturgyAnalyzer...");
    const analyzer = new LiturgyAnalyzer(jinaClient);

    const sampleLiturgyText = `
    PROGRAMA DE CULTO - DOMINGO 19:00H
    Igreja Batista Esperança
    
    19:00 - PRELÚDIO MUSICAL - Ministério de Música
    "Hosana ao Rei" - Instrumental
    
    19:05 - ABERTURA DO CULTO - Pastor João Silva
    Boas-vindas aos visitantes
    Avisos importantes da semana
    
    19:10 - CÂNTICOS CONGREGACIONAIS - Pr. João
    1º Cântico: "Quão Grande És Tu" - HCC 27
    2º Cântico: "Amazing Grace" - HCC 45
    3º Cântico: "Santo, Santo, Santo" - HCC 1
    
    19:25 - ORAÇÃO PASTORAL - Pastor João Silva
    Oração pelos enfermos da igreja
    Agradecimentos pelas bênçãos
    
    19:30 - LEITURA BÍBLICA - Diácono Pedro Santos
    Texto: João 3:16-21
    Leitura responsiva do Salmo 23
    
    19:40 - LOUVOR ESPECIAL - Quarteto Masculino
    "A Ele a Glória" - Música especial
    Ministério: João, Paulo, Marcos, Lucas
    
    19:50 - MENSAGEM BÍBLICA - Pastor João Silva
    Série: "O Amor de Deus"
    Tema: "Deus é Amor"
    Duração estimada: 35 minutos
    
    20:25 - CONVITE E ORAÇÃO - Pastor João
    Momento de decisão e consagração
    Oração individual
    
    20:35 - OFERTÓRIO - Diácono Pedro Santos
    Cântico: "Tudo Entregarei" - Solo: Maria Santos
    Oração de gratidão pela generosidade
    
    20:45 - AVISOS FINAIS - Secretária Ana Lima
    Programação da semana
    Aniversariantes do mês
    
    20:50 - BÊNÇÃO APOSTÓLICA - Pastor João Silva
    Números 6:24-26
    Oração final
    
    20:55 - POSLÚDIO - Ministério de Música
    "Ide em Paz" - Instrumental de encerramento
    `;

    const analysisResult = await analyzer.analyzeLiturgyProgram({
      rawText: sampleLiturgyText,
      language: "pt",
      context: "evangelical",
    });

    console.log(
      `✅ Analyzed liturgy: ${analysisResult.moments.length} moments found`
    );
    console.log(`   Total duration: ${analysisResult.totalDuration} minutes`);
    console.log(
      `   Confidence: ${Math.round(analysisResult.confidence * 100)}%`
    );

    // Test TimelineGenerator
    console.log("\n4. Testing TimelineGenerator...");
    const timelineGenerator = new TimelineGenerator();
    const timeline = timelineGenerator.generateTimeline(analysisResult.moments);

    console.log(`✅ Generated timeline: ${timeline.entries.length} entries`);
    console.log(`   Estimated end time: ${timeline.estimatedEndTime}`);

    // Test ResourceFinder (limited test to avoid too many API calls)
    console.log("\n5. Testing ResourceFinder (quick test)...");
    const resourceFinder = new ResourceFinder(jinaClient);

    if (analysisResult.moments.length > 0) {
      const firstMoment = analysisResult.moments[0];
      const resources = await resourceFinder.findResources({
        moment: firstMoment,
        maxResults: 3,
      });

      console.log(
        `✅ Found ${resources.length} resources for "${firstMoment.title}"`
      );
    }

    // Test VideoResearcher (limited test)
    console.log("\n6. Testing VideoResearcher (quick test)...");
    const videoResearcher = new VideoResearcher(jinaClient);

    if (analysisResult.moments.length > 0) {
      const musicMoment = analysisResult.moments.find(
        (m) => m.type === "Cântico" || m.type === "Louvor"
      );

      if (musicMoment) {
        const videos = await videoResearcher.researchVideos({
          moment: musicMoment,
          maxResults: 2,
        });

        console.log(
          `✅ Found ${videos.length} videos for "${musicMoment.title}"`
        );
      } else {
        console.log("⏭️  No music moments found for video research test");
      }
    }

    console.log("\n🎉 All Jina AI services tested successfully!");
    console.log("\n📋 Summary:");
    console.log(
      `   • Liturgy moments analyzed: ${analysisResult.moments.length}`
    );
    console.log(`   • Timeline entries created: ${timeline.entries.length}`);
    console.log(`   • Services ready for church automation!`);
  } catch (error) {
    console.error("\n❌ Test failed:", error);

    if (error.message?.includes("JINA_API_KEY")) {
      console.log("\n💡 Setup Instructions:");
      console.log(
        "   1. Get your free Jina AI API key: https://jina.ai/?sui=apikey"
      );
      console.log(
        '   2. Set environment variable: export JINA_API_KEY="your_api_key_here"'
      );
      console.log("   3. Run the test again");
    }
  }
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testJinaServices().catch(console.error);
}

export { testJinaServices };
