/* ------------------------------------------------------------------
   app.jsx — page shell and routing.

   Routes (hash-based, so GitHub Pages needs no server config):
     #/                 home
     #/about, #/contact home, scrolled to that section
     #/project/<slug>   spotlight page, loaded from data/projects/<slug>.json

   Content lives in data/ — you shouldn't need to edit this file to
   change text, add a project, or remove one.
------------------------------------------------------------------- */
(function () {
  const { useState, useEffect } = React;
  const PF = window.PF;

  /* ---------- data loading ---------- */
  const cache = {};
  function useJSON(path) {
    const [state, setState] = useState({ data: cache[path], error: null });
    useEffect(() => {
      if (!path) return;
      if (cache[path]) { setState({ data: cache[path], error: null }); return; }
      setState({ data: null, error: null });
      fetch(path)
        .then(r => (r.ok ? r.json() : Promise.reject(new Error(r.status + ' ' + path))))
        .then(json => { cache[path] = json; setState({ data: json, error: null }); })
        .catch(error => setState({ data: null, error }));
    }, [path]);
    return state;
  }

  /* ---------- routing ---------- */
  function parseHash() {
    const h = window.location.hash.replace(/^#\/?/, '');
    const [first, second] = h.split('/');
    if (first === 'project' && second) return { page: 'project', slug: second };
    return { page: 'home', section: first || null };
  }
  function useRoute() {
    const [route, setRoute] = useState(parseHash());
    useEffect(() => {
      const on = () => setRoute(parseHash());
      window.addEventListener('hashchange', on);
      return () => window.removeEventListener('hashchange', on);
    }, []);
    return route;
  }

  /* ---------- chrome ---------- */
  function Header({ site }) {
    return (
      <header className="site-header">
        <div className="container header-inner">
          {site.brand ? <a className="brand" href="#/">{site.brand}</a> : <span />}
          <nav aria-label="Main">
            <a href="#/projects">Projects</a>
            <a href="#/about">About</a>
            <a href={site.contact.resume} target="_blank" rel="noopener">Resume</a>
            <a href="#/contact">Contact</a>
          </nav>
        </div>
      </header>
    );
  }

  function Footer({ site }) {
    return (
      <footer className="site-footer">
        <div className="container">© {new Date().getFullYear()} {site.name}</div>
      </footer>
    );
  }

  /* ---------- home ---------- */
  function ProjectLinks({ links }) {
    if (!links) return null;
    const names = { live: 'Live site', repo: 'Code', article: 'Write-up' };
    return (
      <span className="ext-links">
        {Object.entries(links).filter(([, url]) => url).map(([k, url]) => (
          <a key={k} href={url} target="_blank" rel="noopener">{names[k] || k} ↗</a>
        ))}
      </span>
    );
  }

  function ProjectCard({ p }) {
    return (
      <article className="card">
        <div className="card-top">
          <span className="kicker">{p.kicker}</span>
          {p.status ? <span className="badge">{p.status}</span> : <span className="year">{p.year}</span>}
        </div>
        <h3><a href={'#/project/' + p.slug} className="stretched">{p.title}</a></h3>
        <p>{p.summary}</p>
        {p.highlight ? (
          <div className="card-stat"><b>{p.highlight.value}</b><span>{p.highlight.label}</span></div>
        ) : null}
        <div className="tags">{(p.tags || []).map(t => <span className="tag" key={t}>{t}</span>)}</div>
        <div className="card-foot">
          <span className="cta-text">Open spotlight →</span>
        </div>
      </article>
    );
  }

  function Home({ site, projects, section }) {
    useEffect(() => {
      if (section) {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else window.scrollTo(0, 0);
    }, [section]);

    return (
      <main>
        <section className="hero container">
          <p className="eyebrow">{site.role} · {site.location}</p>
          <h1>{site.headline}</h1>
          <p className="lede">{site.intro}</p>
          <div className="hero-actions">
            <a className="btn" href="#/projects">See the projects</a>
            <a className="btn ghost" href={site.contact.resume} target="_blank" rel="noopener">Resume (PDF)</a>
          </div>
          {site.openTo ? <p className="open-to"><span className="dot" aria-hidden="true" />{site.openTo}</p> : null}
        </section>

        <section id="projects" className="container section">
          <div className="section-head">
            <h2>Projects</h2>
            <p className="caption">Each one has a spotlight page with the data behind it.</p>
          </div>
          <div className="grid">
            {projects.map(p => <ProjectCard key={p.slug} p={p} />)}
          </div>
        </section>

        <section id="about" className="container section about">
          <h2>About</h2>
          <div className="about-grid">
            <div>{site.about.map((t, i) => <p key={i}>{t}</p>)}</div>
            <div className="skills">
              {site.skills.map(g => (
                <div key={g.group}>
                  <h4>{g.group}</h4>
                  <div className="tags">{g.items.map(s => <span className="tag" key={s}>{s}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="container section contact">
          <h2>Contact</h2>
          <p>The fastest way to reach me is email.</p>
          <div className="contact-links">
            <a className="btn" href={'mailto:' + site.contact.email}>{site.contact.email}</a>
            <a className="btn ghost" href={site.contact.github} target="_blank" rel="noopener">GitHub {site.contact.githubHandle}</a>
          </div>
        </section>
      </main>
    );
  }

  /* ---------- spotlight ---------- */
  function Spotlight({ slug, projects }) {
    const { data, error } = useJSON('data/projects/' + slug + '.json');
    const card = projects.find(p => p.slug === slug) || {};
    const idx = projects.findIndex(p => p.slug === slug);
    const next = projects.length > 1 ? projects[(idx + 1) % projects.length] : null;

    useEffect(() => { window.scrollTo(0, 0); }, [slug]);
    useEffect(() => { if (data) document.title = data.title + ' — Joseph Cin'; return () => { document.title = 'Joseph Cin — Data Projects'; }; }, [data]);

    if (error) return <main className="container section"><a href="#/projects" className="back">← All projects</a><p>Couldn't load this project.</p></main>;
    if (!data) return <main className="container section"><p className="caption">Loading…</p></main>;

    return (
      <main className="spotlight">
        <section className="container spot-hero">
          <a href="#/projects" className="back">← All projects</a>
          <p className="eyebrow">{card.kicker}</p>
          <h1>{data.title}</h1>
          <p className="lede">{data.subtitle}</p>
          <ProjectLinks links={card.links} />
          {data.meta ? (
            <dl className="meta">
              {data.meta.map(m => <div key={m.label}><dt>{m.label}</dt><dd>{m.value}</dd></div>)}
            </dl>
          ) : null}
        </section>

        {data.stats ? (
          <section className="container">
            <div className="stat-row hero-stats">
              {data.stats.map((s, i) => (
                <div className="stat" key={i}><span className="stat-value">{s.value}</span><span className="stat-label">{s.label}</span></div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="container narrow">
          {(data.sections || []).map((s, i) => <PF.Block key={i} {...s} />)}
        </div>

        {next && next.slug !== slug ? (
          <section className="container">
            <a className="next-project" href={'#/project/' + next.slug}>
              <span className="caption">Next project</span>
              <b>{next.title} →</b>
            </a>
          </section>
        ) : null}
      </main>
    );
  }

  /* ---------- app ---------- */
  function App() {
    const route = useRoute();
    const site = useJSON('data/site.json');
    const index = useJSON('data/projects.json');

    if (site.error || index.error) return <div className="container section"><p>Couldn't load site data. Check the files in docs/data/.</p></div>;
    if (!site.data || !index.data) return null;

    const projects = (index.data.projects || []).filter(p => !p.hidden);
    return (
      <>
        <a className="skip" href="#main-content">Skip to content</a>
        <Header site={site.data} />
        <div id="main-content">
          {route.page === 'project'
            ? <Spotlight slug={route.slug} projects={projects} />
            : <Home site={site.data} projects={projects} section={route.section} />}
        </div>
        <Footer site={site.data} />
      </>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
