# Sistema de Gerenciamento de Relatórios (SGR)

Sistema web para gerenciamento de relatórios técnicos, inspeção de vias e gestão de equipes.

## Sumário

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Funcionalidades](#funcionalidades)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Banco de Dados](#banco-de-dados)
- [Autenticação e Autorização](#autenticação-e-autorização)
- [Guia de Instalação](#guia-de-instalação)
- [Desenvolvimento](#desenvolvimento)
- [Testes](#testes)
- [Documentação da API](#documentação-da-api)

## Visão Geral

O SGR é uma aplicação web completa para gerenciamento de relatórios técnicos, inspeção de vias e gestão de equipes. O sistema permite:

- Upload e gerenciamento de relatórios técnicos
- Registro e monitoramento de vias e patologias
- Gestão de equipes e tarefas
- Notificações e lembretes
- Análise e estatísticas
- Exportação de dados

## Tecnologias

- **Frontend**:
  - React 18
  - TypeScript
  - Vite
  - TailwindCSS
  - React Router
  - React Query
  - Lucide Icons
  - Leaflet (mapas)
  - Chart.js (gráficos)
  - React Big Calendar
  - React Dropzone

- **Backend**:
  - Supabase (Backend as a Service)
  - PostgreSQL
  - Row Level Security (RLS)
  - Realtime subscriptions
  - Storage

- **Testes**:
  - Vitest
  - React Testing Library
  - Jest DOM

## Funcionalidades

### Autenticação

- Login com email/senha
- Registro de novos usuários
- Recuperação de senha
- Perfis de usuário (Supervisor, Engenheiro, Técnico)

### Relatórios

- Upload de relatórios (PDF, DOC, DOCX, XLS, XLSX)
- Visualização e download
- Comentários e tags
- Sistema de revisão
- Controle de versões
- Prazos e lembretes

### Vias e Patologias

- Cadastro de vias com coordenadas GPS
- Registro de patologias
- Visualização em mapa
- Fotos e documentação
- Análise técnica
- Histórico de inspeções

### Equipes

- Criação e gestão de equipes
- Atribuição de membros
- Chat em tempo real
- Compartilhamento de arquivos
- Calendário de equipe
- Tarefas e atividades

### Notificações

- Notificações em tempo real
- Lembretes de prazos
- Atualizações de status
- Configurações personalizadas
- Resumo diário

### Análise e Relatórios

- Dashboard com métricas
- Gráficos e estatísticas
- Relatórios personalizados
- Exportação de dados (CSV, Excel, PDF)

## Estrutura do Projeto

```
src/
├── components/         # Componentes React reutilizáveis
│   ├── analytics/     # Componentes de análise e gráficos
│   └── ui/            # Componentes de interface básicos
├── lib/               # Lógica de negócios e utilitários
│   ├── hooks/         # React hooks personalizados
│   ├── services/      # Serviços de API e lógica
│   └── validation/    # Schemas de validação
├── pages/             # Componentes de página
└── types/             # Definições de tipos TypeScript
```

### Principais Componentes

- `DashboardLayout`: Layout principal com navegação
- `NotificationBell`: Sistema de notificações
- `DeadlineCalendar`: Calendário de prazos
- `TeamChat`: Chat em tempo real
- `RoadMap`: Visualização de mapa
- `Analytics`: Gráficos e estatísticas

## Banco de Dados

### Tabelas Principais

- `profiles`: Perfis de usuário
- `reports`: Relatórios técnicos
- `roads`: Cadastro de vias
- `pathologies`: Registro de patologias
- `teams`: Equipes
- `tasks`: Tarefas
- `notifications`: Sistema de notificações

### Relacionamentos

- Um usuário pode ter vários relatórios
- Uma via pode ter várias patologias
- Uma equipe pode ter vários membros
- Uma tarefa pertence a uma equipe
- Um usuário pode ter várias notificações

## Autenticação e Autorização

### Níveis de Acesso

- **Supervisor**:
  - Acesso total ao sistema
  - Gerenciamento de usuários
  - Aprovação de relatórios
  - Definição de prazos

- **Engenheiro**:
  - Criação de relatórios
  - Gestão de equipe
  - Análise técnica
  - Revisão de documentos

- **Técnico**:
  - Registro de atividades
  - Inspeção de vias
  - Documentação de patologias
  - Relatórios diários

### Políticas de Segurança

- Row Level Security (RLS) no banco de dados
- Validação de permissões por função
- Proteção de rotas no frontend
- Tokens JWT para autenticação

## Guia de Instalação

1. Clone o repositório
```bash
git clone [url-do-repositorio]
cd [nome-do-projeto]
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

4. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

## Desenvolvimento

### Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Compila o projeto para produção
- `npm run test`: Executa os testes
- `npm run lint`: Executa o linter
- `npm run coverage`: Gera relatório de cobertura de testes

### Padrões de Código

- ESLint para linting
- Prettier para formatação
- TypeScript para tipagem estática
- Commits semânticos

## Testes

### Testes Unitários

- Componentes React
- Hooks personalizados
- Funções utilitárias
- Serviços de API

### Testes de Integração

- Fluxos de autenticação
- Operações de CRUD
- Interações de usuário
- Chamadas de API

## Documentação da API

### Autenticação

```typescript
signIn(email: string, password: string): Promise<AuthResponse>
signUp(email: string, password: string, role: UserRole): Promise<AuthResponse>
signOut(): Promise<void>
```

### Relatórios

```typescript
createReport(data: Partial<Report>): Promise<Report>
getReports(): Promise<Report[]>
updateReport(id: string, data: Partial<Report>): Promise<void>
deleteReport(id: string): Promise<void>
```

### Vias e Patologias

```typescript
createRoad(data: RoadInput): Promise<Road>
createPathology(data: PathologyInput): Promise<Pathology>
getRoads(): Promise<Road[]>
getPathologies(roadId: string): Promise<Pathology[]>
```

### Equipes

```typescript
createTeam(name: string, description?: string): Promise<Team>
addTeamMember(teamId: string, userId: string, role: string): Promise<void>
createTask(data: TaskInput): Promise<Task>
getTeamTasks(teamId: string): Promise<Task[]>
```

### Notificações

```typescript
getNotifications(): Promise<Notification[]>
markAsRead(id: string): Promise<void>
updateSettings(settings: NotificationSettings): Promise<void>
```

### Análise

```typescript
getTeamStats(teamId: string): Promise<TeamStats>
getRoadConditionStats(): Promise<RoadConditionStats>
getMonthlyStats(months: number): Promise<MonthlyStats[]>
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE.md](LICENSE.md) para detalhes.