import Dexie from 'dexie'

// Create offline database inside browser
const db = new Dexie('FloodAssessmentDB')

// Define tables
db.version(1).stores({
  // ++ means auto increment ID
  // other fields are indexed for searching
  assessments: '++id, local_id, synced, user_id',
  photos: '++id, local_id, assessmentLocalId, synced'
})

export default db