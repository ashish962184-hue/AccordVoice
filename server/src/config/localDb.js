const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.resolve(__dirname, '../../data');
const dbFile = path.join(dataDir, 'local_db.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial DB structure
const initialData = {
  profiles: [],
  conversations: [],
  conversation_turns: [],
  claims: [],
  conflicts: [],
  clarifications: [],
  agreements: [],
  agreement_events: [],
};

// Load database from file
function loadDb() {
  try {
    if (fs.existsSync(dbFile)) {
      const content = fs.readFileSync(dbFile, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('[LocalDB] Error reading DB file, reinitializing:', err.message);
  }
  saveDb(initialData);
  return { ...initialData };
}

// Save database to file
function saveDb(data) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[LocalDB] Error saving DB file:', err.message);
  }
}

// Chainable query builder mimicking Supabase API
class QueryBuilder {
  constructor(table, userId = null) {
    this.table = table;
    this.userId = userId;
    this.operation = 'select';
    this.selectColumns = '*';
    this.whereFilters = [];
    this.inFilters = [];
    this.orderBy = null;
    this.limitCount = null;
    this.isSingle = false;
    this.payload = null;
  }

  select(columns = '*') {
    this.selectColumns = columns;
    return this;
  }

  insert(values) {
    this.operation = 'insert';
    this.payload = values;
    return this;
  }

  update(values) {
    this.operation = 'update';
    this.payload = values;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column, value) {
    this.whereFilters.push({ column, value });
    return this;
  }

  in(column, values) {
    this.inFilters.push({ column, values: Array.isArray(values) ? values : [values] });
    return this;
  }

  order(column, options = { ascending: true }) {
    this.orderBy = { column, ascending: options.ascending !== false };
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  // Execute the query when awaited
  async then(resolve, reject) {
    try {
      const db = loadDb();
      if (!db[this.table]) {
        db[this.table] = [];
      }

      let result = null;

      if (this.operation === 'insert') {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        const inserted = items.map((item) => {
          const now = new Date().toISOString();
          return {
            id: item.id || crypto.randomUUID(),
            created_at: item.created_at || now,
            updated_at: now,
            ...item,
          };
        });

        db[this.table].push(...inserted);
        saveDb(db);
        result = this.isSingle || !Array.isArray(this.payload) ? inserted[0] : inserted;
      } else if (this.operation === 'update') {
        const matches = db[this.table].filter((row) => {
          const matchEq = this.whereFilters.every((f) => row[f.column] === f.value);
          const matchIn = this.inFilters.every((f) => f.values.includes(row[f.column]));
          return matchEq && matchIn;
        });

        matches.forEach((row) => {
          Object.assign(row, this.payload, { updated_at: new Date().toISOString() });
        });

        saveDb(db);
        result = this.isSingle ? (matches[0] || null) : matches;
      } else if (this.operation === 'delete') {
        const initialLen = db[this.table].length;
        db[this.table] = db[this.table].filter((row) => {
          const matchEq = this.whereFilters.every((f) => row[f.column] === f.value);
          const matchIn = this.inFilters.every((f) => f.values.includes(row[f.column]));
          return !(matchEq && matchIn);
        });
        saveDb(db);
        result = { count: initialLen - db[this.table].length };
      } else {
        // SELECT
        let rows = [...db[this.table]];

        // Filter by WHERE
        if (this.whereFilters.length > 0) {
          rows = rows.filter((row) =>
            this.whereFilters.every((f) => row[f.column] === f.value)
          );
        }

        // Filter by IN
        if (this.inFilters.length > 0) {
          rows = rows.filter((row) =>
            this.inFilters.every((f) => f.values.includes(row[f.column]))
          );
        }

        // Order
        if (this.orderBy) {
          const { column, ascending } = this.orderBy;
          rows.sort((a, b) => {
            if (a[column] < b[column]) return ascending ? -1 : 1;
            if (a[column] > b[column]) return ascending ? 1 : -1;
            return 0;
          });
        }

        // Limit
        if (this.limitCount !== null) {
          rows = rows.slice(0, this.limitCount);
        }

        if (this.isSingle) {
          result = rows[0] || null;
        } else {
          result = rows;
        }
      }

      const response = {
        data: result,
        error: (this.isSingle && !result && this.operation === 'select') ? { message: 'Row not found' } : null,
      };

      resolve(response);
    } catch (err) {
      console.error(`[LocalDB] Query error on ${this.table}:`, err);
      resolve({ data: null, error: { message: err.message } });
    }
  }
}

// Client constructor that mirrors Supabase client
function createLocalClient(userId = null) {
  return {
    from: (table) => new QueryBuilder(table, userId),
  };
}

module.exports = { createLocalClient, loadDb, saveDb };
