export interface ChatMessage {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    status: 'sending' | 'sent' | 'error';
    errorMsg?: string;
}

export interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    lastMessagePreview: string;
    messageCount: number;
}

export interface ChatWebhookPayload {
    user_id: string;
    message: string;
}

export interface ChatExportData {
    version: number;
    exportedAt: string;
    sessions: ChatSession[];
    messages: Record<string, ChatMessage[]>;
}
