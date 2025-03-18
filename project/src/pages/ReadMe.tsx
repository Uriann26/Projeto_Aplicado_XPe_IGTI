import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ReadMe() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar
      </button>

      <div className="prose prose-blue max-w-none">
        <h1>Sistema de Gerenciamento de Relatórios (SGR)</h1>
        
        <p>Sistema web para gerenciamento de relatórios técnicos, inspeção de vias e gestão de equipes.</p>

        <h2>Sumário</h2>
        <ul>
          <li><a href="#visão-geral">Visão Geral</a></li>
          <li><a href="#tecnologias">Tecnologias</a></li>
          <li><a href="#funcionalidades">Funcionalidades</a></li>
          <li><a href="#estrutura-do-projeto">Estrutura do Projeto</a></li>
          <li><a href="#banco-de-dados">Banco de Dados</a></li>
          <li><a href="#autenticação-e-autorização">Autenticação e Autorização</a></li>
          <li><a href="#guia-de-instalação">Guia de Instalação</a></li>
          <li><a href="#desenvolvimento">Desenvolvimento</a></li>
          <li><a href="#testes">Testes</a></li>
          <li><a href="#documentação-da-api">Documentação da API</a></li>
        </ul>

        <h2 id="visão-geral">Visão Geral</h2>
        <p>O SGR é uma aplicação web completa para gerenciamento de relatórios técnicos, inspeção de vias e gestão de equipes. O sistema permite:</p>
        <ul>
          <li>Upload e gerenciamento de relatórios técnicos</li>
          <li>Registro e monitoramento de vias e patologias</li>
          <li>Gestão de equipes e tarefas</li>
          <li>Notificações e lembretes</li>
          <li>Análise e estatísticas</li>
          <li>Exportação de dados</li>
        </ul>

        <h2 id="tecnologias">Tecnologias</h2>
        <h3>Frontend</h3>
        <ul>
          <li>React 18</li>
          <li>TypeScript</li>
          <li>Vite</li>
          <li>TailwindCSS</li>
          <li>React Router</li>
          <li>React Query</li>
          <li>Lucide Icons</li>
          <li>Leaflet (mapas)</li>
          <li>Chart.js (gráficos)</li>
          <li>React Big Calendar</li>
          <li>React Dropzone</li>
        </ul>

        <h3>Backend</h3>
        <ul>
          <li>Supabase (Backend as a Service)</li>
          <li>PostgreSQL</li>
          <li>Row Level Security (RLS)</li>
          <li>Realtime subscriptions</li>
          <li>Storage</li>
        </ul>

        <h3>Testes</h3>
        <ul>
          <li>Vitest</li>
          <li>React Testing Library</li>
          <li>Jest DOM</li>
        </ul>

        <h2 id="funcionalidades">Funcionalidades</h2>
        
        <h3>Autenticação</h3>
        <ul>
          <li>Login com email/senha</li>
          <li>Registro de novos usuários</li>
          <li>Recuperação de senha</li>
          <li>Perfis de usuário (Supervisor, Engenheiro, Técnico)</li>
        </ul>

        <h3>Relatórios</h3>
        <ul>
          <li>Upload de relatórios (PDF, DOC, DOCX, XLS, XLSX)</li>
          <li>Visualização e download</li>
          <li>Comentários e tags</li>
          <li>Sistema de revisão</li>
          <li>Controle de versões</li>
          <li>Prazos e lembretes</li>
        </ul>

        <h3>Vias e Patologias</h3>
        <ul>
          <li>Cadastro de vias com coordenadas GPS</li>
          <li>Registro de patologias</li>
          <li>Visualização em mapa</li>
          <li>Fotos e documentação</li>
          <li>Análise técnica</li>
          <li>Histórico de inspeções</li>
        </ul>

        <h3>Equipes</h3>
        <ul>
          <li>Criação e gestão de equipes</li>
          <li>Atribuição de membros</li>
          <li>Chat em tempo real</li>
          <li>Compartilhamento de arquivos</li>
          <li>Calendário de equipe</li>
          <li>Tarefas e atividades</li>
        </ul>

        <h3>Notificações</h3>
        <ul>
          <li>Notificações em tempo real</li>
          <li>Lembretes de prazos</li>
          <li>Atualizações de status</li>
          <li>Configurações personalizadas</li>
          <li>Resumo diário</li>
        </ul>

        <h3>Análise e Relatórios</h3>
        <ul>
          <li>Dashboard com métricas</li>
          <li>Gráficos e estatísticas</li>
          <li>Relatórios personalizados</li>
          <li>Exportação de dados (CSV, Excel, PDF)</li>
        </ul>

        <h2 id="estrutura-do-projeto">Estrutura do Projeto</h2>
        <pre><code>src/
├── components/         # Componentes React reutilizáveis
│   ├── analytics/     # Componentes de análise e gráficos
│   └── ui/            # Componentes de interface básicos
├── lib/               # Lógica de negócios e utilitários
│   ├── hooks/         # React hooks personalizados
│   ├── services/      # Serviços de API e lógica
│   └── validation/    # Schemas de validação
├── pages/             # Componentes de página
└── types/             # Definições de tipos TypeScript</code></pre>

        <h3>Principais Componentes</h3>
        <ul>
          <li><code>DashboardLayout</code>: Layout principal com navegação</li>
          <li><code>NotificationBell</code>: Sistema de notificações</li>
          <li><code>DeadlineCalendar</code>: Calendário de prazos</li>
          <li><code>TeamChat</code>: Chat em tempo real</li>
          <li><code>RoadMap</code>: Visualização de mapa</li>
          <li><code>Analytics</code>: Gráficos e estatísticas</li>
        </ul>

        <h2 id="banco-de-dados">Banco de Dados</h2>
        
        <h3>Tabelas Principais</h3>
        <ul>
          <li><code>profiles</code>: Perfis de usuário</li>
          <li><code>reports</code>: Relatórios técnicos</li>
          <li><code>roads</code>: Cadastro de vias</li>
          <li><code>pathologies</code>: Registro de patologias</li>
          <li><code>teams</code>: Equipes</li>
          <li><code>tasks</code>: Tarefas</li>
          <li><code>notifications</code>: Sistema de notificações</li>
        </ul>

        <h3>Relacionamentos</h3>
        <ul>
          <li>Um usuário pode ter vários relatórios</li>
          <li>Uma via pode ter várias patologias</li>
          <li>Uma equipe pode ter vários membros</li>
          <li>Uma tarefa pertence a uma equipe</li>
          <li>Um usuário pode ter várias notificações</li>
        </ul>

        <h2 id="autenticação-e-autorização">Autenticação e Autorização</h2>
        
        <h3>Níveis de Acesso</h3>
        
        <h4>Supervisor</h4>
        <ul>
          <li>Acesso total ao sistema</li>
          <li>Gerenciamento de usuários</li>
          <li>Aprovação de relatórios</li>
          <li>Definição de prazos</li>
        </ul>

        <h4>Engenheiro</h4>
        <ul>
          <li>Criação de relatórios</li>
          <li>Gestão de equipe</li>
          <li>Análise técnica</li>
          <li>Revisão de documentos</li>
        </ul>

        <h4>Técnico</h4>
        <ul>
          <li>Registro de atividades</li>
          <li>Inspeção de vias</li>
          <li>Documentação de patologias</li>
          <li>Relatórios diários</li>
        </ul>

        <h3>Políticas de Segurança</h3>
        <ul>
          <li>Row Level Security (RLS) no banco de dados</li>
          <li>Validação de permissões por função</li>
          <li>Proteção de rotas no frontend</li>
          <li>Tokens JWT para autenticação</li>
        </ul>

        <h2 id="guia-de-instalação">Guia de Instalação</h2>
        
        <h3>1. Clone o repositório</h3>
        <pre><code>git clone [url-do-repositorio]
cd [nome-do-projeto]</code></pre>

        <h3>2. Instale as dependências</h3>
        <pre><code>npm install</code></pre>

        <h3>3. Configure as variáveis de ambiente</h3>
        <pre><code>cp .env.example .env</code></pre>

        <h3>4. Inicie o servidor de desenvolvimento</h3>
        <pre><code>npm run dev</code></pre>

        <h2 id="desenvolvimento">Desenvolvimento</h2>
        
        <h3>Scripts Disponíveis</h3>
        <ul>
          <li><code>npm run dev</code>: Inicia o servidor de desenvolvimento</li>
          <li><code>npm run build</code>: Compila o projeto para produção</li>
          <li><code>npm run test</code>: Executa os testes</li>
          <li><code>npm run lint</code>: Executa o linter</li>
          <li><code>npm run coverage</code>: Gera relatório de cobertura de testes</li>
        </ul>

        <h3>Padrões de Código</h3>
        <ul>
          <li>ESLint para linting</li>
          <li>Prettier para formatação</li>
          <li>TypeScript para tipagem estática</li>
          <li>Commits semânticos</li>
        </ul>

        <h2 id="testes">Testes</h2>
        
        <h3>Testes Unitários</h3>
        <ul>
          <li>Componentes React</li>
          <li>Hooks personalizados</li>
          <li>Funções utilitárias</li>
          <li>Serviços de API</li>
        </ul>

        <h3>Testes de Integração</h3>
        <ul>
          <li>Fluxos de autenticação</li>
          <li>Operações de CRUD</li>
          <li>Interações de usuário</li>
          <li>Chamadas de API</li>
        </ul>

        <h2 id="documentação-da-api">Documentação da API</h2>
        
        <h3>Autenticação</h3>
        <pre><code>signIn(email: string, password: string): Promise<AuthResponse>
signUp(email: string, password: string, role: UserRole): Promise<AuthResponse>
signOut(): Promise<void></code></pre>

        <h3>Relatórios</h3>
        <pre><code>createReport(data: Partial<Report>): Promise<Report>
getReports(): Promise<Report[]>
updateReport(id: string, data: Partial<Report>): Promise<void>
deleteReport(id: string): Promise<void></code></pre>

        <h3>Vias e Patologias</h3>
        <pre><code>createRoad(data: RoadInput): Promise<Road>
createPathology(data: PathologyInput): Promise<Pathology>
getRoads(): Promise<Road[]>
getPathologies(roadId: string): Promise<Pathology[]></code></pre>

        <h3>Equipes</h3>
        <pre><code>createTeam(name: string, description?: string): Promise<Team>
addTeamMember(teamId: string, userId: string, role: string): Promise<void>
createTask(data: TaskInput): Promise<Task>
getTeamTasks(teamId: string): Promise<Task[]></code></pre>

        <h3>Notificações</h3>
        <pre><code>getNotifications(): Promise<Notification[]>
markAsRead(id: string): Promise<void>
updateSettings(settings: NotificationSettings): Promise<void></code></pre>

        <h3>Análise</h3>
        <pre><code>getTeamStats(teamId: string): Promise<TeamStats>
getRoadConditionStats(): Promise<RoadConditionStats>
getMonthlyStats(months: number): Promise<MonthlyStats[]></code></pre>

        <h2>Contribuição</h2>
        <ol>
          <li>Faça um fork do projeto</li>
          <li>Crie uma branch para sua feature (<code>git checkout -b feature/nova-feature</code>)</li>
          <li>Faça commit das alterações (<code>git commit -m "Adiciona nova feature"</code>)</li>
          <li>Faça push para a branch (<code>git push origin feature/nova-feature</code>)</li>
          <li>Abra um Pull Request</li>
        </ol>

        <h2>Licença</h2>
        <p>Este projeto está licenciado sob a licença MIT - veja o arquivo <a href="LICENSE.md">LICENSE.md</a> para detalhes.</p>
      </div>
    </div>
  );
}