import { OllamaService } from "./ollama-service";
import {
  LiturgyItemType,
  LiturgyItem,
  isValidYouTubeUrl,
  extractYouTubeVideoId,
} from "@church-copilot/shared";

export interface LiturgyAnalysis {
  extractedData: {
    title?: string;
    date?: string;
    church?: string;
    elders: string[];
    conductors: string[];
    items: Array<{
      type: LiturgyItemType;
      title: string;
      description?: string;
      startTime?: string;
      responsible?: string;
      youtubeUrl?: string;
      musicKey?: string;
      notes?: string;
    }>;
  };
  suggestions: string[];
  warnings: string[];
  issues: string[];
  youtubeLinks: string[];
}

export class LiturgyAnalyzer {
  constructor(private ollamaService: OllamaService) {}

  /**
   * Analyze liturgy text and extract structured data
   */
  async analyzeLiturgy(rawText: string): Promise<LiturgyAnalysis> {
    const analysis: LiturgyAnalysis = {
      extractedData: {
        elders: [],
        conductors: [],
        items: [],
      },
      suggestions: [],
      warnings: [],
      issues: [],
      youtubeLinks: [],
    };

    try {
      // Extract basic data using regex patterns
      analysis.extractedData = await this.extractBasicData(rawText);

      // Extract YouTube links
      analysis.youtubeLinks = this.extractYouTubeLinks(rawText);

      // Use AI to analyze and provide suggestions
      const aiAnalysis = await this.analyzeWithAI(rawText);
      analysis.suggestions = aiAnalysis.suggestions;
      analysis.warnings = aiAnalysis.warnings;
      analysis.issues = aiAnalysis.issues;

      // Validate extracted data
      this.validateExtractedData(analysis);
    } catch (error) {
      console.error("Error analyzing liturgy:", error);
      analysis.issues.push(
        "Erro na análise da liturgia. Verifique o formato do texto."
      );
    }

    return analysis;
  }

  /**
   * Extract basic data using regex patterns
   */
  private async extractBasicData(
    text: string
  ): Promise<LiturgyAnalysis["extractedData"]> {
    const data: LiturgyAnalysis["extractedData"] = {
      elders: [],
      conductors: [],
      items: [],
    };

    // Extract title and date
    const titleMatch = text.match(
      /^(.+?),\s*(\d{1,2}\s+[A-Z]{3}\.?\s+\d{4})/im
    );
    if (titleMatch) {
      data.title = titleMatch[1].trim();
      data.date = titleMatch[2].trim();
    }

    // Extract elders (Anciãos)
    const eldersMatch = text.match(/Anciãos?:\s*([^\n\r]+)/i);
    if (eldersMatch) {
      data.elders = eldersMatch[1]
        .split(/\s+e\s+|\s*,\s*/)
        .map((name) => name.trim())
        .filter(Boolean);
    }

    // Extract conductors (Regentes)
    const conductorsMatch = text.match(/Regentes?:\s*([^\n\r]+)/i);
    if (conductorsMatch) {
      data.conductors = conductorsMatch[1]
        .split(/\s+e\s+|\s*,\s*/)
        .map((name) => name.trim())
        .filter(Boolean);
    }

    // Extract items using AI
    data.items = await this.extractItemsWithAI(text);

    return data;
  }

  /**
   * Extract liturgy items using AI
   */
  private async extractItemsWithAI(
    text: string
  ): Promise<LiturgyAnalysis["extractedData"]["items"]> {
    const prompt = `
Analise o seguinte texto de liturgia e extraia cada item/atividade em formato JSON.
Para cada item, identifique:
- type: tipo do item (OPENING, PRAYER, MUSIC, SPECIAL_MUSIC, READING, MESSAGE, OFFERING, ANNOUNCEMENT, MOMENT, CLOSING, BREAK, OTHER)
- title: título ou nome do item
- description: descrição adicional se houver
- startTime: horário no formato HH:mm se especificado
- responsible: pessoa responsável se mencionada
- youtubeUrl: URL do YouTube se presente
- musicKey: tonalidade musical se especificada
- notes: observações adicionais

Tipos de itens:
- OPENING: abertura, boas vindas
- PRAYER: oração, oração invocação, oração intercessora
- MUSIC: música, louvor, hino
- SPECIAL_MUSIC: música especial
- READING: leitura bíblica, leitura
- MESSAGE: mensagem, sermão, pregação
- OFFERING: dízimos, ofertas, ofertório
- ANNOUNCEMENT: informativo, avisos, comunicação
- MOMENT: momento infantil, momento especial
- CLOSING: encerramento
- BREAK: intervalo
- OTHER: outros itens não categorizados

Texto da liturgia:
${text}

Responda APENAS com um array JSON válido, sem explicações adicionais.
`;

    try {
      const response = await this.ollamaService.generate(prompt, {
        maxTokens: 2048,
        temperature: 0.3,
      });

      // Try to parse the JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const items = JSON.parse(jsonMatch[0]);
        return this.validateAndNormalizeItems(items);
      }
    } catch (error) {
      console.error("Error extracting items with AI:", error);
    }

    // Fallback to regex-based extraction
    return this.extractItemsWithRegex(text);
  }

  /**
   * Fallback regex-based item extraction
   */
  private extractItemsWithRegex(
    text: string
  ): LiturgyAnalysis["extractedData"]["items"] {
    const items: LiturgyAnalysis["extractedData"]["items"] = [];
    const lines = text.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      const timeMatch = line.match(/(\d{1,2}:\d{2})/);
      const time = timeMatch ? timeMatch[1] : undefined;

      // Check for different types of items
      if (line.match(/boas vindas|abertura/i)) {
        items.push({
          type: "OPENING",
          title: line.replace(/^\d{1,2}:\d{2}\s*[-–]\s*/, "").trim(),
          startTime: time,
        });
      } else if (line.match(/oração|prece/i)) {
        items.push({
          type: "PRAYER",
          title: line.replace(/^\d{1,2}:\d{2}\s*[-–]\s*/, "").trim(),
          startTime: time,
        });
      } else if (line.match(/música especial/i)) {
        items.push({
          type: "SPECIAL_MUSIC",
          title: line.replace(/^\d{1,2}:\d{2}\s*[-–]\s*/, "").trim(),
          startTime: time,
        });
      } else if (line.match(/música|louvor|hino/i)) {
        items.push({
          type: "MUSIC",
          title: line.replace(/^\d{1,2}:\d{2}\s*[-–]\s*/, "").trim(),
          startTime: time,
        });
      } else if (line.match(/mensagem|sermão|pregação/i)) {
        items.push({
          type: "MESSAGE",
          title: line.replace(/^\d{1,2}:\d{2}\s*[-–]\s*/, "").trim(),
          startTime: time,
        });
      } else if (line.match(/dízimo|oferta|ofertório/i)) {
        items.push({
          type: "OFFERING",
          title: line.replace(/^\d{1,2}:\d{2}\s*[-–]\s*/, "").trim(),
          startTime: time,
        });
      } else if (line.match(/informativo|aviso|comunicação/i)) {
        items.push({
          type: "ANNOUNCEMENT",
          title: line.replace(/^\d{1,2}:\d{2}\s*[-–]\s*/, "").trim(),
          startTime: time,
        });
      } else if (line.match(/momento/i)) {
        items.push({
          type: "MOMENT",
          title: line.replace(/^\d{1,2}:\d{2}\s*[-–]\s*/, "").trim(),
          startTime: time,
        });
      } else if (line.match(/encerramento|despedida/i)) {
        items.push({
          type: "CLOSING",
          title: line.replace(/^\d{1,2}:\d{2}\s*[-–]\s*/, "").trim(),
          startTime: time,
        });
      } else if (timeMatch) {
        items.push({
          type: "OTHER",
          title: line.replace(/^\d{1,2}:\d{2}\s*[-–]\s*/, "").trim(),
          startTime: time,
        });
      }
    }

    return items;
  }

  /**
   * Validate and normalize extracted items
   */
  private validateAndNormalizeItems(
    items: any[]
  ): LiturgyAnalysis["extractedData"]["items"] {
    const validTypes: LiturgyItemType[] = [
      "OPENING",
      "PRAYER",
      "MUSIC",
      "SPECIAL_MUSIC",
      "READING",
      "MESSAGE",
      "OFFERING",
      "ANNOUNCEMENT",
      "MOMENT",
      "CLOSING",
      "BREAK",
      "OTHER",
    ];

    return items
      .filter((item) => item && typeof item === "object" && item.title)
      .map((item) => ({
        type: validTypes.includes(item.type) ? item.type : "OTHER",
        title: String(item.title).trim(),
        description: item.description
          ? String(item.description).trim()
          : undefined,
        startTime:
          item.startTime && /^\d{1,2}:\d{2}$/.test(item.startTime)
            ? item.startTime
            : undefined,
        responsible: item.responsible
          ? String(item.responsible).trim()
          : undefined,
        youtubeUrl:
          item.youtubeUrl && isValidYouTubeUrl(item.youtubeUrl)
            ? item.youtubeUrl
            : undefined,
        musicKey: item.musicKey ? String(item.musicKey).trim() : undefined,
        notes: item.notes ? String(item.notes).trim() : undefined,
      }));
  }

  /**
   * Extract YouTube links from text
   */
  private extractYouTubeLinks(text: string): string[] {
    const youtubeRegex =
      /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/g;
    const matches = text.match(youtubeRegex) || [];
    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Analyze text with AI for suggestions and warnings
   */
  private async analyzeWithAI(text: string): Promise<{
    suggestions: string[];
    warnings: string[];
    issues: string[];
  }> {
    const prompt = `
Analise o seguinte texto de liturgia de igreja e forneça:

1. SUGESTÕES: melhorias para otimizar o culto (máximo 5)
2. AVISOS: potenciais problemas que precisam de atenção (máximo 5)
3. PROBLEMAS: erros ou inconsistências graves (máximo 5)

Considere:
- Sequência lógica dos itens
- Horários realistas
- Responsáveis designados
- Músicas sem intérpretes
- Links quebrados do YouTube
- Conflitos de horário
- Duração total do culto

Texto da liturgia:
${text}

Responda no formato:
SUGESTÕES:
- sugestão 1
- sugestão 2

AVISOS:
- aviso 1
- aviso 2

PROBLEMAS:
- problema 1
- problema 2
`;

    try {
      const response = await this.ollamaService.generate(prompt, {
        maxTokens: 1024,
        temperature: 0.5,
      });

      return this.parseAIAnalysis(response);
    } catch (error) {
      console.error("Error in AI analysis:", error);
      return { suggestions: [], warnings: [], issues: [] };
    }
  }

  /**
   * Parse AI analysis response
   */
  private parseAIAnalysis(response: string): {
    suggestions: string[];
    warnings: string[];
    issues: string[];
  } {
    const suggestions: string[] = [];
    const warnings: string[] = [];
    const issues: string[] = [];

    const lines = response.split("\n");
    let currentSection: "suggestions" | "warnings" | "issues" | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.match(/^SUGESTÕES:/i)) {
        currentSection = "suggestions";
      } else if (trimmed.match(/^AVISOS:/i)) {
        currentSection = "warnings";
      } else if (trimmed.match(/^PROBLEMAS:/i)) {
        currentSection = "issues";
      } else if (trimmed.startsWith("-") && currentSection) {
        const item = trimmed.substring(1).trim();
        if (item) {
          switch (currentSection) {
            case "suggestions":
              suggestions.push(item);
              break;
            case "warnings":
              warnings.push(item);
              break;
            case "issues":
              issues.push(item);
              break;
          }
        }
      }
    }

    return { suggestions, warnings, issues };
  }

  /**
   * Validate extracted data and add automatic warnings
   */
  private validateExtractedData(analysis: LiturgyAnalysis): void {
    const { extractedData, issues, warnings } = analysis;

    // Check for missing basic information
    if (!extractedData.title) {
      issues.push("Título da liturgia não encontrado");
    }
    if (!extractedData.date) {
      issues.push("Data da liturgia não encontrada");
    }
    if (extractedData.elders.length === 0) {
      warnings.push("Nenhum ancião especificado");
    }
    if (extractedData.conductors.length === 0) {
      warnings.push("Nenhum regente especificado");
    }

    // Check for music items without responsible person
    const musicWithoutResponsible = extractedData.items.filter(
      (item) =>
        (item.type === "MUSIC" || item.type === "SPECIAL_MUSIC") &&
        !item.responsible
    );
    if (musicWithoutResponsible.length > 0) {
      warnings.push(
        `${musicWithoutResponsible.length} música(s) sem responsável especificado`
      );
    }

    // Check for invalid YouTube URLs
    const invalidYouTubeItems = extractedData.items.filter(
      (item) => item.youtubeUrl && !isValidYouTubeUrl(item.youtubeUrl)
    );
    if (invalidYouTubeItems.length > 0) {
      issues.push(
        `${invalidYouTubeItems.length} link(s) do YouTube inválido(s)`
      );
    }

    // Check for time conflicts
    const itemsWithTime = extractedData.items.filter((item) => item.startTime);
    for (let i = 0; i < itemsWithTime.length - 1; i++) {
      const current = itemsWithTime[i];
      const next = itemsWithTime[i + 1];
      if (
        current.startTime &&
        next.startTime &&
        current.startTime >= next.startTime
      ) {
        warnings.push(
          `Possível conflito de horário entre "${current.title}" e "${next.title}"`
        );
      }
    }
  }
}
