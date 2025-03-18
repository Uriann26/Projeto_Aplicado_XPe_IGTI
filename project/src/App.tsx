import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from './lib/auth';
import type { UserRole } from './lib/types';

function App() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('engineer');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Por favor, preencha todos os campos');
      }

      if (isSignUp) {
        await signUp(email, password, role);
        setError('Conta criada com sucesso! Por favor, faça login.');
        setIsSignUp(false);
      } else {
        await signIn(email, password);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Sistema de Gerenciamento de Relatórios
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gerencie seus relatórios técnicos de forma eficiente e segura. 
            Organize, acompanhe e colabore em um único lugar.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Features Section */}
          <div className="w-full lg:w-1/2 space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900">
                  Relatórios Digitais
                </h3>
              </div>
              <p className="text-gray-600">
                Upload e gerenciamento de relatórios técnicos em formato digital, 
                com suporte para diversos formatos de arquivo.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900">
                  Colaboração em Equipe
                </h3>
              </div>
              <p className="text-gray-600">
                Trabalhe em conjunto com sua equipe, compartilhe informações 
                e mantenha todos atualizados sobre o progresso.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <ArrowRight className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900">
                  Acompanhamento em Tempo Real
                </h3>
              </div>
              <p className="text-gray-600">
                Monitore o status dos relatórios, receba notificações e 
                mantenha-se informado sobre prazos importantes.
              </p>
            </div>
          </div>

          {/* Auth Form */}
          <div className="w-full lg:w-1/2 max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isSignUp ? 'Criar Conta' : 'Entrar no Sistema'}
                </h2>
                <p className="mt-2 text-gray-600">
                  {isSignUp 
                    ? 'Crie sua conta para começar a usar o sistema' 
                    : 'Faça login para acessar sua conta'}
                </p>
              </div>

              {error && (
                <div className="mb-6 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Senha
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Função
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="engineer">Engenheiro</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="technician">Técnico</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </div>
                  ) : (
                    isSignUp ? 'Criar Conta' : 'Entrar'
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;