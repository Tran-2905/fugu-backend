
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UserPreferencesDto {
    @IsString()
    @IsOptional()
    language?: string;

    @IsString()
    @IsOptional()
    riskLevel?: string;
}

export class UserContextDto {
    @IsString()
    @IsOptional()
    walletAddress?: string;

    @IsNumber()
    @IsOptional()
    balance?: number;

    @IsArray()
    @IsOptional()
    activePredictions?: any[];

    @ValidateNested()
    @Type(() => UserPreferencesDto)
    @IsOptional()
    userPreferences?: UserPreferencesDto;
}

export class ChatMessageDto {
    @IsString()
    role: 'user' | 'assistant' | 'system';

    @IsString()
    @IsOptional()
    content: string;

    // Handle other formats if necessary, but string content is standard
    @IsString()
    @IsOptional()
    text?: string;

    @IsArray()
    @IsOptional()
    parts?: any[];
}

export class ChatRequestDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ChatMessageDto)
    messages: ChatMessageDto[];

    @ValidateNested()
    @Type(() => UserContextDto)
    @IsOptional()
    userContext?: UserContextDto;

    @IsNumber()
    @IsOptional()
    timestamp?: number;
}
