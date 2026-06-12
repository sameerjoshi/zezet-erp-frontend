import { setRequestLocale } from 'next-intl/server';
import { Topbar } from '@/components/Topbar';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="page">
        {/* KPI strip */}
        <div className="kpibar reveal d1">
          <div className="kpi">
            <span className="tile blue">
              <svg className="ico" viewBox="0 0 24 24">
                <path d="M10 17h4V5H2v12h3" />
                <path d="M20 17h2v-3.3a1 1 0 0 0-.3-.7l-2.7-2.7a1 1 0 0 0-.7-.3H14v7h2" />
                <circle cx="7.5" cy="17.5" r="2.5" />
                <circle cx="17.5" cy="17.5" r="2.5" />
              </svg>
            </span>
            <div className="m">
              <div className="l">Trucks entered</div>
              <div className="v">
                28 <span className="muted" style={{ fontSize: 14 }}>/38</span>
              </div>
            </div>
          </div>
          <div className="kpi">
            <span className="tile green">
              <svg className="ico" viewBox="0 0 24 24">
                <path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
              </svg>
            </span>
            <div className="m">
              <div className="l">Trips today</div>
              <div className="v">
                31 <span className="d up">+16% ↗</span>
              </div>
            </div>
          </div>
          <div className="kpi">
            <span className="tile amber">
              <svg className="ico" viewBox="0 0 24 24">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </span>
            <div className="m">
              <div className="l">Fleet in use</div>
              <div className="v">
                81% <span className="d down">-3% ↘</span>
              </div>
            </div>
          </div>
          <div className="kpi">
            <span className="tile red">
              <svg className="ico" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6M9 13h6M9 17h6" />
              </svg>
            </span>
            <div className="m">
              <div className="l">To bill today 🔒</div>
              <div className="v">$9,420</div>
            </div>
          </div>
        </div>

        {/* donuts */}
        <div className="grid2 reveal d2" style={{ gridTemplateColumns: '1fr 1.25fr', marginTop: 14 }}>
          <div className="card">
            <div className="bd" style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
              <div
                className="donut"
                style={{
                  background:
                    'conic-gradient(var(--green) 0 73.7%, var(--warn) 73.7% 81.6%, #E7E9F1 81.6% 100%)',
                }}
              >
                <div className="cap">
                  <small>Trucks</small>
                  <b>28/38</b>
                </div>
              </div>
              <div className="legend">
                <div className="li">
                  <span className="sw" style={{ background: 'var(--green)' }} /> Entered
                  <b style={{ marginLeft: 'auto' }}>28</b>
                </div>
                <div className="li">
                  <span className="sw" style={{ background: 'var(--warn)' }} /> Draft
                  <b style={{ marginLeft: 'auto' }}>3</b>
                </div>
                <div className="li">
                  <span className="sw" style={{ background: '#E7E9F1' }} /> Not yet
                  <b style={{ marginLeft: 'auto' }}>7</b>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="bd" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div
                className="donut"
                style={{
                  background:
                    'conic-gradient(#EE4E63 0 34%, #3D52E0 34% 57%, #27B07A 57% 74%, #E8973A 74% 88%, #9B6BE8 88% 100%)',
                }}
              >
                <div className="cap">
                  <small>Trips (Jun)</small>
                  <b>485</b>
                </div>
              </div>
              <div className="legend" style={{ flex: 1 }}>
                {[
                  ['#EE4E63', 'TLA', 165],
                  ['#3D52E0', 'Yobel', 112],
                  ['#27B07A', 'Super 99', 83],
                  ['#E8973A', 'Riba Smith', 68],
                  ['#9B6BE8', 'Others', 57],
                ].map(([c, n, v]) => (
                  <div className="li" key={n as string}>
                    <span className="sw" style={{ background: c as string }} /> {n}
                    <b style={{ marginLeft: 'auto' }}>{v}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* fleet status */}
        <div className="card reveal d3" style={{ marginTop: 14 }}>
          <div className="bd">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ font: '800 16px var(--font)', margin: 0 }}>Fleet status — today</h2>
              <div className="spacer" />
              <span className="helper">38 trucks</span>
            </div>
            <div className="segbar">
              <div className="s g" style={{ flex: 28 }}>28 / 74%</div>
              <div className="s a" style={{ flex: 3 }}>3 / 8%</div>
              <div className="s empty" style={{ flex: 7 }}>7 / 18%</div>
            </div>
            <div className="legrow">
              <span className="li"><span className="sw" style={{ background: 'var(--ok-bg)', borderColor: '#BFE8D4' }} /> Entered</span>
              <span className="li"><span className="sw" style={{ background: '#E9EDFF', borderColor: '#C5D0FF' }} /> Draft</span>
              <span className="li"><span className="sw" style={{ background: 'var(--red-bg)', borderColor: '#F6C7CE' }} /> Check</span>
              <span className="li"><span className="sw" style={{ background: '#fff' }} /> Not yet</span>
            </div>
            <div className="cellgrid" style={{ marginTop: 14 }}>
              {Array.from({ length: 38 }, (_, i) => {
                const n = i + 1;
                const cls = [5, 11, 17, 24, 30, 34, 37].includes(n)
                  ? 'x'
                  : [7, 22].includes(n)
                    ? 'b'
                    : [14, 28].includes(n)
                      ? 'r'
                      : 'g';
                return (
                  <div className={`cell ${cls}`} key={n}>
                    {n}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
