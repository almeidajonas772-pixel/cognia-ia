/**
 * Tipos do banco (Fase 2). Escritos à mão para dar autocomplete nas queries.
 * Quando adotar o Supabase CLI, substitua por:
 *   supabase gen types typescript --project-id <ref> > lib/supabase/types.ts
 */

export type Plan = "free" | "premium";

type Timestamps = { created_at: string; updated_at: string };

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: Plan;
        } & Timestamps;
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: Plan;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: Plan;
        };
      };
      progress: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          topic: string;
          completed: boolean;
          completed_at: string | null;
        } & Timestamps;
        Insert: {
          user_id: string;
          subject: string;
          topic: string;
          completed?: boolean;
          completed_at?: string | null;
        };
        Update: { completed?: boolean; completed_at?: string | null };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          item_type: string;
          item_id: string;
          created_at: string;
        };
        Insert: { user_id: string; item_type: string; item_id: string };
        Update: never;
      };
      chat_history: {
        Row: {
          id: string;
          user_id: string;
          conversation_id: string;
          prompt: string;
          response: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          conversation_id?: string;
          prompt: string;
          response: string;
        };
        Update: never;
      };
      essays: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          correction: unknown | null;
          grade: number | null;
        } & Timestamps;
        Insert: {
          user_id: string;
          text: string;
          correction?: unknown | null;
          grade?: number | null;
        };
        Update: { text?: string; correction?: unknown | null; grade?: number | null };
      };
      community_posts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
        } & Timestamps;
        Insert: { user_id: string; content: string };
        Update: { content?: string };
      };

      // ── Fase 3 — Biblioteca ENEM (additivo; não altera as tabelas acima) ──
      library_subjects: {
        Row: {
          id: string;
          area: LibraryAreaValue;
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          position: number;
        } & Timestamps;
        Insert: {
          area: LibraryAreaValue;
          slug: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          position?: number;
        };
        Update: Partial<{
          name: string;
          description: string | null;
          icon: string | null;
          position: number;
        }>;
      };
      library_topics: {
        Row: {
          id: string;
          subject_id: string;
          slug: string;
          name: string;
          position: number;
        } & Timestamps;
        Insert: {
          subject_id: string;
          slug: string;
          name: string;
          position?: number;
        };
        Update: Partial<{ name: string; position: number }>;
      };
      library_contents: {
        Row: {
          id: string;
          topic_id: string;
          subject_id: string;
          slug: string;
          title: string;
          summary_short: string;
          recurrence: RecurrenceValue;
          reading_minutes: number;
          is_published: boolean;
          position: number;
        } & Timestamps;
        Insert: {
          topic_id: string;
          subject_id: string;
          slug: string;
          title: string;
          summary_short: string;
          recurrence?: RecurrenceValue;
          reading_minutes?: number;
          is_published?: boolean;
          position?: number;
        };
        Update: Partial<{
          title: string;
          summary_short: string;
          recurrence: RecurrenceValue;
          reading_minutes: number;
          is_published: boolean;
          position: number;
        }>;
      };
      library_content_premium: {
        Row: { content_id: string; body: string; updated_at: string };
        Insert: { content_id: string; body: string };
        Update: { body?: string };
      };
      library_reading_history: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          last_viewed_at: string;
          view_count: number;
        };
        Insert: {
          user_id: string;
          content_id: string;
          last_viewed_at?: string;
          view_count?: number;
        };
        Update: Partial<{ last_viewed_at: string; view_count: number }>;
      };

      // ── Fase 4 — Chat inteligente (additivo) ────────────────────────────
      chat_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          mode: ChatModeValue;
          depth: ChatDepthValue;
          pinned: boolean;
          last_message_at: string;
        } & Timestamps;
        Insert: {
          user_id: string;
          title?: string;
          mode?: ChatModeValue;
          depth?: ChatDepthValue;
          pinned?: boolean;
        };
        Update: Partial<{
          title: string;
          mode: ChatModeValue;
          depth: ChatDepthValue;
          pinned: boolean;
          last_message_at: string;
        }>;
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: ChatRoleValue;
          content: string;
          attachments: unknown;
          model: string | null;
          favorited: boolean;
          created_at: string;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          role: ChatRoleValue;
          content: string;
          attachments?: unknown;
          model?: string | null;
          favorited?: boolean;
        };
        Update: Partial<{ favorited: boolean; content: string }>;
      };
      chat_user_memory: {
        Row: {
          user_id: string;
          level: ChatDepthValue | null;
          learning_style: string | null;
          subjects: Record<string, { seen: number; last_at: string }>;
          difficulties: string[];
          notes: string | null;
          updated_at: string;
          // Fase 15 — memória evolutiva
          evolved_summary: string | null;
          strengths: string[];
          weaknesses: string[];
          memory_version: number;
          interactions_since_evolve: number;
          last_evolved_at: string | null;
        };
        Insert: {
          user_id: string;
          level?: ChatDepthValue | null;
          learning_style?: string | null;
          subjects?: Record<string, { seen: number; last_at: string }>;
          difficulties?: string[];
          notes?: string | null;
          interactions_since_evolve?: number;
        };
        Update: Partial<{
          level: ChatDepthValue | null;
          learning_style: string | null;
          subjects: Record<string, { seen: number; last_at: string }>;
          difficulties: string[];
          notes: string | null;
          evolved_summary: string | null;
          strengths: string[];
          weaknesses: string[];
        }>;
      };
      memory_snapshots: {
        Row: {
          id: number;
          user_id: string;
          version: number;
          payload: Record<string, unknown>;
          reason: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
      chat_usage: {
        Row: {
          user_id: string;
          day: string;
          messages: number;
          images: number;
          summaries: number;
          questions: number;
        };
        Insert: {
          user_id: string;
          day?: string;
          messages?: number;
          images?: number;
          summaries?: number;
          questions?: number;
        };
        Update: Partial<{
          messages: number;
          images: number;
          summaries: number;
          questions: number;
        }>;
      };

      // ── Fase 5 — Progresso e analytics (additivo) ───────────────────────
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          kind: ActivityKindValue;
          subject_slug: string | null;
          ref_id: string | null;
          ref_label: string | null;
          meta: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          user_id: string;
          kind: ActivityKindValue;
          subject_slug?: string | null;
          ref_id?: string | null;
          ref_label?: string | null;
          meta?: Record<string, unknown>;
        };
        Update: never;
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          ended_at: string;
        };
        Insert: { user_id: string };
        Update: Partial<{ ended_at: string }>;
      };
      study_daily: {
        Row: {
          user_id: string;
          day: string;
          minutes: number;
          activities: number;
          last_ping_at: string | null;
        };
        Insert: {
          user_id: string;
          day?: string;
          minutes?: number;
          activities?: number;
        };
        Update: Partial<{ minutes: number; activities: number }>;
      };
      content_difficulty: {
        Row: {
          user_id: string;
          content_id: string;
          level: DifficultyLevelValue;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          content_id: string;
          level: DifficultyLevelValue;
        };
        Update: Partial<{ level: DifficultyLevelValue }>;
      };

      // ── Fase 6 — Redação (additivo) ─────────────────────────────────────
      essay_rubrics: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          source: string | null;
          raw: string | null;
          parsed: unknown;
        } & Timestamps;
        Insert: {
          user_id: string;
          name: string;
          source?: string | null;
          raw?: string | null;
          parsed?: unknown;
        };
        Update: Partial<{ name: string; parsed: unknown }>;
      };
      essay_submissions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          source: EssaySourceValue;
          raw_text: string | null;
          transcription: string | null;
          transcription_confirmed: boolean;
          banca: string;
          rubric_id: string | null;
          correction_type: CorrectionTypeValue;
          detail_level: DetailLevelValue;
          mode: CorrectionModeValue;
          status: EssayStatusValue;
          grade: number | null;
          grade_max: number | null;
          competencies: unknown;
          errors: unknown;
          improvements: unknown;
          max_score_gap: unknown;
          summary: string | null;
          model: string | null;
          corrected_at: string | null;
        } & Timestamps;
        Insert: {
          user_id: string;
          title?: string;
          source?: EssaySourceValue;
          raw_text?: string | null;
          transcription?: string | null;
          transcription_confirmed?: boolean;
          banca?: string;
          rubric_id?: string | null;
          correction_type?: CorrectionTypeValue;
          detail_level?: DetailLevelValue;
          mode?: CorrectionModeValue;
          status?: EssayStatusValue;
        };
        Update: Partial<{
          title: string;
          raw_text: string | null;
          transcription: string | null;
          transcription_confirmed: boolean;
          banca: string;
          rubric_id: string | null;
          correction_type: CorrectionTypeValue;
          detail_level: DetailLevelValue;
          mode: CorrectionModeValue;
          status: EssayStatusValue;
          grade: number | null;
          grade_max: number | null;
          competencies: unknown;
          errors: unknown;
          improvements: unknown;
          max_score_gap: unknown;
          summary: string | null;
          model: string | null;
          corrected_at: string | null;
        }>;
      };
      essay_error_bank: {
        Row: {
          id: string;
          user_id: string;
          signature: string;
          label: string;
          category: string | null;
          occurrences: number;
          first_seen: string;
          last_seen: string;
        };
        Insert: never;
        Update: never;
      };

      // ── Fase 7 — Comunidade (additivo) ─────────────────────────────────
      app_admins: {
        Row: { user_id: string; created_at: string };
        Insert: never;
        Update: never;
      };
      community_groups: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          image_url: string | null;
          category: string;
          visibility: GroupVisibilityValue;
          rules: string | null;
          official: boolean;
          created_by: string | null;
          member_count: number;
        } & Timestamps;
        Insert: {
          slug: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          category?: string;
          visibility?: GroupVisibilityValue;
          rules?: string | null;
          official?: boolean;
          created_by?: string | null;
        };
        Update: Partial<{
          name: string;
          description: string | null;
          image_url: string | null;
          category: string;
          visibility: GroupVisibilityValue;
          rules: string | null;
          official: boolean;
        }>;
      };
      community_group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: MemberRoleValue;
          joined_at: string;
        };
        Insert: { group_id: string; user_id: string; role?: MemberRoleValue };
        Update: Partial<{ role: MemberRoleValue }>;
      };
      community_group_posts: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          kind: PostKindValue;
          title: string;
          content: string;
          attachments: unknown;
          source_ref: unknown;
          official: boolean;
          pinned: boolean;
          moderation: ModerationStatusValue;
          moderation_note: string | null;
          like_count: number;
          comment_count: number;
        } & Timestamps;
        Insert: {
          group_id: string;
          user_id: string;
          kind?: PostKindValue;
          title: string;
          content: string;
          attachments?: unknown;
          source_ref?: unknown;
          official?: boolean;
          pinned?: boolean;
          moderation?: ModerationStatusValue;
          moderation_note?: string | null;
        };
        Update: Partial<{
          kind: PostKindValue;
          title: string;
          content: string;
          attachments: unknown;
          official: boolean;
          pinned: boolean;
          moderation: ModerationStatusValue;
          moderation_note: string | null;
        }>;
      };
      community_post_likes: {
        Row: { post_id: string; user_id: string; created_at: string };
        Insert: { post_id: string; user_id: string };
        Update: never;
      };
      community_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          parent_id: string | null;
          content: string;
          moderation: ModerationStatusValue;
          edited: boolean;
        } & Timestamps;
        Insert: {
          post_id: string;
          user_id: string;
          parent_id?: string | null;
          content: string;
          moderation?: ModerationStatusValue;
        };
        Update: Partial<{ content: string; edited: boolean; moderation: ModerationStatusValue }>;
      };
      community_reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: ReportTargetValue;
          target_id: string;
          reason: ReportReasonValue;
          detail: string | null;
          resolved: boolean;
          created_at: string;
        };
        Insert: {
          reporter_id: string;
          target_type: ReportTargetValue;
          target_id: string;
          reason: ReportReasonValue;
          detail?: string | null;
        };
        Update: Partial<{ resolved: boolean }>;
      };
      community_library_submissions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          suggested_subject: string | null;
          suggested_topic: string | null;
          source_conversation_id: string | null;
          status: SubmissionStatusValue;
          admin_note: string | null;
          reviewed_by: string | null;
          published_content_id: string | null;
        } & Timestamps;
        Insert: {
          user_id: string;
          title: string;
          content: string;
          suggested_subject?: string | null;
          suggested_topic?: string | null;
          source_conversation_id?: string | null;
        };
        Update: Partial<{
          status: SubmissionStatusValue;
          admin_note: string | null;
          reviewed_by: string | null;
          published_content_id: string | null;
        }>;
      };
      community_notifications: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          title: string;
          href: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: never;
        Update: Partial<{ read: boolean }>;
      };

      // ── Fase 8 — Billing / monetização (additivo) ──────────────────────
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          status: SubscriptionStatusValue;
          provider: string;
          provider_ref: string | null;
          cycle: BillingCycleValue;
          price: number;
          coupon_code: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          started_at: string;
          updated_at: string;
        };
        // escrita reservada ao service role (webhook) e às funções SQL
        Insert: {
          user_id: string;
          plan?: string;
          status?: SubscriptionStatusValue;
          provider?: string;
          provider_ref?: string | null;
          cycle?: BillingCycleValue;
          price?: number;
          coupon_code?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
        };
        Update: Partial<{
          status: SubscriptionStatusValue;
          provider: string;
          provider_ref: string | null;
          cycle: BillingCycleValue;
          price: number;
          coupon_code: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
        }>;
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          amount: number;
          currency: string;
          status: PaymentStatusValue;
          provider: string;
          provider_ref: string | null;
          method: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          subscription_id?: string | null;
          amount?: number;
          currency?: string;
          status?: PaymentStatusValue;
          provider?: string;
          provider_ref?: string | null;
          method?: string | null;
        };
        Update: never;
      };
      billing_config: {
        Row: { key: string; value: unknown; updated_at: string };
        Insert: { key: string; value: unknown };
        Update: Partial<{ value: unknown }>;
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_pct: number;
          discount_fixed: number;
          applies_to: string;
          max_redemptions: number | null;
          per_user_limit: number;
          valid_from: string | null;
          valid_until: string | null;
          active: boolean;
          redemptions: number;
        } & Timestamps;
        Insert: {
          code: string;
          description?: string | null;
          discount_pct?: number;
          discount_fixed?: number;
          applies_to?: string;
          max_redemptions?: number | null;
          per_user_limit?: number;
          valid_from?: string | null;
          valid_until?: string | null;
          active?: boolean;
        };
        Update: Partial<{
          description: string | null;
          discount_pct: number;
          discount_fixed: number;
          applies_to: string;
          max_redemptions: number | null;
          per_user_limit: number;
          valid_from: string | null;
          valid_until: string | null;
          active: boolean;
        }>;
      };
      coupon_redemptions: {
        Row: {
          id: string;
          coupon_id: string;
          user_id: string;
          subscription_id: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
      billing_events: {
        Row: {
          id: string;
          user_id: string | null;
          type: string;
          detail: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          type: string;
          detail?: Record<string, unknown>;
        };
        Update: never;
      };
      feature_usage: {
        Row: {
          user_id: string;
          feature: string;
          period: string;
          count: number;
        };
        Insert: never;
        Update: never;
      };

      // ── Fase 9 — Admin / Blog / Analytics (additivo) ───────────────────
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          subtitle: string | null;
          excerpt: string | null;
          content: string;
          cover_image_url: string | null;
          category: string;
          tags: string[];
          author_name: string;
          status: BlogStatusValue;
          seo_title: string | null;
          seo_description: string | null;
          keywords: string[];
          reading_minutes: number;
          published_at: string | null;
          scheduled_for: string | null;
        } & Timestamps;
        Insert: {
          slug: string;
          title: string;
          subtitle?: string | null;
          excerpt?: string | null;
          content?: string;
          cover_image_url?: string | null;
          category?: string;
          tags?: string[];
          author_name?: string;
          status?: BlogStatusValue;
          seo_title?: string | null;
          seo_description?: string | null;
          keywords?: string[];
          reading_minutes?: number;
          published_at?: string | null;
          scheduled_for?: string | null;
        };
        Update: Partial<{
          slug: string;
          title: string;
          subtitle: string | null;
          excerpt: string | null;
          content: string;
          cover_image_url: string | null;
          category: string;
          tags: string[];
          author_name: string;
          status: BlogStatusValue;
          seo_title: string | null;
          seo_description: string | null;
          keywords: string[];
          reading_minutes: number;
          published_at: string | null;
          scheduled_for: string | null;
        }>;
      };
      admin_logs: {
        Row: {
          id: string;
          admin_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          detail: Record<string, unknown>;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
      site_config: {
        Row: { key: string; value: unknown; updated_at: string };
        Insert: { key: string; value: unknown };
        Update: Partial<{ value: unknown }>;
      };
      user_moderation: {
        Row: {
          user_id: string;
          status: UserStatusValue;
          reason: string | null;
          until: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          status?: UserStatusValue;
          reason?: string | null;
          until?: string | null;
        };
        Update: Partial<{
          status: UserStatusValue;
          reason: string | null;
          until: string | null;
        }>;
      };
      page_views: {
        Row: {
          id: number;
          path: string;
          user_id: string | null;
          referrer: string | null;
          device: string | null;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };

      // ── Fase 10 — Infraestrutura / Observabilidade (additivo) ──────────
      jobs: {
        Row: {
          id: string;
          type: string;
          status: JobStatusValue;
          payload: Record<string, unknown>;
          result: Record<string, unknown> | null;
          progress: number;
          attempts: number;
          max_attempts: number;
          error: string | null;
          user_id: string | null;
          run_after: string;
          started_at: string | null;
          finished_at: string | null;
        } & Timestamps;
        Insert: {
          type: string;
          payload?: Record<string, unknown>;
          user_id?: string | null;
          max_attempts?: number;
          run_after?: string;
          status?: JobStatusValue;
        };
        Update: Partial<{
          status: JobStatusValue;
          result: Record<string, unknown> | null;
          progress: number;
          error: string | null;
          run_after: string;
        }>;
      };
      system_logs: {
        Row: {
          id: number;
          level: LogLevelValue;
          source: string;
          message: string;
          user_id: string | null;
          meta: Record<string, unknown>;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
      ai_calls: {
        Row: {
          id: number;
          provider: string;
          model: string | null;
          kind: string;
          user_id: string | null;
          tokens_in: number | null;
          tokens_out: number | null;
          duration_ms: number | null;
          cost_usd: number | null;
          ok: boolean;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
      storage_objects: {
        Row: {
          id: string;
          bucket: string;
          path: string;
          owner_id: string | null;
          kind: string | null;
          size_bytes: number | null;
          mime: string | null;
          created_at: string;
        };
        Insert: {
          bucket: string;
          path: string;
          owner_id?: string | null;
          kind?: string | null;
          size_bytes?: number | null;
          mime?: string | null;
        };
        Update: never;
      };

      // ── Fase 11 — Segurança / Privacidade / LGPD (additivo) ────────────
      user_security: {
        Row: {
          user_id: string;
          mfa_enabled: boolean;
          sessions_valid_after: string;
          deletion_requested_at: string | null;
          deletion_scheduled_for: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          mfa_enabled?: boolean;
          sessions_valid_after?: string;
        };
        Update: Partial<{
          mfa_enabled: boolean;
          sessions_valid_after: string;
          deletion_requested_at: string | null;
          deletion_scheduled_for: string | null;
        }>;
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          token_iat: number | null;
          user_agent: string | null;
          ip_hash: string | null;
          device_label: string | null;
          created_at: string;
          last_seen_at: string;
          revoked_at: string | null;
        };
        Insert: {
          user_id: string;
          token_iat?: number | null;
          user_agent?: string | null;
          ip_hash?: string | null;
          device_label?: string | null;
        };
        Update: Partial<{ last_seen_at: string; revoked_at: string | null; token_iat: number | null }>;
      };
      user_consent: {
        Row: {
          user_id: string;
          analytics: boolean;
          marketing: boolean;
          terms_version: string | null;
          policy_version: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          analytics?: boolean;
          marketing?: boolean;
          terms_version?: string | null;
          policy_version?: string | null;
        };
        Update: Partial<{
          analytics: boolean;
          marketing: boolean;
          terms_version: string | null;
          policy_version: string | null;
        }>;
      };
      security_events: {
        Row: {
          id: number;
          user_id: string | null;
          email: string | null;
          event: string;
          ip_hash: string | null;
          user_agent: string | null;
          meta: Record<string, unknown>;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
      data_exports: {
        Row: {
          id: string;
          user_id: string;
          status: DataExportStatusValue;
          storage_path: string | null;
          size_bytes: number | null;
          error: string | null;
          requested_at: string;
          completed_at: string | null;
          expires_at: string | null;
        };
        Insert: { user_id: string; status?: DataExportStatusValue };
        Update: Partial<{
          status: DataExportStatusValue;
          storage_path: string | null;
          size_bytes: number | null;
          error: string | null;
          completed_at: string | null;
          expires_at: string | null;
        }>;
      };

      // ── Fase 13 — Onboarding (additivo) ────────────────────────────────
      user_onboarding: {
        Row: {
          user_id: string;
          completed: boolean;
          goal: string | null;
          exam_date: string | null;
          target_course: string | null;
          focus_areas: string[];
          level: string | null;
          steps_done: string[];
          started_at: string;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          completed?: boolean;
          goal?: string | null;
          exam_date?: string | null;
          target_course?: string | null;
          focus_areas?: string[];
          level?: string | null;
          steps_done?: string[];
        };
        Update: Partial<{
          completed: boolean;
          goal: string | null;
          exam_date: string | null;
          target_course: string | null;
          focus_areas: string[];
          level: string | null;
          steps_done: string[];
          completed_at: string | null;
        }>;
      };
      waitlist: {
        Row: {
          id: string;
          email: string;
          source: string | null;
          meta: Record<string, unknown>;
          invited_at: string | null;
          created_at: string;
        };
        Insert: {
          email: string;
          source?: string | null;
          meta?: Record<string, unknown>;
        };
        Update: Partial<{ invited_at: string | null; source: string | null }>;
      };

      // ── Fase 14 — Crescimento / Gamificação / Indicação (additivo) ─────
      user_gamification: {
        Row: {
          user_id: string;
          xp: number;
          level: number;
          current_streak: number;
          longest_streak: number;
          last_active_date: string | null;
          streak_freezes: number;
          weekly_goal_minutes: number;
          last_nudge_date: string | null;
          updated_at: string;
        };
        Insert: { user_id: string };
        Update: Partial<{ weekly_goal_minutes: number }>;
      };
      xp_events: {
        Row: {
          id: number;
          user_id: string;
          kind: string;
          amount: number;
          dedupe_key: string | null;
          meta: Record<string, unknown>;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
      user_achievements: {
        Row: {
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          seen: boolean;
        };
        // escrita via service role (sem política de INSERT no RLS)
        Insert: { user_id: string; achievement_id: string; seen?: boolean };
        Update: Partial<{ seen: boolean }>;
      };
      referral_codes: {
        Row: { user_id: string; code: string; created_at: string };
        Insert: never;
        Update: never;
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          code: string;
          status: ReferralStatusValue;
          referrer_reward_xp: number;
          referred_reward_xp: number;
          created_at: string;
          qualified_at: string | null;
          rewarded_at: string | null;
        };
        Insert: never;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_premium: { Args: Record<string, never>; Returns: boolean };
      user_is_blocked: { Args: { p_user: string }; Returns: boolean };
      log_admin_action: {
        Args: {
          p_action: string;
          p_target_type?: string | null;
          p_target_id?: string | null;
          p_detail?: Record<string, unknown>;
        };
        Returns: undefined;
      };
      admin_set_plan: {
        Args: { p_user: string; p_plan: string };
        Returns: undefined;
      };
      track_page_view: {
        Args: {
          p_path: string;
          p_referrer?: string | null;
          p_device?: string | null;
          p_duration_ms?: number | null;
        };
        Returns: undefined;
      };
      sync_user_plan: { Args: { p_user: string }; Returns: undefined };
      cancel_subscription: { Args: Record<string, never>; Returns: undefined };
      expire_due_subscriptions: { Args: Record<string, never>; Returns: number };
      activate_subscription: {
        Args: {
          p_cycle: string;
          p_provider?: string;
          p_provider_ref?: string | null;
          p_coupon?: string | null;
          p_amount?: number | null;
        };
        Returns: string;
      };
      bump_feature_usage: {
        Args: {
          p_user: string;
          p_feature: string;
          p_period: string;
          p_delta?: number;
        };
        Returns: number;
      };
      is_app_admin: { Args: Record<string, never>; Returns: boolean };
      is_group_staff: { Args: { p_group: string }; Returns: boolean };
      is_group_member: { Args: { p_group: string }; Returns: boolean };
      community_notify: {
        Args: {
          p_user: string;
          p_kind: string;
          p_title: string;
          p_href?: string | null;
        };
        Returns: undefined;
      };
      bump_chat_usage: {
        Args: {
          p_user: string;
          p_messages?: number;
          p_images?: number;
          p_summaries?: number;
          p_questions?: number;
        };
        Returns: undefined;
      };
      log_activity: {
        Args: {
          p_user: string;
          p_kind: ActivityKindValue;
          p_subject?: string | null;
          p_ref_id?: string | null;
          p_ref_label?: string | null;
          p_meta?: Record<string, unknown>;
        };
        Returns: undefined;
      };
      study_ping: { Args: { p_user: string }; Returns: undefined };
      bump_error_bank: {
        Args: {
          p_user: string;
          p_signature: string;
          p_label: string;
          p_category?: string | null;
        };
        Returns: number;
      };
      claim_jobs: {
        Args: { p_limit?: number };
        Returns: Database["public"]["Tables"]["jobs"]["Row"][];
      };
      finish_job: {
        Args: {
          p_id: string;
          p_status: JobStatusValue;
          p_result?: Record<string, unknown> | null;
          p_error?: string | null;
        };
        Returns: undefined;
      };
      set_job_progress: {
        Args: { p_id: string; p_progress: number };
        Returns: undefined;
      };
      log_system_event: {
        Args: {
          p_level: LogLevelValue;
          p_source: string;
          p_message: string;
          p_user?: string | null;
          p_meta?: Record<string, unknown>;
        };
        Returns: undefined;
      };
      record_ai_call: {
        Args: {
          p_provider: string;
          p_model: string | null;
          p_kind: string;
          p_user: string | null;
          p_tokens_in?: number | null;
          p_tokens_out?: number | null;
          p_duration_ms?: number | null;
          p_cost_usd?: number | null;
          p_ok?: boolean;
        };
        Returns: undefined;
      };
      publish_scheduled_posts: { Args: Record<string, never>; Returns: number };
      purge_old_telemetry: { Args: { p_days?: number }; Returns: undefined };
      ensure_user_security: { Args: { p_user: string }; Returns: undefined };
      log_security_event: {
        Args: {
          p_event: string;
          p_user?: string | null;
          p_email?: string | null;
          p_ip_hash?: string | null;
          p_ua?: string | null;
          p_meta?: Record<string, unknown>;
        };
        Returns: undefined;
      };
      revoke_all_sessions: { Args: { p_user?: string | null }; Returns: undefined };
      revoke_session: { Args: { p_session: string }; Returns: undefined };
      request_account_deletion: { Args: { p_grace_days?: number }; Returns: string };
      cancel_account_deletion: { Args: Record<string, never>; Returns: undefined };
      purge_due_deletions: { Args: Record<string, never>; Returns: number };
      expire_due_exports: { Args: Record<string, never>; Returns: number };
      set_user_consent: {
        Args: {
          p_analytics: boolean;
          p_marketing: boolean;
          p_terms?: string | null;
          p_policy?: string | null;
        };
        Returns: undefined;
      };
      complete_onboarding: { Args: Record<string, never>; Returns: undefined };
      level_for_xp: { Args: { p_xp: number }; Returns: number };
      ensure_gamification: { Args: { p_user: string }; Returns: undefined };
      grant_xp: {
        Args: {
          p_user: string;
          p_kind: string;
          p_amount: number;
          p_dedupe?: string | null;
          p_meta?: Record<string, unknown>;
        };
        Returns: number;
      };
      touch_streak: { Args: { p_user: string }; Returns: number };
      get_or_create_referral_code: { Args: Record<string, never>; Returns: string };
      record_referral: { Args: { p_code: string }; Returns: boolean };
      qualify_referral: { Args: Record<string, never>; Returns: undefined };
      notify_user: {
        Args: {
          p_user: string;
          p_kind: string;
          p_title: string;
          p_href?: string | null;
        };
        Returns: undefined;
      };
      run_growth_maintenance: {
        Args: Record<string, never>;
        Returns: Record<string, unknown>;
      };
      bump_memory_interactions: {
        Args: { p_user: string; p_delta?: number };
        Returns: number;
      };
      apply_memory_evolution: {
        Args: {
          p_user: string;
          p_summary: string;
          p_strengths: string[];
          p_weaknesses: string[];
          p_style: string;
          p_payload: Record<string, unknown>;
        };
        Returns: number;
      };
      enqueue_due_memory_evolutions: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: {
      plan_tier: Plan;
      library_area: LibraryAreaValue;
      library_recurrence: RecurrenceValue;
      chat_role: ChatRoleValue;
      chat_mode: ChatModeValue;
      chat_depth: ChatDepthValue;
      activity_kind: ActivityKindValue;
      difficulty_level: DifficultyLevelValue;
      essay_status: EssayStatusValue;
      essay_source: EssaySourceValue;
      correction_type: CorrectionTypeValue;
      detail_level: DetailLevelValue;
      correction_mode: CorrectionModeValue;
      group_visibility: GroupVisibilityValue;
      member_role: MemberRoleValue;
      post_kind: PostKindValue;
      moderation_status: ModerationStatusValue;
      report_reason: ReportReasonValue;
      report_target: ReportTargetValue;
      submission_status: SubmissionStatusValue;
      subscription_status: SubscriptionStatusValue;
      payment_status: PaymentStatusValue;
      billing_cycle: BillingCycleValue;
      blog_status: BlogStatusValue;
      user_status: UserStatusValue;
      job_status: JobStatusValue;
      log_level: LogLevelValue;
      referral_status: ReferralStatusValue;
    };
  };
}

type JobStatusValue = "queued" | "running" | "done" | "error";
type LogLevelValue = "debug" | "info" | "warn" | "error";
type DataExportStatusValue =
  | "pending"
  | "processing"
  | "ready"
  | "error"
  | "expired";
type ReferralStatusValue = "pending" | "qualified" | "rewarded" | "void";

type BlogStatusValue = "rascunho" | "agendado" | "publicado";
type UserStatusValue = "ativo" | "suspenso" | "banido";

type SubscriptionStatusValue =
  | "active"
  | "cancelled"
  | "expired"
  | "paused"
  | "pending";
type PaymentStatusValue =
  | "approved"
  | "rejected"
  | "pending"
  | "in_process"
  | "refunded";
type BillingCycleValue = "mensal" | "anual";

type GroupVisibilityValue = "publica" | "privada";
type MemberRoleValue = "membro" | "moderador" | "admin";
type PostKindValue =
  | "duvida"
  | "explicacao"
  | "resumo"
  | "material"
  | "noticia"
  | "discussao"
  | "dica";
type ModerationStatusValue = "aprovado" | "pendente" | "bloqueado" | "revisao";
type ReportReasonValue =
  | "spam"
  | "ofensa"
  | "improprio"
  | "falso"
  | "propaganda"
  | "outro";
type ReportTargetValue = "post" | "comment" | "material";
type SubmissionStatusValue = "pendente" | "aprovado" | "reprovado" | "ajustes";

type ActivityKindValue =
  | "content_read"
  | "content_completed"
  | "chat"
  | "questions"
  | "essay"
  | "community";
type DifficultyLevelValue = "facil" | "medio" | "dificil";
type EssayStatusValue =
  | "rascunho"
  | "aguardando_transcricao"
  | "transcricao_confirmada"
  | "corrigindo"
  | "corrigida"
  | "erro";
type EssaySourceValue = "texto" | "imagem" | "pdf";
type CorrectionTypeValue = "simples" | "comentada";
type DetailLevelValue = "objetiva" | "equilibrada" | "detalhada";
type CorrectionModeValue = "treino" | "simulacao";

type LibraryAreaValue =
  | "linguagens"
  | "matematica"
  | "natureza"
  | "humanas"
  | "redacao";

type RecurrenceValue =
  | "muito_recorrente"
  | "recorrente"
  | "ocasional"
  | "raro";

type ChatRoleValue = "user" | "assistant" | "system";
type ChatModeValue =
  | "professor"
  | "simples"
  | "detalhado"
  | "resumo"
  | "prova";
type ChatDepthValue = "basico" | "intermediario" | "avancado";

export type UserProfile = Database["public"]["Tables"]["users"]["Row"];
