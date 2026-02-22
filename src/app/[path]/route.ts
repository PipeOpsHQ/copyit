
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';

async function isRateLimited(ip: string) {
  if (!redis) return false;
  const key = `rate-limit:get:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60);
  }
  return count > 120; // Allow more reads than writes
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string }> } // In Next.js 15, params is a Promise
) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (await isRateLimited(ip)) {
    return new Response('Too many requests\n', { status: 429 });
  }

  const { path } = await params;

  if (!path || path.length < 4) {
    return new Response('Invalid path\n', { status: 400 });
  }

  try {
    const result = await query(
      `SELECT id, content, is_one_time, is_consumed, expires_at
       FROM snippets
       WHERE path = $1`,
      [path]
    );

    if (result.rows.length === 0) {
      return new Response('Snippet not found or expired.\n', { status: 404 });
    }

    const snippet = result.rows[0];

    if (new Date(snippet.expires_at) < new Date()) {
      return new Response('Snippet expired.\n', { status: 404 });
    }

    if (snippet.is_one_time && snippet.is_consumed) {
      return new Response('This one-time snippet has already been consumed.\n', { status: 410 });
    }

    if (snippet.is_one_time && !snippet.is_consumed) {
      // Mark as consumed
      await query(`UPDATE snippets SET is_consumed = true WHERE id = $1`, [snippet.id]);
    }

    const userAgent = request.headers.get('user-agent') || '';
    const isCurl = userAgent.toLowerCase().includes('curl') || userAgent.toLowerCase().includes('wget');

    // Determine if we should wrap in OSC52 (currently just outputting raw text to easily pipe into pbcopy/xclip for MVP. Wrapping in OSC52 can be complex depending on terminal multiplexers like tmux, so raw output is safer default for pipes).

    if (isCurl || new URL(request.url).searchParams.get('raw') === '1') {
      return new Response(snippet.content, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    // A browser trying to access the path
    // For MVP, just return the raw text as well. We can upgrade to a nice UI representation later.
    return new Response(snippet.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error) {
    console.error('Error retrieving snippet:', error);
    return new Response('Internal Server Error\n', { status: 500 });
  }
}
