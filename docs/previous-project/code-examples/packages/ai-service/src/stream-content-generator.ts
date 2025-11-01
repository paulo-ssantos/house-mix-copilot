import { OllamaService } from "./ollama-service";
import { LiturgyAnalysis } from "./liturgy-analyzer";

export interface StreamContentSuggestions {
  title: string;
  description: string;
  tags: string[];
  initialMessage: string;
  alternative: {
    title: string;
    description: string;
    tags: string[];
  };
}

export class StreamContentGenerator {
  constructor(private ollamaService: OllamaService) {}

  /**
   * Generate streaming content based on liturgy analysis
   */
  async generateStreamContent(
    liturgyAnalysis: LiturgyAnalysis,
    churchName?: string,
    date?: string
  ): Promise<StreamContentSuggestions> {
    const prompt = this.createStreamContentPrompt(
      liturgyAnalysis,
      churchName,
      date
    );

    try {
      const response = await this.ollamaService.generate(prompt, {
        maxTokens: 1024,
        temperature: 0.7,
      });

      return this.parseStreamContentResponse(response);
    } catch (error) {
      console.error("Error generating stream content:", error);
      return this.generateFallbackContent(liturgyAnalysis, churchName, date);
    }
  }

  /**
   * Generate title suggestions
   */
  async generateTitles(
    liturgyAnalysis: LiturgyAnalysis,
    churchName?: string,
    date?: string,
    count: number = 5
  ): Promise<string[]> {
    const prompt = `
Gere ${count} títulos criativos e atrativos para uma transmissão ao vivo de culto religioso.

Informações do culto:
- Igreja: ${churchName || "Igreja Local"}
- Data: ${date || "Data não especificada"}
- Título da liturgia: ${
      liturgyAnalysis.extractedData.title || "Culto Dominical"
    }

Elementos da liturgia:
${liturgyAnalysis.extractedData.items
  .map((item) => `- ${item.title}`)
  .join("\n")}

Características dos títulos:
- Máximo 60 caracteres
- Atraentes para YouTube
- Incluir o nome da igreja
- Mencionar que é transmissão ao vivo
- Usar palavras-chave relevantes (culto, igreja, louvor, etc.)

Responda apenas com os títulos, um por linha, sem numeração.
`;

    try {
      const response = await this.ollamaService.generate(prompt, {
        maxTokens: 512,
        temperature: 0.8,
      });

      const titles = response
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && line.length <= 60)
        .slice(0, count);

      return titles.length > 0
        ? titles
        : this.generateFallbackTitles(churchName, date);
    } catch (error) {
      console.error("Error generating titles:", error);
      return this.generateFallbackTitles(churchName, date);
    }
  }

  /**
   * Generate description
   */
  async generateDescription(
    liturgyAnalysis: LiturgyAnalysis,
    churchName?: string,
    date?: string
  ): Promise<string> {
    const prompt = `
Escreva uma descrição atraente de 1-2 parágrafos para uma transmissão ao vivo de culto religioso no YouTube.

Informações do culto:
- Igreja: ${churchName || "Igreja Local"}
- Data: ${date || "Data não especificada"}
- Título: ${liturgyAnalysis.extractedData.title || "Culto Dominical"}

Elementos principais:
${liturgyAnalysis.extractedData.items
  .filter((item) => ["MESSAGE", "SPECIAL_MUSIC", "MUSIC"].includes(item.type))
  .map((item) => `- ${item.title}`)
  .join("\n")}

A descrição deve:
- Ser acolhedora e convidativa
- Mencionar os principais momentos do culto
- Incluir convite para participação
- Ser otimizada para SEO do YouTube
- Ter entre 125-300 palavras

Responda apenas com a descrição, sem formatação adicional.
`;

    try {
      const response = await this.ollamaService.generate(prompt, {
        maxTokens: 512,
        temperature: 0.7,
      });

      return (
        response.trim() || this.generateFallbackDescription(churchName, date)
      );
    } catch (error) {
      console.error("Error generating description:", error);
      return this.generateFallbackDescription(churchName, date);
    }
  }

  /**
   * Generate tags
   */
  async generateTags(
    liturgyAnalysis: LiturgyAnalysis,
    churchName?: string,
    maxTags: number = 10
  ): Promise<string[]> {
    const prompt = `
Gere até ${maxTags} tags relevantes para uma transmissão ao vivo de culto religioso no YouTube.

Informações:
- Igreja: ${churchName || "Igreja Local"}
- Título: ${liturgyAnalysis.extractedData.title || "Culto Dominical"}

Elementos da liturgia:
${liturgyAnalysis.extractedData.items
  .map((item) => `- ${item.title}`)
  .join("\n")}

Tags devem ser:
- Relevantes para o conteúdo religioso
- Populares no YouTube
- Em português
- Uma ou duas palavras por tag
- Incluir variações de "igreja", "culto", "cristão", etc.

Responda apenas com as tags separadas por vírgula.
`;

    try {
      const response = await this.ollamaService.generate(prompt, {
        maxTokens: 256,
        temperature: 0.6,
      });

      const tags = response
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0 && tag.length <= 30)
        .slice(0, maxTags);

      return tags.length > 0 ? tags : this.generateFallbackTags();
    } catch (error) {
      console.error("Error generating tags:", error);
      return this.generateFallbackTags();
    }
  }

  /**
   * Generate initial chat message
   */
  async generateInitialMessage(
    liturgyAnalysis: LiturgyAnalysis,
    churchName?: string
  ): Promise<string> {
    const prompt = `
Escreva uma mensagem de boas-vindas calorosa e acolhedora para o chat de uma transmissão ao vivo de culto religioso.

Informações:
- Igreja: ${churchName || "Igreja Local"}
- Culto: ${liturgyAnalysis.extractedData.title || "Culto Dominical"}

A mensagem deve:
- Ser calorosa e acolhedora
- Convidar à participação no chat
- Mencionar que todos são bem-vindos
- Ter entre 50-150 caracteres
- Usar emojis apropriados

Responda apenas com a mensagem, sem formatação adicional.
`;

    try {
      const response = await this.ollamaService.generate(prompt, {
        maxTokens: 256,
        temperature: 0.7,
      });

      return response.trim() || this.generateFallbackInitialMessage(churchName);
    } catch (error) {
      console.error("Error generating initial message:", error);
      return this.generateFallbackInitialMessage(churchName);
    }
  }

  /**
   * Create comprehensive prompt for stream content
   */
  private createStreamContentPrompt(
    liturgyAnalysis: LiturgyAnalysis,
    churchName?: string,
    date?: string
  ): string {
    return `
Gere conteúdo completo para transmissão ao vivo de culto religioso no YouTube.

Informações do culto:
- Igreja: ${churchName || "Igreja Local"}
- Data: ${date || "Data não especificada"}
- Título: ${liturgyAnalysis.extractedData.title || "Culto Dominical"}

Programa da liturgia:
${liturgyAnalysis.extractedData.items
  .map((item) => `- ${item.title}`)
  .join("\n")}

Gere no seguinte formato JSON:
{
  "title": "título atrativo para YouTube (max 60 chars)",
  "description": "descrição de 1-2 parágrafos",
  "tags": ["tag1", "tag2", "tag3", ...] (max 10),
  "initialMessage": "mensagem de boas-vindas para chat",
  "alternative": {
    "title": "título alternativo",
    "description": "descrição alternativa",
    "tags": ["tags alternativas"]
  }
}

Responda APENAS com o JSON válido, sem explicações adicionais.
`;
  }

  /**
   * Parse AI response for stream content
   */
  private parseStreamContentResponse(
    response: string
  ): StreamContentSuggestions {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || "Culto ao Vivo",
          description:
            parsed.description || "Participe do nosso culto ao vivo.",
          tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10) : [],
          initialMessage:
            parsed.initialMessage ||
            "🙏 Sejam bem-vindos ao nosso culto! Participem do chat!",
          alternative: {
            title: parsed.alternative?.title || "Transmissão ao Vivo - Igreja",
            description:
              parsed.alternative?.description ||
              "Acompanhe nossa programação religiosa.",
            tags: Array.isArray(parsed.alternative?.tags)
              ? parsed.alternative.tags.slice(0, 10)
              : [],
          },
        };
      }
    } catch (error) {
      console.error("Error parsing stream content response:", error);
    }

    return this.generateFallbackContent(undefined, undefined, undefined);
  }

  /**
   * Generate fallback content when AI fails
   */
  private generateFallbackContent(
    liturgyAnalysis?: LiturgyAnalysis,
    churchName?: string,
    date?: string
  ): StreamContentSuggestions {
    const church = churchName || "Igreja Local";
    const dateStr = date || new Date().toLocaleDateString("pt-BR");

    return {
      title: `${church} - Culto ao Vivo ${dateStr}`,
      description: `Participe do nosso culto ao vivo na ${church}. Uma experiência de fé, louvor e comunhão. Todos são bem-vindos!\n\nAcompanhe nossa programação e participe dos comentários. Que Deus abençoe sua vida!`,
      tags: [
        "igreja",
        "culto",
        "cristão",
        "louvor",
        "fé",
        "religioso",
        "transmissão",
        "ao vivo",
      ],
      initialMessage:
        "🙏 Sejam bem-vindos ao nosso culto ao vivo! Participem do chat e sintam-se em casa! ✨",
      alternative: {
        title: `Transmissão Ao Vivo - ${church}`,
        description: `Acompanhe nossa programação religiosa ao vivo. Momentos de fé, adoração e comunhão na ${church}. Participe conosco desta experiência única de louvor e palavra.`,
        tags: [
          "transmissão",
          "igreja",
          "culto cristão",
          "louvor",
          "adoração",
          "fé",
          "comunidade",
        ],
      },
    };
  }

  /**
   * Generate fallback titles
   */
  private generateFallbackTitles(churchName?: string, date?: string): string[] {
    const church = churchName || "Igreja Local";
    const dateStr = date || new Date().toLocaleDateString("pt-BR");

    return [
      `${church} - Culto ao Vivo ${dateStr}`,
      `Transmissão Ao Vivo - ${church}`,
      `Culto Dominical - ${church} ${dateStr}`,
      `${church} - Louvor e Palavra Ao Vivo`,
      `Culto Online - ${church}`,
    ];
  }

  /**
   * Generate fallback description
   */
  private generateFallbackDescription(
    churchName?: string,
    date?: string
  ): string {
    const church = churchName || "Igreja Local";
    const dateStr = date || new Date().toLocaleDateString("pt-BR");

    return `Participe do nosso culto ao vivo na ${church} neste ${dateStr}. Uma experiência de fé, louvor e comunhão que transformará seu dia.\n\nAcompanhe nossa programação completa com momentos de adoração, palavra e oração. Todos são bem-vindos! Que Deus abençoe sua vida e sua família.`;
  }

  /**
   * Generate fallback tags
   */
  private generateFallbackTags(): string[] {
    return [
      "igreja",
      "culto",
      "cristão",
      "louvor",
      "fé",
      "religioso",
      "transmissão",
      "ao vivo",
      "adoração",
      "palavra",
    ];
  }

  /**
   * Generate fallback initial message
   */
  private generateFallbackInitialMessage(churchName?: string): string {
    const church = churchName || "nossa igreja";
    return `🙏 Sejam bem-vindos ao culto ao vivo da ${church}! Participem do chat e sintam-se em casa! ✨`;
  }
}
