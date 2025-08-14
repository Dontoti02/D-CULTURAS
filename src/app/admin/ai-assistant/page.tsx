
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, Loader2, Send } from 'lucide-react';
import { getAssistantResponse } from '@/ai/flows/assistant-flow';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hola, soy tu asistente de IA. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre productos, ventas, clientes y más.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getAssistantResponse({ question: input });
      const assistantMessage: Message = { role: 'assistant', content: response.answer };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = { role: 'assistant', content: `Lo siento, ocurrió un error: ${error.message}` };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Asistente de IA</h1>
        <p className="text-muted-foreground">Consulta información sobre tu tienda usando lenguaje natural.</p>
      </header>
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role === 'assistant' && (
                <div className="bg-primary text-primary-foreground rounded-full p-2">
                  <Bot className="h-6 w-6" />
                </div>
              )}
              <div
                className={`max-w-md p-3 rounded-lg ${
                  message.role === 'user' ? 'bg-muted' : 'bg-secondary'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="bg-muted rounded-full p-2">
                  <User className="h-6 w-6" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="bg-primary text-primary-foreground rounded-full p-2">
                <Bot className="h-6 w-6" />
              </div>
              <div className="max-w-md p-3 rounded-lg bg-secondary flex items-center">
                 <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </CardContent>
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ej: ¿Cuál es el producto más caro?"
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
