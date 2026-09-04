/**
 * Seed da Biblioteca ENEM (Fase 3).
 *
 *   npm run seed:biblioteca
 *
 * Lê content/biblioteca/manifest.mjs + os .md e faz UPSERT no Supabase usando a
 * SERVICE ROLE KEY (ignora RLS). Idempotente: rode quantas vezes quiser.
 *
 * Requer no .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { CATALOG } from "../content/biblioteca/manifest.mjs";

config({ path: ".env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, "..", "content", "biblioteca");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "\n✗ Faltam variáveis. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local\n"
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  let nSubjects = 0;
  let nTopics = 0;
  let nContents = 0;

  for (const [sIdx, subject] of CATALOG.entries()) {
    const { data: subjectRow, error: sErr } = await db
      .from("library_subjects")
      .upsert(
        {
          area: subject.area,
          slug: subject.slug,
          name: subject.name,
          description: subject.description,
          icon: subject.icon,
          position: sIdx,
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();
    if (sErr) throw new Error(`matéria ${subject.slug}: ${sErr.message}`);
    nSubjects++;

    for (const [tIdx, topic] of subject.topics.entries()) {
      const { data: topicRow, error: tErr } = await db
        .from("library_topics")
        .upsert(
          {
            subject_id: subjectRow.id,
            slug: topic.slug,
            name: topic.name,
            position: tIdx,
          },
          { onConflict: "subject_id,slug" }
        )
        .select("id")
        .single();
      if (tErr) throw new Error(`tema ${topic.slug}: ${tErr.message}`);
      nTopics++;

      for (const [cIdx, content] of topic.contents.entries()) {
        const { data: contentRow, error: cErr } = await db
          .from("library_contents")
          .upsert(
            {
              topic_id: topicRow.id,
              subject_id: subjectRow.id,
              slug: content.slug,
              title: content.title,
              summary_short: content.summaryShort,
              recurrence: content.recurrence,
              reading_minutes: content.readingMinutes,
              is_published: true,
              position: cIdx,
            },
            { onConflict: "subject_id,slug" }
          )
          .select("id")
          .single();
        if (cErr) throw new Error(`conteúdo ${content.slug}: ${cErr.message}`);

        const body = await readFile(
          join(CONTENT_DIR, content.premiumFile),
          "utf8"
        );
        const { error: pErr } = await db
          .from("library_content_premium")
          .upsert(
            { content_id: contentRow.id, body },
            { onConflict: "content_id" }
          );
        if (pErr) throw new Error(`premium ${content.slug}: ${pErr.message}`);

        nContents++;
        console.log(`  ✓ ${subject.name} › ${topic.name} › ${content.title}`);
      }
    }
  }

  console.log(
    `\n✓ Seed concluído: ${nSubjects} matérias, ${nTopics} temas, ${nContents} conteúdos.\n`
  );
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}\n`);
  process.exit(1);
});
