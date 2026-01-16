
export interface FilterResult {
    isValid: boolean;
    reason?: string;
    category?: string;
}

const VALID_TOPICS = [
    // Blockchain & Crypto
    'blockchain', 'sui', 'wallet', 'ví', 'crypto', 'usdc', 'token',
    'transaction', 'giao dịch', 'on-chain', 'smart contract',

    // Prediction Market
    'dự đoán', 'prediction', 'cược', 'bet', 'market', 'thị trường',
    'event', 'sự kiện', 'outcome', 'kết quả', 'odds', 'tỷ lệ',

    // Platform Features
    'nạp tiền', 'deposit', 'withdraw', 'rút tiền', 'balance', 'số dư',
    'buy', 'mua', 'sell', 'bán', 'share', 'cổ phần', 'reward', 'thưởng',
    'transak', 'banxa', 'payment', 'thanh toán',

    // Data & Analysis
    'price', 'giá', 'bitcoin', 'btc', 'eth', 'gold', 'vàng', 'silver', 'bạc',
    'news', 'tin tức', 'analysis', 'phân tích', 'chart', 'biểu đồ',
    'volume', 'khối lượng', 'statistics', 'thống kê',

    // User Actions
    'hướng dẫn', 'tutorial', 'how to', 'làm sao', 'cách', 'guide',
    'help', 'giúp', 'support', 'hỗ trợ', 'account', 'tài khoản',

    // Technical
    'api', 'integration', 'pyth', 'oracle', 'deepbook', 'zklogin',
];

const BANNED_TOPICS = [
    // Weather
    { keywords: ['thời tiết', 'weather', 'rain', 'mưa', 'nắng', 'sunny'], exception: ['dự đoán', 'prediction', 'bet', 'thị trường', 'market'] },

    // Cooking
    { keywords: ['nấu ăn', 'cooking', 'recipe', 'công thức', 'món ăn', 'food'], exception: [] },

    // Entertainment
    { keywords: ['phim', 'movie', 'nhạc', 'music', 'game'], exception: ['dự đoán', 'prediction', 'bet', 'cược'] },

    // Personal questions
    { keywords: ['bạn tên gì', 'what is your name', 'bao nhiêu tuổi', 'how old'], exception: [] },

    // Spam
    { keywords: ['spam', 'advertisement', 'quảng cáo', 'mua hàng'], exception: [] },
];

export function filterQuestion(question: string): FilterResult {
    const lowerQuestion = question.toLowerCase();

    if (question.trim().length < 3) {
        return {
            isValid: false,
            reason: 'Question is too short. Please be more specific.',
        };
    }

    for (const banned of BANNED_TOPICS) {
        const hasBannedKeyword = banned.keywords.some(kw => lowerQuestion.includes(kw));
        const hasException = banned.exception.some(kw => lowerQuestion.includes(kw));

        if (hasBannedKeyword && !hasException) {
            return {
                isValid: false,
                reason: `Sorry, I can only answer questions related to Fugu Protocol. Your question about "${banned.keywords[0]}" is outside the scope of support.`,
            };
        }
    }

    const hasValidTopic = VALID_TOPICS.some(topic => lowerQuestion.includes(topic));
    const isGreeting = /^(hi|hello|xin chào|chào|hey|hola)/i.test(question.trim());

    if (!hasValidTopic && !isGreeting) {
        return {
            isValid: true,
            category: 'general',
            reason: 'The question may not be directly related to the system. I will try to answer.',
        };
    }

    let category = 'general';
    if (lowerQuestion.match(/nạp|deposit|withdraw|rút|payment|thanh toán/)) {
        category = 'payment';
    } else if (lowerQuestion.match(/dự đoán|prediction|cược|bet|event/)) {
        category = 'prediction';
    } else if (lowerQuestion.match(/blockchain|sui|wallet|ví|crypto/)) {
        category = 'blockchain';
    } else if (lowerQuestion.match(/hướng dẫn|tutorial|how to|cách|guide/)) {
        category = 'tutorial';
    } else if (lowerQuestion.match(/price|giá|bitcoin|market|thị trường/)) {
        category = 'market';
    }

    return {
        isValid: true,
        category,
    };
}

export function generateFilterResponse(filterResult: FilterResult): string {
    if (filterResult.isValid) return '';

    return `${filterResult.reason}

I can help you with:
- 💰 Deposits/Withdrawals, Balance Management
- 🎯 Participating in Predictions, Buying Shares
- 📊 Viewing Statistics, Market Analysis
- 📚 Platform Usage Guides
- ⛓️ Information about Sui Blockchain

What would you like to ask?`;
}
