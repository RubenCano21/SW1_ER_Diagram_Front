'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Lightbulb, X, Send, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface EntityData {
  id: string;
  name: string;
  attributes: Array<{
    id: string;
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    isRequired: boolean;
  }>;
}

interface SuggestedRelationship {
  fromEntity: string;
  toEntity: string;
  cardinality: string;
  reason: string;
  confidence: number;
}

interface AIAssistantProps {
  entities: EntityData[];
  relationships: Array<{
    source: string;
    target: string;
    data: {
      type: string;
      sourceCardinality: string;
      targetCardinality: string;
    };
  }>;
  onApplySuggestion?: (suggestion: SuggestedRelationship) => void;
  apiBaseUrl?: string;
}

export default function AIAssistant({ 
  entities, 
  relationships, 
  onApplySuggestion,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'suggestions'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de IA para diagramas ER. Puedo ayudarte con:\n\n• Sugerir relaciones entre entidades\n• Explicar conceptos de cardinalidad\n• Validar tu modelo de datos\n• Responder preguntas sobre diseño de bases de datos\n\n¿En qué puedo ayudarte?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestedRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Auto-analizar cuando hay más de 2 entidades y no hay sugerencias
  useEffect(() => {
    if (isOpen && activeTab === 'suggestions' && entities.length >= 2 && suggestions.length === 0) {
      handleGetSuggestions();
    }
  }, [isOpen, activeTab, entities.length]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/ai-assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-10) // Últimos 10 mensajes para contexto
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el asistente de IA. Verifica tu conexión a Internet.",
        variant: "destructive",
      });
      
      // Mensaje de fallback
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, no puedo conectarme al servidor en este momento. Por favor, verifica tu conexión a Internet.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (entities.length < 2) {
      toast({
        title: "Necesitas más entidades",
        description: "Agrega al menos 2 entidades para recibir sugerencias de relaciones.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setActiveTab('suggestions');

    try {
      // Preparar contexto del diagrama
      const diagramContext = {
        entities: entities.map(entity => ({
          name: entity.name,
          attributes: entity.attributes.map(attr => attr.name)
        })),
        existingRelationships: relationships.map(rel => {
          const sourceEntity = entities.find(e => e.id === rel.source);
          const targetEntity = entities.find(e => e.id === rel.target);
          return {
            fromEntity: sourceEntity?.name || 'Unknown',
            toEntity: targetEntity?.name || 'Unknown',
            cardinality: `${rel.data.sourceCardinality}:${rel.data.targetCardinality}`,
            type: rel.data.type
          };
        })
      };

      const response = await fetch(`${apiBaseUrl}/ai-assistant/analyze-diagram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(diagramContext)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      
      if (data.suggestions && data.suggestions.length > 0) {
        toast({
          title: "✨ Análisis completado",
          description: `Se encontraron ${data.suggestions.length} sugerencias de relaciones`,
        });
      } else {
        toast({
          title: "👍 Diagrama completo",
          description: "No se encontraron relaciones faltantes obvias",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error al analizar",
        description: "No se pudo analizar el diagrama. Verifica la conexión con el backend.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-orange-100 text-orange-800 border-orange-200';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle2 className="h-4 w-4" />;
    if (confidence >= 0.6) return <AlertCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-50 hover:scale-110 animate-pulse"
          title="Asistente de IA"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Panel del asistente */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold">Asistente IA</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded p-1 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b bg-gray-50">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 px-4 font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'border-b-2 border-purple-600 text-purple-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageCircle size={16} />
                Chat
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('suggestions');
                if (suggestions.length === 0 && entities.length >= 2) {
                  handleGetSuggestions();
                }
              }}
              className={`flex-1 py-3 px-4 font-medium transition-colors ${
                activeTab === 'suggestions'
                  ? 'border-b-2 border-purple-600 text-purple-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Lightbulb size={16} />
                Sugerencias
                {suggestions.length > 0 && (
                  <Badge className="bg-purple-600 text-white">{suggestions.length}</Badge>
                )}
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {activeTab === 'chat' ? (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-purple-100' : 'text-gray-400'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Sparkles className="h-12 w-12 text-purple-600 animate-spin mb-4" />
                    <p className="text-sm text-gray-600">Analizando diagrama...</p>
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-800">
                        <strong>{suggestions.length}</strong> sugerencias encontradas para mejorar tu diagrama
                      </p>
                    </div>
                    {suggestions.map((suggestion, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-2 flex-1">
                            <Lightbulb className="text-yellow-500 mt-1 flex-shrink-0" size={18} />
                            <div>
                              <div className="font-medium text-gray-900 mb-1">
                                {suggestion.fromEntity} → {suggestion.toEntity}
                              </div>
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                {suggestion.cardinality}
                              </Badge>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getConfidenceColor(suggestion.confidence)}`}>
                            {getConfidenceIcon(suggestion.confidence)}
                            {(suggestion.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 ml-7">{suggestion.reason}</p>
                        <Button
                          onClick={() => onApplySuggestion?.(suggestion)}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                          size="sm"
                        >
                          Aplicar Sugerencia
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={handleGetSuggestions}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Re-analizar Diagrama
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Lightbulb size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600 mb-2">
                      {entities.length < 2 
                        ? 'Agrega al menos 2 entidades para recibir sugerencias'
                        : '¡Tu diagrama está completo!'}
                    </p>
                    {entities.length >= 2 && (
                      <Button
                        onClick={handleGetSuggestions}
                        className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                        size="sm"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analizar Diagrama
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input (solo para chat) */}
          {activeTab === 'chat' && (
            <div className="border-t p-4 bg-white rounded-b-lg">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}