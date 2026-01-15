import { useWebSocketContext } from '@/context/WebSocketProvider'

export function useChatMessages() {
    return useWebSocketContext()
}
