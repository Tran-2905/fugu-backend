
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { loadDocuments, searchDocuments, extractRelevantSections, Document } from './knowledge-base';
import { filterQuestion, generateFilterResponse } from './question-filter';
import { ChatRequestDto } from './dto/chat-request.dto';

@Injectable()
export class ChatService implements OnModuleInit {
    private readonly logger = new Logger(ChatService.name);
    private documents: Document[] = [];
    private openai: OpenAI;
    private readonly systemPrompt: string;

    constructor(private configService: ConfigService) {
        this.systemPrompt = `You are a professional AI assistant for Fugu Protocol (Fugu Prediction Market).

## ROLE:
- Provide ACCURATE answers based on the provided documentation (HIGHEST PRIORITY)
- If information is not found in the documentation, USE YOUR OWN KNOWLEDGE to answer
  (especially related to Crypto, Blockchain, and Web3)
- Keep responses concise, clear, and professional
- Use appropriate emojis to improve readability

## CAPABILITIES & DATA:
1. 💰 Guide users on deposit and withdrawal processes (Transak, Banxa)
2. 🎯 Explain how to participate in predictions on Fugu
3. 📊 Analyze crypto markets and price action
4. 📚 Provide information about Fugu Protocol and the Sui Blockchain

## RULES:
- Prioritize questions related to Fugu Protocol and Prediction Markets
- ACCEPT questions about crypto market trends, token prices, and blockchain/Web3 developments
- Use general crypto knowledge if the Knowledge Base does not contain the answer
- REJECT questions that are completely unrelated
  (e.g. weather, cooking, non-economic politics, etc.)`;
    }

    onModuleInit() {
        this.logger.log('📚 Loading knowledge base...');
        this.documents = loadDocuments();
        this.logger.log(`✅ Loaded ${this.documents.length} documents`);

        const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
        if (!apiKey) {
            this.logger.error('❌ OPENROUTER_API_KEY is missing');
        } else {
            this.openai = new OpenAI({
                apiKey: apiKey,
                baseURL: 'https://openrouter.ai/api/v1',
                defaultHeaders: {
                    'HTTP-Referer': 'https://fugu-protocol.com',
                    'X-Title': 'Fugu Prediction Chatbot',
                }
            });
        }
    }

    async processChat(chatRequest: ChatRequestDto) {
        const { messages, userContext } = chatRequest;
        this.logger.log(`📥 Received messages: ${messages?.length}`);

        // Format messages
        const formattedMessages = messages
            .filter((msg) => msg && (msg.role === 'user' || msg.role === 'assistant'))
            .map((msg) => {
                let content = '';
                if (typeof msg.content === 'string') {
                    content = msg.content;
                } else if (msg.text) {
                    content = msg.text;
                } else if (msg.parts && Array.isArray(msg.parts)) {
                    content = msg.parts[0]?.text || '';
                }
                return {
                    role: msg.role as 'user' | 'assistant',
                    content: content.trim()
                };
            })
            .filter((msg) => msg.content.length > 0);

        if (formattedMessages.length === 0) {
            throw new Error('No valid messages received');
        }

        const lastUserMessage = formattedMessages[formattedMessages.length - 1].content;
        this.logger.log(`🤖 Processing: ${lastUserMessage}`);

        // Step 1: Filter
        const filterResult = filterQuestion(lastUserMessage);
        if (!filterResult.isValid) {
            this.logger.log(`🚫 Question rejected: ${filterResult.reason}`);
            return {
                type: 'rejected',
                message: generateFilterResponse(filterResult)
            };
        }

        // Step 2: Search Knowledge Base
        const relevantDocs = searchDocuments(lastUserMessage, this.documents);
        this.logger.log(`📖 Found ${relevantDocs.length} relevant documents`);

        let knowledgeContext = '';
        if (relevantDocs.length > 0) {
            knowledgeContext = '\n\n## REFERENCE DOCUMENTS:\n\n';
            relevantDocs.forEach(doc => {
                const section = extractRelevantSections(doc, 5000);
                knowledgeContext += section + '\n---\n';
            });
        }

        // Step 3: Create System Prompt
        const userInfo = userContext ? `
## USER INFORMATION:
- Wallet Address: ${userContext.walletAddress || 'Not connected'}
- Balance: ${userContext.balance || 0} USDC
- Active Predictions: ${userContext.activePredictions?.length || 0}
- Language: ${userContext.userPreferences?.language || 'en'}
- Risk Level: ${userContext.userPreferences?.riskLevel || 'medium'}
` : '## USER INFORMATION:\n- Not logged in\n';

        const systemMessage = `${this.systemPrompt}

${userInfo}

${knowledgeContext}

## RESPONSE GUIDELINES:
- Question Category: ${filterResult.category}
  - **IGNORE** the "Language" field in USER INFORMATION if it conflicts with the detected language of the message.
- PRIORITY 1: Find the answer in "REFERENCE DOCUMENTS" above.
- PRIORITY 2: If the documentation is insufficient, use your general knowledge to provide the most accurate answer possible.
- PRIORITY 3: Rejected any question that is completely unrelated to Fugu Protocol or Prediction Markets.
- PRIORITY 4: If the question is about a specific prediction, use the "Active Predictions" field in USER INFORMATION to provide the most accurate answer possible.`;

        // Step 4: Call AI
        if (!this.openai) {
            throw new Error('OpenAI client not initialized (missing API key)');
        }

        this.logger.log('🚀 Calling AI via OpenRouter...');
        const stream = await this.openai.chat.completions.create({
            model: 'deepseek/deepseek-chat',
            messages: [
                { role: 'system', content: systemMessage },
                ...formattedMessages
            ],
            temperature: 0.7,
            stream: true,
        });

        return {
            type: 'stream',
            stream
        };
    }
}
