import { Ollama } from "ollama";
import { AIConfig } from "@church-copilot/shared";

export class OllamaService {
  private ollama: Ollama;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.ollama = new Ollama({
      host: config.ollamaUrl,
    });
  }

  /**
   * Check if Ollama service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.ollama.list();
      return true;
    } catch (error) {
      console.error("Ollama service not available:", error);
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.ollama.list();
      return response.models.map((model) => model.name);
    } catch (error) {
      console.error("Failed to list models:", error);
      return [];
    }
  }

  /**
   * Generate completion using Ollama
   */
  async generate(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      system?: string;
    }
  ): Promise<string> {
    try {
      const response = await this.ollama.generate({
        model: options?.model || this.config.model,
        prompt,
        system: options?.system || this.config.systemPrompt,
        options: {
          temperature: options?.temperature || this.config.temperature,
          num_predict: options?.maxTokens || this.config.maxTokens,
        },
        stream: false,
      });

      return response.response;
    } catch (error) {
      console.error("Failed to generate completion:", error);
      throw new Error(
        `AI generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate streaming completion
   */
  async *generateStream(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      system?: string;
    }
  ): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.ollama.generate({
        model: options?.model || this.config.model,
        prompt,
        system: options?.system || this.config.systemPrompt,
        options: {
          temperature: options?.temperature || this.config.temperature,
          num_predict: options?.maxTokens || this.config.maxTokens,
        },
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.response) {
          yield chunk.response;
        }
      }
    } catch (error) {
      console.error("Failed to generate streaming completion:", error);
      throw new Error(
        `AI streaming failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Chat completion
   */
  async chat(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    try {
      const response = await this.ollama.chat({
        model: options?.model || this.config.model,
        messages,
        options: {
          temperature: options?.temperature || this.config.temperature,
          num_predict: options?.maxTokens || this.config.maxTokens,
        },
        stream: false,
      });

      return response.message.content;
    } catch (error) {
      console.error("Failed to generate chat completion:", error);
      throw new Error(
        `AI chat failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
    this.ollama = new Ollama({
      host: this.config.ollamaUrl,
    });
  }

  /**
   * Test connection and model
   */
  async testConnection(): Promise<{
    available: boolean;
    models: string[];
    testResponse?: string;
    error?: string;
  }> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return {
          available: false,
          models: [],
          error: "Ollama service not available",
        };
      }

      const models = await this.listModels();

      // Test with a simple prompt
      const testResponse = await this.generate("Hello, how are you?", {
        maxTokens: 50,
      });

      return {
        available: true,
        models,
        testResponse,
      };
    } catch (error) {
      return {
        available: false,
        models: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
