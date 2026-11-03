/**
 * Local Campus Database Engine (Fallback when Supabase credentials are placeholders)
 * Mirrors the exact PostgreSQL schema, RLS rules, and RPC atomic functions from
 * supabase/migrations/001_initial_schema.sql so the app works out-of-the-box.
 */

const STORAGE_KEY = 'playerfinder_db_v1'
const SESSION_KEY = 'playerfinder_session_v1'

const addHours = (hours) => new Date(Date.now() + hours * 3600 * 1000).toISOString()

const INITIAL_DB = {
  sports: [
    { id: 1, name: 'Badminton', default_players_needed: 2, icon: 'racquet' },
    { id: 2, name: 'Table Tennis', default_players_needed: 2, icon: 'table-tennis' },
    { id: 3, name: 'Cricket', default_players_needed: 12, icon: 'cricket' },
    { id: 4, name: 'Football', default_players_needed: 10, icon: 'football' },
    { id: 5, name: 'Basketball', default_players_needed: 6, icon: 'basketball' },
    { id: 6, name: 'Volleyball', default_players_needed: 12, icon: 'volleyball' },
    { id: 7, name: 'Chess', default_players_needed: 2, icon: 'chess' },
    { id: 8, name: 'Tennis', default_players_needed: 2, icon: 'tennis' },
  ],
  users: [
    {
      id: 'user-aarav',
      email: 'aarav@college.edu.in',
      password: 'Password@123',
      email_confirmed_at: new Date().toISOString(),
    },
    {
      id: 'user-meera',
      email: 'meera@college.edu.in',
      password: 'Password@123',
      email_confirmed_at: new Date().toISOString(),
    },
    {
      id: 'user-rohan',
      email: 'rohan@college.edu.in',
      password: 'Password@123',
      email_confirmed_at: new Date().toISOString(),
    },
    {
      id: 'user-priya',
      email: 'priya@college.edu.in',
      password: 'Password@123',
      email_confirmed_at: new Date().toISOString(),
    },
  ],
  profiles: [
    {
      id: 'user-aarav',
      full_name: 'Aarav Sharma',
      roll_number: '23CS101',
      department: 'Computer Science',
      year: 2,
      contact: '+91 98765 43210',
      avatar_url: '',
      bio: 'Plays badminton every evening at Indoor Court 2. Looking for consistent singles/doubles partners!',
      avg_rating: 4.8,
      rating_count: 12,
      matches_played: 15,
      created_at: addHours(-500),
    },
    {
      id: 'user-meera',
      full_name: 'Meera Nair',
      roll_number: '24EC112',
      department: 'Electronics & Comm.',
      year: 1,
      contact: '+91 98111 22334',
      avatar_url: '',
      bio: 'First-year student keen on meeting fellow badminton and table tennis players on campus.',
      avg_rating: 4.6,
      rating_count: 5,
      matches_played: 6,
      created_at: addHours(-320),
    },
    {
      id: 'user-rohan',
      full_name: 'Rohan Verma',
      roll_number: '22ME045',
      department: 'Mechanical Eng.',
      year: 3,
      contact: '+91 99223 34455',
      avatar_url: '',
      bio: 'Competitive badminton & basketball player. Prefer fast-paced intermediate/advanced rallies.',
      avg_rating: 4.9,
      rating_count: 21,
      matches_played: 24,
      created_at: addHours(-800),
    },
    {
      id: 'user-priya',
      full_name: 'Priya Patel',
      roll_number: '23IT088',
      department: 'Information Tech',
      year: 2,
      contact: '+91 97654 32109',
      avatar_url: '',
      bio: 'Casual games between lectures! Chess, TT, and evening badminton doubles.',
      avg_rating: 4.7,
      rating_count: 8,
      matches_played: 10,
      created_at: addHours(-450),
    },
  ],
  player_sport_levels: [
    { user_id: 'user-aarav', sport_id: 1, skill_level: 'intermediate' },
    { user_id: 'user-aarav', sport_id: 2, skill_level: 'beginner' },
    { user_id: 'user-meera', sport_id: 1, skill_level: 'beginner' },
    { user_id: 'user-meera', sport_id: 2, skill_level: 'intermediate' },
    { user_id: 'user-rohan', sport_id: 1, skill_level: 'advanced' },
    { user_id: 'user-rohan', sport_id: 5, skill_level: 'advanced' },
    { user_id: 'user-priya', sport_id: 1, skill_level: 'intermediate' },
    { user_id: 'user-priya', sport_id: 7, skill_level: 'intermediate' },
  ],
  matches: [
    {
      id: 'match-1',
      host_id: 'user-aarav',
      sport_id: 1,
      venue: 'Indoor Sports Complex — Court 2',
      match_at: addHours(3),
      players_needed: 4,
      skill_level: 'intermediate',
      join_mode: 'instant',
      status: 'open',
      notes: 'Bringing Yonex Mavis 350 shuttles. Need 2 more for spirited doubles!',
      created_at: addHours(-4),
    },
    {
      id: 'match-2',
      host_id: 'user-rohan',
      sport_id: 1,
      venue: 'Indoor Sports Complex — Court 1',
      match_at: addHours(5),
      players_needed: 2,
      skill_level: 'advanced',
      join_mode: 'approval',
      status: 'open',
      notes: 'High-intensity singles 21-point best of 3 sets. Non-marking shoes required.',
      created_at: addHours(-6),
    },
    {
      id: 'match-3',
      host_id: 'user-meera',
      sport_id: 2,
      venue: 'Student Activity Center — TT Hall',
      match_at: addHours(8),
      players_needed: 2,
      skill_level: 'beginner',
      join_mode: 'instant',
      status: 'open',
      notes: 'Friendly evening table tennis rally. Extra paddle available if you need one!',
      created_at: addHours(-2),
    },
    {
      id: 'match-4',
      host_id: 'user-priya',
      sport_id: 5,
      venue: 'Main Outdoor Basketball Court',
      match_at: addHours(24),
      players_needed: 6,
      skill_level: 'any',
      join_mode: 'instant',
      status: 'open',
      notes: '3v3 half-court pickup game tomorrow evening. All skill levels welcome!',
      created_at: addHours(-5),
    },
    {
      id: 'match-5',
      host_id: 'user-aarav',
      sport_id: 7,
      venue: 'Central Library Lounge — Table 4',
      match_at: addHours(28),
      players_needed: 2,
      skill_level: 'intermediate',
      join_mode: 'approval',
      status: 'open',
      notes: '10+0 Rapid OTB games between classes.',
      created_at: addHours(-3),
    },
    {
      id: 'match-6',
      host_id: 'user-aarav',
      sport_id: 1,
      venue: 'Indoor Sports Complex — Court 3',
      match_at: addHours(-24),
      players_needed: 2,
      skill_level: 'intermediate',
      join_mode: 'instant',
      status: 'completed',
      notes: 'Evening singles session.',
      created_at: addHours(-48),
    },
  ],
  match_participants: [
    { id: 'mp-1', match_id: 'match-1', user_id: 'user-aarav', status: 'accepted', created_at: addHours(-4) },
    { id: 'mp-2', match_id: 'match-1', user_id: 'user-priya', status: 'accepted', created_at: addHours(-2) },
    { id: 'mp-3', match_id: 'match-2', user_id: 'user-rohan', status: 'accepted', created_at: addHours(-6) },
    { id: 'mp-4', match_id: 'match-3', user_id: 'user-meera', status: 'accepted', created_at: addHours(-2) },
    { id: 'mp-5', match_id: 'match-4', user_id: 'user-priya', status: 'accepted', created_at: addHours(-5) },
    { id: 'mp-6', match_id: 'match-4', user_id: 'user-rohan', status: 'accepted', created_at: addHours(-3) },
    { id: 'mp-7', match_id: 'match-4', user_id: 'user-meera', status: 'accepted', created_at: addHours(-1) },
    { id: 'mp-8', match_id: 'match-5', user_id: 'user-aarav', status: 'accepted', created_at: addHours(-3) },
    { id: 'mp-9', match_id: 'match-5', user_id: 'user-meera', status: 'pending', created_at: addHours(-1) },
    { id: 'mp-10', match_id: 'match-6', user_id: 'user-aarav', status: 'accepted', created_at: addHours(-48) },
    { id: 'mp-11', match_id: 'match-6', user_id: 'user-rohan', status: 'accepted', created_at: addHours(-36) },
  ],
  ratings: [
    {
      id: 'rating-1',
      match_id: 'match-6',
      rater_id: 'user-rohan',
      ratee_id: 'user-aarav',
      stars: 5,
      comment: 'Super punctual and great rallies!',
      no_show: false,
      created_at: addHours(-20),
    },
  ],
  notifications: [
    {
      id: 'notif-1',
      user_id: 'user-aarav',
      type: 'join_request',
      title: 'New Join Request',
      body: 'Meera Nair requested to join your Chess match.',
      match_id: 'match-5',
      read: false,
      created_at: addHours(-1),
    },
  ],
}

export function getDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DB))
      return structuredClone(INITIAL_DB)
    }
    return JSON.parse(raw)
  } catch {
    return structuredClone(INITIAL_DB)
  }
}

export function saveDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  window.dispatchEvent(new CustomEvent('playerfinder-db-change'))
}

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function enrichMatch(db, match, currentUserId = null) {
  const sport = db.sports.find((s) => Number(s.id) === Number(match.sport_id)) || null
  const hostProfile = db.profiles.find((p) => p.id === match.host_id) || null
  const participants = db.match_participants
    .filter((mp) => mp.match_id === match.id)
    .map((mp) => {
      const prof = db.profiles.find((p) => p.id === mp.user_id) || null
      return { ...mp, profile: prof }
    })

  const acceptedCount = participants.filter((p) => p.status === 'accepted').length
  const pendingCount = participants.filter((p) => p.status === 'pending').length

  // Contact privacy rule (PROF-4): Contact details visible ONLY to host and accepted participants
  const isViewerHostOrAccepted =
    currentUserId &&
    (match.host_id === currentUserId ||
      participants.some((p) => p.user_id === currentUserId && p.status === 'accepted'))

  const sanitizeProfile = (prof) => {
    if (!prof) return null
    if (isViewerHostOrAccepted || prof.id === currentUserId) return prof
    const { contact: _contact, ...publicFields } = prof
    return publicFields
  }

  return {
    ...match,
    sport,
    host: sanitizeProfile(hostProfile),
    participants: participants.map((p) => ({
      ...p,
      profile: sanitizeProfile(p.profile),
    })),
    accepted_count: acceptedCount,
    pending_count: pendingCount,
  }
}

