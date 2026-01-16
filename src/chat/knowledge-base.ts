
import * as fs from 'fs';
import * as path from 'path';

export interface Document {
    title: string;
    content: string;
    category: string;
}

// Load CHỈ file hướng dẫn sử dụng app (duy nhất)
export function loadDocuments(): Document[] {
    const docsPath = process.cwd(); // Root of Fugu-backend
    const documents: Document[] = [];

    // CHỈ load file hướng dẫn sử dụng app
    const docFiles = [
        { file: 'HUONG_DAN_SU_DUNG_APP.txt', category: 'guide' },
    ];

    for (const { file, category } of docFiles) {
        try {
            const filePath = path.join(docsPath, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                documents.push({
                    title: 'Hướng Dẫn Sử Dụng Fugu App',
                    content,
                    category,
                });
                console.log(`✅ Loaded knowledge: ${file}`);
            } else {
                console.warn(`⚠️ Knowledge file not found: ${file}`);
            }
        } catch (error) {
            console.warn(`⚠️ Could not load ${file}:`, error);
        }
    }

    return documents;
}

export function searchDocuments(query: string, documents: Document[]): Document[] {
    // Luôn trả về document hướng dẫn để AI có context đầy đủ
    return documents;
}

export function extractRelevantSections(doc: Document, maxLength: number = 5000): string {
    const lines = doc.content.split('\n');
    let result = `## ${doc.title}\n\n`;
    let currentLength = result.length;

    for (const line of lines) {
        if (currentLength + line.length > maxLength) break;
        result += line + '\n';
        currentLength += line.length + 1;
    }

    return result;
}
