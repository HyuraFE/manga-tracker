import type { APIRoute } from "astro";
import { db } from "@/db";
import { userMangas } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const GET: APIRoute = async (context) => {
  const { userId } = context.locals.auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const list = await db
      .select()
      .from(userMangas)
      .where(eq(userMangas.userId, userId))
      .orderBy(desc(userMangas.updatedAt));

    return new Response(JSON.stringify({ data: list }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async (context) => {
  const { userId } = context.locals.auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await context.request.json();
    const { mangaId, title, coverUrl } = body;

    if (!mangaId || !title) {
      return new Response(
        JSON.stringify({ error: "mangaId dan title wajib diisi" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Periksa apakah manga sudah ada di library user
    const existing = await db
      .select()
      .from(userMangas)
      .where(and(eq(userMangas.userId, userId), eq(userMangas.mangaId, mangaId)))
      .limit(1);

    if (existing.length > 0) {
      return new Response(
        JSON.stringify({ error: "Manga sudah ada di library Anda" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    const newEntry = {
      id: crypto.randomUUID(),
      userId,
      mangaId,
      title,
      coverUrl: coverUrl || null,
      currentChapter: 0,
      status: "reading" as const,
      updatedAt: new Date(),
    };

    await db.insert(userMangas).values(newEntry);

    return new Response(JSON.stringify({ success: true, data: newEntry }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PATCH: APIRoute = async (context) => {
  const { userId } = context.locals.auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await context.request.json();
    const { id, currentChapter, status } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "id wajib disertakan" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (currentChapter !== undefined) {
      updateData.currentChapter = Number(currentChapter);
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    await db
      .update(userMangas)
      .set(updateData)
      .where(and(eq(userMangas.id, id), eq(userMangas.userId, userId)));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async (context) => {
  const { userId } = context.locals.auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "id wajib disertakan" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db
      .delete(userMangas)
      .where(and(eq(userMangas.id, id), eq(userMangas.userId, userId)));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
