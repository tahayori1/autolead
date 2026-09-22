import type { ChatMessage, ChatSession, ChatExportData, ChatWebhookPayload } from '../types/aiChat';

const AI_CHAT_WEBHOOK_URL = 'https://api.hoseinikhodro.com/webhook/chatbot-customer';
const SESSIONS_STORAGE_KEY = 'autolead_ai_chat_sessions_v1';
const MESSAGES_STORAGE_PREFIX = 'autolead_ai_chat_msgs_';
const ACTIVE_SESSION_KEY = 'autolead_ai_chat_active_session_id';

// Helper to generate unique IDs
export function generateChatId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

// ----------------- Offline Session Management -----------------

export function getOfflineSessions(): ChatSession[] {
    try {
        const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }
        return [];
    } catch (e) {
        console.error('Error reading offline chat sessions:', e);
        return [];
    }
}

export function saveOfflineSessions(sessions: ChatSession[]): void {
    try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.error('Error saving offline chat sessions:', e);
    }
}

export function createNewChatSession(initialTitle?: string): ChatSession {
    const nowIso = new Date().toISOString();
    const newSession: ChatSession = {
        id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title: initialTitle || 'چت با مشتری',
        createdAt: nowIso,
        updatedAt: nowIso,
        lastMessagePreview: '',
        messageCount: 0
    };

    const currentSessions = getOfflineSessions();
    const updated = [newSession, ...currentSessions];
    saveOfflineSessions(updated);
    setActiveChatSessionId(newSession.id);
    return newSession;
}

export function getActiveChatSessionId(): string | null {
    try {
        return localStorage.getItem(ACTIVE_SESSION_KEY);
    } catch {
        return null;
    }
}

export function setActiveChatSessionId(sessionId: string): void {
    try {
        localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
    } catch {
        // ignore
    }
}

export function updateChatSessionTitle(sessionId: string, newTitle: string): void {
    const sessions = getOfflineSessions();
    const target = sessions.find(s => s.id === sessionId);
    if (target) {
        target.title = newTitle.trim() || 'بدون عنوان';
        target.updatedAt = new Date().toISOString();
        saveOfflineSessions(sessions);
    }
}

export function deleteChatSession(sessionId: string): void {
    const sessions = getOfflineSessions().filter(s => s.id !== sessionId);
    saveOfflineSessions(sessions);
    try {
        localStorage.removeItem(MESSAGES_STORAGE_PREFIX + sessionId);
        const active = getActiveChatSessionId();
        if (active === sessionId) {
            const nextSession = sessions[0];
            if (nextSession) {
                setActiveChatSessionId(nextSession.id);
            } else {
                localStorage.removeItem(ACTIVE_SESSION_KEY);
            }
        }
    } catch (e) {
        console.error('Error deleting session messages:', e);
    }
}

export function clearAllChatHistory(): void {
    const sessions = getOfflineSessions();
    sessions.forEach(s => {
        try {
            localStorage.removeItem(MESSAGES_STORAGE_PREFIX + s.id);
        } catch {
            // ignore
        }
    });
    try {
        localStorage.removeItem(SESSIONS_STORAGE_KEY);
        localStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch {
        // ignore
    }
}

// ----------------- Offline Message Management -----------------

export function getOfflineMessages(sessionId: string): ChatMessage[] {
    if (!sessionId) return [];
    try {
        const raw = localStorage.getItem(MESSAGES_STORAGE_PREFIX + sessionId);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        return [];
    } catch (e) {
        console.error(`Error reading messages for session ${sessionId}:`, e);
        return [];
    }
}

export function saveOfflineMessages(sessionId: string, messages: ChatMessage[]): void {
    if (!sessionId) return;
    try {
        localStorage.setItem(MESSAGES_STORAGE_PREFIX + sessionId, JSON.stringify(messages));

        // Update session meta (count, updatedAt, preview)
        const sessions = getOfflineSessions();
        const target = sessions.find(s => s.id === sessionId);
        if (target) {
            target.messageCount = messages.length;
            target.updatedAt = new Date().toISOString();
            const lastMsg = messages[messages.length - 1];
            if (lastMsg) {
                target.lastMessagePreview = lastMsg.content.substring(0, 80);
                // If title is default, set first user prompt as title
                if (target.title === 'گفتگوی جدید' && lastMsg.role === 'user') {
                    target.title = lastMsg.content.trim().substring(0, 35);
                }
            }
            saveOfflineSessions(sessions);
        }
    } catch (e) {
        console.error(`Error saving messages for session ${sessionId}:`, e);
    }
}

export function appendOfflineMessage(sessionId: string, message: ChatMessage): void {
    const current = getOfflineMessages(sessionId);
    const updated = [...current, message];
    saveOfflineMessages(sessionId, updated);
}

export function updateOfflineMessage(sessionId: string, messageId: string, partial: Partial<ChatMessage>): void {
    const current = getOfflineMessages(sessionId);
    const updated = current.map(m => m.id === messageId ? { ...m, ...partial } : m);
    saveOfflineMessages(sessionId, updated);
}

// ----------------- Webhook Communication -----------------

/**
 * Sends a chat message to the configured customer chatbot webhook:
 * URL: https://api.hoseinikhodro.com/webhook/chatbot-customer
 * Method: POST
 * Items: user_id, message
 */
export async function sendChatMessageToWebhook(
    userId: string,
    messageText: string,
    signal?: AbortSignal
): Promise<string> {
    const payload: ChatWebhookPayload = {
        user_id: userId || 'anonymous_user',
        message: messageText.trim()
    };

    const response = await fetch(AI_CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
        },
        body: JSON.stringify(payload),
        signal
    });

    if (!response.ok) {
        let errorDetails = '';
        try {
            const errJson = await response.json();
            errorDetails = errJson.message || errJson.error || JSON.stringify(errJson);
        } catch {
            errorDetails = await response.text().catch(() => '');
        }
        throw new Error(errorDetails || `خطا در ارتباط با سرور (${response.status})`);
    }

    // Attempt to parse JSON response
    const rawText = await response.text();
    if (!rawText || rawText.trim() === '') {
        return 'پیام شما دریافت شد.';
    }

    try {
        const json = JSON.parse(rawText);
        
        // Check standard webhook response fields
        if (typeof json === 'string') {
            return json;
        }

        if (Array.isArray(json) && json.length > 0) {
            const first = json[0];
            if (typeof first === 'string') return first;
            if (first && typeof first === 'object') {
                return first.output || first.reply || first.message || first.response || first.text || JSON.stringify(first);
            }
        }

        if (json && typeof json === 'object') {
            const reply = json.reply || json.output || json.response || json.answer || json.message || json.text || json.result;
            if (reply) {
                if (typeof reply === 'string') return reply;
                return JSON.stringify(reply, null, 2);
            }
            return JSON.stringify(json, null, 2);
        }

        return String(json);
    } catch {
        // Plain text response
        return rawText.trim();
    }
}

// ----------------- History Import / Export -----------------

export function exportAllChatHistory(): string {
    const sessions = getOfflineSessions();
    const messages: Record<string, ChatMessage[]> = {};
    sessions.forEach(s => {
        messages[s.id] = getOfflineMessages(s.id);
    });

    const data: ChatExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        sessions,
        messages
    };

    return JSON.stringify(data, null, 2);
}

export function importChatHistory(jsonContent: string): { success: boolean; count: number; error?: string } {
    try {
        const parsed = JSON.parse(jsonContent);
        if (!parsed || !Array.isArray(parsed.sessions)) {
            return { success: false, count: 0, error: 'فرمت فایل ورودی نامعتبر است.' };
        }

        const existingSessions = getOfflineSessions();
        const existingIds = new Set(existingSessions.map(s => s.id));
        let importedCount = 0;

        const mergedSessions: ChatSession[] = [...existingSessions];

        for (const session of parsed.sessions) {
            if (!session.id) continue;
            if (!existingIds.has(session.id)) {
                mergedSessions.push(session);
                existingIds.add(session.id);
                importedCount++;
            }
            if (parsed.messages && parsed.messages[session.id]) {
                localStorage.setItem(
                    MESSAGES_STORAGE_PREFIX + session.id,
                    JSON.stringify(parsed.messages[session.id])
                );
            }
        }

        saveOfflineSessions(mergedSessions);
        return { success: true, count: importedCount };
    } catch (err: any) {
        return { success: false, count: 0, error: err.message || 'خطا در خواندن فایل' };
    }
}
