'use client'

import { useState } from 'react';
import { testSupabaseConnection, simpleLogin } from '@/lib/simple-auth';

export default function TestPage() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('123456');
  const [result, setResult] = useState<string>('');

  const handleTestConnection = async () => {
    setResult('Testando conexão...');
    const success = await testSupabaseConnection();
    setResult(success ? '✅ Conexão OK' : '❌ Conexão falhou');
  };

  const handleSimpleLogin = async () => {
    setResult('Tentando login...');
    try {
      const response = await simpleLogin(email, password);
      setResult(`✅ Login OK: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`❌ Login falhou: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">🔧 Teste de Conexão Supabase</h1>
        
        <div className="space-y-4">
          <button
            onClick={handleTestConnection}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            1. Testar Conexão com Supabase
          </button>

          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">2. Testar Login:</h3>
            <div className="space-y-2">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              <button
                onClick={handleSimpleLogin}
                className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
              >
                Testar Login Simples
              </button>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold mb-2">Resultado:</h3>
            <pre className="text-sm overflow-auto max-h-96">{result}</pre>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Como usar:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Primeiro teste a conexão básica</li>
              <li>Se OK, teste o login (qualquer email/senha por enquanto)</li>
              <li>Veja os logs no console (F12) para mais detalhes</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}