/* ------------------------------------------------------------------
   charts.jsx — small, dependency-free chart components.
   Each one takes plain data from a project's JSON file.
   Exposed on window.PF so other scripts can use them.
------------------------------------------------------------------- */
(function () {
  const { useState } = React;

  /* ---------- number formatting ---------- */
  function fmt(v, format) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    switch (format) {
      case 'int':  return Math.round(v).toLocaleString();
      case 'dec1': return v.toFixed(1);
      case 'dec2': return v.toFixed(2);
      case 'pct0': return Math.round(v) + '%';
      case 'pct1': return (v > 0 ? '+' : '') + v.toFixed(1) + '%';
      case 'usd':  return '$' + v.toLocaleString(undefined, { maximumFractionDigits: 2 });
      default:     return String(v);
    }
  }

  /* ---------- shared tooltip (follows pointer, also works on focus) ---------- */
  function useTooltip() {
    const [tip, setTip] = useState(null);
    const show = (e, content) => {
      const r = e.currentTarget.getBoundingClientRect();
      const x = e.clientX || r.left + r.width / 2;
      const y = e.clientY || r.top;
      setTip({ x, y, content });
    };
    const hide = () => setTip(null);
    const node = tip ? (
      <div className="tooltip" role="tooltip" style={{ left: tip.x, top: tip.y }}>{tip.content}</div>
    ) : null;
    return { show, hide, node };
  }

  /* ---------- "view as table" toggle wrapper ---------- */
  function ChartFrame({ title, caption, note, table, children }) {
    const [asTable, setAsTable] = useState(false);
    return (
      <figure className="chart">
        <div className="chart-head">
          <div>
            {title ? <h3>{title}</h3> : null}
            {caption ? <p className="caption">{caption}</p> : null}
          </div>
          {table ? (
            <button className="link-btn" onClick={() => setAsTable(!asTable)} aria-pressed={asTable}>
              {asTable ? 'View chart' : 'View table'}
            </button>
          ) : null}
        </div>
        {asTable && table ? <DataTable columns={table.columns} rows={table.rows} /> : children}
        {note ? <figcaption className="note">{note}</figcaption> : null}
      </figure>
    );
  }

  function DataTable({ columns, rows }) {
    return (
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr>{columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* ---------- horizontal bar chart (magnitude, one series) ---------- */
  function BarChart({ title, caption, note, data, format, max, showValues }) {
    const tt = useTooltip();
    const top = max || Math.max(...data.map(d => d.value));
    return (
      <ChartFrame title={title} caption={caption} note={note}
        table={{ columns: ['Item', 'Value'], rows: data.map(d => [d.label, fmt(d.value, format)]) }}>
        <div className="hbar">
          {data.map((d, i) => (
            <div className="hbar-row" key={i}>
              <span className="hbar-label">{d.label}</span>
              <span className="hbar-track">
                <span className="hbar-fill" tabIndex={0}
                  aria-label={`${d.label}: ${fmt(d.value, format)}`}
                  style={{ width: `${Math.max(0.5, (d.value / top) * 100)}%` }}
                  onMouseMove={e => tt.show(e, <><b>{d.label}</b><br />{fmt(d.value, format)}</>)}
                  onFocus={e => tt.show(e, <><b>{d.label}</b><br />{fmt(d.value, format)}</>)}
                  onMouseLeave={tt.hide} onBlur={tt.hide} />
              </span>
              {showValues ? <span className="hbar-value">{fmt(d.value, format)}</span> : null}
            </div>
          ))}
        </div>
        {tt.node}
      </ChartFrame>
    );
  }

  /* ---------- diverging bars (positive vs negative around zero) ---------- */
  function DivergingBars({ title, caption, note, data, format }) {
    const tt = useTooltip();
    const extent = Math.max(...data.map(d => Math.abs(d.value)));
    return (
      <ChartFrame title={title} caption={caption} note={note}
        table={{ columns: ['Ticker', 'Change'], rows: data.map(d => [d.label, fmt(d.value, format)]) }}>
        <div className="legend">
          <span><i className="swatch pos" /> Gained</span>
          <span><i className="swatch neg" /> Lost</span>
        </div>
        <div className="dbar">
          {data.map((d, i) => {
            const w = (Math.abs(d.value) / extent) * 50;
            const pos = d.value >= 0;
            const tip = <><b>{d.label}</b><br />{fmt(d.value, format)}</>;
            return (
              <div className="dbar-row" key={i}>
                <span className="dbar-label">{d.label}</span>
                <span className="dbar-track">
                  <span className="dbar-zero" />
                  <span className={'dbar-fill ' + (pos ? 'pos' : 'neg')} tabIndex={0}
                    aria-label={`${d.label}: ${fmt(d.value, format)}`}
                    style={pos ? { left: '50%', width: `${Math.max(w, 0.4)}%` } : { right: '50%', width: `${Math.max(w, 0.4)}%` }}
                    onMouseMove={e => tt.show(e, tip)} onFocus={e => tt.show(e, tip)}
                    onMouseLeave={tt.hide} onBlur={tt.hide} />
                </span>
              </div>
            );
          })}
          <div className="dbar-axis"><span>{fmt(-extent, format)}</span><span>0</span><span>{fmt(extent, format)}</span></div>
        </div>
        {tt.node}
      </ChartFrame>
    );
  }

  /* ---------- funnel (ordered stages that shrink) ---------- */
  function Funnel({ title, caption, steps }) {
    const top = steps[0].value;
    return (
      <ChartFrame title={title} caption={caption}>
        <ol className="funnel">
          {steps.map((s, i) => (
            <li key={i} className="funnel-step">
              <div className="funnel-top">
                <span className="funnel-label">{s.label}</span>
                <span className="funnel-value">{s.value.toLocaleString()}</span>
              </div>
              <span className="funnel-track">
                <span className="funnel-fill" style={{ width: `${(s.value / top) * 100}%`, opacity: 1 - i * 0.18 }} />
              </span>
              {s.note ? <span className="funnel-note">{s.note}</span> : null}
            </li>
          ))}
        </ol>
      </ChartFrame>
    );
  }

  /* ---------- 2x2 confusion matrix (sequential shading by count) ---------- */
  function ConfusionMatrix({ title, caption, labels, matrix }) {
    const flat = matrix.flat();
    const max = Math.max(...flat);
    const total = flat.reduce((a, b) => a + b, 0);
    // sequential blue ramp, light -> dark
    const ramp = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95'];
    const shade = v => ramp[Math.min(ramp.length - 1, Math.floor((v / max) * (ramp.length - 1)))];
    const darkText = v => (v / max) < 0.55;
    return (
      <ChartFrame title={title} caption={caption}
        table={{ columns: ['Actual \\ Predicted', ...labels], rows: matrix.map((r, i) => [labels[i], ...r.map(v => v.toLocaleString())]) }}>
        <div className="cm">
          <div />
          <div className="cm-axis-top">Predicted</div>
          <div className="cm-axis-left">Actual</div>
          <div className="cm-grid" style={{ gridTemplateColumns: `auto repeat(${labels.length}, 1fr)` }}>
            <div />
            {labels.map((l, i) => <div key={'h' + i} className="cm-head">{l}</div>)}
            {matrix.map((row, i) => (
              <React.Fragment key={i}>
                <div className="cm-head cm-row">{labels[i]}</div>
                {row.map((v, j) => (
                  <div key={j} className={'cm-cell' + (i === j ? ' diag' : '')}
                    style={{ background: shade(v), color: darkText(v) ? '#0b0b0b' : '#ffffff' }}>
                    <b>{v.toLocaleString()}</b>
                    <span>{((v / total) * 100).toFixed(0)}% · {i === j ? 'correct' : 'missed'}</span>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </ChartFrame>
    );
  }

  window.PF = Object.assign(window.PF || {}, { fmt, useTooltip, ChartFrame, DataTable, BarChart, DivergingBars, Funnel, ConfusionMatrix });
})();
