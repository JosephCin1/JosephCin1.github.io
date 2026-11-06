/* ------------------------------------------------------------------
   blocks.jsx — the building blocks of a spotlight page.

   A project's JSON has a "sections" array. Each section has a "type";
   that type picks a renderer from the BLOCKS registry at the bottom.
   To add a new kind of section: write a component, add it to BLOCKS.
   To remove one from a page: delete that object from the JSON.
------------------------------------------------------------------- */
(function () {
  const { useState, useMemo } = React;
  const PF = window.PF;

  const paras = body => (Array.isArray(body) ? body : [body]).map((p, i) => <p key={i}>{p}</p>);

  function TextBlock({ title, body }) {
    return <div className="block-text">{title ? <h3>{title}</h3> : null}{paras(body)}</div>;
  }

  function StatsBlock({ title, items }) {
    return (
      <div>
        {title ? <h3>{title}</h3> : null}
        <div className="stat-row">
          {items.map((s, i) => (
            <div className="stat" key={i}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function ListBlock({ title, items }) {
    return (
      <div>
        {title ? <h3>{title}</h3> : null}
        <ul className="clean-list">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
      </div>
    );
  }

  function CalloutBlock({ title, body }) {
    return (
      <aside className="callout">
        {title ? <h3>{title}</h3> : null}
        {paras(body)}
      </aside>
    );
  }

  function TableBlock({ title, caption, columns, rows }) {
    return (
      <div>
        {title ? <h3>{title}</h3> : null}
        {caption ? <p className="caption">{caption}</p> : null}
        <PF.DataTable columns={columns} rows={rows} />
      </div>
    );
  }

  function StepsBlock({ title, items }) {
    return (
      <div>
        {title ? <h3>{title}</h3> : null}
        <ol className="steps">
          {items.map((s, i) => (
            <li key={i}>
              <span className="step-num">{i + 1}</span>
              <div><b>{s.title}</b><p>{s.body}</p></div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  function FormulaBlock({ title, lines, body }) {
    return (
      <div>
        {title ? <h3>{title}</h3> : null}
        <pre className="formula">{lines.join('\n')}</pre>
        {body ? <p className="caption">{body}</p> : null}
      </div>
    );
  }

  function WeekBlock({ title, caption, days }) {
    return (
      <div>
        {title ? <h3>{title}</h3> : null}
        {caption ? <p className="caption">{caption}</p> : null}
        <div className="week">
          {days.map((d, i) => (
            <div key={i} className={'week-day' + (d.events.length ? '' : ' empty')}>
              <span className="week-name">{d.day}</span>
              {d.events.map((e, j) => <span className="week-event" key={j}>{e}</span>)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* Interactive version of the Travel Guide scoring function. */
  function matchScore(place, prefs, cats) {
    let num = 0, den = 0;
    cats.forEach(c => {
      const u = prefs[c], p = place[c];
      if (u >= 1 && u <= 10 && p >= 1 && p <= 10) {
        num += (9 - Math.abs(u - p)) * u;
        den += 9 * u;
      }
    });
    return den === 0 ? 50 : Math.max(0, Math.min(100, Math.round((num / den) * 100)));
  }

  function MatchScoreBlock({ title, caption, categories, defaults, places, note }) {
    const [prefs, setPrefs] = useState(defaults);
    const ranked = useMemo(
      () => places.map(p => ({ ...p, score: matchScore(p.ratings, prefs, categories) })).sort((a, b) => b.score - a.score),
      [prefs]
    );
    const pretty = c => c.replace(/_/g, ' ');
    return (
      <div className="match">
        {title ? <h3>{title}</h3> : null}
        {caption ? <p className="caption">{caption}</p> : null}
        <div className="match-grid">
          <div className="match-sliders">
            {categories.map(c => (
              <label key={c} className="slider">
                <span>{pretty(c)}</span>
                <input type="range" min="1" max="10" value={prefs[c]}
                  onChange={e => setPrefs({ ...prefs, [c]: Number(e.target.value) })} />
                <output>{prefs[c]}</output>
              </label>
            ))}
            <button className="link-btn" onClick={() => setPrefs(defaults)}>Reset</button>
          </div>
          <ol className="match-results" aria-live="polite">
            {ranked.map((p, i) => (
              <li key={p.name}>
                <div className="match-top"><span>{i + 1}. {p.name}</span><b>{p.score}</b></div>
                <span className="hbar-track"><span className="hbar-fill" style={{ width: p.score + '%' }} /></span>
              </li>
            ))}
          </ol>
        </div>
        {note ? <p className="note">{note}</p> : null}
      </div>
    );
  }

  /* ---------- registry: section "type" -> component ---------- */
  const BLOCKS = {
    text: TextBlock,
    stats: StatsBlock,
    list: ListBlock,
    callout: CalloutBlock,
    table: TableBlock,
    steps: StepsBlock,
    formula: FormulaBlock,
    week: WeekBlock,
    matchScore: MatchScoreBlock,
    bar: PF.BarChart,
    diverging: PF.DivergingBars,
    funnel: PF.Funnel,
    confusion: PF.ConfusionMatrix
  };

  function Block(props) {
    const Comp = BLOCKS[props.type];
    if (!Comp) {
      console.warn('Unknown section type:', props.type);
      return null;
    }
    return <section className={'block block-' + props.type}><Comp {...props} /></section>;
  }

  window.PF = Object.assign(window.PF, { Block, BLOCKS });
})();
