const STORAGE_KEY = 'casino_suite_v1'
const BACKUP_KEY = 'casino_suite_v1_backup'
const CURRENT_VERSION = 1

export type StorageData = {
  version: number
  [key: string]: unknown
}

export function loadStorage(): StorageData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StorageData
  } catch {
    return null
  }
}

export function saveStorage(data: StorageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function backupStorage(): void {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    localStorage.setItem(BACKUP_KEY, raw)
  }
}

export function loadBackup(): StorageData | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StorageData
  } catch {
    return null
  }
}

type Migration = (data: StorageData) => StorageData

const migrations: Record<number, Migration> = {}

export function migrateStorage(data: StorageData): StorageData {
  let current = data
  while (current.version < CURRENT_VERSION) {
    const migrate = migrations[current.version]
    if (!migrate) break
    current = migrate(current)
  }
  return current
}

export function initStorage(): StorageData {
  const existing = loadStorage()
  if (!existing) {
    const fresh: StorageData = { version: CURRENT_VERSION }
    saveStorage(fresh)
    return fresh
  }
  if (existing.version < CURRENT_VERSION) {
    backupStorage()
    const migrated = migrateStorage(existing)
    saveStorage(migrated)
    return migrated
  }
  return existing
}
