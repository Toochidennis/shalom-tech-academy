import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
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

const routes = ['/', '/about', '/academics', '/gallery', '/admissions', '/news', '/contact'];

const newsItems = [
  ['Admissions', site.admissionSession + ' admission is open', 'Speak with the school office about current class placement and the admissions process.', site.heroImage],
  ['Campus life', 'A school environment made for young learners', 'Our colourful learning spaces help children feel welcome, curious and ready to grow.', site.learningMural],
  ['Learning', 'Small beginnings. Big possibilities.', 'A strong early foundation is built through daily routines, thoughtful teaching and joyful discovery.', site.innovationMural],
];

function getRouteState() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
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

function Link({ to, className = '', children, onClick }) {
  return <a href={hrefFor(to)} className={className} onClick={(event) => { event.preventDefault(); onClick?.(); navigate(to); }}>{children}</a>;
}

function usePageTitle(title, description, image = site.ogImage) {
  useEffect(() => {
    document.title = title;
    const entries = [
      ['name', 'description', description],
      ['property', 'og:title', title],
      ['property', 'og:description', description],
      ['property', 'og:image', 'https://' + site.website + '/' + image],
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
  }, [title, description, image]);
}

function Eyebrow({ children }) {
  return <p className="eyebrow"><span />{children}</p>;
}

const MARQUEE_SPEED = 72;

function AnnouncementBar() {
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

  return (
    <div className="announcement-bar" ref={barRef}>
      <p className="marquee-item" ref={textRef} style={{ animationDuration: duration + 's' }}>
        <Sparkles size={14} /> {site.admissionSession} admissions are open for Nursery &amp; Primary.
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
          <img src={site.logo} alt="SSTBAC crest" />
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
        <div className="footer-brand"><img src={site.logo} alt="" /><div><strong>{site.name}</strong><span>{site.motto}</span></div></div>
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
  return <section className="admissions-banner"><div><Eyebrow>Join SSTBAC</Eyebrow><h2>Your child’s bright beginning can start here.</h2></div><div><p>Speak with the school office about Nursery and Primary admissions for the {site.admissionSession} session.</p><Link to="/admissions" className="button button-primary">Start an enquiry <ArrowRight size={18} /></Link></div></section>;
}

function CampusGrid({ limit }) {
  const stories = limit ? campusStories.slice(0, limit) : campusStories;
  return <div className={limit ? 'campus-grid campus-grid-preview' : 'campus-grid'}>{stories.map((story) => <article className={'campus-card campus-card-' + story.size} key={story.title}><img src={story.image} alt={story.title} /><div><span>Campus life</span><h3>{story.title}</h3><p>{story.text}</p></div></article>)}</div>;
}

function Home() {
  usePageTitle(site.name + ' | Nursery & Primary School in Enugu', site.admissionSession + ' admissions for Nursery and Primary at ' + site.name + '.');
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <Eyebrow>{site.admissionSession} admissions open</Eyebrow>
          <h1>A strong start for <em>bright</em> young minds.</h1>
          <p>{site.name} is a warm, creative learning home where children build confidence, character and a lifelong love of discovery.</p>
          <div className="hero-actions"><Link to="/admissions" className="button button-primary">Begin an enquiry <ArrowRight size={18} /></Link><Link to="/gallery" className="button button-quiet">Explore our campus <ChevronRight size={18} /></Link></div>
          <div className="hero-note"><CalendarDays size={20} /><span><strong>{site.programmes}</strong><small>Now welcoming learners for the new session</small></span></div>
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
  usePageTitle('Admissions | ' + site.name, site.admissionSession + ' Nursery and Primary admissions at ' + site.name + '.', site.heroImage);
  return <><PageHero eyebrow={site.admissionSession + ' admissions'} title="Let’s begin your child’s next chapter." copy={'We are welcoming new learners into ' + site.programmes + '. Start by speaking with the school office so we can guide you clearly through the right next step.'} image={site.heroImage} alt="SSTBAC school campus" /><section className="section"><SectionHeading eyebrow="How to get started" title="A simple path to joining SSTBAC." copy="Our admissions team will help you understand availability, placement and the documents needed for your child." /><ol className="admission-list">{admissionSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol></section><section className="section contact-options"><div><Eyebrow>Talk to admissions</Eyebrow><h2>We are ready to answer your questions.</h2><p>Whether you would like to ask about classes, arrange a visit or understand the admissions process, the school office is the best place to start.</p></div><div>{[['Call the school', site.phones[0], 'tel:' + site.phones[0].replace(/\D/g, ''), Phone], ['Send an email', site.admissionsEmail, 'mailto:' + site.admissionsEmail, Mail]].map(([label, detail, href, Icon]) => <a href={href} key={label}><Icon size={23} /><span><small>{label}</small><strong>{detail}</strong></span><ChevronRight size={19} /></a>)}<Link to="/contact"><MapPin size={23} /><span><small>Visit the campus</small><strong>View location details</strong></span><ChevronRight size={19} /></Link></div></section><section className="admission-photo-band"><img src={site.galleryWall} alt="Colourful SSTBAC school murals" /><div><span>Ready when you are</span><h2>Great minds begin with a welcoming first step.</h2></div></section></>;
}

function NewsPreview() {
  return <section className="section news-section"><SectionHeading eyebrow="Latest from SSTBAC" title="News, moments and school notices." copy="Keep up with the things that matter to our school community." action={<Link to="/news" className="text-link">See all updates <ArrowRight size={17} /></Link>} /><NewsCards items={newsItems.slice(0, 2)} /></section>;
}

function NewsCards({ items }) {
  return <div className="news-grid">{items.map(([category, title, text, image]) => <article key={title}><img src={image} alt="" /><div><span>{category}</span><h3>{title}</h3><p>{text}</p><Link to="/contact">Talk to us <ArrowRight size={16} /></Link></div></article>)}</div>;
}

function News() {
  usePageTitle('News | ' + site.name, 'News and school notices from ' + site.name + '.', site.learningMural);
  return <><PageHero eyebrow="News & notices" title="The latest from our school community." copy="Important admissions information, campus moments and school notices will all live here." image={site.learningMural} alt="Colourful SSTBAC school mural" /><section className="section news-section"><SectionHeading eyebrow="Updates" title="What’s happening at SSTBAC." copy="School announcements and campus stories will be shared here." /><NewsCards items={newsItems} /></section><section className="section notice-panel"><Sparkles size={25} /><div><h2>A fresh news space is ready for SSTBAC.</h2><p>This frontend is ready to connect to your preferred publishing system when the time is right.</p></div></section></>;
}

function Contact() {
  usePageTitle('Contact | ' + site.name, 'Contact ' + site.name + ' in Enugu.', site.campusImage);
  const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(site.address);
  return <><PageHero eyebrow="Contact SSTBAC" title="Come in, call us or send a note." copy="We would love to help you learn more about SSTBAC, admissions and visiting the school." image={site.campusImage} alt="SSTBAC school building" /><section className="section contact-page"><div className="contact-details"><Eyebrow>Get in touch</Eyebrow><h2>We are here to help.</h2><a href={'tel:' + site.phones[0].replace(/\D/g, '')}><Phone size={23} /><span><small>Call us</small><strong>{site.phones[0]}</strong></span></a><a href={'tel:' + site.phones[1].replace(/\D/g, '')}><Phone size={23} /><span><small>Alternative line</small><strong>{site.phones[1]}</strong></span></a><a href={'mailto:' + site.email}><Mail size={23} /><span><small>Email us</small><strong>{site.email}</strong></span></a></div><div className="visit-card"><MapPin size={29} /><span>Visit the school</span><h2>{site.address}</h2><p>Contact the school office before your visit so the team can welcome and guide you.</p><a href={mapUrl} target="_blank" rel="noreferrer">Open directions <ArrowRight size={17} /></a></div></section><AdmissionBanner /></>;
}

function App() {
  const [path, setPath] = useState(getRouteState().path);
  useEffect(() => {
    const handleRoute = () => { const next = getRouteState(); routePrefix = next.prefix; setPath(next.path); };
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);
  const pages = { '/': <Home />, '/about': <About />, '/academics': <Academics />, '/gallery': <Gallery />, '/admissions': <Admissions />, '/news': <News />, '/contact': <Contact /> };
  return <Shell path={path}>{pages[path] || <Home />}</Shell>;
}

export default App;
