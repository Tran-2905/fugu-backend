
import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post()
    async chat(@Body() chatRequest: ChatRequestDto, @Res() res: Response) {
        try {
            const result = await this.chatService.processChat(chatRequest);

            if (result.type === 'rejected') {
                res.status(200).send(result.message);
                return;
            }

            if (result.type === 'stream' && result.stream) {
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Transfer-Encoding', 'chunked');

                const stream = result.stream;

                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        res.write(content);
                    }
                }
                res.end();
            } else {
                res.status(500).send('Internal Server Error: No valid response from service');
            }
        } catch (error) {
            console.error('Error in chat controller:', error);
            // Frontend expects 200 with error message text for some reason in catch block of route.ts?
            // route.ts returns formatted message.
            res.status(200).send(`Xin lỗi, đã có lỗi: ${error.message}`);
        }
    }
}
