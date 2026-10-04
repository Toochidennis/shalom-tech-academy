import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  Eye,
  FilePlus2,
  ImagePlus,
  Images,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Newspaper,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { apiRequest, assetUrl } from '../data/api';
import './admin.css';

const nav = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/news', label: 'News & notices', icon: Newspaper },
  { path: '/admin/campus-life', label: 'Campus life', icon: Images },
  { path: '/admin/admissions', label: 'Admissions', icon: Settings },
  { path: '/admin/password', label: 'Account security', icon: ShieldCheck },
];

function dateLabel(value) {
  if (!value) return 'Not published';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not published' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function newsPublicationWarning(post) {
  const text = [post.title, post.category, post.summary, post.body].filter(Boolean).join('\n');
  const hasLongToken = /(?<![\p{L}\p{N}])[A-Za-z0-9_-]{40,}(?![\p{L}\p{N}])/u.test(text);
  const hasLabeledSecret = /\b(?:password|passcode|secret|api[_ -]?key|access[_ -]?token)\s*[:=]\s*\S+/i.test(text);
  return hasLongToken || hasLabeledSecret
    ? 'This update contains a long unbroken value or credential-like text. Remove or replace it before publishing.'
    : '';
}

function AdminShell({ children, path, navigate, hrefFor, session, onLogout, notice, onDismissNotice }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const title = path.includes('/news') ? (path.endsWith('/new') || path.endsWith('/edit') ? 'News editor' : 'News & notices')
    : path.includes('/campus-life') ? (path.endsWith('/new') || path.endsWith('/edit') ? 'Campus tile editor' : 'Campus life')
      : path.includes('/admissions') ? 'Admissions'
      : path.includes('/password') ? 'Account security' : 'Overview';
  return (
    <div className="admin-shell">
      <aside className={menuOpen ? 'admin-sidebar is-open' : 'admin-sidebar'}>
        <div className="admin-brand">
          <span className="admin-brand-mark"><BookOpen size={20} /></span>
          <span><strong>SSTBAC</strong><small>School website</small></span>
          <button className="admin-mobile-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>
        <p className="admin-nav-label">MANAGE</p>
        <nav className="admin-nav">
          {nav.map(({ path: target, label, icon: Icon }) => (
            <button key={target} className={path === target || (target === '/admin/news' && path.startsWith('/admin/news/')) || (target === '/admin/campus-life' && path.startsWith('/admin/campus-life/')) ? 'active' : ''} type="button" onClick={() => { navigate(target); setMenuOpen(false); }}>
              <Icon size={18} /><span>{label}</span>{target === path && <ChevronRight size={15} />}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-user-chip"><span className="admin-avatar">{(session.username || 'A').slice(0, 1).toUpperCase()}</span><span><strong>{session.username}</strong><small>Administrator</small></span></div>
          <button type="button" className="admin-logout" onClick={onLogout}><LogOut size={17} />Sign out</button>
        </div>
      </aside>
      {menuOpen && <button className="admin-scrim" aria-label="Close menu" type="button" onClick={() => setMenuOpen(false)} />}
      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="admin-menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
          <div><span className="admin-breadcrumb">Administration</span><ChevronRight size={14} /><strong>{title}</strong></div>
          <a href={hrefFor('/')} className="admin-view-site" target="_blank" rel="noreferrer">View website <ArrowUpRight size={15} /></a>
        </header>
        <main className="admin-content">
          {notice && <div className={'admin-toast ' + notice.type} role="status"><CircleCheck size={18} /><span>{notice.message}</span><button type="button" onClick={onDismissNotice} aria-label="Dismiss"><X size={16} /></button></div>}
          {children}
        </main>
      </div>
    </div>
  );
}

function Login({ csrf, initialized, onLogin, hrefFor }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onLogin(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card">
        <a className="admin-auth-brand" href={hrefFor('/')}><span><BookOpen size={22} /></span><div><strong>Shalom Academy</strong><small>Website administration</small></div></a>
        <div className="admin-auth-heading"><span className="admin-auth-icon"><LockKeyhole size={23} /></span><p>WELCOME BACK</p><h1>Sign in to your workspace</h1><span>Manage school news and admissions information.</span></div>
        {!initialized && <div className="admin-inline-warning">Admin access has not been set up on this server yet. Ask the site administrator to run the one-time setup command.</div>}
        {error && <div className="admin-form-error" role="alert">{error}</div>}
        <form onSubmit={submit} className="admin-form">
          <label>Username<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required autoFocus /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <button className="admin-primary-button" disabled={busy || !initialized}>{busy ? 'Signing in…' : 'Sign in'}<ArrowRight size={17} /></button>
        </form>
        <p className="admin-auth-footnote"><ShieldCheck size={15} />Protected access for authorised school staff</p>
      </section>
      <p className="admin-auth-copyright">© {new Date().getFullYear()} SSTBAC · School website</p>
    </main>
  );
}

function PasswordForm({ forced, csrf, onChanged }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError('');
    if (next !== confirm) { setError('The new passwords do not match.'); return; }
    if (next.length < 12) { setError('Use at least 12 characters for your new password.'); return; }
    setBusy(true);
    try {
      const result = await apiRequest('admin/password', {
        method: 'POST', csrf, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      onChanged(result.csrf);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="admin-panel admin-password-panel">
      <div className="admin-panel-heading"><span className="admin-panel-icon"><ShieldCheck size={21} /></span><div><h2>{forced ? 'Set a new password' : 'Change your password'}</h2><p>{forced ? 'Your one-time sign-in password must be replaced before you can manage the site.' : 'Choose a strong password that is unique to this administrator account.'}</p></div></div>
      {error && <div className="admin-form-error" role="alert">{error}</div>}
      <form className="admin-form admin-password-form" onSubmit={submit}>
        <label>Current password<input type="password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} required /></label>
        <label>New password<input type="password" autoComplete="new-password" minLength={12} value={next} onChange={(event) => setNext(event.target.value)} required /><small>At least 12 characters.</small></label>
        <label>Confirm new password<input type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></label>
        <div className="admin-form-actions"><button className="admin-primary-button" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}<ArrowRight size={17} /></button></div>
      </form>
    </section>
  );
}

function Dashboard({ navigate }) {
  const [posts, setPosts] = useState([]);
  const [admissions, setAdmissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([apiRequest('admin/news'), apiRequest('admin/admissions')])
      .then(([news, settings]) => { if (active) { setPosts(news.items || []); setAdmissions(settings); } })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const published = posts.filter((post) => post.published && !newsPublicationWarning(post)).length;
  const draftsAndReview = posts.length - published;
  return (
    <>
      <div className="admin-page-heading"><div><span className="admin-eyebrow">YOUR SCHOOL, AT A GLANCE</span><h1>Good morning.</h1><p>Here’s what’s happening on the SSTBAC website.</p></div><button className="admin-primary-button" type="button" onClick={() => navigate('/admin/news/new')}><Plus size={17} />Write an update</button></div>
      <div className="admin-stat-grid">
        <article className="admin-stat-card"><span className="admin-stat-icon blue"><Newspaper size={19} /></span><small>Published updates</small><strong>{loading ? '—' : published}</strong><span className="admin-stat-caption">Visible on the website</span></article>
        <article className="admin-stat-card"><span className="admin-stat-icon green"><FilePlus2 size={19} /></span><small>Drafts &amp; review</small><strong>{loading ? '—' : draftsAndReview}</strong><span className="admin-stat-caption">Drafts and withheld updates</span></article>
        <article className="admin-stat-card"><span className="admin-stat-icon amber"><BookOpen size={19} /></span><small>Admissions</small><strong>{admissions ? (admissions.open ? 'Open' : 'Closed') : '—'}</strong><span className="admin-stat-caption">{admissions ? admissions.session + ' session' : 'Current status'}</span></article>
      </div>
      {error && <div className="admin-form-error" role="alert">{error}</div>}
      <section className="admin-panel admin-recent-panel">
        <div className="admin-panel-title"><div><h2>Recent news & notices</h2><p>Your latest saved website updates.</p></div><button className="admin-text-button" type="button" onClick={() => navigate('/admin/news')}>All updates <ArrowRight size={16} /></button></div>
        {loading ? <div className="admin-loading">Loading your updates…</div> : posts.length === 0 ? <div className="admin-empty"><span><Newspaper size={23} /></span><h3>No news updates yet</h3><p>Publish your first school announcement to share it with families.</p><button className="admin-secondary-button" type="button" onClick={() => navigate('/admin/news/new')}><Plus size={16} />Create an update</button></div> : (
          <div className="admin-recent-list">{posts.slice(0, 5).map((post) => {
            const warning = newsPublicationWarning(post);
            const status = !post.published ? 'draft' : warning ? 'review' : 'published';
            return <button type="button" key={post.id} className="admin-recent-row" onClick={() => navigate('/admin/news/' + post.id + '/edit')}><span className="admin-recent-thumb">{post.image ? <img src={assetUrl(post.image)} alt="" /> : <Newspaper size={19} />}</span><span className="admin-recent-copy"><strong>{post.title}</strong><small>{post.category} · {dateLabel(post.updated_at)}</small></span><span className={'admin-status ' + status}>{status === 'review' ? 'Needs review' : post.published ? 'Published' : 'Draft'}</span><ChevronRight size={17} /></button>;
          })}</div>
        )}
      </section>
      <section className="admin-tip"><span><Check size={18} /></span><div><strong>Keep school information current</strong><p>Admissions session and open/closed status appear on your public homepage and admissions page.</p></div><button type="button" onClick={() => navigate('/admin/admissions')}>Review settings <ArrowRight size={15} /></button></section>
    </>
  );
}

function NewsManager({ navigate, setNotice }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  async function load() {
    setLoading(true);
    try { const result = await apiRequest('admin/news'); setPosts(result.items || []); setError(''); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => posts.filter((post) => {
    const warning = newsPublicationWarning(post);
    const matchesFilter = filter === 'all'
      || (filter === 'published' && post.published && !warning)
      || (filter === 'review' && post.published && !!warning)
      || (filter === 'draft' && !post.published);
    return matchesFilter && (post.title + ' ' + post.category + ' ' + post.summary).toLowerCase().includes(search.toLowerCase());
  }), [posts, filter, search]);
  async function remove(post) {
    if (!window.confirm('Delete “' + post.title + '”? This cannot be undone.')) return;
    try {
      const { csrf } = await apiRequest('admin/session');
      await apiRequest('admin/news/' + post.id, { method: 'DELETE', csrf });
      setPosts((items) => items.filter((item) => item.id !== post.id));
      setNotice({ type: 'success', message: 'News update deleted.' });
    } catch (err) { setError(err.message); }
  }
  return (
    <>
      <div className="admin-page-heading"><div><span className="admin-eyebrow">PUBLISHING</span><h1>News & notices</h1><p>Create school updates that families can read on the public website.</p></div><button className="admin-primary-button" type="button" onClick={() => navigate('/admin/news/new')}><Plus size={17} />New update</button></div>
      <section className="admin-panel admin-news-panel">
        <div className="admin-news-toolbar">
          <div className="admin-tabs"><button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All <span>{posts.length}</span></button><button type="button" className={filter === 'published' ? 'active' : ''} onClick={() => setFilter('published')}>Published <span>{posts.filter((post) => post.published && !newsPublicationWarning(post)).length}</span></button><button type="button" className={filter === 'review' ? 'active' : ''} onClick={() => setFilter('review')}>Needs review <span>{posts.filter((post) => post.published && newsPublicationWarning(post)).length}</span></button><button type="button" className={filter === 'draft' ? 'active' : ''} onClick={() => setFilter('draft')}>Drafts <span>{posts.filter((post) => !post.published).length}</span></button></div>
          <label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search updates" aria-label="Search updates" /></label>
        </div>
        {error && <div className="admin-form-error" role="alert">{error}</div>}
        {loading ? <div className="admin-loading">Loading news updates…</div> : filtered.length === 0 ? <div className="admin-empty"><span><Search size={22} /></span><h3>{posts.length ? 'No matching updates' : 'Your news space is ready'}</h3><p>{posts.length ? 'Try another search or filter.' : 'Create an update as a draft or publish it straight to the website.'}</p>{!posts.length && <button className="admin-secondary-button" type="button" onClick={() => navigate('/admin/news/new')}><Plus size={16} />Create an update</button>}</div> : (
          <div className="admin-news-list">{filtered.map((post) => {
            const warning = newsPublicationWarning(post);
            const status = !post.published ? 'draft' : warning ? 'review' : 'published';
            return <article className="admin-news-row" key={post.id}><div className="admin-news-image">{post.image ? <img src={assetUrl(post.image)} alt="" /> : <Newspaper size={20} />}</div><div className="admin-news-info"><div className="admin-news-meta"><span>{post.category}</span><i>·</i><span>{dateLabel(post.updated_at)}</span></div><h3>{post.title}</h3><p>{warning ? 'Sensitive-looking text is withheld. Edit this update to review it.' : post.summary}</p></div><span className={'admin-status ' + status}>{status === 'review' ? 'Needs review' : post.published ? <><CircleCheck size={13} />Published</> : <><Clock3 size={13} />Draft</>}</span><div className="admin-row-actions"><button type="button" aria-label={'Edit ' + post.title} onClick={() => navigate('/admin/news/' + post.id + '/edit')}><Pencil size={16} /></button><button type="button" aria-label={'Delete ' + post.title} onClick={() => remove(post)}><Trash2 size={16} /></button></div></article>;
          })}</div>
        )}
      </section>
    </>
  );
}

function NewsEditor({ path, navigate, csrf, setNotice }) {
  const isNew = path.endsWith('/new');
  const id = isNew ? null : path.split('/')[3];
  const [form, setForm] = useState({ title: '', category: 'School notice', summary: '', body: '', published: false, image: null });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const publicationWarning = newsPublicationWarning(form);
  useEffect(() => {
    if (isNew) return;
    let active = true;
    apiRequest('admin/news').then(({ items }) => {
      const item = items.find((post) => post.id === id);
      if (!item) throw new Error('This news update could not be found.');
      if (active) setForm(item);
    }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, isNew]);
  useEffect(() => {
    if (!file) { setPreview(''); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function setField(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event) {
    event.preventDefault();
    if (form.published && publicationWarning) {
      setError(publicationWarning + ' Save it as a draft while you correct the text.');
      return;
    }
    setError('');
    setSaving(true);
    const body = new FormData();
    ['title', 'category', 'summary', 'body'].forEach((key) => body.set(key, form[key] || ''));
    body.set('published', form.published ? 'true' : 'false');
    if (file) body.set('image', file);
    try {
      await apiRequest(isNew ? 'admin/news' : 'admin/news/' + id, { method: 'POST', body, csrf });
      setNotice({ type: 'success', message: form.published ? 'Your update has been published.' : 'Your draft has been saved.' });
      navigate('/admin/news');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  if (loading) return <div className="admin-loading admin-editor-loading">Loading update…</div>;
  return (
    <>
      <div className="admin-page-heading admin-editor-heading"><div><button className="admin-back-link" type="button" onClick={() => navigate('/admin/news')}><ArrowDownRight size={15} />All news & notices</button><h1>{isNew ? 'Write an update' : 'Edit update'}</h1><p>Clear, helpful information helps families stay connected to school.</p></div><button className="admin-secondary-button" type="button" onClick={() => setPreviewOpen(true)}><Eye size={16} />Preview</button></div>
      {error && <div className="admin-form-error" role="alert">{error}</div>}
      <form className="admin-editor-grid" onSubmit={submit}>
        {publicationWarning && <div className="admin-inline-warning admin-publication-warning" role="status"><strong>{form.published ? 'Needs review — this update is hidden from the public site.' : 'Review before publishing.'}</strong> {publicationWarning}</div>}
        <div className="admin-panel admin-editor-form">
          <label>Headline<input maxLength={140} value={form.title || ''} onChange={(event) => setField('title', event.target.value)} placeholder="Give your update a clear title" required /></label>
          <label>Category<input maxLength={50} value={form.category || ''} onChange={(event) => setField('category', event.target.value)} placeholder="e.g. School notice, Admissions, Campus life" required /></label>
          <label>Short summary<textarea maxLength={280} rows={3} value={form.summary || ''} onChange={(event) => setField('summary', event.target.value)} placeholder="Write one or two clear sentences for the news card" required /><small>Keep it concise; long summaries are shortened on cards. {(form.summary || '').length}/280 characters</small></label>
          <label>Full article <span className="admin-optional">Optional</span><textarea maxLength={12000} rows={9} value={form.body || ''} onChange={(event) => setField('body', event.target.value)} placeholder="Add the full notice or story. Plain text only." /><small>Plain text only. Line breaks are preserved.</small></label>
        </div>
        <aside className="admin-editor-side">
        <section className="admin-panel admin-publish-panel"><h2>Publishing</h2>{form.published && publicationWarning && <div className="admin-review-state"><Clock3 size={14} /><span><strong>Needs review</strong><small>Currently hidden from the public website</small></span></div>}<label className="admin-publish-toggle"><input type="checkbox" checked={!!form.published} onChange={(event) => setField('published', event.target.checked)} /><span className="admin-toggle-track" /><span><strong>{form.published && publicationWarning ? 'Publish after corrections' : form.published ? 'Published' : 'Save as draft'}</strong><small>{form.published && publicationWarning ? 'Correct the flagged text first, or uncheck to save as a draft.' : form.published ? 'Visible to everyone on the website' : 'Only administrators can see this update'}</small></span></label><div className="admin-publish-date"><Clock3 size={15} />{form.published && publicationWarning ? 'Not visible on the public site pending review' : form.published ? (isNew ? 'Publishes when saved' : 'Last published ' + dateLabel(form.published_at)) : 'Not visible on the public site'}</div></section>
          <section className="admin-panel admin-image-panel"><div className="admin-image-heading"><h2>Featured image</h2><span>Optional</span></div><p>Add a photo to make this update stand out.</p><label className="admin-image-drop">{preview || form.image ? <img src={preview || assetUrl(form.image)} alt="Selected featured image" /> : <span className="admin-image-placeholder"><ImagePlus size={24} /><strong>Choose an image</strong><small>JPEG, PNG or WebP · max 5 MB</small></span>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>{file && <button className="admin-remove-file" type="button" onClick={() => setFile(null)}><X size={14} />Remove selected image</button>}</section>
          <div className="admin-editor-actions"><button className="admin-secondary-button" type="button" onClick={() => navigate('/admin/news')}>Cancel</button><button className="admin-primary-button" disabled={saving || (form.published && !!publicationWarning)}>{saving ? 'Saving…' : form.published ? 'Publish update' : 'Save draft'}<Save size={16} /></button></div>
        </aside>
      </form>
      {previewOpen && <div className="admin-modal-backdrop" onMouseDown={() => setPreviewOpen(false)}><section className="admin-preview-modal" role="dialog" aria-modal="true" aria-labelledby="news-preview-title" onMouseDown={(event) => event.stopPropagation()}><header><span><Eye size={16} />Preview · not yet public</span><button type="button" onClick={() => setPreviewOpen(false)} aria-label="Close preview"><X size={19} /></button></header>{(preview || form.image) && <img className="admin-preview-image" src={preview || assetUrl(form.image)} alt="" />}<div className="admin-preview-copy"><span className="admin-preview-category">{form.category || 'News & notices'}</span><h2 id="news-preview-title">{form.title || 'Your headline will appear here'}</h2><p className="admin-preview-summary">{form.summary || 'Your short summary will appear here as you write it.'}</p>{form.body && <p className="admin-preview-body">{form.body}</p>}<small>Shalom Science &amp; Technology Basic Academy</small></div></section></div>}
    </>
  );
}

function CampusLifeManager({ navigate, setNotice }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    apiRequest('admin/campus-life').then(({ items: result }) => {
      if (active) setItems(result || []);
    }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= items.length || savingOrder) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setSavingOrder(true);
    setError('');
    try {
      const { csrf } = await apiRequest('admin/session');
      await apiRequest('admin/campus-life/reorder', {
        method: 'POST', csrf, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((item) => item.id) }),
      });
      setItems(next);
      setNotice({ type: 'success', message: 'Campus gallery order updated.' });
    } catch (err) { setError(err.message); }
    finally { setSavingOrder(false); }
  }

  async function remove(item) {
    if (!window.confirm('Delete “' + item.title + '”? This removes its saved image too.')) return;
    try {
      const { csrf } = await apiRequest('admin/session');
      await apiRequest('admin/campus-life/' + item.id, { method: 'DELETE', csrf });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setNotice({ type: 'success', message: 'Campus gallery tile deleted.' });
    } catch (err) { setError(err.message); }
  }

  return <>
    <div className="admin-page-heading"><div><span className="admin-eyebrow">PUBLIC WEBSITE CONTENT</span><h1>Campus life</h1><p>Manage the gallery photos and the caption shown over each one.</p></div><button className="admin-primary-button" type="button" onClick={() => navigate('/admin/campus-life/new')}><Plus size={17} />Add a moment</button></div>
    {error && <div className="admin-form-error" role="alert">{error}</div>}
    <section className="admin-panel admin-campus-panel">
      <div className="admin-panel-title"><div><h2>Campus gallery</h2><p>Move tiles to change their order on the homepage and Campus Life page.</p></div><span className="admin-campus-count">{items.filter((item) => item.published).length} published</span></div>
      {loading ? <div className="admin-loading">Loading campus gallery…</div> : items.length === 0 ? <div className="admin-empty"><span><Images size={23} /></span><h3>Your campus gallery is ready</h3><p>Add a photo and caption to create the first gallery moment.</p><button className="admin-secondary-button" type="button" onClick={() => navigate('/admin/campus-life/new')}><Plus size={16} />Add a campus moment</button></div> : <div className="admin-campus-list">{items.map((item, index) => <article className="admin-campus-row" key={item.id}>
        <div className="admin-campus-thumb">{item.image ? <img src={assetUrl(item.image)} alt={item.alt_text || ''} /> : <Images size={20} />}</div>
        <div className="admin-campus-info"><div className="admin-campus-meta"><span>{item.eyebrow || 'Campus life'}</span><span>·</span><span>{item.size || 'standard'} layout</span></div><h3>{item.title}</h3><p>{item.description}</p></div>
        <span className={'admin-status ' + (item.published ? 'published' : 'draft')}>{item.published ? <><CircleCheck size={13} />Published</> : <><Clock3 size={13} />Draft</>}</span>
        <div className="admin-campus-actions"><div className="admin-order-buttons"><button type="button" disabled={index === 0 || savingOrder} aria-label={'Move ' + item.title + ' up'} onClick={() => move(index, -1)}><ArrowUp size={15} /></button><button type="button" disabled={index === items.length - 1 || savingOrder} aria-label={'Move ' + item.title + ' down'} onClick={() => move(index, 1)}><ArrowDown size={15} /></button></div><button type="button" aria-label={'Edit ' + item.title} onClick={() => navigate('/admin/campus-life/' + item.id + '/edit')}><Pencil size={15} /></button><button type="button" aria-label={'Delete ' + item.title} onClick={() => remove(item)}><Trash2 size={15} /></button></div>
      </article>)}</div>}
    </section>
  </>;
}

function CampusLifeEditor({ path, navigate, csrf, setNotice }) {
  const isNew = path.endsWith('/new');
  const id = isNew ? null : path.split('/')[3];
  const [form, setForm] = useState({ eyebrow: 'Campus life', title: '', description: '', alt_text: '', size: 'standard', published: false, image: null });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (isNew) return;
    let active = true;
    apiRequest('admin/campus-life').then(({ items }) => {
      const item = items.find((entry) => entry.id === id);
      if (!item) throw new Error('This campus tile could not be found.');
      if (active) setForm(item);
    }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, isNew]);
  useEffect(() => {
    if (!file) { setPreview(''); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function setField(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event) {
    event.preventDefault();
    if (!file && !form.image) { setError('Choose a photo for this campus moment.'); return; }
    setError('');
    setSaving(true);
    const body = new FormData();
    ['eyebrow', 'title', 'description', 'alt_text', 'size'].forEach((key) => body.set(key, form[key] || ''));
    body.set('published', form.published ? 'true' : 'false');
    if (file) body.set('image', file);
    try {
      await apiRequest(isNew ? 'admin/campus-life' : 'admin/campus-life/' + id, { method: 'POST', body, csrf });
      setNotice({ type: 'success', message: form.published ? 'Campus moment published.' : 'Campus moment saved as a draft.' });
      navigate('/admin/campus-life');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  if (loading) return <div className="admin-loading admin-editor-loading">Loading campus tile…</div>;
  const image = preview || (form.image ? assetUrl(form.image) : '');
  return <>
    <div className="admin-page-heading admin-editor-heading"><div><button className="admin-back-link" type="button" onClick={() => navigate('/admin/campus-life')}><ArrowDownRight size={15} />Campus gallery</button><h1>{isNew ? 'Add a campus moment' : 'Edit campus moment'}</h1><p>Update the image and the caption displayed over it on the public site.</p></div></div>
    {error && <div className="admin-form-error" role="alert">{error}</div>}
    <form className="admin-editor-grid" onSubmit={submit}>
      <div className="admin-panel admin-editor-form">
        <label>Caption label<input maxLength={40} value={form.eyebrow || ''} onChange={(event) => setField('eyebrow', event.target.value)} placeholder="Campus life" required /><small>The small line above the heading.</small></label>
        <label>Caption heading<input maxLength={110} value={form.title || ''} onChange={(event) => setField('title', event.target.value)} placeholder="Joyful learning beyond the classroom" required /></label>
        <label>Caption description<textarea maxLength={500} rows={4} value={form.description || ''} onChange={(event) => setField('description', event.target.value)} placeholder="A short sentence shown below the heading" required /><small>{(form.description || '').length}/500 characters</small></label>
        <label>Image description for accessibility<input maxLength={250} value={form.alt_text || ''} onChange={(event) => setField('alt_text', event.target.value)} placeholder="Describe what is visible in the photo" required /><small>Shown to screen readers and when the image is enlarged.</small></label>
        <label>Tile layout<select value={form.size || 'standard'} onChange={(event) => setField('size', event.target.value)}><option value="standard">Standard</option><option value="tall">Tall</option><option value="wide">Wide</option><option value="feature">Feature</option></select><small>Controls the tile’s relative size in the gallery.</small></label>
      </div>
      <aside className="admin-editor-side">
        <section className="admin-panel admin-publish-panel"><h2>Publishing</h2><label className="admin-publish-toggle"><input type="checkbox" checked={!!form.published} onChange={(event) => setField('published', event.target.checked)} /><span className="admin-toggle-track" /><span><strong>{form.published ? 'Published' : 'Save as draft'}</strong><small>{form.published ? 'Visible in Campus Life and homepage gallery' : 'Only administrators can see this tile'}</small></span></label></section>
        <section className="admin-panel admin-image-panel"><div className="admin-image-heading"><h2>Campus photo</h2><span>Required</span></div><p>Use a clear JPEG, PNG or WebP image. Maximum 5 MB.</p><label className="admin-image-drop admin-campus-image-drop">{image ? <img src={image} alt="Campus tile preview" /> : <span className="admin-image-placeholder"><ImagePlus size={24} /><strong>Choose a photo</strong><small>JPEG, PNG or WebP · max 5 MB</small></span>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>{file && <button className="admin-remove-file" type="button" onClick={() => setFile(null)}><X size={14} />Undo photo change</button>}</section>
        <section className="admin-panel admin-campus-preview"><h2>Caption preview</h2><div className="admin-campus-preview-card">{image && <img src={image} alt="" />}<div><span>{form.eyebrow || 'Campus life'}</span><strong>{form.title || 'Your heading appears here'}</strong><p>{form.description || 'Your description appears here.'}</p></div></div></section>
        <div className="admin-editor-actions"><button className="admin-secondary-button" type="button" onClick={() => navigate('/admin/campus-life')}>Cancel</button><button className="admin-primary-button" disabled={saving}>{saving ? 'Saving…' : form.published ? 'Publish tile' : 'Save draft'}<Save size={16} /></button></div>
      </aside>
    </form>
  </>;
}

function AdmissionsSettings({ csrf, setNotice }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    apiRequest('admin/admissions').then(setForm).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);
  function setField(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const saved = await apiRequest('admin/admissions', { method: 'PUT', csrf, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setForm(saved);
      setNotice({ type: 'success', message: 'Admissions information updated on the website.' });
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  if (loading) return <div className="admin-loading">Loading admissions settings…</div>;
  return (
    <>
      <div className="admin-page-heading"><div><span className="admin-eyebrow">PUBLIC WEBSITE CONTENT</span><h1>Admissions settings</h1><p>Update the session details and admissions banner shown to families.</p></div></div>
      <section className="admin-panel admin-settings-panel">
        <div className="admin-panel-heading"><span className="admin-panel-icon"><BookOpen size={20} /></span><div><h2>Admissions information</h2><p>These details appear on the homepage, admissions page and announcement banner.</p></div></div>
        {error && <div className="admin-form-error" role="alert">{error}</div>}
        <form className="admin-form admin-settings-form" onSubmit={submit}>
          <label>Academic session<input maxLength={20} value={form.session} onChange={(event) => setField('session', event.target.value)} placeholder="2026/2027" required /></label>
          <label>Programmes accepting enquiries<input maxLength={100} value={form.programmes} onChange={(event) => setField('programmes', event.target.value)} placeholder="Nursery & Primary" required /></label>
          <label>Admissions status<select value={form.open ? 'open' : 'closed'} onChange={(event) => setField('open', event.target.value === 'open')}><option value="open">Open — welcoming enquiries</option><option value="closed">Closed — not currently accepting</option></select><small>This status is shown on the public website.</small></label>
          <label>Announcement message<textarea maxLength={180} rows={3} value={form.banner_message} onChange={(event) => setField('banner_message', event.target.value)} required /><small>{form.banner_message.length}/180 characters</small></label>
          <div className="admin-settings-preview"><span className={form.open ? 'admin-status published' : 'admin-status draft'}>{form.open ? 'Admissions open' : 'Admissions closed'}</span><strong>{form.session} · {form.programmes}</strong><p>{form.banner_message}</p></div>
          <div className="admin-form-actions"><button className="admin-primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save admissions settings'}<Save size={16} /></button></div>
        </form>
      </section>
    </>
  );
}

export default function AdminApp({ path, navigate, hrefFor }) {
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState('');
  const [notice, setNotice] = useState(null);
  const [csrf, setCsrf] = useState('');
  useEffect(() => {
    document.title = 'Website administration | SSTBAC';
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    robots.setAttribute('content', 'noindex, nofollow');
  }, []);
  useEffect(() => {
    let active = true;
    apiRequest('admin/session').then((result) => {
      if (!active) return;
      setSession(result);
      setCsrf(result.csrf);
    }).catch((err) => { if (active) setSessionError(err.message); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  async function login(username, password) {
    const result = await apiRequest('admin/login', { method: 'POST', csrf, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    setSession((current) => ({ ...current, ...result, initialized: true }));
    setCsrf(result.csrf);
    navigate('/admin');
  }
  async function logout() {
    try { await apiRequest('admin/logout', { method: 'POST', csrf }); }
    finally { setSession((current) => ({ ...current, authenticated: false, must_change_password: false })); navigate('/admin/login'); }
  }
  function passwordChanged(nextCsrf) {
    setCsrf(nextCsrf);
    setSession((current) => ({ ...current, must_change_password: false }));
    navigate('/admin');
    setNotice({ type: 'success', message: 'Your password has been changed.' });
  }
  if (!session) return <main className="admin-auth-page"><section className="admin-auth-card">{sessionError ? <div className="admin-form-error">{sessionError}</div> : <div className="admin-loading">Opening secure workspace…</div>}</section></main>;
  if (!session.authenticated) return <Login csrf={csrf} initialized={session.initialized} onLogin={login} hrefFor={hrefFor} />;
  if (session.must_change_password) return <main className="admin-auth-page admin-first-password"><section className="admin-auth-card"><a className="admin-auth-brand" href={hrefFor('/')}><span><BookOpen size={22} /></span><div><strong>Shalom Academy</strong><small>Secure account setup</small></div></a><div className="admin-auth-heading"><span className="admin-auth-icon"><ShieldCheck size={23} /></span><p>ONE-TIME SETUP</p><h1>Protect your admin account</h1><span>Before continuing, replace the temporary password with one only you know.</span></div><PasswordForm forced csrf={csrf} onChanged={passwordChanged} /></section></main>;
  const content = path === '/admin/news' ? <NewsManager navigate={navigate} setNotice={setNotice} />
    : path === '/admin/news/new' || /^\/admin\/news\/[a-f0-9]{24}\/edit$/.test(path) ? <NewsEditor path={path} navigate={navigate} csrf={csrf} setNotice={setNotice} />
      : path === '/admin/campus-life' ? <CampusLifeManager navigate={navigate} setNotice={setNotice} />
        : path === '/admin/campus-life/new' || /^\/admin\/campus-life\/[a-f0-9]{24}\/edit$/.test(path) ? <CampusLifeEditor path={path} navigate={navigate} csrf={csrf} setNotice={setNotice} />
      : path === '/admin/admissions' ? <AdmissionsSettings csrf={csrf} setNotice={setNotice} />
        : path === '/admin/password' ? <PasswordForm csrf={csrf} onChanged={passwordChanged} />
          : <Dashboard navigate={navigate} />;
  return <AdminShell path={path} navigate={navigate} hrefFor={hrefFor} session={session} onLogout={logout} notice={notice} onDismissNotice={() => setNotice(null)}>{content}</AdminShell>;
}
