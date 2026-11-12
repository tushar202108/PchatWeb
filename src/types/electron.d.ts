export { };

declare global {
    interface Window {
        chatStorage: {
            saveConversations: (
                userId: string,
                conversations: any[]
            ) => Promise<boolean>;

            getConversations: (userId: string) => Promise<any[]>;

            saveMessages: (
                userId: string,
                messages: any[]
            ) => Promise<boolean>;

            getMessages: (
                userId: string,
                conversationId: string
            ) => Promise<any[]>;

            getAllMessages: (userId: string) => Promise<any[]>;
            deleteConversation: (
                userId: string,
                conversationId: string
            ) => Promise<boolean>;

            deleteMessage: (
                userId: string,
                conversationId: string,
                messageId: string
            ) => Promise<boolean>;
        };
    }
}