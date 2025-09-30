// hooks/useCollaboration.ts
import { useCallback } from 'react';
import { CollaborationMessageType } from '@/lib/websockets/types';
import { Node, Edge } from '@xyflow/react';
import { useWebSocket } from '@/lib/websockets/useWebSocket';

interface UseCollaborationProps {
  projectId: string;
  token: string;
  enabled?: boolean;
  onNodeUpdate?: (nodeId: string, data: any) => void;
  onNodeCreate?: (nodeId: string, data: any) => void;
  onNodeDelete?: (nodeId: string) => void;
  onEdgeUpdate?: (edgeId: string, data: any) => void;
  onEdgeCreate?: (edgeId: string, data: any) => void;
  onEdgeDelete?: (edgeId: string) => void;
}

export const useCollaboration = ({
  projectId,
  token,
  enabled = true,
  onNodeUpdate,
  onNodeCreate,
  onNodeDelete,
  onEdgeUpdate,
  onEdgeCreate,
  onEdgeDelete,
}: UseCollaborationProps) => {
  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case CollaborationMessageType.NODE_UPDATED:
        onNodeUpdate?.(message.data.nodeId, message.data);
        break;
      case CollaborationMessageType.NODE_CREATED:
        onNodeCreate?.(message.data.nodeId, message.data);
        break;
      case CollaborationMessageType.NODE_DELETED:
        onNodeDelete?.(message.data.nodeId);
        break;
      case CollaborationMessageType.EDGE_UPDATED:
        onEdgeUpdate?.(message.data.edgeId, message.data);
        break;
      case CollaborationMessageType.EDGE_CREATED:
        onEdgeCreate?.(message.data.edgeId, message.data);
        break;
      case CollaborationMessageType.EDGE_DELETED:
        onEdgeDelete?.(message.data.edgeId);
        break;
    }
  }, [onNodeUpdate, onNodeCreate, onNodeDelete, onEdgeUpdate, onEdgeCreate, onEdgeDelete]);

  const ws = useWebSocket({
    projectId,
    token,
    enabled,
    onMessage: handleMessage,
  });

  const broadcastNodeUpdate = useCallback((nodeId: string, nodeData: any) => {
    ws.sendMessage({
      type: CollaborationMessageType.NODE_UPDATED,
      projectId,
      data: { nodeId, ...nodeData },
      timestamp: Date.now(),
    });
  }, [ws.sendMessage, projectId]);

  const broadcastNodeCreate = useCallback((nodeId: string, nodeData: any) => {
    ws.sendMessage({
      type: CollaborationMessageType.NODE_CREATED,
      projectId,
      data: { nodeId, ...nodeData },
      timestamp: Date.now(),
    });
  }, [ws.sendMessage, projectId]);

  const broadcastNodeDelete = useCallback((nodeId: string) => {
    ws.sendMessage({
      type: CollaborationMessageType.NODE_DELETED,
      projectId,
      data: { nodeId },
      timestamp: Date.now(),
    });
  }, [ws.sendMessage, projectId]);

  const broadcastEdgeUpdate = useCallback((edgeId: string, edgeData: any) => {
    ws.sendMessage({
      type: CollaborationMessageType.EDGE_UPDATED,
      projectId,
      data: { edgeId, ...edgeData },
      timestamp: Date.now(),
    });
  }, [ws.sendMessage, projectId]);

  const broadcastEdgeCreate = useCallback((edgeId: string, edgeData: any) => {
    ws.sendMessage({
      type: CollaborationMessageType.EDGE_CREATED,
      projectId,
      data: { edgeId, ...edgeData },
      timestamp: Date.now(),
    });
  }, [ws.sendMessage, projectId]);

  const broadcastEdgeDelete = useCallback((edgeId: string) => {
    ws.sendMessage({
      type: CollaborationMessageType.EDGE_DELETED,
      projectId,
      data: { edgeId },
      timestamp: Date.now(),
    });
  }, [ws.sendMessage, projectId]);

  const broadcastCursorMove = useCallback((x: number, y: number) => {
    ws.sendMessage({
      type: CollaborationMessageType.USER_CURSOR,
      projectId,
      data: { x, y },
      timestamp: Date.now(),
    });
  }, [ws.sendMessage, projectId]);

  const lockNode = useCallback((nodeId: string) => {
    ws.sendMessage({
      type: CollaborationMessageType.NODE_LOCKED,
      projectId,
      data: { nodeId },
      timestamp: Date.now(),
    });
  }, [ws.sendMessage, projectId]);

  const unlockNode = useCallback((nodeId: string) => {
    ws.sendMessage({
      type: CollaborationMessageType.NODE_UNLOCKED,
      projectId,
      data: { nodeId },
      timestamp: Date.now(),
    });
  }, [ws.sendMessage, projectId]);

  return {
    ...ws,
    broadcastNodeUpdate,
    broadcastNodeCreate,
    broadcastNodeDelete,
    broadcastEdgeUpdate,
    broadcastEdgeCreate,
    broadcastEdgeDelete,
    broadcastCursorMove,
    lockNode,
    unlockNode,
  };
};