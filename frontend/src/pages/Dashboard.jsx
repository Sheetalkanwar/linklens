import {
  Activity,
  ArrowUpRight,
  Link2,
  MousePointerClick,
  Plus,
  Users,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard({ analytics }) {
  const totalClicks = analytics?.total_clicks ?? 0;
  const uniqueClicks = analytics?.unique_clicks ?? 0;
  const activeLinks = analytics?.active_links ?? 0;
  const totalLinks = analytics?.total_links ?? 0;

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <header className="analytics-header">
        <div>
          <div className="analytics-eyebrow">OVERVIEW</div>
          <h1>Analytics</h1>
          <p>Track how your links are performing.</p>
        </div>

        <Link className="analytics-primary-button" to="/links/new">
          <Plus size={17} />
          Create link
        </Link>
      </header>

      {/* KPI cards */}
      <section className="analytics-kpis">
        <MetricCard
          label="Total clicks"
          value={totalClicks}
          icon={MousePointerClick}
        />

        <MetricCard
          label="Unique visitors"
          value={uniqueClicks}
          icon={Users}
        />

        <MetricCard
          label="Active links"
          value={activeLinks}
          icon={Link2}
        />

        <MetricCard
          label="Total links"
          value={totalLinks}
          icon={Activity}
        />
      </section>

      {/* Main chart */}
      <section className="analytics-panel analytics-chart-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>Clicks over time</h2>
            <p>Daily click activity across all your links.</p>
          </div>

          <span className="analytics-period">Last 14 days</span>
        </div>

        <ClicksChart data={analytics?.clicks_over_time ?? []} />
      </section>

      {/* Audience */}
      <section className="analytics-two-column">
        <DevicePanel data={analytics?.device_breakdown ?? []} />

        <ReferrerPanel data={analytics?.referrer_breakdown ?? []} />
      </section>

      {/* Top links */}
      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>Top performing links</h2>
            <p>Your links ranked by total clicks.</p>
          </div>

          <Link to="/links" className="analytics-text-link">
            View all
            <ArrowUpRight size={15} />
          </Link>
        </div>

        <TopLinks data={analytics?.top_links ?? []} />
      </section>

      {/* Recent activity */}
      <section className="analytics-panel analytics-recent-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>Recent activity</h2>
            <p>The latest clicks recorded by LinkLens.</p>
          </div>

          <span className="analytics-period">Latest 8</span>
        </div>

        <RecentClicks
          data={(analytics?.recent_clicks ?? []).slice(0, 8)}
        />
      </section>
    </div>
  );
}


/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="analytics-metric">
      <div className="analytics-metric-top">
        <span>{label}</span>

        <div className="analytics-metric-icon">
          <Icon size={17} />
        </div>
      </div>

      <strong>{Number(value).toLocaleString()}</strong>
    </div>
  );
}


/* =========================================================
   CLICKS CHART
========================================================= */

function ClicksChart({ data }) {
  if (!data.length) {
    return (
      <div className="analytics-empty">
        <MousePointerClick size={22} />
        <strong>No click activity yet</strong>
        <span>
          Share a link and your click activity will appear here.
        </span>
      </div>
    );
  }

  const width = 1000;
  const height = 300;

  const left = 12;
  const right = 12;
  const top = 24;
  const bottom = 42;

  const graphWidth = width - left - right;
  const graphHeight = height - top - bottom;

  const maxClicks = Math.max(
    ...data.map((item) => item.clicks),
    1
  );

  const points = data.map((item, index) => {
    const x =
      left +
      (index / Math.max(data.length - 1, 1)) * graphWidth;

    const y =
      top +
      graphHeight -
      (item.clicks / maxClicks) * graphHeight;

    return {
      ...item,
      x,
      y,
    };
  });

  const line = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const area = [
    `${points[0].x},${top + graphHeight}`,
    ...points.map((point) => `${point.x},${point.y}`),
    `${points[points.length - 1].x},${top + graphHeight}`,
  ].join(" ");

  const labelEvery = data.length > 8 ? 2 : 1;

  return (
    <div className="analytics-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="analytics-svg"
      >
        {/* Horizontal grid */}
        {[0, 1, 2, 3].map((row) => {
          const y = top + (graphHeight / 3) * row;

          return (
            <line
              key={row}
              x1={left}
              y1={y}
              x2={width - right}
              y2={y}
              className="analytics-grid-line"
            />
          );
        })}

        {/* Area */}
        <polygon
          points={area}
          className="analytics-chart-area"
        />

        {/* Line */}
        <polyline
          points={line}
          fill="none"
          className="analytics-chart-line"
        />

        {/* Points */}
        {points.map((point) => (
          <circle
            key={point.date}
            cx={point.x}
            cy={point.y}
            r="3.5"
            className="analytics-chart-point"
          />
        ))}
      </svg>

      <div className="analytics-chart-labels">
        {data.map((item, index) => (
          <span
            key={item.date}
            className={
              index % labelEvery !== 0
                ? "analytics-chart-label-hidden"
                : ""
            }
          >
            {new Date(`${item.date}T00:00:00`).toLocaleDateString(
              undefined,
              {
                month: "short",
                day: "numeric",
              }
            )}
          </span>
        ))}
      </div>
    </div>
  );
}


/* =========================================================
   DEVICES
========================================================= */

function DevicePanel({ data }) {
  const total = data.reduce(
    (sum, item) => sum + item.clicks,
    0
  );

  return (
    <section className="analytics-panel">
      <div className="analytics-panel-header">
        <div>
          <h2>Devices</h2>
          <p>Where your audience is clicking from.</p>
        </div>
      </div>

      {data.length ? (
        <div className="analytics-breakdown">
          {data.map((item) => {
            const percentage = total
              ? Math.round((item.clicks / total) * 100)
              : 0;

            return (
              <BreakdownRow
                key={item.name}
                icon={<DeviceIcon device={item.name} />}
                label={item.name}
                clicks={item.clicks}
                percentage={percentage}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState text="Device data will appear after your first click." />
      )}
    </section>
  );
}


/* =========================================================
   REFERRERS
========================================================= */

function ReferrerPanel({ data }) {
  const total = data.reduce(
    (sum, item) => sum + item.clicks,
    0
  );

  return (
    <section className="analytics-panel">
      <div className="analytics-panel-header">
        <div>
          <h2>Traffic sources</h2>
          <p>Where your visitors are coming from.</p>
        </div>
      </div>

      {data.length ? (
        <div className="analytics-breakdown">
          {data.slice(0, 6).map((item) => {
            const percentage = total
              ? Math.round((item.clicks / total) * 100)
              : 0;

            return (
              <BreakdownRow
                key={item.name}
                icon={<span className="analytics-source-dot" />}
                label={formatReferrer(item.name)}
                clicks={item.clicks}
                percentage={percentage}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState text="Traffic source data will appear here." />
      )}
    </section>
  );
}


/* =========================================================
   BREAKDOWN ROW
========================================================= */

function BreakdownRow({
  icon,
  label,
  clicks,
  percentage,
}) {
  return (
    <div className="analytics-breakdown-row">
      <div className="analytics-breakdown-top">
        <div className="analytics-breakdown-label">
          {icon}
          <span>{label}</span>
        </div>

        <div className="analytics-breakdown-number">
          <strong>{clicks.toLocaleString()}</strong>
          <span>{percentage}%</span>
        </div>
      </div>

      <div className="analytics-progress">
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}


/* =========================================================
   TOP LINKS
========================================================= */

function TopLinks({ data }) {
  if (!data.length) {
    return (
      <EmptyState text="Your best-performing links will appear here." />
    );
  }

  return (
    <div className="analytics-links-table">
      <div className="analytics-links-header">
        <span>LINK</span>
        <span>CLICKS</span>
        <span>UNIQUE</span>
      </div>

      {data.map((link, index) => (
        <div className="analytics-link-row" key={link.link_id}>
          <div className="analytics-link-info">
            <div className="analytics-link-rank">
              {String(index + 1).padStart(2, "0")}
            </div>

            <div>
              <strong>
                {link.title || "Untitled link"}
              </strong>

              <span>/{link.short_code}</span>
            </div>
          </div>

          <strong className="analytics-link-number">
            {link.total_clicks.toLocaleString()}
          </strong>

          <span className="analytics-link-unique">
            {link.unique_clicks.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}


/* =========================================================
   RECENT CLICKS
========================================================= */

function RecentClicks({ data }) {
  if (!data.length) {
    return (
      <EmptyState text="Recent click activity will appear here." />
    );
  }

  return (
    <div className="analytics-recent">
      {data.map((click) => (
        <div className="analytics-recent-row" key={click.id}>
          <div className="analytics-recent-icon">
            <MousePointerClick size={15} />
          </div>

          <div className="analytics-recent-main">
            <strong>{click.device}</strong>

            <span>
              {click.browser} · {click.os}
            </span>
          </div>

          <div className="analytics-recent-source">
            {formatReferrer(click.referrer || "Direct")}
          </div>

          <time>
            {formatDate(click.clicked_at)}
          </time>
        </div>
      ))}
    </div>
  );
}


/* =========================================================
   HELPERS
========================================================= */

function DeviceIcon({ device }) {
  const value = device.toLowerCase();

  if (value.includes("mobile")) {
    return <Smartphone size={17} />;
  }

  if (value.includes("tablet")) {
    return <Tablet size={17} />;
  }

  return <Monitor size={17} />;
}


function formatReferrer(value) {
  if (!value || value === "Direct") {
    return "Direct";
  }

  try {
    const url = new URL(value);
    return url.hostname.replace("www.", "");
  } catch {
    return value;
  }
}


function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}


function EmptyState({ text }) {
  return (
    <div className="analytics-empty analytics-empty-small">
      <span>{text}</span>
    </div>
  );
}