import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Building2, CalendarDays, CheckCircle2, GraduationCap, Mail, MapPin, Menu, Megaphone, Phone, ShieldCheck, Sparkles, Users, X } from 'lucide-react';
import { getCurrentAdmin, login, logout } from './api/auth';
import { deleteNews, getAdminNews, getAdminNewsById, getNewsBySlug, getPublicNews, saveNews, togglePublish, uploadNewsImage } from './api/newsService';
import { aboutStats, admissionSteps, categories, imageOptions, learningNotes, navItems, pillars, schoolHighlights, schoolLife, secondarySchoolFacts, site, values, visionMission } from './data/siteContent';

const knownRoutes = [
  '/admin_news_form',
  '/admin_news',
  '/admin_login',
  '/news_detail',
  '/admissions',
  '/academics',
  '/gallery',
  '/contact',
  '/about',
  '/news',
];

function getRouteState() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  for (const route of knownRoutes) {
    if (pathname === route || pathname.endsWith(route)) {
      const prefix = pathname.slice(0, -route.length);
      return { path: route, prefix };
    }
  }
  return { path: '/', prefix: pathname === '/' ? '' : pathname };
}

let routePrefix = getRouteState().prefix;

function hrefFor(path) {
  const normalized = path === '/' ? '' : path;
  return `${routePrefix}${normalized || '/'}`;
}

function navigate(path) {
  window.history.pushState({}, '', hrefFor(path));
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function Link({ to, className = '', children, onClick }) {
  return (
      <a
      href={hrefFor(to)}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        onClick?.();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

const pageDescriptions = {
  '/': `${site.admissionSession} Nursery and Primary admission is open at ${site.name}, ${site.address}.`,
  '/about': `Learn about ${site.name}, a Nursery and Primary basic academy using the Shalom science and technology identity.`,
  '/academics': `${site.name} focuses on strong academics, STEM and innovation, character, creativity, and a safe learning environment.`,
  '/gallery': `View school-life sections for ${site.name}: early years, STEM, reading, sports, creativity, and daily routines.`,
  '/admissions': `${site.admissionSession} admission details for Nursery and Primary at ${site.name}. Call ${site.phones.join(' or ')}.`,
  '/news': `Published news and school announcements from ${site.name}.`,
  '/contact': `Contact ${site.name} at ${site.address}. Phone: ${site.phones.join(' or ')}.`,
};

function setMeta(title, description, path = window.location.pathname, image = site.ogImage) {
  document.title = title;
  const url = new URL(path, `https://${site.website}/`).href;
  const entries = [
    ['name', 'description', description],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:url', url],
    ['property', 'og:image', new URL(image, `https://${site.website}/`).href],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'twitter:image', new URL(image, `https://${site.website}/`).href],
  ];

  for (const [attr, key, value] of entries) {
    let node = document.querySelector(`meta[${attr}="${key}"]`);
    if (!node) {
      node = document.createElement('meta');
      node.setAttribute(attr, key);
      document.head.appendChild(node);
    }
    node.setAttribute('content', value);
  }

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}

function Header({ path }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <Link to="/" className="brand-lockup" onClick={() => setOpen(false)}>
        <img src={site.logo} alt="Shalom Science and Technology Academy logo" />
        <span>
          <strong>{site.name}</strong>
          <small>{site.motto}</small>
        </span>
      </Link>
      <button className="icon-button nav-toggle" type="button" aria-label="Open navigation" onClick={() => setOpen(!open)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav className={open ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} className={path === item.path ? 'active' : ''} onClick={() => setOpen(false)}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <img src={site.logo} alt="Shalom Science and Technology Academy logo" />
        <div>
          <p>{site.name}</p>
          <span>{site.motto}</span>
        </div>
      </div>
      <div className="footer-contact">
        <h2>Contact</h2>
        <p><MapPin size={18} />{site.address}</p>
        <p><Phone size={18} />{site.phones.join(' / ')}</p>
        <p><Mail size={18} />{site.email}</p>
      </div>
      <div className="footer-links">
        <h2>Pages</h2>
        <Link to="/about">About</Link>
        <Link to="/academics">Academics</Link>
        <Link to="/gallery">Gallery</Link>
        <Link to="/admissions">Admissions</Link>
        <Link to="/news">News</Link>
        <Link to="/contact">Contact</Link>
      </div>
      <div className="footer-bottom">
        <span>Faith · Excellence · Innovation · Leadership</span>
        <span>{site.name}</span>
      </div>
    </footer>
  );
}

function Shell({ children, path }) {
  return (
    <>
      <Header path={path} />
      <main>{children}</main>
      <Footer />
    </>
  );
}

function Home() {
  useEffect(() => {
    setMeta(`${site.name} | Nursery & Primary School in Enugu`, pageDescriptions['/'], '/', site.ogImage);
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Now open for {site.admissionSession} admission</p>
          <h1>{site.name}</h1>
          <p className="hero-promise">{site.promise}</p>
          <p>Nursery and primary education shaped around strong academics, early STEM habits, character, creativity, and a secure school environment.</p>
          <div className="hero-actions">
            <Link to="/about" className="button primary">
              Explore the school <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="button ghost">
              Contact school
            </Link>
          </div>
        </div>
        <div className="uniform-panel">
          <img src={site.pupils} alt="Pupils wearing the Shalom green, cream, and plaid uniform" />
          <div className="session-badge">
            <CalendarDays size={24} />
            <span>{site.programmes}</span>
            <strong>{site.admissionSession}</strong>
          </div>
        </div>
      </section>

      <section className="admission-strip">
        <div>
          <Megaphone size={28} />
          <span>Limited spaces available</span>
        </div>
        <p>Enrol early and secure your child's future today.</p>
      </section>

      <section className="section split">
        <div>
          <p className="eyebrow">Foundation years</p>
          <h2>A basic academy for the years where confidence, habits, and curiosity are formed.</h2>
          <p className="lead-copy">Great minds begin in a nurturing environment. The school’s work is presented through clear attention to academics, STEM, character, creativity, and safety.</p>
        </div>
        <div className="fact-grid">
          {schoolHighlights.map((fact) => (
            <article key={fact} className="fact-card">
              <CheckCircle2 size={20} />
              <p>{fact}</p>
            </article>
          ))}
        </div>
      </section>

      <LearningSection />
      <Pillars />
      <SchoolLifePreview />
      <AdmissionsSummary />
      <NewsPreview />
    </>
  );
}

function LearningSection() {
  return (
    <section className="section image-split">
      <div className="image-stack">
        <img src={site.primaryStem} alt="Pupils using age-appropriate STEM learning materials" />
        <img src={site.libraryReading} alt="Pupils reading and drawing with a teacher" />
      </div>
      <div>
        <p className="eyebrow">Learning approach</p>
        <h2>Hands-on work before big words.</h2>
        <div className="note-list">
          {learningNotes.map((note) => (
            <article key={note.title}>
              <h3>{note.title}</h3>
              <p>{note.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SchoolLifePreview() {
  return (
    <section className="section">
      <div className="section-row">
        <div>
          <p className="eyebrow">School life</p>
          <h2>More than an admission notice.</h2>
        </div>
        <Link to="/gallery" className="text-link">View gallery</Link>
      </div>
      <div className="life-grid compact">
        {schoolLife.slice(0, 3).map((item) => (
          <article className="life-card" key={item.title}>
            <img src={item.image} alt={item.title} />
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdmissionsSummary() {
  return (
    <section className="section admission-summary">
      <div>
        <p className="eyebrow">Admission</p>
        <h2>{site.admissionSession} admission is open.</h2>
        <p className="lead-copy">Admission is open into Nursery and Primary, with limited spaces available. The next step is to contact the school directly and confirm the current admission process.</p>
      </div>
      <ol>
        {admissionSteps.map((step) => <li key={step}>{step}</li>)}
      </ol>
    </section>
  );
}

function Pillars() {
  const icons = [GraduationCap, Sparkles, Users, BookOpen, ShieldCheck];
  return (
    <section className="section">
      <p className="eyebrow">Our promise</p>
      <h2>Excellence, character, innovation.</h2>
      <div className="pillar-grid">
        {pillars.map((pillar, index) => {
          const Icon = icons[index];
          return (
            <article className="pillar-card" key={pillar.title}>
              <Icon size={28} />
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function About() {
  useEffect(() => {
    setMeta(`About | ${site.name}`, pageDescriptions['/about'], '/about', site.schoolArrival);
  }, []);

  return (
    <>
      <section className="page-hero about-hero">
        <div>
          <p className="eyebrow">About</p>
          <h1>A nursery and primary school built around foundations that last.</h1>
          <p>{site.name} carries the Shalom science and technology identity into the early school years: strong academics, practical curiosity, character, creativity, and safety.</p>
        </div>
        <img src={site.schoolArrival} alt="Pupils arriving at school in the morning" />
      </section>

      <section className="section split">
        <div>
          <p className="eyebrow">Our story</p>
          <h2>{site.promise}</h2>
        </div>
        <div className="copy-block">
          <p>{site.name} is a basic academy for Nursery and Primary learners. The school’s public materials present it as a nurturing environment for curious minds and future leaders.</p>
          <p>The academy promise is expressed through five visible commitments: strong academics, STEM and innovation, character and values, sports and creativity, and a safe and secure environment.</p>
          <p>{secondarySchoolFacts.body}</p>
        </div>
      </section>

      <section className="section stat-band">
        {aboutStats.map((stat) => (
          <div key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="section section-alt">
        <div className="vision-grid">
          {visionMission.map((item) => (
            <article className="vision-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section image-split reverse">
        <div>
          <p className="eyebrow">How children learn here</p>
          <h2>Clear routines, practical work, and steady values.</h2>
          <div className="note-list">
            {learningNotes.map((note) => (
              <article key={note.title}>
                <h3>{note.title}</h3>
                <p>{note.text}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="image-stack">
          <img src={site.earlyYears} alt="Children sorting shapes and counting in class" />
          <img src={site.primaryStem} alt="Primary pupils working with STEM learning materials" />
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">What guides us</p>
        <h2>Faith, excellence, innovation, leadership.</h2>
        <div className="values-grid">
          {values.map((value) => (
            <article className="value-card" key={value.title}>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function Academics() {
  useEffect(() => {
    setMeta(`Academics | ${site.name}`, pageDescriptions['/academics'], '/academics', site.primaryStem);
  }, []);

  return (
    <section className="section page">
      <p className="eyebrow">Academics</p>
      <h1>Nursery and primary learning with a STEM-forward identity.</h1>
      <div className="content-columns academics-intro">
        <div className="copy-block">
          <p>At nursery and primary level, STEM should be practical before it becomes technical. Children learn by naming what they see, comparing objects, counting carefully, building simple structures, recording ideas, and explaining their thinking in plain language.</p>
          <p>The academy’s focus areas are strong academics, STEM and innovation, character and values, sports and creativity, and a safe and secure environment.</p>
        </div>
        <img className="framed-image" src={site.primaryStem} alt="Primary pupils using STEM learning materials" />
      </div>
      <Pillars />
      <SchoolLifePreview />
    </section>
  );
}

function Gallery() {
  useEffect(() => {
    setMeta(`Gallery | ${site.name}`, pageDescriptions['/gallery'], '/gallery', site.earlyYears);
  }, []);

  return (
    <section className="section page">
      <p className="eyebrow">Gallery</p>
      <h1>School life in focus.</h1>
      <div className="life-grid">
        {schoolLife.map((item) => (
          <article className="life-card" key={item.title}>
            <img src={item.image} alt={item.title} />
            <div>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Admissions() {
  useEffect(() => {
    setMeta(`Admissions | ${site.name}`, pageDescriptions['/admissions'], '/admissions', site.flyer);
  }, []);

  return (
    <section className="section page admission-page">
      <div className="admission-copy">
        <p className="eyebrow">Admissions</p>
        <h1>{site.admissionSession} admission into {site.programmes}</h1>
        <p>{site.promise} {site.subPromise.join(' ')} For current placement details, parents should contact the school office directly.</p>
        <ol className="admission-steps">
          {admissionSteps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <div className="contact-list">
          <a href="tel:+2349099256745"><Phone size={18} />+234 (0)909 925 6745</a>
          <a href="tel:+2347030426997"><Phone size={18} />0703 042 6997</a>
          <a href={`https://${site.website}`}><Building2 size={18} />{site.website}</a>
        </div>
      </div>
      <img className="flyer-image" src={site.flyer} alt="Shalom Science & Technology Basic Academy 2026/2027 admission information" />
    </section>
  );
}

function Contact() {
  useEffect(() => {
    setMeta(`Contact | ${site.name}`, pageDescriptions['/contact'], '/contact', site.campus);
  }, []);

  return (
    <section className="section page">
      <p className="eyebrow">Contact</p>
      <h1>Reach the school.</h1>
      <div className="contact-panel">
        <div><MapPin size={24} /><p>{site.address}</p></div>
        <div><Phone size={24} /><p>{site.phones.join(' / ')}</p></div>
        <div><Mail size={24} /><p>{site.email}</p></div>
      </div>
    </section>
  );
}

function renderContent(content) {
  return content
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((block, index) => {
      const image = block.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (image) {
        return (
          <figure className="article-figure" key={`${block}-${index}`}>
            <img src={image[2]} alt={image[1]} />
            {image[1] && <figcaption>{image[1]}</figcaption>}
          </figure>
        );
      }
      return <p key={`${block}-${index}`}>{block}</p>;
    });
}

function EmptyNews() {
  return (
    <div className="empty-news">
      <Megaphone size={42} />
      <h2>News coming soon</h2>
      <p>Published announcements will appear here after the school office adds them.</p>
    </div>
  );
}

function NewsPreview() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    getPublicNews().then((items) => setPosts(items.slice(0, 3))).catch(() => setPosts([]));
  }, []);

  return (
    <section className="section">
      <div className="section-row">
        <div>
          <p className="eyebrow">News</p>
          <h2>Latest updates</h2>
        </div>
        <Link to="/news" className="text-link">View all</Link>
      </div>
      {posts.length === 0 ? <EmptyNews /> : <NewsCards posts={posts} />}
    </section>
  );
}

function NewsCards({ posts }) {
  return (
    <div className="news-grid">
      {posts.map((post) => (
        <article className="news-card" key={post.id}>
          <img src={post.image} alt="" />
          <div>
            <span>{post.category}</span>
            <h3>{post.title}</h3>
            <p>{post.summary}</p>
            <Link to={`/news_detail?slug=${encodeURIComponent(post.slug)}`} className="text-link">Read update</Link>
          </div>
        </article>
      ))}
    </div>
  );
}

function NewsList() {
  const [posts, setPosts] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    setMeta(`News | ${site.name}`, pageDescriptions['/news'], '/news', site.flyer);
    getPublicNews().then(setPosts).catch(() => setPosts([]));
  }, []);

  const visible = posts?.slice((page - 1) * pageSize, page * pageSize) || [];
  const pages = Math.max(1, Math.ceil((posts?.length || 0) / pageSize));

  return (
    <section className="section page">
      <p className="eyebrow">News</p>
      <h1>School announcements</h1>
      {posts && posts.length === 0 && <EmptyNews />}
      {visible.length > 0 && <NewsCards posts={visible} />}
      {pages > 1 && (
        <div className="pager">
          {Array.from({ length: pages }, (_, index) => (
            <button type="button" className={page === index + 1 ? 'active' : ''} onClick={() => setPage(index + 1)} key={index}>
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function NewsDetail() {
  const [post, setPost] = useState(null);
  const [missing, setMissing] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug') || '';
  const preview = params.get('preview') === '1';

  useEffect(() => {
    getNewsBySlug(slug, { preview })
      .then((item) => {
        setPost(item);
        setMissing(!item);
        if (item) setMeta(`${item.title} | ${site.name}`, item.summary);
      })
      .catch(() => setMissing(true));
  }, [slug, preview]);

  if (missing) {
    return (
      <section className="section page">
        <h1>News post not found</h1>
        <Link to="/news" className="button primary">Back to news</Link>
      </section>
    );
  }

  if (!post) return <section className="section page"><p>Loading...</p></section>;

  return (
    <article className="section page article">
      <p className="eyebrow">{post.category}</p>
      <h1>{post.title}</h1>
      <img className="article-cover" src={post.image} alt="" />
      {renderContent(post.content)}
    </article>
  );
}

function Alert({ alert, onDismiss }) {
  if (!alert) return null;
  return (
    <div className={`alert ${alert.type}`} role="alert">
      <span>{alert.message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss message"><X size={16} /></button>
    </div>
  );
}

function AdminLogin({ onAuthed }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    setMeta(`Admin login | ${site.name}`, `Admin sign in for ${site.name}.`);
  }, []);

  async function submit(event) {
    event.preventDefault();
    setAlert(null);
    try {
      const admin = await login(form.username, form.password);
      onAuthed(admin);
      navigate('/admin_news');
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  }

  return (
    <section className="admin-page">
      <form className="auth-card" onSubmit={submit}>
        <img src={site.logo} alt="" />
        <h1>Admin login</h1>
        <Alert alert={alert} onDismiss={() => setAlert(null)} />
        <label>Username<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
        <label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        <button className="button primary" type="submit">Sign in</button>
      </form>
    </section>
  );
}

function AdminShell({ children, onLogout }) {
  return (
    <section className="admin-shell">
      <aside>
        <img src={site.logo} alt="" />
        <strong>News admin</strong>
        <Link to="/admin_news">Posts</Link>
        <Link to="/admin_news_form">New post</Link>
        <button type="button" onClick={onLogout}>Sign out</button>
      </aside>
      <div>{children}</div>
    </section>
  );
}

function ConfirmDialog({ title, body, onCancel, onConfirm }) {
  return (
    <div className="dialog-backdrop">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <p>{body}</p>
        <div>
          <button className="button ghost" type="button" onClick={onCancel}>Cancel</button>
          <button className="button danger" type="button" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function AdminNews({ authed }) {
  const [posts, setPosts] = useState([]);
  const [alert, setAlert] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    if (!authed) return;
    getAdminNews().then(setPosts).catch((error) => setAlert({ type: 'error', message: error.message }));
  }, [authed]);

  async function refresh() {
    setPosts(await getAdminNews());
  }

  async function setStatus(id, publish) {
    try {
      await togglePublish(id, publish);
      await refresh();
      setAlert({ type: 'success', message: publish ? 'Published.' : 'Moved to draft.' });
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  }

  async function removePost() {
    try {
      await deleteNews(confirmId);
      setConfirmId(null);
      await refresh();
      setAlert({ type: 'success', message: 'Deleted.' });
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  }

  return (
    <div className="admin-content">
      <div className="admin-top">
        <h1>News posts</h1>
        <Link to="/admin_news_form" className="button primary">New post</Link>
      </div>
      <Alert alert={alert} onDismiss={() => setAlert(null)} />
      <div className="admin-table">
        {posts.length === 0 && <p>No news posts yet.</p>}
        {posts.map((post) => (
          <article key={post.id}>
            <span className={`status ${post.status}`}>{post.status}</span>
            <h2>{post.title}</h2>
            <p>{post.category} · {new Date(post.updatedAt || post.createdAt).toLocaleDateString()}</p>
            <div>
              <Link to={`/admin_news_form?id=${post.id}`} className="button small">Edit</Link>
              <a className="button small" href={`${hrefFor('/news_detail')}?slug=${post.slug}&preview=1`} target="_blank" rel="noreferrer">Preview</a>
              <button className="button small" type="button" onClick={() => setStatus(post.id, post.status !== 'published')}>
                {post.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
              <button className="button small danger" type="button" onClick={() => setConfirmId(post.id)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
      {confirmId && <ConfirmDialog title="Delete news post" body="This removes the post from the JSON news store." onCancel={() => setConfirmId(null)} onConfirm={removePost} />}
    </div>
  );
}

const blankPost = {
  title: '',
  slug: '',
  category: 'Admission',
  summary: '',
  content: '',
  image: imageOptions[0].value,
};

function AdminNewsForm({ authed }) {
  const [post, setPost] = useState(blankPost);
  const [alert, setAlert] = useState(null);
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  useEffect(() => {
    if (!authed || !id) return;
    getAdminNewsById(id).then((item) => setPost(item || blankPost)).catch((error) => setAlert({ type: 'error', message: error.message }));
  }, [authed, id]);

  const slug = useMemo(() => post.slug || post.title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'), [post.slug, post.title]);

  function update(field, value) {
    setPost((current) => ({ ...current, [field]: value }));
  }

  async function save(status) {
    setAlert(null);
    try {
      await saveNews({ ...post, slug }, status, id);
      navigate('/admin_news');
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  }

  async function upload(event, inline = false) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const image = await uploadNewsImage(file);
      if (inline) {
        update('content', `${post.content}\n\n![${file.name}](${image})`.trim());
      } else {
        update('image', image);
      }
      setAlert({ type: 'success', message: 'Image uploaded.' });
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    } finally {
      event.target.value = '';
    }
  }

  return (
    <div className="editor-grid">
      <form className="editor-card" onSubmit={(event) => event.preventDefault()}>
        <h1>{id ? 'Edit news post' : 'New news post'}</h1>
        <Alert alert={alert} onDismiss={() => setAlert(null)} />
        <label>Title<input value={post.title} onChange={(event) => update('title', event.target.value)} /></label>
        <label>Slug<input value={slug} onChange={(event) => update('slug', event.target.value)} /></label>
        <label>Category<select value={post.category} onChange={(event) => update('category', event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>Summary<textarea rows="3" value={post.summary} onChange={(event) => update('summary', event.target.value)} /></label>
        <label>Content<textarea rows="10" value={post.content} onChange={(event) => update('content', event.target.value)} /></label>
        <label>Featured image<select value={post.image} onChange={(event) => update('image', event.target.value)}>{imageOptions.map((image) => <option key={image.value} value={image.value}>{image.label}</option>)}{post.image?.startsWith('uploads/news/') && <option value={post.image}>Uploaded image</option>}</select></label>
        <label className="file-button">Upload featured image<input type="file" accept="image/*" onChange={(event) => upload(event)} /></label>
        <label className="file-button">Insert image in content<input type="file" accept="image/*" onChange={(event) => upload(event, true)} /></label>
        <div className="editor-actions">
          <button className="button ghost" type="button" onClick={() => navigate('/admin_news')}>Cancel</button>
          <button className="button" type="button" onClick={() => save('draft')}>Save draft</button>
          <button className="button primary" type="button" onClick={() => save('published')}>Publish</button>
        </div>
      </form>
      <article className="editor-preview">
        <span>{post.category}</span>
        <h2>{post.title || 'News title'}</h2>
        <p>{post.summary || 'Summary preview appears here.'}</p>
        {post.image && <img src={post.image} alt="" />}
        <div>{renderContent(post.content || 'Full content preview appears here.')}</div>
      </article>
    </div>
  );
}

function App() {
  const [path, setPath] = useState(getRouteState().path);
  const [admin, setAdmin] = useState(null);
  const adminRoute = path.startsWith('/admin');

  useEffect(() => {
    const sync = () => {
      const routeState = getRouteState();
      routePrefix = routeState.prefix;
      setPath(routeState.path);
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  useEffect(() => {
    if (!adminRoute) return;
    getCurrentAdmin().then(setAdmin).catch(() => setAdmin(null));
  }, [adminRoute, path]);

  async function doLogout() {
    await logout();
    setAdmin(null);
    navigate('/admin_login');
  }

  if (path === '/admin_login') return <AdminLogin onAuthed={setAdmin} />;

  if (adminRoute) {
    if (!admin) return <AdminLogin onAuthed={setAdmin} />;
    return (
      <AdminShell onLogout={doLogout}>
        {path === '/admin_news_form' ? <AdminNewsForm authed={admin} /> : <AdminNews authed={admin} />}
      </AdminShell>
    );
  }

  const routes = {
    '/': <Home />,
    '/about': <About />,
    '/academics': <Academics />,
    '/gallery': <Gallery />,
    '/admissions': <Admissions />,
    '/news': <NewsList />,
    '/news_detail': <NewsDetail />,
    '/contact': <Contact />,
  };

  return <Shell path={path}>{routes[path] || <Home />}</Shell>;
}

export default App;
