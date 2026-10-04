import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Mail,
  MapPin,
  Menu,
  Microscope,
  Palette,
  Phone,
  School,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { admissionSteps, campusStories, learningStages, navItems, site, trustPoints, values } from './data/siteContent';
import { apiRequest, assetUrl } from './data/api';
import AdminApp from './admin/Admin.jsx';

const routes = ['/', '/about', '/academics', '/gallery', '/admissions', '/news', '/contact'];

const defaultAdmissions = {
  session: site.admissionSession,
  open: true,
  programmes: site.programmes,
  banner_message: 'Admissions are open. Speak with our school office to get started.',
};
const AdmissionsContext = createContext(defaultAdmissions);

function useAdmissions() {
  return useContext(AdmissionsContext);
}

function usePublicNews() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    apiRequest('news').then((result) => {
      if (active) setItems(result.items || []);
    }).catch((err) => {
      if (active) setError(err.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  return { items, loading, error };
}

function useCampusStories() {
  const [stories, setStories] = useState(() => campusStories.map((story, index) => ({
    ...story,
    id: 'local-' + index,
    eyebrow: 'Campus life',
    description: story.text,
    alt_text: story.title,
    sort_order: index,
  })));
  useEffect(() => {
    let active = true;
    apiRequest('campus-life').then((result) => {
      if (active && Array.isArray(result.items)) setStories(result.items);
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  return stories;
}

function getRouteState() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  const adminRoute = pathname.match(/^(.*?)(\/admin(?:\/.*)?)$/);
  if (adminRoute) return { path: adminRoute[2], prefix: adminRoute[1] };
  const newsDetailRoute = pathname.match(/^(.*)\/news\/(?:([^/]+)-)?([a-f0-9]{24})$/i);
  if (newsDetailRoute) return { path: '/news-detail', prefix: newsDetailRoute[1], newsId: newsDetailRoute[3] };
  const path = routes.find((route) => route !== '/' && (pathname === route || pathname.endsWith(route)));
  return path ? { path, prefix: pathname.slice(0, -path.length) } : { path: '/', prefix: pathname === '/' ? '' : pathname };
}

let routePrefix = getRouteState().prefix;

function hrefFor(path) {
  return routePrefix + (path === '/' ? '/' : path);
}

function navigate(path) {
  window.history.pushState({}, '', hrefFor(path));
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function newsPathFor(item) {
  const slug = String(item.title || 'school-update')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'school-update';
  return '/news/' + slug + '-' + item.id;
}

function Link({ to, className = '', children, onClick, ...attributes }) {
  return <a href={hrefFor(to)} className={className} {...attributes} onClick={(event) => { event.preventDefault(); onClick?.(); navigate(to); }}>{children}</a>;
}

function usePageTitle(title, description, image = site.ogImage) {
  useEffect(() => {
    document.title = title;
    const canonicalUrl = window.location.origin + window.location.pathname;
    const socialImage = /^https?:\/\//i.test(String(image))
      ? image
      : 'https://' + site.website + '/' + String(image).replace(/^\/+/, '');
    const entries = [
      ['name', 'description', description],
      ['property', 'og:title', title],
      ['property', 'og:description', description],
      ['property', 'og:image', socialImage],
      ['property', 'og:url', canonicalUrl],
    ];
    entries.forEach(([attribute, name, value]) => {
      let tag = document.querySelector('meta[' + attribute + '="' + name + '"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', value);
    });
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [title, description, image]);
}

function Eyebrow({ children }) {
  return <p className="eyebrow"><span />{children}</p>;
}

const MARQUEE_SPEED = 72;

function AnnouncementBar() {
  const admissions = useAdmissions();
  const barRef = useRef(null);
  const textRef = useRef(null);
  const [duration, setDuration] = useState(22);

  // The line travels the full width of the bar plus its own width, so hold the
  // speed steady rather than the duration: a wide screen takes proportionally
  // longer instead of whipping the text across.
  useEffect(() => {
    const measure = () => {
      const bar = barRef.current?.offsetWidth;
      const text = textRef.current?.offsetWidth;
      if (!bar || !text) return;
      setDuration((bar + text) / MARQUEE_SPEED);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  if (!admissions.open) return null;
  return (
    <div className="announcement-bar" ref={barRef}>
      <p className="marquee-item" ref={textRef} style={{ animationDuration: duration + 's' }}>
        <Sparkles size={14} /> {admissions.banner_message}
      </p>
    </div>
  );
}

function Header({ path }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return undefined;
    const measure = () => setHeaderHeight(node.offsetHeight);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // The sentinel sits directly below the header, so it leaves the viewport at
  // the exact moment the header has scrolled away. The spacer then takes the
  // header's place in the flow, which keeps the sentinel still and stops the
  // observer oscillating.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setPinned(!entry.isIntersecting && entry.boundingClientRect.top <= 0),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <AnnouncementBar />
      <header ref={headerRef} className={pinned ? 'site-header is-pinned' : 'site-header'}>
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <img src={assetUrl(site.logo)} alt="SSTBAC crest" />
          <span><strong>{site.shortName}</strong><small>Science &amp; Technology Basic Academy</small></span>
        </Link>
        <button className="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={23} /> : <Menu size={23} />}
        </button>
        <nav className={open ? 'nav-links is-open' : 'nav-links'}>
          {navItems.map((item) => <Link key={item.path} to={item.path} className={path === item.path ? 'active' : ''} onClick={() => setOpen(false)}>{item.label}</Link>)}
          <Link to="/admissions" className="nav-cta" onClick={() => setOpen(false)}>Enquire now <ArrowRight size={15} /></Link>
        </nav>
      </header>
      <div className="header-spacer" style={{ height: pinned ? headerHeight : 0 }} aria-hidden="true" />
      <div className="header-sentinel" ref={sentinelRef} aria-hidden="true" />
    </>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand"><img src={assetUrl(site.logo)} alt="" /><div><strong>{site.name}</strong><span>{site.motto}</span></div></div>
        <p>A warm, purposeful beginning for every child who walks through our gates.</p>
        <Link to="/admissions" className="button button-light">Start an enquiry <ArrowRight size={17} /></Link>
      </div>
      <div className="footer-grid">
        <div className="footer-explore"><span className="footer-label">Explore</span>{navItems.slice(1).map((item) => <Link key={item.path} to={item.path}>{item.label}</Link>)}</div>
        <div><span className="footer-label">Visit or call</span><p><MapPin size={17} />{site.address}</p><a href={'tel:' + site.phones[0].replace(/\D/g, '')}><Phone size={17} />{site.phones[0]}</a><a href={'mailto:' + site.email}><Mail size={17} />{site.email}</a></div>
        <div className="footer-values"><span className="footer-label">Our foundation</span><strong>Faith.<br />Curiosity.<br />Confidence.</strong></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} {site.shortName}. All rights reserved.</span><span>{site.motto}</span></div>
    </footer>
  );
}

function Shell({ children, path }) {
  return <div className="app-shell"><Header path={path} /><main>{children}</main><Footer /></div>;
}

function SectionHeading({ eyebrow, title, copy, action }) {
  return <div className="section-heading"><div><Eyebrow>{eyebrow}</Eyebrow><h2>{title}</h2></div><div>{copy && <p>{copy}</p>}{action}</div></div>;
}

function PageHero({ eyebrow, title, copy, image, alt }) {
  return <section className="page-hero"><div><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{copy}</p></div><figure><img src={image} alt={alt} /></figure></section>;
}

function AdmissionBanner() {
  const admissions = useAdmissions();
  return <section className="admissions-banner"><div><Eyebrow>{admissions.open ? 'Join SSTBAC' : 'Admissions update'}</Eyebrow><h2>Your child’s bright beginning can start here.</h2></div><div><p>{admissions.banner_message} {admissions.session} · {admissions.programmes}.</p><Link to="/admissions" className="button button-primary">{admissions.open ? 'Start an enquiry' : 'Ask about admissions'} <ArrowRight size={18} /></Link></div></section>;
}

function CampusGrid({ limit }) {
  const allStories = useCampusStories();
  const stories = limit ? allStories.slice(0, limit) : allStories;
  const [selectedIndex, setSelectedIndex] = useState(null);
  const dialogRef = useRef(null);
  const selected = selectedIndex === null ? null : stories[selectedIndex];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  function moveSelection(direction) {
    setSelectedIndex((current) => current === null ? null : (current + direction + stories.length) % stories.length);
  }

  return <>
    <div className={limit ? 'campus-grid campus-grid-preview' : 'campus-grid'}>
      {stories.map((story) => <article className={'campus-card campus-card-' + story.size} key={story.id}>
        <button className="campus-card-button" type="button" aria-label={'View full-size image: ' + story.title} onClick={() => setSelectedIndex(stories.indexOf(story))}>
          <img src={assetUrl(story.image)} alt={story.alt_text || story.title} />
          <div><span>{story.eyebrow || 'Campus life'}</span><h3>{story.title}</h3><p>{story.description}</p></div>
        </button>
      </article>)}
    </div>
    <dialog className="campus-lightbox" ref={dialogRef} aria-label="Campus photo viewer" onClose={() => setSelectedIndex(null)} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current.close(); }} onKeyDown={(event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveSelection(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); moveSelection(1); }
    }}>
      {selected && <>
        <button className="campus-lightbox-close" type="button" aria-label="Close image viewer" onClick={() => dialogRef.current?.close()}><X size={22} /></button>
        {stories.length > 1 && <>
          <button className="campus-lightbox-nav previous" type="button" aria-label="Previous campus image" onClick={() => moveSelection(-1)}><ChevronLeft size={26} /></button>
          <button className="campus-lightbox-nav next" type="button" aria-label="Next campus image" onClick={() => moveSelection(1)}><ChevronRight size={26} /></button>
        </>}
        <img className="campus-lightbox-image" src={assetUrl(selected.image)} alt={selected.alt_text || selected.title} />
        <div className="campus-lightbox-caption"><span>{selected.eyebrow || 'Campus life'}</span><h2>{selected.title}</h2><p>{selected.description}</p><small>{selectedIndex + 1} of {stories.length}</small></div>
      </>}
    </dialog>
  </>;
}

function Home() {
  const admissions = useAdmissions();
  usePageTitle(site.name + ' | Nursery & Primary School in Enugu', admissions.session + ' admissions for Nursery and Primary at ' + site.name + '.');
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <Eyebrow>{admissions.session} admissions {admissions.open ? 'open' : 'currently closed'}</Eyebrow>
          <h1>A strong start for <em>bright</em> young minds.</h1>
          <p>{site.name} is a warm, creative learning home where children build confidence, character and a lifelong love of discovery.</p>
          <div className="hero-actions"><Link to="/admissions" className="button button-primary">Begin an enquiry <ArrowRight size={18} /></Link><Link to="/gallery" className="button button-quiet">Explore our campus <ChevronRight size={18} /></Link></div>
          <div className="hero-note"><CalendarDays size={20} /><span><strong>{admissions.programmes}</strong><small>{admissions.open ? 'Now welcoming learners for the new session' : 'Contact us for future session information'}</small></span></div>
        </div>
        <div className="hero-visual"><div className="hero-arch"><img src={site.heroImage} alt="SSTBAC campus exterior" /></div><div className="hero-crest"><img src={site.logo} alt="" /></div><div className="hero-tag"><span>Our promise</span><strong>{site.motto}</strong></div></div>
      </section>
      <section className="trust-strip"><p>Why families choose SSTBAC</p>{trustPoints.map((point) => <div key={point}><Check size={18} />{point}</div>)}</section>
      <section className="section welcome-section">
        <figure><img src={site.campusImage} alt="Front view of the SSTBAC school building" /><figcaption><School size={20} />Built for the foundation years</figcaption></figure>
        <div><Eyebrow>Welcome to SSTBAC</Eyebrow><h2>Where a child’s first school years are treated as something special.</h2><p>We believe a child learns best when they feel safe to ask questions, make mistakes, express ideas and take pride in every new achievement.</p><p>Our approach brings together strong early academics, practical science and technology, creativity, discipline and values—all within a cheerful environment made for children.</p><Link to="/about" className="text-link">Discover our school <ArrowRight size={17} /></Link></div>
      </section>
      <section className="section">
        <SectionHeading eyebrow="How learning grows" title="Small steps. Big confidence." copy="A clear learning journey shaped for the way young children explore the world." />
        <div className="stage-grid">{learningStages.map((stage, index) => { const icons = [BookOpen, School, Microscope]; const Icon = icons[index]; return <article className="stage-card" key={stage.title}><div><span>{stage.step}</span><Icon size={25} /></div><h3>{stage.title}</h3><p>{stage.text}</p><Link to="/academics" className="round-link" aria-label={'Learn about ' + stage.title}><ArrowRight size={18} /></Link></article>; })}</div>
      </section>
      <section className="feature-split"><div><Eyebrow>Every space can teach</Eyebrow><h2>Colour, creativity and curiosity live beyond the classroom.</h2><p>From murals that spark imagination to everyday number and language prompts, our campus is designed to keep learning visible, memorable and joyful.</p><Link to="/gallery" className="button button-light">See campus life <ArrowRight size={18} /></Link></div><figure><img className="feature-main" src={site.innovationMural} alt="Innovation themed learning mural" /><img className="feature-small" src={site.corridorImage} alt="Numbers learning mural" /></figure></section>
      <section className="section"><SectionHeading eyebrow="Campus life" title="A school children are excited to come back to." copy="Take a look around the spaces that make the SSTBAC experience warm, colourful and full of possibility." action={<Link to="/gallery" className="text-link">View all moments <ArrowRight size={17} /></Link>} /><CampusGrid limit={4} /></section>
      <section className="section values-section"><SectionHeading eyebrow="More than lessons" title="The values children carry with them." copy="What happens every day matters: how children are spoken to, encouraged and taught to treat one another." /><div className="value-grid">{values.map((value, index) => { const icons = [Sparkles, Heart, ShieldCheck]; const Icon = icons[index]; return <article key={value.title}><Icon size={28} /><h3>{value.title}</h3><p>{value.text}</p></article>; })}</div></section>
      <NewsPreview />
      <AdmissionBanner />
    </>
  );
}

function About() {
  usePageTitle('Our School | ' + site.name, 'Learn about the values and learning environment at ' + site.name + '.', site.campusImage);
  return <><PageHero eyebrow="Our school" title="A school home for curious minds and growing character." copy="SSTBAC is shaped around a simple belief: children deserve a strong, joyful foundation that prepares them to learn with confidence." image={site.campusImage} alt="SSTBAC campus entrance" /><section className="section story-section"><div><Eyebrow>Our foundation</Eyebrow><h2>Strong beginnings are built with care.</h2></div><div><p>At Shalom Science &amp; Technology Basic Academy, we create a learning environment where children feel seen, supported and inspired to try. Our focus is not simply on getting through lessons; it is on helping children form the habits, confidence and imagination that make future learning possible.</p><p>We bring together early academics, practical exploration, creativity, faith and everyday character so each learner can grow at a pace that feels purposeful and encouraging.</p></div></section><section className="section values-showcase"><figure><img src={site.learningMural} alt="Learning themed mural at SSTBAC" /></figure><div><Eyebrow>What guides us</Eyebrow><h2>Faith, wonder and a belief in every child.</h2>{values.map((value) => <article className="check-value" key={value.title}><Check size={16} /><div><h3>{value.title}</h3><p>{value.text}</p></div></article>)}</div></section><AdmissionBanner /></>;
}

function Academics() {
  usePageTitle('Learning | ' + site.name, 'Explore the Nursery and Primary learning experience at ' + site.name + '.', site.innovationMural);
  return <><PageHero eyebrow="Learning at SSTBAC" title="Learning that begins with a question." copy="We make space for children to read, count, imagine, build, explain and practise the small skills that lead to lasting confidence." image={site.innovationMural} alt="Creative science and innovation mural" /><section className="section"><SectionHeading eyebrow="A clear path" title="Growing well at every stage." copy="Each stage is designed to meet children where they are and guide them toward what comes next." /><div className="learning-path">{learningStages.map((stage) => <article key={stage.title}><span>{stage.step}</span><h3>{stage.title}</h3><p>{stage.text}</p></article>)}</div></section><section className="section academics-feature"><div><Eyebrow>Learning beyond the workbook</Eyebrow><h2>Practical thinking is part of the school day.</h2><p>Science, technology, creativity and communication are introduced in child-friendly ways: by observing closely, testing ideas, making things, telling stories and asking good questions.</p><p>It is the kind of learning that helps children understand not just what they are taught, but how to think about the world around them.</p></div><figure><img src={site.classroomImage} alt="Classroom corridor at SSTBAC" /><img src={site.corridorImage} alt="Numbers learning display" /></figure></section><section className="section promise-grid"><article><BookOpen size={25} /><h3>Strong foundations</h3><p>Early literacy, numeracy, communication and steady learning habits.</p></article><article><Microscope size={25} /><h3>Practical discovery</h3><p>Age-appropriate science, technology and curiosity-led exploration.</p></article><article><Palette size={25} /><h3>Creative expression</h3><p>Making, drawing, music and ideas that give every learner a voice.</p></article></section><AdmissionBanner /></>;
}

function Gallery() {
  usePageTitle('Campus Life | ' + site.name, 'See the welcoming campus and learning spaces at ' + site.name + '.', site.courtyardImage);
  return <><PageHero eyebrow="Campus life" title="Designed to make learning feel alive." copy="Every corner of the campus reflects the warmth, colour and sense of possibility we want children to feel each day." image={site.courtyardImage} alt="Children playing in the SSTBAC courtyard" /><section className="section"><SectionHeading eyebrow="Around the campus" title="A place to learn, play and imagine." copy="The school environment is part of the learning experience." /><CampusGrid /></section><section className="section gallery-closing"><div><span>✦</span><h2>Come and see it for yourself.</h2></div><p>Pictures can tell part of the story. A campus visit lets you experience the environment, meet the team and ask the questions that matter to your family.</p><Link to="/contact" className="button button-primary">Plan a visit <ArrowRight size={18} /></Link></section></>;
}

function Admissions() {
  const admissions = useAdmissions();
  usePageTitle('Admissions | ' + site.name, admissions.session + ' Nursery and Primary admissions at ' + site.name + '.', site.heroImage);
  const intro = admissions.open
    ? 'We are welcoming new learners into ' + admissions.programmes + '. Start by speaking with the school office so we can guide you clearly through the right next step.'
    : 'Admissions for the ' + admissions.session + ' session are currently closed. Contact the school office to ask about future availability and next steps.';
  return <><PageHero eyebrow={admissions.session + ' admissions'} title="Let’s begin your child’s next chapter." copy={intro} image={site.heroImage} alt="SSTBAC school campus" /><section className="section"><SectionHeading eyebrow="How to get started" title="A simple path to joining SSTBAC." copy="Our admissions team will help you understand availability, placement and the documents needed for your child." /><ol className="admission-list">{admissionSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol></section><section className="section contact-options"><div><Eyebrow>Talk to admissions</Eyebrow><h2>We are ready to answer your questions.</h2><p>Whether you would like to ask about classes, arrange a visit or understand the admissions process, the school office is the best place to start.</p></div><div>{[['Call the school', site.phones[0], 'tel:' + site.phones[0].replace(/\D/g, ''), Phone], ['Send an email', site.admissionsEmail, 'mailto:' + site.admissionsEmail, Mail]].map(([label, detail, href, Icon]) => <a href={href} key={label}><Icon size={23} /><span><small>{label}</small><strong>{detail}</strong></span><ChevronRight size={19} /></a>)}<Link to="/contact"><MapPin size={23} /><span><small>Visit the campus</small><strong>View location details</strong></span><ChevronRight size={19} /></Link></div></section><section className="admission-photo-band"><img src={site.galleryWall} alt="Colourful SSTBAC school murals" /><div><span>Ready when you are</span><h2>Great minds begin with a welcoming first step.</h2></div></section></>;
}

function NewsPreview() {
  const { items, loading, error } = usePublicNews();
  return <section className="section news-section"><SectionHeading eyebrow="Latest from SSTBAC" title="News, moments and school notices." copy="Keep up with the things that matter to our school community." action={<Link to="/news" className="text-link">See all updates <ArrowRight size={17} /></Link>} />{loading ? <p className="news-feed-message">Loading school updates…</p> : error ? <p className="news-feed-message">School updates are temporarily unavailable.</p> : <NewsCards items={items.slice(0, 2)} />}</section>;
}

function NewsCards({ items }) {
  if (!items.length) return <div className="news-feed-empty"><Sparkles size={20} /><p>There are no published updates just yet. Please check back soon.</p></div>;
  return (
    <div className={items.length === 1 ? 'news-grid news-grid-single' : 'news-grid'}>
      {items.map((item) => {
        const date = item.published_at ? new Date(item.published_at) : null;
        const articlePath = newsPathFor(item);
        return (
          <article key={item.id}>
            <Link to={articlePath} className="news-card-image" aria-label={'Read ' + item.title}>
              <img src={item.image ? assetUrl(item.image) : site.learningMural} alt="" />
            </Link>
            <div>
              <span className="news-category">{item.category}</span>
              <h3><Link to={articlePath}>{item.title}</Link></h3>
              <p className="news-summary">{item.summary}</p>
              <Link to={articlePath} className="news-read-link">Read the full story <ArrowRight size={15} /></Link>
              {date && !Number.isNaN(date.getTime()) && <small className="news-date">{date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</small>}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function News() {
  const { items, loading, error } = usePublicNews();
  usePageTitle('News | ' + site.name, 'News and school notices from ' + site.name + '.', site.learningMural);
  return <><PageHero eyebrow="News & notices" title="The latest from our school community." copy="Important admissions information, campus moments and school notices will all live here." image={site.learningMural} alt="Colourful SSTBAC school mural" /><section className="section news-section"><SectionHeading eyebrow="Updates" title="What’s happening at SSTBAC." copy="School announcements and campus stories will be shared here." />{loading ? <p className="news-feed-message">Loading school updates…</p> : error ? <p className="news-feed-message">Updates are temporarily unavailable. Please try again later.</p> : <NewsCards items={items} />}</section></>;
}

function NewsDetail({ id }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setItem(null);
    setError('');
    setLoading(true);
    if (!id) {
      setError('This news update could not be found.');
      setLoading(false);
      return () => { active = false; };
    }
    apiRequest('news/' + id)
      .then((result) => { if (active) setItem(result.item || null); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const title = item ? item.title + ' | ' + site.name : 'News update | ' + site.name;
  const description = item?.summary || 'Read school news and notices from ' + site.name + '.';
  usePageTitle(title, description, item?.image ? assetUrl(item.image) : site.learningMural);

  const bodyParagraphs = String(item?.body || '')
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const publishedDate = item?.published_at ? new Date(item.published_at) : null;

  return (
    <main className="section news-story-page">
      <div className="news-story-container">
        <Link to="/news" className="news-back-link"><ArrowLeft size={16} />Back to all news</Link>
        {loading ? (
          <p className="news-feed-message" role="status">Loading this update…</p>
        ) : error || !item ? (
          <section className="news-story-empty" role="status">
            <span className="eyebrow">News &amp; notices</span>
            <h1>We couldn’t find that update.</h1>
            <p>It may have been unpublished or moved. You can browse the latest school updates instead.</p>
            <Link to="/news" className="news-read-link">Browse all updates <ArrowRight size={15} /></Link>
          </section>
        ) : (
          <article className="news-story">
            <header className="news-story-header">
              <span className="news-story-category">{item.category}</span>
              {publishedDate && !Number.isNaN(publishedDate.getTime()) && (
                <time dateTime={publishedDate.toISOString()}>{publishedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</time>
              )}
              <h1>{item.title}</h1>
              {item.summary && <p className="news-story-lead">{item.summary}</p>}
            </header>
            {item.image && <img className="news-story-image" src={assetUrl(item.image)} alt={item.title} />}
            {bodyParagraphs.length > 0 && (
              <div className="news-story-body">
                {bodyParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>
            )}
            <footer className="news-story-footer">
              <Link to="/news" className="news-back-link"><ArrowLeft size={16} />More school updates</Link>
              <span>Shalom Science &amp; Technology Basic Academy</span>
            </footer>
          </article>
        )}
      </div>
    </main>
  );
}

function Contact() {
  usePageTitle('Contact | ' + site.name, 'Contact ' + site.name + ' in Enugu.', site.campusImage);
  const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(site.address);
  return <><PageHero eyebrow="Contact SSTBAC" title="Come in, call us or send a note." copy="We would love to help you learn more about SSTBAC, admissions and visiting the school." image={site.campusImage} alt="SSTBAC school building" /><section className="section contact-page"><div className="contact-details"><Eyebrow>Get in touch</Eyebrow><h2>We are here to help.</h2><a href={'tel:' + site.phones[0].replace(/\D/g, '')}><Phone size={23} /><span><small>Call us</small><strong>{site.phones[0]}</strong></span></a><a href={'tel:' + site.phones[1].replace(/\D/g, '')}><Phone size={23} /><span><small>Alternative line</small><strong>{site.phones[1]}</strong></span></a><a href={'mailto:' + site.email}><Mail size={23} /><span><small>Email us</small><strong>{site.email}</strong></span></a></div><div className="visit-card"><MapPin size={29} /><span>Visit the school</span><h2>{site.address}</h2><p>Contact the school office before your visit so the team can welcome and guide you.</p><a href={mapUrl} target="_blank" rel="noreferrer">Open directions <ArrowRight size={17} /></a></div></section><AdmissionBanner /></>;
}

function App() {
  const [initialRoute] = useState(getRouteState);
  const [path, setPath] = useState(initialRoute.path);
  const [newsId, setNewsId] = useState(initialRoute.newsId || null);
  const [admissions, setAdmissions] = useState(defaultAdmissions);
  useEffect(() => {
    const handleRoute = () => {
      const next = getRouteState();
      routePrefix = next.prefix;
      setPath(next.path);
      setNewsId(next.newsId || null);
    };
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);
  useEffect(() => {
    let active = true;
    apiRequest('admissions').then((result) => { if (active) setAdmissions(result); }).catch(() => {});
    return () => { active = false; };
  }, []);
  if (path.startsWith('/admin')) {
    return <AdminApp path={path} navigate={navigate} hrefFor={hrefFor} />;
  }
  const pages = { '/': <Home />, '/about': <About />, '/academics': <Academics />, '/gallery': <Gallery />, '/admissions': <Admissions />, '/news': <News />, '/contact': <Contact /> };
  const page = path === '/news-detail' ? <NewsDetail id={newsId} /> : pages[path] || <Home />;
  return <AdmissionsContext.Provider value={admissions}><Shell path={path === '/news-detail' ? '/news' : path}>{page}</Shell></AdmissionsContext.Provider>;
}

export default App;
