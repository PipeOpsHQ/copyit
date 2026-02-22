import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generatePath } from '@/lib/path-gen';
import { v4 as uuidv4 } from 'uuid';
import { redis } from '@/lib/redis';

// Rudimentary Rate Limiter since PRD requested one
async function isRateLimited(ip: string) {
  if (!redis) return false;
  const key = `rate-limit:create:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60); // 1 minute window
  }
  return count > 30; // Max 30 creates per minute per IP
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (await isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { content, ttl_seconds, one_time } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid content' }, { status: 400 });
    }

    // Rough check for 1MB limit (1 character = 1 byte roughly for ascii, max 2-4 bytes for UTF8)
    if (Buffer.byteLength(content, 'utf8') > 1024 * 1024) {
      return NextResponse.json({ error: 'Content size exceeds 1MB limit' }, { status: 413 });
    }

    const ttlSeconds = Math.max(60, Math.min(parseInt(ttl_seconds) || 86400, 604800));
    const isOneTime = Boolean(one_time);

    let path = '';
    let inserted = false;
    let attempts = 0;

    // Retry loop for path collision
    while (!inserted && attempts < 5) {
      path = generatePath();
      const id = uuidv4();
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      try {
        await query(
          `INSERT INTO snippets (id, path, content, ttl_seconds, is_one_time, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, path, content, ttlSeconds, isOneTime, expiresAt.toISOString()]
        );
        inserted = true;
      } catch (err: unknown) {
        // 23505 is the unique_violation error code in postgres
        if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === '23505') {
          attempts++;
        } else {
          throw err;
        }
      }
    }

    if (!inserted) {
      throw new Error('Failed to generate unique path after 5 attempts');
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://copyit.pipeops.app';
    const expiresAtIso = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    return NextResponse.json({
      path,
      url: `${baseUrl}/${path}`,
      expires_at: expiresAtIso,
      created_at: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating snippet:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
