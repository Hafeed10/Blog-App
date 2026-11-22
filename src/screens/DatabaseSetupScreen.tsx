import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../services/supabase';

interface DatabaseSetupScreenProps {
  onBack: () => void;
}

export const DatabaseSetupScreen: React.FC<DatabaseSetupScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const { databaseStatus, recheckDatabase } = useBlog();
  const [isChecking, setIsChecking] = useState(false);

  const handleRecheck = async () => {
    setIsChecking(true);
    await recheckDatabase();
    setIsChecking(false);
    Alert.alert('Database Check Complete', 'Status has been refreshed from Supabase.');
  };

  const isLive = databaseStatus.tableExists;

  const sqlSnippet = `-- 1. Create Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Tech',
    read_time TEXT DEFAULT '4 min',
    author_name TEXT NOT NULL DEFAULT 'Elena Vance',
    author_avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    author_role TEXT DEFAULT 'Design Technologist',
    likes_count INTEGER DEFAULT 142,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 3. Public Policies (Read, Insert, Update)
CREATE POLICY "Allow public read access for posts"
    ON public.posts FOR SELECT USING (true);

CREATE POLICY "Allow public insert access for posts"
    ON public.posts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access for likes"
    ON public.posts FOR UPDATE USING (true);

-- 4. Optional Extended Columns (Rich media & custom audio)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS cover_style TEXT DEFAULT 'banner';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS audio_title TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS audio_duration TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_phone TEXT;

-- 5. Comments Table & Policies
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for comments"
    ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for comments"
    ON public.comments FOR INSERT WITH CHECK (true);`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Database & Supabase</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: isLive
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(245, 158, 11, 0.1)',
              borderColor: isLive
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(245, 158, 11, 0.3)',
            },
          ]}
        >
          <View style={styles.statusHeaderRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isLive ? '#10B981' : '#F59E0B' },
              ]}
            />
            <Text
              style={[
                styles.statusTitle,
                { color: isLive ? '#10B981' : '#F59E0B' },
              ]}
            >
              {isLive ? 'Supabase Database Connected & Live' : 'Database Awaiting Schema'}
            </Text>
          </View>

          <Text style={[styles.statusDescription, { color: colors.text }]}>
            {isLive
              ? `The 'posts' table is active and verified in public schema. Realtime sync is operational with ${databaseStatus.rowCount} remote posts.`
              : 'Your Supabase credentials are wired in! Run the SQL schema query in your Supabase dashboard to activate cloud data storage.'}
          </Text>

          {databaseStatus.errorMessage && !isLive ? (
            <View style={styles.errorBox}>
              <Ionicons name="information-circle-outline" size={16} color="#F59E0B" />
              <Text style={styles.errorText}>{databaseStatus.errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleRecheck}
            disabled={isChecking}
            style={[
              styles.recheckBtn,
              { backgroundColor: isLive ? '#10B981' : colors.primary },
            ]}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={16} color="#FFF" />
                <Text style={styles.recheckBtnText}>Test & Recheck Connection</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Credentials Info */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            PROJECT CREDENTIALS
          </Text>

          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
              Supabase Project URL
            </Text>
            <Text style={[styles.fieldValue, { color: colors.primary }]}>
              {SUPABASE_URL}
            </Text>
          </View>

          <View style={[styles.fieldRow, { borderTopWidth: 1, borderTopColor: colors.separator }]}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
              Publishable API Key
            </Text>
            <Text style={[styles.fieldValue, { color: colors.textSecondary }]}>
              {SUPABASE_ANON_KEY.slice(0, 15)}...{SUPABASE_ANON_KEY.slice(-8)}
            </Text>
          </View>
        </View>

        {/* 3-Step Setup Instructions */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            1-CLICK SETUP STEPS
          </Text>

          <View style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Open Supabase Dashboard
              </Text>
              <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                Navigate to your project SQL editor in browser:
                {'\n'}
                https://supabase.com/dashboard
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Run the SQL Schema
              </Text>
              <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                Open the file <Text style={{ fontWeight: '700' }}>supabase-schema.sql</Text> in
                your project directory, or copy the snippet below, paste into Supabase SQL
                Editor, and click "Run".
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Verify & Enjoy!
              </Text>
              <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                Come back here and tap "Test & Recheck Connection". The app will immediately
                switch to live cloud database mode!
              </Text>
            </View>
          </View>
        </View>

        {/* SQL Preview */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            SCHEMA SNIPPET (supabase-schema.sql)
          </Text>

          <View style={[styles.codeBlock, { backgroundColor: colors.surface }]}>
            <Text style={[styles.codeText, { color: colors.textSecondary }]}>
              {sqlSnippet}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  statusCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
  },
  errorText: {
    color: '#F59E0B',
    fontSize: 11,
    flex: 1,
  },
  recheckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  recheckBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  infoCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  fieldRow: {
    paddingVertical: 10,
  },
  fieldLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  codeBlock: {
    padding: 12,
    borderRadius: 12,
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
