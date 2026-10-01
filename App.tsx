import { Component, useEffect, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import {
  Archive, ArrowLeft, ArrowRight, Bell, BookOpen, Bot, CalendarDays, Check,
  CheckSquare, ChevronDown, ChevronRight, CircleHelp, Clock3, Command, Copy,
  Database, FilePlus2, FileText, Filter, FolderKanban, Gauge, GitBranch,
  Hash, Inbox, LayoutDashboard, ListTodo, LogOut, Menu, Moon, MoreHorizontal,
  PanelLeftClose, PanelLeftOpen, Pin, Plus, RotateCcw, Search, Settings2,
  Share2, Sparkles, Sun, Target, Users, X, Zap, Image as ImageIcon
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "./contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { exportBackup, importBackup } from "@/lib/localdb";
import { Toaster, toast } from "sonner";

const iconBySpace: Record<string, LucideIcon> = {
  "Início": LayoutDashboard,
  "Comercial": Target,
  "Operações": FolderKanban,
  "Pessoas": Users,
  "Financeiro": Gauge,
  "Pessoal": BookOpen,
};

const pageIcon: Record<string, LucideIcon> = {
  "⌂": LayoutDashboard,
  "◈": Bell,
  "▱": Database,
  "✎": FileText,
  "◌": FolderKanban,
  "◷": CalendarDays,
  "✦": Sparkles,
  "⌁": Gauge,
  "○": CircleHelp,
};

type Block = { id: string; type: string; content?: string; checked?: boolean; language?: string };
type PageItem = { id: number; spaceId: number; parentId?: number | null; title: string; icon?: string; color?: string; type?: string; updatedAt?: string | Date; excerpt?: string };

type UserLike = { name?: string | null; email?: string | null; role?: string | null } | null;
type LayoutSettings = { accent: string; secondary: string; font: string; logo: string };
const defaultLayout: LayoutSettings = { accent: "#0E7490", secondary: "#F59E0B", font: "'Manrope', ui-sans-serif, system-ui, sans-serif", logo: "" };

function initials(name?: string | null) {
  return (name || "NC").split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(value?: string | Date) {
  if (!value) return "Agora";
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(value);
  }
  return String(value);
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Centrall render error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <div className="error-state app-crash-state"><div className="brand-mark small"><span>⌁</span></div><h2>Não foi possível abrir seu workspace</h2><p>O login foi concluído, mas encontramos um problema ao montar esta tela.</p><code>{this.state.error.message || "Erro inesperado"}</code><button className="primary-button" onClick={() => window.location.reload()}>Recarregar ferramenta</button></div>;
  }
}

function App() {
  return <AppErrorBoundary><AppContent /></AppErrorBoundary>;
}

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const me = trpc.auth.me.useQuery();
  if (me.isLoading) return <LoadingScreen />;
  if (me.error) return <div className="error-state"><h2>Não foi possível validar sua sessão</h2><p>{me.error.message}</p><button className="primary-button" onClick={() => me.refetch()}>Tentar novamente</button></div>;
  if (!me.data) return <LoginScreen />;
  return <NexoraApp user={me.data} theme={theme} toggleTheme={toggleTheme} />;
}

function LoadingScreen() {
  return <div className="loading-screen"><div className="brand-mark small"><span>⌁</span></div><div><strong>Centrall</strong><p>Preparando seu espaço criativo…</p></div></div>;
}

function LoginScreen() {
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = trpc.auth.login.useMutation({ onSuccess: () => utils.auth.me.invalidate(), onError: error => toast.error(error.message || "Não foi possível entrar.") });
  const register = trpc.auth.register.useMutation({ onSuccess: () => utils.auth.me.invalidate(), onError: error => toast.error(error.message || "Não foi possível criar a conta.") });
  const demo = trpc.auth.demo.useMutation({ onSuccess: () => utils.auth.me.invalidate(), onError: error => toast.error(error.message) });
  const isRegister = mode === "register";
  return <><Toaster position="bottom-right" richColors /><main className="auth-screen">
    <section className="auth-visual">
      <div className="auth-brand"><div className="brand-mark"><span>⌁</span></div><span>Centrall</span></div>
      <div className="auth-hero-copy"><p className="eyebrow light">SISTEMA OPERACIONAL DE AGÊNCIA</p><h1>Ideias, clientes e entregas, <em>no mesmo fluxo.</em></h1><p>Um workspace vivo para agências que querem criar com mais clareza, ritmo e personalidade.</p></div>
      <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
      <div className="auth-quote"><div className="quote-dot" /><div><strong>Estúdio Aurora</strong><span>“O briefing, o time e a próxima entrega agora respiram no mesmo lugar.”</span></div></div>
    </section>
    <section className="auth-panel">
      <div className="auth-panel-inner">
        <div className="mobile-auth-brand"><div className="brand-mark"><span>⌁</span></div><strong>Centrall</strong></div>
        <div className="auth-heading"><p className="eyebrow">{isRegister ? "COMECE SUA AGÊNCIA" : "ACESSO DO ESTÚDIO"}</p><h2>{isRegister ? "Crie seu espaço criativo." : "Bom te ver por aqui."}</h2><p>{isRegister ? "Monte seu workspace e convide o time para criar junto." : "Entre no Centrall para continuar de onde sua equipe parou."}</p></div>
        <form className="auth-form" onSubmit={event => { event.preventDefault(); isRegister ? register.mutate({ name, email, password, workspaceName }) : login.mutate({ email, password }); }}>
          {isRegister && <><label>Seu nome<input autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Ex.: Marina Costa" required /></label><label>Nome da agência<input value={workspaceName} onChange={event => setWorkspaceName(event.target.value)} placeholder="Ex.: Estúdio Aurora" required /></label></>}
          <label>E-mail profissional<input autoComplete="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@agencia.com" required /></label>
          <label>Senha<div className="password-field"><input autoComplete={isRegister ? "new-password" : "current-password"} type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} placeholder="••••••••" minLength={8} required /><button type="button" onClick={() => setShowPassword(value => !value)}>{showPassword ? "Ocultar" : "Mostrar"}</button></div></label>
          {!isRegister && <div className="auth-options"><label className="checkbox-line"><input type="checkbox" defaultChecked /> <span>Manter conectado por 14 dias</span></label><button type="button" className="text-button" onClick={() => toast.info("Para redefinir a senha, fale com a direção do workspace.")}>Esqueci minha senha</button></div>}
          <button className="primary-button full" type="submit" disabled={login.isPending || register.isPending}>{login.isPending || register.isPending ? "Aguarde…" : isRegister ? "Criar minha conta" : "Entrar no Centrall"}<ArrowRight size={16} /></button>
        </form>
        {!isRegister && <><div className="auth-divider"><span>ou</span></div><button className="demo-button" type="button" onClick={() => demo.mutate()} disabled={demo.isPending}><Sparkles size={16} />{demo.isPending ? "Abrindo demonstração…" : "Explorar demonstração"}</button></>}
        <p className="auth-footnote">{isRegister ? "Sem cartão. Você pode ajustar o espaço e convidar sua equipe depois." : "Entre com sua conta ou crie um workspace para sua agência."}</p>
        <button className="auth-switch" type="button" onClick={() => setMode(isRegister ? "login" : "register")}>{isRegister ? "Já tenho uma conta · Entrar" : "Ainda não tenho conta · Criar agora"}</button>
        <div className="auth-security"><span><Check size={13} /> Sessão segura</span><span><Check size={13} /> Dados isolados</span><span><Check size={13} /> LGPD ready</span></div>
      </div>
    </section>
  </main></>;
}

function NexoraApp({ user, theme, toggleTheme }: { user: UserLike; theme: "light" | "dark"; toggleTheme?: () => void }) {
  const summary = trpc.workspace.summary.useQuery(undefined, { staleTime: 60_000 });
  const utils = trpc.useUtils();
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [layout, setLayout] = useState<LayoutSettings>(() => { try { return { ...defaultLayout, ...JSON.parse(localStorage.getItem("centrall-layout") || "{}") }; } catch { return defaultLayout; } });
  const [activeId, setActiveId] = useState(-101);
  const [splitId, setSplitId] = useState<number | null>(null);
  const [tabs, setTabs] = useState<number[]>([-101, -103, -105]);
  const [localPages, setLocalPages] = useState<PageItem[]>([]);
  const [pinned, setPinned] = useState<number[]>([-101]);
  const [favorites, setFavorites] = useState<number[]>([-103]);
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => utils.auth.me.invalidate() });
  const createPage = trpc.pages.create.useMutation({
    onSuccess: result => {
      const newPage: PageItem = { id: result.id, spaceId: result.spaceId, parentId: result.parentId ?? null, title: result.title, icon: "✎", color: "#0E7490", updatedAt: "Agora", excerpt: "Uma nova página para tirar ideias do papel." };
      setLocalPages(pages => [...pages, newPage]);
      setTabs(current => [...current, result.id]);
      setActiveId(result.id);
      toast.success("Página criada");
    },
    onError: error => toast.error(error.message),
  });

  const spaces = (summary.data?.spaces ?? []) as Array<{ id: number; name: string; icon: string; color: string; isPersonal?: boolean }>;
  const pages = Array.from(new Map([...((summary.data?.pages ?? []) as PageItem[]), ...localPages].map(item => [item.id, item] as const)).values());
  const activePage = pages.find(page => page.id === activeId) ?? pages[0];
  const splitPage = pages.find(page => page.id === splitId);

  useEffect(() => {
    document.documentElement.style.setProperty("--brand", layout.accent);
    document.documentElement.style.setProperty("--brand-strong", layout.accent);
    document.documentElement.style.setProperty("--brand-soft", `${layout.accent}16`);
    document.documentElement.style.setProperty("--agency-secondary", layout.secondary);
    document.documentElement.style.setProperty("--font-sans", layout.font);
    localStorage.setItem("centrall-layout", JSON.stringify(layout));
  }, [layout]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); }
      if ((event.metaKey || event.ctrlKey) && event.key === "\\") { event.preventDefault(); setSplitId(value => value ? null : (pages.find(page => page.id !== activeId)?.id ?? -103)); }
      if (event.key === "Escape") { setSearchOpen(false); setShortcutsOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, pages]);

  const openPage = (id: number) => {
    setActiveId(id);
    setTabs(current => current.includes(id) ? current : [...current, id]);
  };
  const closeTab = (id: number) => {
    setTabs(current => current.length === 1 ? current : current.filter(tab => tab !== id));
    if (activeId === id) setActiveId(tabs.find(tab => tab !== id) ?? -101);
  };
  const toggleFavorite = (id: number) => setFavorites(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  if (summary.isLoading) return <LoadingScreen />;
  if (summary.error) return <div className="error-state"><h2>Não foi possível carregar o workspace</h2><p>{summary.error.message}</p><button className="primary-button" onClick={() => summary.refetch()}>Tentar novamente</button></div>;

  return <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
    <Sidebar collapsed={collapsed} user={user} workspace={summary.data?.workspace} spaces={spaces} pages={pages} activeId={activeId} favorites={favorites} pinned={pinned} onToggle={() => setCollapsed(value => !value)} onOpenPage={openPage} onCreatePage={() => createPage.mutate({ spaceId: spaces[1]?.id ?? -12, title: "Nova página" })} onToggleFavorite={toggleFavorite} onOpenShortcuts={() => setShortcutsOpen(true)} onOpenSettings={() => setSettingsOpen(true)} logo={layout.logo} />
    <div className="app-main">
      <Topbar activePage={activePage} tabs={tabs.map(id => pages.find(page => page.id === id)).filter(Boolean) as PageItem[]} activeId={activeId} pinned={pinned} onOpenPage={openPage} onCloseTab={closeTab} onCreatePage={() => createPage.mutate({ spaceId: spaces[1]?.id ?? -12, title: "Nova página" })} onTogglePin={id => setPinned(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])} onSearch={() => setSearchOpen(true)} onToggleSidebar={() => setCollapsed(value => !value)} onToggleTheme={toggleTheme} theme={theme} onLogout={() => logout.mutate()} user={user} />
      <div className="workspace-canvas">
        <div className="breadcrumb-row"><div className="breadcrumbs"><span>{summary.data?.workspace?.name ?? "Centrall Studio"}</span><ChevronRight size={13} /><span>{activePage?.title ?? "Visão geral"}</span></div><div className="canvas-actions"><button className="icon-button" aria-label="Desfazer" onClick={() => toast.info("O histórico de alterações será disponibilizado em breve.")}><RotateCcw size={15} /></button><button className="icon-button" aria-label="Compartilhar" onClick={async () => { try { await navigator.clipboard?.writeText(window.location.href); toast.success("Link do workspace copiado"); } catch { toast.info("Copie o endereço desta página para compartilhar."); } }}><Share2 size={15} /></button><button className="icon-button" aria-label="Mais opções" onClick={() => toast.info("Use Configurações para administrar o workspace.")}><MoreHorizontal size={16} /></button></div></div>
        {activeId === -101 ? <HomeOverview user={user} stats={summary.data?.stats} pages={pages} onOpenPage={openPage} onOpenSettings={() => setSettingsOpen(true)} /> : <div className={`page-layout ${splitPage ? "has-split" : ""}`}><PageEditor page={activePage} onFavorite={() => activePage && toggleFavorite(activePage.id)} isFavorite={activePage ? favorites.includes(activePage.id) : false} /><>{splitPage && <div className="split-pane"><div className="split-label"><span>VISUALIZAÇÃO DIVIDIDA</span><button className="icon-button" onClick={() => setSplitId(null)}><X size={14} /></button></div><PageEditor page={splitPage} compact onFavorite={() => {}} isFavorite={false} /></div>}</></div>}
      </div>
    </div>
    {searchOpen && <CommandPalette pages={pages} spaces={spaces} onClose={() => setSearchOpen(false)} onOpenPage={openPage} onCreatePage={() => { setSearchOpen(false); createPage.mutate({ spaceId: spaces[1]?.id ?? -12, title: "Nova página" }); }} />}
    {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
    {settingsOpen && <SettingsModal theme={theme} toggleTheme={toggleTheme} settings={layout} onChange={setLayout} onClose={() => setSettingsOpen(false)} />}
    <Toaster position="bottom-right" richColors />
  </div>;
}

function Sidebar({ collapsed, user, workspace, spaces, pages, activeId, favorites, pinned, onToggle, onOpenPage, onCreatePage, onToggleFavorite, onOpenShortcuts, onOpenSettings, logo }: { collapsed: boolean; user: UserLike; workspace?: { name?: string; initials?: string; accentColor?: string } | null; spaces: Array<{ id: number; name: string; icon: string; color: string; isPersonal?: boolean }>; pages: PageItem[]; activeId: number; favorites: number[]; pinned: number[]; onToggle: () => void; onOpenPage: (id: number) => void; onCreatePage: () => void; onToggleFavorite: (id: number) => void; onOpenShortcuts: () => void; onOpenSettings: () => void; logo: string }) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ [-12]: true, [-13]: true, [-14]: false, [-15]: false, [-16]: false });
  return <aside className="sidebar">
    <div className="sidebar-head"><div className="workspace-switcher"><div className="workspace-avatar">{logo ? <img src={logo} alt="Logo do workspace" /> : workspace?.initials ?? "CS"}</div>{!collapsed && <div className="workspace-name"><strong>{workspace?.name ?? "Centrall Studio"}</strong><span>Espaço criativo <ChevronDown size={12} /></span></div>}</div><button className="icon-button subtle" onClick={onToggle} aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>{collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button></div>
    {!collapsed && <div className="sidebar-scroll">
      <button className="quick-search" onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}><Search size={15} /><span>Buscar em tudo</span><kbd>⌘ K</kbd></button>
      <nav className="side-nav"><SideNavItem icon={Inbox} label="Caixa de entrada" count="3" onClick={() => { onOpenPage(-101); toast.info("Sua caixa de entrada está no resumo do workspace."); }} /><SideNavItem icon={Clock3} label="Recentes" onClick={() => onOpenPage(-101)} /><SideNavItem icon={Pin} label="Fixados" onClick={() => pinned[0] ? onOpenPage(pinned[0]) : toast.info("Você ainda não fixou nenhuma página.")} /></nav>
      <div className="side-divider" />
      <div className="side-section"><div className="side-section-title"><span>ESPAÇOS</span><button className="plus-mini" onClick={onCreatePage}><Plus size={14} /></button></div>{spaces.map(space => { const SpaceIcon = iconBySpace[space.name] || BookOpen; const spacePages = pages.filter(page => page.spaceId === space.id && !page.parentId); const isOpen = expanded[space.id] ?? false; return <div className="space-group" key={space.id}><button className={`space-row ${spacePages.some(page => page.id === activeId) ? "active-parent" : ""}`} onClick={() => setExpanded(current => ({ ...current, [space.id]: !isOpen }))}><span className="tree-chevron">{spacePages.length ? (isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />) : <span />}</span><span className="space-icon" style={{ color: space.color }}><SpaceIcon size={15} /></span><span>{space.name}</span><span className="space-count">{spacePages.length || ""}</span></button>{isOpen && <div className="page-tree">{spacePages.map(page => <TreePage key={page.id} page={page} pages={pages} activeId={activeId} onOpenPage={onOpenPage} />)}</div>}</div>; })}</div>
      <div className="side-divider" />
      <div className="side-section"><div className="side-section-title"><span>ATALHOS</span></div><button className="side-link" onClick={onCreatePage}><FilePlus2 size={15} /><span>Nova página</span><kbd>⌘ N</kbd></button><button className="side-link" onClick={onOpenShortcuts}><Command size={15} /><span>Atalhos de teclado</span></button><button className="side-link" onClick={() => toast.info("A lixeira ficará disponível quando você arquivar uma página.")}><Archive size={15} /><span>Lixeira</span></button></div>
      {favorites.length > 0 && <div className="side-section"><div className="side-section-title"><span>FAVORITOS</span></div>{favorites.map(id => { const page = pages.find(item => item.id === id); return page ? <button className="side-link favorite-link" key={id} onClick={() => onOpenPage(id)}><span style={{ color: page.color }}>{page.icon}</span><span>{page.title}</span></button> : null; })}</div>}
    </div>}
    <div className="sidebar-footer"><div className="user-mini"><div className="user-avatar">{initials(user?.name)}</div>{!collapsed && <div><strong>{user?.name ?? "Marina Costa"}</strong><span>{user?.role === "admin" ? "Direção da agência" : "Membro do time"}</span></div>}</div>{!collapsed && <button className="icon-button subtle" onClick={onOpenSettings} aria-label="Abrir configurações"><Settings2 size={16} /></button>}</div>
  </aside>;
}

function SideNavItem({ icon: Icon, label, count, onClick }: { icon: LucideIcon; label: string; count?: string; onClick?: () => void }) { return <button className="side-link" onClick={onClick}><Icon size={15} /><span>{label}</span>{count && <b className="nav-count">{count}</b>}</button>; }

function TreePage({ page, pages, activeId, onOpenPage }: { page: PageItem; pages: PageItem[]; activeId: number; onOpenPage: (id: number) => void }) { const [open, setOpen] = useState(false); const children = pages.filter(item => item.parentId === page.id); const Icon = pageIcon[page.icon || "✎"] || FileText; return <div className="tree-item"><button className={`tree-page ${page.id === activeId ? "selected" : ""}`} onClick={() => onOpenPage(page.id)} onDoubleClick={() => setOpen(value => !value)}><span className="tree-chevron">{children.length ? (open ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <span />}</span><Icon size={14} style={{ color: page.color }} /><span>{page.title}</span></button>{open && children.map(child => <div className="tree-child" key={child.id}><TreePage page={child} pages={pages} activeId={activeId} onOpenPage={onOpenPage} /></div>)}</div>; }

function Topbar({ activePage, tabs, activeId, pinned, onOpenPage, onCloseTab, onCreatePage, onTogglePin, onSearch, onToggleSidebar, onToggleTheme, theme, onLogout, user }: { activePage?: PageItem; tabs: PageItem[]; activeId: number; pinned: number[]; onOpenPage: (id: number) => void; onCloseTab: (id: number) => void; onCreatePage: () => void; onTogglePin: (id: number) => void; onSearch: () => void; onToggleSidebar: () => void; onToggleTheme?: () => void; theme: string; onLogout: () => void; user: UserLike }) {
  return <header className="topbar"><div className="topbar-row"><button className="mobile-menu icon-button" onClick={onToggleSidebar}><Menu size={17} /></button><div className="tab-strip">{tabs.map(tab => <button key={tab.id} className={`tab ${tab.id === activeId ? "active" : ""}`} onClick={() => onOpenPage(tab.id)}><span className="tab-icon" style={{ color: tab.color }}>{tab.icon}</span><span>{tab.title}</span>{pinned.includes(tab.id) && <Pin size={11} fill="currentColor" />}{tabs.length > 1 && <span className="tab-close" onClick={event => { event.stopPropagation(); onCloseTab(tab.id); }}><X size={12} /></span>}</button>)}<button className="new-tab icon-button" onClick={onCreatePage} aria-label="Criar nova página"><Plus size={15} /></button></div><div className="topbar-actions"><button className="top-search" onClick={onSearch}><Search size={15} /><span>Buscar</span><kbd>⌘ K</kbd></button><button className="icon-button" onClick={onToggleTheme} aria-label="Alternar tema">{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button><button className="icon-button notification-button" onClick={() => toast.info("Você não tem novas notificações.")} aria-label="Notificações"><Bell size={16} /><i /></button><div className="profile-menu"><div className="user-avatar">{initials(user?.name)}</div><ChevronDown size={13} /><div className="profile-dropdown"><strong>{user?.name}</strong><span>{user?.email}</span><button onClick={onLogout}><LogOut size={14} /> Sair</button></div></div></div></div><div className="tab-context"><div className="context-title"><span className="context-icon" style={{ color: activePage?.color }}>{activePage?.icon}</span><strong>{activePage?.title || "Visão geral"}</strong></div><div className="context-actions"><span className="save-state"><span className="save-dot" /> Salvo agora</span><button className="icon-button" onClick={() => activePage && onTogglePin(activePage.id)}><Pin size={14} /></button><button className="icon-button" onClick={() => toast.info("Use Configurações para administrar o workspace.")} aria-label="Mais opções"><MoreHorizontal size={15} /></button></div></div></header>;
}

function HomeOverview({ user, stats, pages, onOpenPage, onOpenSettings }: { user: UserLike; onOpenSettings: () => void; stats?: { activeProjects?: number; openTasks?: number; pipelineValue?: string; completion?: number }; pages: PageItem[]; onOpenPage: (id: number) => void }) {
  const greeting = new Date().getHours() < 12 ? "Bom dia" : "Boa tarde";
  return <main className="home-content"><div className="welcome-row"><div><p className="eyebrow">QUARTA-FEIRA, 01 OUT 2026</p><h1>{greeting}, {user?.name?.split(" ")[0] ?? "Marina"} <span className="wave">✦</span></h1><p className="lead">Aqui está o pulso do seu estúdio. O trabalho importante, sem o ruído.</p></div><button className="primary-button" onClick={onOpenSettings}><Sparkles size={15} /> Personalizar Home</button></div><div className="signal-banner"><div className="signal-icon"><Zap size={17} /></div><div><strong>3 coisas precisam da sua atenção</strong><span>2 aprovações aguardam decisão · 1 prazo vence hoje</span></div><button className="text-button" onClick={() => toast.info("As aprovações e prazos aparecerão aqui conforme os módulos forem ativados.")}>Ver tudo <ArrowRight size={14} /></button></div><section className="metric-grid"><MetricCard label="Projetos ativos" value={String(stats?.activeProjects ?? 8)} detail="+2 neste mês" icon={FolderKanban} tone="purple" /><MetricCard label="Tarefas abertas" value={String(stats?.openTasks ?? 24)} detail="7 para esta semana" icon={CheckSquare} tone="blue" /><MetricCard label="Pipeline comercial" value={stats?.pipelineValue ?? "R$ 284k"} detail="+18,4% vs. mês anterior" icon={Target} tone="orange" /><MetricCard label="Ritmo do trimestre" value={`${stats?.completion ?? 72}%`} detail="4 pts acima da meta" icon={Gauge} tone="green" /></section><div className="home-grid"><section className="surface-card recent-card"><div className="card-heading"><div><p className="eyebrow">CONTINUE DE ONDE PAROU</p><h3>Recentes</h3></div><button className="icon-button" onClick={() => toast.info("Use a busca global para localizar qualquer página.")}><MoreHorizontal size={16} /></button></div><div className="recent-list">{pages.filter(page => page.id !== -101).slice(0, 5).map(page => <button className="recent-item" key={page.id} onClick={() => onOpenPage(page.id)}><span className="recent-icon" style={{ background: `${page.color}18`, color: page.color }}>{page.icon}</span><span className="recent-copy"><strong>{page.title}</strong><span>{page.excerpt}</span></span><span className="recent-time">{formatDate(page.updatedAt)}</span><ChevronRight size={14} /></button>)}</div><button className="card-link" onClick={() => toast.info("Você já está vendo os itens recentes do workspace.")}>Ver todos os recentes <ArrowRight size={14} /></button></section><section className="surface-card agenda-card"><div className="card-heading"><div><p className="eyebrow">SEU DIA</p><h3>Próximos passos</h3></div><button className="icon-button" onClick={() => toast.info("O calendário será conectado ao módulo de agenda.")} aria-label="Abrir calendário"><CalendarDays size={16} /></button></div><div className="agenda-list"><AgendaItem time="09:30" title="Daily de Operações" tag="Agora" tone="purple" /><AgendaItem time="11:00" title="Revisar proposta · Acme" tag="Comercial" tone="orange" /><AgendaItem time="14:30" title="Feedback com João" tag="Pessoas" tone="pink" /><AgendaItem time="16:00" title="Fechar orçamento Q4" tag="Financeiro" tone="green" /></div><button className="card-link" onClick={() => toast.info("O calendário será conectado ao módulo de agenda.")}>Abrir calendário <ArrowRight size={14} /></button></section></div><section className="surface-card activity-card"><div className="card-heading"><div><p className="eyebrow">SINAL DA EQUIPE</p><h3>O que mudou enquanto você esteve fora</h3></div><button className="text-button" onClick={() => toast.info("O histórico completo ficará disponível no módulo de atividade.")}>Ver atividade <ArrowRight size={14} /></button></div><div className="activity-list"><ActivityItem initials="LA" name="Lucas Almeida" action="moveu o projeto" target="Portal do cliente" detail="para Em andamento" color="#7C3AED" time="há 12 min" /><ActivityItem initials="MB" name="Marina Borges" action="comentou em" target="Playbook de vendas" detail="“Ajustei a etapa de diagnóstico.”" color="#D97706" time="há 34 min" /><ActivityItem initials="RC" name="Rafael Costa" action="concluiu" target="Briefing Q4" detail="em Projetos em andamento" color="#059669" time="há 1h" /></div></section></main>;
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: LucideIcon; tone: string }) { return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={17} /></div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className={`metric-detail ${tone}`}>{detail}</span></div>; }
function AgendaItem({ time, title, tag, tone }: { time: string; title: string; tag: string; tone: string }) { return <div className="agenda-item"><span className="agenda-time">{time}</span><span className={`agenda-line ${tone}`} /><div><strong>{title}</strong><span className={`tag ${tone}`}>{tag}</span></div></div>; }
function ActivityItem({ initials: avatar, name, action, target, detail, color, time }: { initials: string; name: string; action: string; target: string; detail: string; color: string; time: string }) { return <div className="activity-item"><div className="activity-avatar" style={{ background: `${color}18`, color }}>{avatar}</div><div className="activity-copy"><p><strong>{name}</strong> {action} <b>{target}</b></p><span>{detail}</span></div><time>{time}</time></div>; }

function PageEditor({ page, compact = false, onFavorite, isFavorite }: { page?: PageItem; compact?: boolean; onFavorite: () => void; isFavorite: boolean }) {
  const pageQuery = trpc.pages.get.useQuery({ id: page?.id ?? -101 }, { enabled: Boolean(page), staleTime: 60_000 });
  const utils = trpc.useUtils();
  const update = trpc.pages.update.useMutation({ onSuccess: () => { void utils.workspace.summary.invalidate(); void utils.pages.get.invalidate({ id: page?.id ?? -101 }); toast.success("Alterações salvas", { duration: 1600 }); }, onError: error => toast.error(error.message) });
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState(page?.title || "");
  const [editingTitle, setEditingTitle] = useState(false);
  useEffect(() => { const content = (pageQuery.data as { content?: Block[] } | undefined)?.content; if (content) setBlocks(content); if (page?.title) setTitle(page.title); }, [pageQuery.data, page?.title]);
  const updateBlock = (id: string, content: string) => setBlocks(current => current.map(block => block.id === id ? { ...block, content } : block));
  const save = () => { if (page) update.mutate({ id: page.id, title: title.trim() || page.title, content: blocks }); };
  const sharePage = async () => { try { await navigator.clipboard?.writeText(window.location.href); toast.success("Link da página copiado"); } catch { toast.info("Copie o endereço desta página para compartilhar."); } };
  const addBlock = (type = "paragraph") => setBlocks(current => [...current, { id: `${Date.now()}`, type, content: type === "heading" ? "Novo título" : "Comece a escrever…" }]);
  if (!page) return <div className="empty-state"><FileText size={28} /><h3>Selecione uma página</h3></div>;
  return <article className={`editor-panel ${compact ? "compact-editor" : ""}`}><div className="editor-toolbar"><div className="editor-actions"><button className="icon-button" onClick={onFavorite} title="Favoritar">{isFavorite ? <Pin size={15} fill="currentColor" /> : <Pin size={15} />}</button><span className="toolbar-separator" /><button className="editor-tool" onClick={sharePage}><Share2 size={14} /> Compartilhar</button><button className="editor-tool" onClick={() => toast.info("Convide pessoas pelas configurações de equipe.")}><Users size={14} /> 4 pessoas</button></div><div className="editor-actions"><span className="save-state"><span className="save-dot" /> {update.isPending ? "Salvando…" : "Salvo agora"}</span><button className="icon-button" onClick={save}><Check size={15} /></button><button className="icon-button" onClick={() => toast.info("Use Salvar para persistir as alterações desta página.")} aria-label="Mais opções da página"><MoreHorizontal size={16} /></button></div></div><div className="editor-body"><div className="page-title-row"><span className="page-large-icon" style={{ color: page.color, background: `${page.color}14` }}>{page.icon}</span>{editingTitle ? <input className="title-input title-edit-input" autoFocus value={title} onChange={event => setTitle(event.target.value)} onBlur={() => { setEditingTitle(false); save(); }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); setEditingTitle(false); save(); } }} /> : <button className="title-input" onClick={() => setEditingTitle(true)} title="Clique para editar o título">{title || page.title}</button>}</div><div className="page-meta"><span>Atualizado {formatDate(page.updatedAt)}</span><span>·</span><span>Você e mais 3 pessoas</span></div><div className="blocks">{blocks.map(block => <BlockEditor key={block.id} block={block} onChange={content => updateBlock(block.id, content)} onToggle={() => setBlocks(current => current.map(item => item.id === block.id ? { ...item, checked: !item.checked } : item))} />)}<div className="block-add-row"><button onClick={() => addBlock("paragraph")}><Plus size={14} /> Adicionar bloco</button><button onClick={() => addBlock("heading")}><Hash size={14} /> Título</button><button onClick={() => addBlock("callout")}><Sparkles size={14} /> Callout</button></div></div></div></article>;
}

function BlockEditor({ block, onChange, onToggle }: { block: Block; onChange: (value: string) => void; onToggle: () => void }) {
  if (block.type === "heading") return <div className="block heading-block"><input value={block.content || ""} onChange={event => onChange(event.target.value)} placeholder="Título" /></div>;
  if (block.type === "callout") return <div className="block callout-block"><Sparkles size={17} /><textarea value={block.content || ""} onChange={event => onChange(event.target.value)} rows={2} /></div>;
  if (block.type === "checklist") return <label className="block checklist-block"><input type="checkbox" checked={Boolean(block.checked)} onChange={onToggle} /><span className={block.checked ? "checked" : ""}>{block.content || "Tarefa"}</span></label>;
  if (block.type === "quote") return <div className="block quote-block"><span>“</span><textarea value={block.content || ""} onChange={event => onChange(event.target.value)} rows={2} /></div>;
  return <div className="block paragraph-block"><span className="block-handle">⋮⋮</span><textarea value={block.content || ""} onChange={event => onChange(event.target.value)} rows={Math.max(1, Math.ceil((block.content || "").length / 78))} placeholder="Digite / para inserir um bloco" /></div>;
}

function CommandPalette({ pages, spaces, onClose, onOpenPage, onCreatePage }: { pages: PageItem[]; spaces: Array<{ id: number; name: string }>; onClose: () => void; onOpenPage: (id: number) => void; onCreatePage: () => void }) {
  const [term, setTerm] = useState("");
  const results = useMemo(() => pages.filter(page => `${page.title} ${page.excerpt}`.toLowerCase().includes(term.toLowerCase())).slice(0, 8), [pages, term]);
  return <div className="overlay" onMouseDown={onClose}><div className="command-palette" onMouseDown={event => event.stopPropagation()}><div className="command-input"><Search size={18} /><input autoFocus value={term} onChange={event => setTerm(event.target.value)} placeholder="Buscar páginas, tarefas e pessoas…" /><kbd>ESC</kbd></div><div className="command-body">{!term && <><p className="command-label">AÇÕES RÁPIDAS</p><button className="command-row" onClick={onCreatePage}><span className="command-icon accent"><Plus size={15} /></span><span><strong>Criar uma nova página</strong><small>Comece com uma página em branco</small></span><ArrowRight size={15} /></button><button className="command-row" onClick={() => { toast.info("As tarefas estarão disponíveis no módulo de operações."); onClose(); }}><span className="command-icon"><ListTodo size={15} /></span><span><strong>Ver minhas tarefas</strong><small>24 itens abertos</small></span><ArrowRight size={15} /></button><p className="command-label">RECENTES</p></>}{term && <p className="command-label">RESULTADOS PARA “{term.toUpperCase()}”</p>}{results.map(page => <button className="command-row" key={page.id} onClick={() => { onOpenPage(page.id); onClose(); }}><span className="command-icon" style={{ color: page.color }}>{page.icon}</span><span><strong>{page.title}</strong><small>{spaces.find(space => space.id === page.spaceId)?.name ?? "Workspace"} · {page.type === "database" ? "Banco de dados" : "Página"}</small></span><ChevronRight size={15} /></button>)}{term && !results.length && <div className="command-empty"><Search size={20} /><strong>Nenhum resultado</strong><span>Tente buscar por outro termo.</span></div>}</div><div className="command-footer"><span><kbd>↑↓</kbd> navegar</span><span><kbd>↵</kbd> abrir</span><span><kbd>esc</kbd> fechar</span></div></div></div>;
}

function ShortcutsModal({ onClose }: { onClose: () => void }) { const shortcuts = [["⌘ K", "Abrir busca global"], ["⌘ N", "Criar uma nova página"], ["⌘ ", "Alternar split view"], ["Esc", "Fechar painel ou modal"], ["/", "Inserir bloco no editor"]]; return <div className="overlay" onMouseDown={onClose}><div className="shortcuts-modal" onMouseDown={event => event.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">CENTRALL SHORTCUTS</p><h3>Atalhos que deixam tudo mais rápido</h3></div><button className="icon-button" onClick={onClose}><X size={16} /></button></div>{shortcuts.map(([key, label]) => <div className="shortcut-row" key={label}><span>{label}</span><kbd>{key}</kbd></div>)}</div></div>; }

function SettingsModal({ theme, toggleTheme, settings, onChange, onClose }: { theme: "light" | "dark"; toggleTheme?: () => void; settings: LayoutSettings; onChange: (settings: LayoutSettings) => void; onClose: () => void }) {
  const fontOptions = [{ label: "Manrope", value: "'Manrope', ui-sans-serif, system-ui, sans-serif" }, { label: "Inter", value: "Inter, ui-sans-serif, system-ui, sans-serif" }, { label: "DM Sans", value: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }, { label: "Sistema", value: "ui-sans-serif, system-ui, sans-serif" }];
  const presetColors = ["#0E7490", "#7C3AED", "#DB2777", "#D97706", "#059669", "#2563EB"];
  const uploadLogo = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 2_000_000) { toast.error("A logo precisa ter no máximo 2 MB."); return; } const reader = new FileReader(); reader.onload = () => onChange({ ...settings, logo: String(reader.result) }); reader.readAsDataURL(file); };
  return <div className="overlay settings-overlay" onMouseDown={onClose}><div className="settings-modal" onMouseDown={event => event.stopPropagation()}><div className="settings-sidebar"><div className="settings-title"><div className="brand-mark small"><span>⌁</span></div><div><strong>Configurações</strong><span>Personalize seu Centrall</span></div></div><button className="settings-nav active"><Settings2 size={15} /> Layout</button><button className="settings-nav" onClick={() => toast.info("A gestão de equipe será liberada nesta mesma área.")}><Users size={15} /> Equipe e permissões</button><button className="settings-nav" onClick={() => toast.info("As preferências de notificação serão liberadas nesta mesma área.")}><Bell size={15} /> Notificações</button><button className="settings-nav" onClick={() => toast.info("A segurança da sessão já está ativa: cookie httpOnly, Secure e SameSite=None.")}><ShieldIcon /> Segurança</button></div><div className="settings-content"><div className="settings-content-head"><div><p className="eyebrow">IDENTIDADE DO WORKSPACE</p><h3>Layout e marca</h3><p>Deixe o espaço com a cara da sua agência.</p></div><button className="icon-button" onClick={onClose}><X size={17} /></button></div><div className="settings-section"><div className="settings-section-title"><div><strong>Backup dos dados</strong><span>Seus dados ficam só neste aparelho. Baixe um backup com frequência.</span></div></div><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button type="button" className="editor-tool" onClick={async () => { try { await exportBackup(); toast.success("Backup baixado"); } catch (error) { toast.error((error as Error).message); } }}>Exportar backup</button><label className="editor-tool" style={{ cursor: "pointer" }}>Importar backup<input type="file" accept="application/json,.json" style={{ display: "none" }} onChange={async event => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; if (!window.confirm("Importar vai SUBSTITUIR todos os dados deste aparelho pelos do arquivo. Continuar?")) return; try { await importBackup(file); toast.success("Backup restaurado"); setTimeout(() => window.location.reload(), 700); } catch (error) { toast.error((error as Error).message); } }} /></label></div></div><div className="settings-section"><div className="settings-section-title"><div><strong>Tema da interface</strong><span>Escolha o clima para trabalhar.</span></div></div><div className="theme-picker"><button className={theme === "light" ? "selected" : ""} onClick={() => theme === "dark" && toggleTheme?.()}><Sun size={16} /><span>Claro</span><small>Leve e luminoso</small></button><button className={theme === "dark" ? "selected" : ""} onClick={() => theme === "light" && toggleTheme?.()}><Moon size={16} /><span>Escuro</span><small>Foco com menos brilho</small></button></div></div><div className="settings-section"><div className="settings-section-title"><div><strong>Cor principal</strong><span>Usada em ações, links e estados ativos.</span></div><span className="color-value" style={{ background: settings.accent }}>{settings.accent}</span></div><div className="color-row">{presetColors.map(color => <button key={color} className={`color-swatch ${settings.accent === color ? "selected" : ""}`} style={{ background: color }} onClick={() => onChange({ ...settings, accent: color })} aria-label={`Escolher cor ${color}`} />)}<label className="custom-color"><input type="color" value={settings.accent} onChange={event => onChange({ ...settings, accent: event.target.value })} /><Plus size={14} /></label></div></div><div className="settings-grid"><div className="settings-section compact"><div className="settings-section-title"><div><strong>Cor secundária</strong><span>Tags, alertas e destaques.</span></div></div><label className="color-input-row"><input type="color" value={settings.secondary} onChange={event => onChange({ ...settings, secondary: event.target.value })} /><span>{settings.secondary}</span></label></div><div className="settings-section compact"><div className="settings-section-title"><div><strong>Tipografia</strong><span>Escolha a voz visual da agência.</span></div></div><select className="font-select" value={settings.font} onChange={event => onChange({ ...settings, font: event.target.value })}>{fontOptions.map(option => <option value={option.value} key={option.label}>{option.label}</option>)}</select></div></div><div className="settings-section logo-section"><div className="settings-section-title"><div><strong>Logo da marca</strong><span>PNG, JPG ou SVG · até 2 MB</span></div></div><div className="logo-upload"><div className="logo-preview">{settings.logo ? <img src={settings.logo} alt="Prévia da logo" /> : <ImageIcon size={22} />}</div><div><label className="upload-button"><ImageIcon size={14} /> Adicionar logo<input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={uploadLogo} /></label>{settings.logo && <button className="remove-logo" onClick={() => onChange({ ...settings, logo: "" })}>Remover logo</button>}</div></div></div><div className="settings-footer"><span><Check size={14} /> Alterações salvas automaticamente</span><button className="primary-button" onClick={onClose}>Concluir</button></div></div></div></div>;
}

function ShieldIcon() { return <span className="settings-shield">✓</span>; }

export default App;
