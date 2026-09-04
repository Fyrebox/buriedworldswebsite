// PostgreSQL persistence for first-party campaign links.

import pg from 'pg';

const { Pool } = pg;

export class LinkValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LinkValidationError';
  }
}

function cleanText(value, field, maxLength, { required = false } = {}) {
  const clean = String(value ?? '').trim();
  if (required && !clean) throw new LinkValidationError(`${field} is required`);
  if (clean.length > maxLength) {
    throw new LinkValidationError(`${field} must be at most ${maxLength} characters`);
  }
  return clean;
}

function normaliseSlug(value) {
  const slug = cleanText(value, 'Short name', 48, { required: true }).toLowerCase();
  if (slug.length < 3 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])$/.test(slug)) {
    throw new LinkValidationError(
      'Short name must be 3–48 lowercase letters, numbers or single dashes'
    );
  }
  if (slug.includes('--')) throw new LinkValidationError('Short name cannot contain repeated dashes');
  return slug;
}

function normaliseDestination(value, allowedHosts) {
  const raw = cleanText(value, 'Destination URL', 2048, { required: true });
  let destination;
  try {
    destination = new URL(raw);
  } catch {
    throw new LinkValidationError('Destination URL must be a complete HTTPS address');
  }
  if (destination.protocol !== 'https:') {
    throw new LinkValidationError('Destination URL must use HTTPS');
  }
  if (allowedHosts.size > 0 && !allowedHosts.has(destination.hostname.toLowerCase())) {
    throw new LinkValidationError(
      `Destination host is not allowed. Add ${destination.hostname} to TRACKING_ALLOWED_HOSTS first.`
    );
  }
  return destination.toString();
}

export function normaliseLink(input, allowedHosts = new Set()) {
  return {
    name: cleanText(input.name, 'Name', 80, { required: true }),
    slug: normaliseSlug(input.slug),
    destinationUrl: normaliseDestination(input.destinationUrl, allowedHosts),
    utmSource: cleanText(input.utmSource, 'UTM source', 100).toLowerCase(),
    utmMedium: cleanText(input.utmMedium, 'UTM medium', 100).toLowerCase(),
    utmCampaign: cleanText(input.utmCampaign, 'UTM campaign', 100).toLowerCase(),
    utmContent: cleanText(input.utmContent, 'UTM content', 100).toLowerCase()
  };
}

function iso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function rowToLink(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    destinationUrl: row.destination_url,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    utmContent: row.utm_content,
    active: Boolean(row.active),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

export async function createTrackingStore({
  databaseUrl,
  pool: suppliedPool,
  allowedHosts = [],
  seedLinks = []
}) {
  if (!suppliedPool && !databaseUrl) {
    throw new Error('DATABASE_URL is required for campaign tracking');
  }

  const pool = suppliedPool ?? new Pool({
    connectionString: databaseUrl,
    max: Number.parseInt(process.env.PG_POOL_MAX ?? '10', 10),
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    // Daily charts and CSV timestamps are defined in UTC, independent of the
    // database host or process timezone.
    options: '-c timezone=UTC'
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS campaign_links (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      destination_url TEXT NOT NULL,
      utm_source TEXT NOT NULL DEFAULT '',
      utm_medium TEXT NOT NULL DEFAULT '',
      utm_campaign TEXT NOT NULL DEFAULT '',
      utm_content TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS campaign_links_slug_lower
      ON campaign_links (LOWER(slug));

    CREATE TABLE IF NOT EXISTS campaign_clicks (
      id BIGSERIAL PRIMARY KEY,
      link_id BIGINT NOT NULL REFERENCES campaign_links(id),
      clicked_at TIMESTAMPTZ NOT NULL,
      destination_url TEXT NOT NULL,
      referrer_host TEXT NOT NULL DEFAULT '',
      device_category TEXT NOT NULL DEFAULT 'unknown',
      is_bot BOOLEAN NOT NULL DEFAULT FALSE,
      placement TEXT NOT NULL DEFAULT '',
      utm_source TEXT NOT NULL DEFAULT '',
      utm_medium TEXT NOT NULL DEFAULT '',
      utm_campaign TEXT NOT NULL DEFAULT '',
      utm_content TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS campaign_click_totals (
      link_id BIGINT PRIMARY KEY REFERENCES campaign_links(id),
      human_clicks BIGINT NOT NULL DEFAULT 0,
      bot_clicks BIGINT NOT NULL DEFAULT 0,
      archived_through TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS campaign_clicks_link_time
      ON campaign_clicks(link_id, clicked_at DESC);
    CREATE INDEX IF NOT EXISTS campaign_clicks_time
      ON campaign_clicks(clicked_at DESC);
  `);

  const allowedHostSet = new Set(
    allowedHosts.map((host) => host.trim().toLowerCase()).filter(Boolean)
  );

  const seedClient = await pool.connect();
  try {
    await seedClient.query('BEGIN');
    for (const input of seedLinks) {
      const link = normaliseLink(input, allowedHostSet);
      await seedClient.query(`
        INSERT INTO campaign_links
          (name, slug, destination_url, utm_source, utm_medium, utm_campaign, utm_content)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (LOWER(slug)) DO NOTHING
      `, [
        link.name,
        link.slug,
        link.destinationUrl,
        link.utmSource,
        link.utmMedium,
        link.utmCampaign,
        link.utmContent
      ]);
    }
    await seedClient.query('COMMIT');
  } catch (error) {
    await seedClient.query('ROLLBACK');
    throw error;
  } finally {
    seedClient.release();
  }

  // Keep visit-level records for 13 months. Older rows are atomically folded
  // into anonymous lifetime totals before they are removed.
  async function archiveOldClicks() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const expired = await client.query(`
        SELECT link_id,
          SUM(CASE WHEN is_bot = FALSE THEN 1 ELSE 0 END) AS human_clicks,
          SUM(CASE WHEN is_bot = TRUE THEN 1 ELSE 0 END) AS bot_clicks
        FROM campaign_clicks
        WHERE clicked_at < NOW() - INTERVAL '13 months'
        GROUP BY link_id
      `);
      for (const group of expired.rows) {
        await client.query(`
          INSERT INTO campaign_click_totals
            (link_id, human_clicks, bot_clicks, archived_through)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (link_id) DO UPDATE SET
            human_clicks = campaign_click_totals.human_clicks + EXCLUDED.human_clicks,
            bot_clicks = campaign_click_totals.bot_clicks + EXCLUDED.bot_clicks,
            archived_through = EXCLUDED.archived_through
        `, [group.link_id, group.human_clicks, group.bot_clicks]);
      }
      await client.query(`
        DELETE FROM campaign_clicks
        WHERE clicked_at < NOW() - INTERVAL '13 months'
      `);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  await archiveOldClicks();
  let nextArchiveAt = Date.now() + 24 * 60 * 60 * 1000;

  async function getBySlug(slug) {
    const result = await pool.query(
      'SELECT * FROM campaign_links WHERE LOWER(slug) = LOWER($1)',
      [slug]
    );
    return rowToLink(result.rows[0]);
  }

  async function getById(id) {
    const result = await pool.query('SELECT * FROM campaign_links WHERE id = $1', [id]);
    return rowToLink(result.rows[0]);
  }

  async function createLink(input) {
    const link = normaliseLink(input, allowedHostSet);
    try {
      const result = await pool.query(`
        INSERT INTO campaign_links
          (name, slug, destination_url, utm_source, utm_medium, utm_campaign, utm_content)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [link.name, link.slug, link.destinationUrl, link.utmSource, link.utmMedium,
        link.utmCampaign, link.utmContent]);
      return rowToLink(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') throw new LinkValidationError('That short name is already in use');
      throw error;
    }
  }

  async function updateLink(id, input) {
    const link = normaliseLink(input, allowedHostSet);
    try {
      const result = await pool.query(`
        UPDATE campaign_links SET
          name = $1, slug = $2, destination_url = $3,
          utm_source = $4, utm_medium = $5, utm_campaign = $6, utm_content = $7,
          updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `, [link.name, link.slug, link.destinationUrl, link.utmSource, link.utmMedium,
        link.utmCampaign, link.utmContent, id]);
      if (!result.rows[0]) throw new LinkValidationError('Campaign link was not found');
      return rowToLink(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') throw new LinkValidationError('That short name is already in use');
      throw error;
    }
  }

  async function setActive(id, active) {
    const result = await pool.query(`
      UPDATE campaign_links SET active = $1, updated_at = NOW() WHERE id = $2
    `, [Boolean(active), id]);
    return result.rowCount > 0;
  }

  async function recordClick(link, click) {
    if (Date.now() >= nextArchiveAt) {
      await archiveOldClicks();
      nextArchiveAt = Date.now() + 24 * 60 * 60 * 1000;
    }
    await pool.query(`
      INSERT INTO campaign_clicks
        (link_id, clicked_at, destination_url, referrer_host, device_category,
         is_bot, placement, utm_source, utm_medium, utm_campaign, utm_content)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [link.id, click.clickedAt, click.destinationUrl, click.referrerHost,
      click.deviceCategory, Boolean(click.isBot), click.placement, link.utmSource,
      link.utmMedium, link.utmCampaign, link.utmContent]);
  }

  async function listLinks() {
    const result = await pool.query(`
      WITH click_stats AS (
        SELECT link_id,
          SUM(CASE WHEN is_bot = FALSE THEN 1 ELSE 0 END) AS human_clicks,
          SUM(CASE WHEN is_bot = TRUE THEN 1 ELSE 0 END) AS bot_clicks,
          SUM(CASE WHEN is_bot = FALSE AND clicked_at >= NOW() - INTERVAL '7 days'
            THEN 1 ELSE 0 END) AS clicks_7d,
          SUM(CASE WHEN is_bot = FALSE AND clicked_at >= NOW() - INTERVAL '30 days'
            THEN 1 ELSE 0 END) AS clicks_30d,
          MAX(CASE WHEN is_bot = FALSE THEN clicked_at END) AS last_clicked_at
        FROM campaign_clicks GROUP BY link_id
      )
      SELECT l.*,
        COALESCE(a.human_clicks, 0) + COALESCE(c.human_clicks, 0) AS human_clicks,
        COALESCE(a.bot_clicks, 0) + COALESCE(c.bot_clicks, 0) AS bot_clicks,
        COALESCE(c.clicks_7d, 0) AS clicks_7d,
        COALESCE(c.clicks_30d, 0) AS clicks_30d,
        c.last_clicked_at
      FROM campaign_links l
      LEFT JOIN click_stats c ON c.link_id = l.id
      LEFT JOIN campaign_click_totals a ON a.link_id = l.id
      ORDER BY l.active DESC, l.updated_at DESC
    `);
    return result.rows.map((row) => ({
      ...rowToLink(row),
      humanClicks: Number(row.human_clicks ?? 0),
      botClicks: Number(row.bot_clicks ?? 0),
      clicks7d: Number(row.clicks_7d ?? 0),
      clicks30d: Number(row.clicks_30d ?? 0),
      lastClickedAt: iso(row.last_clicked_at)
    }));
  }

  async function getLinkStats(id, days = 30) {
    const link = await getById(id);
    if (!link) return null;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const totals = (await pool.query(`
      SELECT
        SUM(CASE WHEN is_bot = FALSE THEN 1 ELSE 0 END) AS human,
        SUM(CASE WHEN is_bot = TRUE THEN 1 ELSE 0 END) AS bots,
        MIN(clicked_at) AS first_click,
        MAX(clicked_at) AS last_click
      FROM campaign_clicks
      WHERE link_id = $1 AND clicked_at >= $2::TIMESTAMPTZ
    `, [id, cutoff])).rows[0];
    const daily = (await pool.query(`
      SELECT TO_CHAR(clicked_at, 'YYYY-MM-DD') AS day,
             COUNT(*) AS clicks
      FROM campaign_clicks
      WHERE link_id = $1 AND is_bot = FALSE
        AND clicked_at >= $2::TIMESTAMPTZ
      GROUP BY day ORDER BY day ASC
    `, [id, cutoff])).rows;
    const referrers = (await pool.query(`
      SELECT CASE WHEN referrer_host = '' THEN 'direct / unknown' ELSE referrer_host END AS label,
             COUNT(*) AS clicks
      FROM campaign_clicks
      WHERE link_id = $1 AND is_bot = FALSE
        AND clicked_at >= $2::TIMESTAMPTZ
      GROUP BY referrer_host ORDER BY clicks DESC LIMIT 12
    `, [id, cutoff])).rows;
    const devices = (await pool.query(`
      SELECT device_category AS label, COUNT(*) AS clicks
      FROM campaign_clicks
      WHERE link_id = $1 AND is_bot = FALSE
        AND clicked_at >= $2::TIMESTAMPTZ
      GROUP BY device_category ORDER BY clicks DESC
    `, [id, cutoff])).rows;
    const placements = (await pool.query(`
      SELECT CASE WHEN placement = '' THEN 'unspecified' ELSE placement END AS label,
             COUNT(*) AS clicks
      FROM campaign_clicks
      WHERE link_id = $1 AND is_bot = FALSE
        AND clicked_at >= $2::TIMESTAMPTZ
      GROUP BY placement ORDER BY clicks DESC LIMIT 12
    `, [id, cutoff])).rows;

    return {
      link,
      days,
      humanClicks: Number(totals.human ?? 0),
      botClicks: Number(totals.bots ?? 0),
      firstClick: iso(totals.first_click),
      lastClick: iso(totals.last_click),
      daily: daily.map((row) => ({ day: row.day, clicks: Number(row.clicks) })),
      referrers: referrers.map((row) => ({ label: row.label, clicks: Number(row.clicks) })),
      devices: devices.map((row) => ({ label: row.label, clicks: Number(row.clicks) })),
      placements: placements.map((row) => ({ label: row.label, clicks: Number(row.clicks) }))
    };
  }

  async function exportClicks(id) {
    const result = await pool.query(`
      SELECT TO_CHAR(clicked_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS clicked_at,
             destination_url, referrer_host, device_category, is_bot,
             placement, utm_source, utm_medium, utm_campaign, utm_content
      FROM campaign_clicks WHERE link_id = $1 ORDER BY campaign_clicks.clicked_at DESC
    `, [id]);
    return result.rows;
  }

  return {
    allowedHosts: allowedHostSet,
    createLink,
    updateLink,
    setActive,
    recordClick,
    listLinks,
    getLinkStats,
    exportClicks,
    getBySlug,
    getById,
    close() { return pool.end(); }
  };
}
