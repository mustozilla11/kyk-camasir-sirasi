import { Booking, Maintenance } from "./types";
import path from "path";
import fs from "fs";
import { getIstanbulDate, formatDate, isSlotPast } from "./date-utils";

// Database adapter interface
interface DbAdapter {
  init(): Promise<void>;
  getBookingsForDate(date: string): Promise<Booking[]>;
  getBookingById(id: string): Promise<Booking | null>;
  findBooking(date: string, timeSlot: string, machineNumber: number): Promise<Booking | null>;
  getActiveBookingsForBed(room: string, bed: number): Promise<Booking[]>;
  createBooking(booking: Booking): Promise<Booking>;
  deleteBooking(id: string): Promise<boolean>;
  deleteBookingWithCode(room: string, bed: number, cancelCode: string): Promise<Booking | null>;
  getMaintenances(): Promise<Maintenance[]>;
  addMaintenance(type: "machine" | "date", target: string, reason?: string): Promise<void>;
  removeMaintenance(type: "machine" | "date", target: string): Promise<void>;
  searchBookings(query: string, date?: string): Promise<Booking[]>;
  cleanupOldBookings(daysThreshold?: number): Promise<number>;
}

// Check for Postgres (Neon / Vercel Postgres)
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const isPostgres = Boolean(
  dbUrl && (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://"))
);

// -------------------------------------------------------------
// 1. POSTGRES IMPLEMENTATION (NEON / VERCEL POSTGRES)
// -------------------------------------------------------------
class PostgresAdapter implements DbAdapter {
  private sqlClient: any = null;

  private async getSql() {
    if (!this.sqlClient) {
      const { neon } = await import("@neondatabase/serverless");
      this.sqlClient = neon(dbUrl!);
    }
    return this.sqlClient;
  }

  async init(): Promise<void> {
    const sql = await this.getSql();
    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(64) PRIMARY KEY,
        booking_date VARCHAR(10) NOT NULL,
        time_slot VARCHAR(32) NOT NULL,
        machine_number INT NOT NULL,
        floor INT NOT NULL,
        room VARCHAR(32) NOT NULL,
        bed INT NOT NULL,
        cancel_code VARCHAR(32) DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_slot UNIQUE (booking_date, time_slot, machine_number)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS maintenance (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(16) NOT NULL,
        target VARCHAR(32) NOT NULL,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_maintenance UNIQUE (type, target)
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_bed ON bookings(room, bed, booking_date);`;
  }

  async getBookingsForDate(date: string): Promise<Booking[]> {
    const sql = await this.getSql();
    const rows = await sql`
      SELECT * FROM bookings 
      WHERE booking_date = ${date} 
      ORDER BY time_slot ASC, machine_number ASC
    `;
    return rows.map(mapBookingRow);
  }

  async getBookingById(id: string): Promise<Booking | null> {
    const sql = await this.getSql();
    const rows = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    return rows.length > 0 ? mapBookingRow(rows[0]) : null;
  }

  async findBooking(date: string, timeSlot: string, machineNumber: number): Promise<Booking | null> {
    const sql = await this.getSql();
    const rows = await sql`
      SELECT * FROM bookings 
      WHERE booking_date = ${date} 
        AND time_slot = ${timeSlot} 
        AND machine_number = ${machineNumber}
    `;
    return rows.length > 0 ? mapBookingRow(rows[0]) : null;
  }

  async getActiveBookingsForBed(room: string, bed: number): Promise<Booking[]> {
    const sql = await this.getSql();
    const todayStr = formatDate(getIstanbulDate());
    const rows = await sql`
      SELECT * FROM bookings
      WHERE room = ${room}
        AND bed = ${bed}
        AND booking_date >= ${todayStr}
      ORDER BY booking_date ASC, time_slot ASC
    `;
    const bookings = rows.map(mapBookingRow);
    return bookings.filter((b: Booking) => !isSlotPast(b.booking_date, b.time_slot));
  }

  async createBooking(booking: Booking): Promise<Booking> {
    const sql = await this.getSql();
    await sql`
      INSERT INTO bookings (
        id, booking_date, time_slot, machine_number, floor, room, bed, cancel_code, created_at
      ) VALUES (
        ${booking.id},
        ${booking.booking_date},
        ${booking.time_slot},
        ${booking.machine_number},
        ${booking.floor},
        ${booking.room},
        ${booking.bed},
        ${booking.cancel_code || ""},
        ${booking.created_at}
      )
    `;
    return booking;
  }

  async deleteBooking(id: string): Promise<boolean> {
    const sql = await this.getSql();
    const res = await sql`DELETE FROM bookings WHERE id = ${id} RETURNING id`;
    return res.length > 0;
  }

  async deleteBookingWithCode(room: string, bed: number, cancelCode: string): Promise<Booking | null> {
    const sql = await this.getSql();
    const code = cancelCode.trim().toUpperCase();
    const rows = await sql`
      SELECT * FROM bookings 
      WHERE room = ${room} 
        AND bed = ${bed} 
        AND UPPER(cancel_code) = ${code}
      ORDER BY booking_date DESC, time_slot DESC
    `;
    if (rows.length === 0) return null;
    const target = rows[0];
    await sql`DELETE FROM bookings WHERE id = ${target.id}`;
    return mapBookingRow(target);
  }

  async getMaintenances(): Promise<Maintenance[]> {
    const sql = await this.getSql();
    const rows = await sql`SELECT * FROM maintenance`;
    return rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      target: r.target,
      reason: r.reason,
      created_at: r.created_at,
    }));
  }

  async addMaintenance(type: "machine" | "date", target: string, reason?: string): Promise<void> {
    const sql = await this.getSql();
    const id = `${type}_${target}`;
    await sql`
      INSERT INTO maintenance (id, type, target, reason, created_at)
      VALUES (${id}, ${type}, ${target}, ${reason || ""}, NOW())
      ON CONFLICT (type, target) DO UPDATE SET reason = ${reason || ""}
    `;
  }

  async removeMaintenance(type: "machine" | "date", target: string): Promise<void> {
    const sql = await this.getSql();
    await sql`DELETE FROM maintenance WHERE type = ${type} AND target = ${target}`;
  }

  async searchBookings(query: string, date?: string): Promise<Booking[]> {
    const sql = await this.getSql();
    const q = `%${query.trim()}%`;
    let rows;
    if (date) {
      rows = await sql`
        SELECT * FROM bookings
        WHERE booking_date = ${date}
          AND (room ILIKE ${q} OR CONCAT(room, '-', bed) ILIKE ${q})
        ORDER BY time_slot ASC, machine_number ASC
      `;
    } else {
      rows = await sql`
        SELECT * FROM bookings
        WHERE room ILIKE ${q} OR CONCAT(room, '-', bed) ILIKE ${q}
        ORDER BY booking_date DESC, time_slot ASC
        LIMIT 100
      `;
    }
    return rows.map(mapBookingRow);
  }

  async cleanupOldBookings(daysThreshold = 7): Promise<number> {
    const sql = await this.getSql();
    const res = await sql`
      DELETE FROM bookings
      WHERE booking_date < TO_CHAR(NOW() - (${daysThreshold} || ' days')::INTERVAL, 'YYYY-MM-DD')
      RETURNING id
    `;
    return res.length;
  }
}

// -------------------------------------------------------------
// 2. SERVERLESS JSON ADAPTER (VERCEL FALLBACK WHEN NO POSTGRES)
// -------------------------------------------------------------
class ServerlessJsonAdapter implements DbAdapter {
  private filePath = path.join("/tmp", "kyk_store.json");

  private readData(): { bookings: Booking[]; maintenances: Maintenance[] } {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
      }
    } catch (e) {}
    return { bookings: [], maintenances: [] };
  }

  private writeData(data: { bookings: Booking[]; maintenances: Maintenance[] }) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data), "utf-8");
    } catch (e) {
      console.error("Write to /tmp error:", e);
    }
  }

  async init(): Promise<void> {
    const data = this.readData();
    this.writeData(data);
  }

  async getBookingsForDate(date: string): Promise<Booking[]> {
    const data = this.readData();
    return data.bookings.filter((b) => b.booking_date === date);
  }

  async getBookingById(id: string): Promise<Booking | null> {
    const data = this.readData();
    return data.bookings.find((b) => b.id === id) || null;
  }

  async findBooking(date: string, timeSlot: string, machineNumber: number): Promise<Booking | null> {
    const data = this.readData();
    return (
      data.bookings.find(
        (b) =>
          b.booking_date === date &&
          b.time_slot === timeSlot &&
          b.machine_number === machineNumber
      ) || null
    );
  }

  async getActiveBookingsForBed(room: string, bed: number): Promise<Booking[]> {
    const data = this.readData();
    const todayStr = formatDate(getIstanbulDate());
    return data.bookings.filter(
      (b) =>
        b.room === room &&
        b.bed === bed &&
        b.booking_date >= todayStr &&
        !isSlotPast(b.booking_date, b.time_slot)
    );
  }

  async createBooking(booking: Booking): Promise<Booking> {
    const data = this.readData();
    const exists = data.bookings.some(
      (b) =>
        b.booking_date === booking.booking_date &&
        b.time_slot === booking.time_slot &&
        b.machine_number === booking.machine_number
    );
    if (exists) {
      throw new Error("UNIQUE constraint failed");
    }
    data.bookings.push(booking);
    this.writeData(data);
    return booking;
  }

  async deleteBooking(id: string): Promise<boolean> {
    const data = this.readData();
    const initialLen = data.bookings.length;
    data.bookings = data.bookings.filter((b) => b.id !== id);
    this.writeData(data);
    return data.bookings.length < initialLen;
  }

  async deleteBookingWithCode(room: string, bed: number, cancelCode: string): Promise<Booking | null> {
    const data = this.readData();
    const code = cancelCode.trim().toUpperCase();
    const idx = data.bookings.findIndex(
      (b) => b.room === room && b.bed === bed && (b.cancel_code || "").toUpperCase() === code
    );
    if (idx === -1) return null;
    const deleted = data.bookings.splice(idx, 1)[0];
    this.writeData(data);
    return deleted;
  }

  async getMaintenances(): Promise<Maintenance[]> {
    const data = this.readData();
    return data.maintenances;
  }

  async addMaintenance(type: "machine" | "date", target: string, reason?: string): Promise<void> {
    const data = this.readData();
    data.maintenances = data.maintenances.filter((m) => !(m.type === type && m.target === target));
    data.maintenances.push({
      id: `${type}_${target}`,
      type,
      target,
      reason: reason || "",
      created_at: new Date().toISOString(),
    });
    this.writeData(data);
  }

  async removeMaintenance(type: "machine" | "date", target: string): Promise<void> {
    const data = this.readData();
    data.maintenances = data.maintenances.filter((m) => !(m.type === type && m.target === target));
    this.writeData(data);
  }

  async searchBookings(query: string, date?: string): Promise<Booking[]> {
    const data = this.readData();
    const q = query.trim().toLowerCase();
    return data.bookings.filter((b) => {
      const matchRoom = b.room.toLowerCase().includes(q) || `${b.room}-${b.bed}`.includes(q);
      if (!matchRoom) return false;
      if (date) return b.booking_date === date;
      return true;
    });
  }

  async cleanupOldBookings(daysThreshold = 7): Promise<number> {
    const data = this.readData();
    const initialLen = data.bookings.length;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysThreshold);
    const cutoffStr = formatDate(cutoff);
    data.bookings = data.bookings.filter((b) => b.booking_date >= cutoffStr);
    this.writeData(data);
    return initialLen - data.bookings.length;
  }
}

// -------------------------------------------------------------
// 3. SQLITE IMPLEMENTATION (LOCAL DEV)
// -------------------------------------------------------------
class SqliteAdapter implements DbAdapter {
  private db: any = null;

  private getDb() {
    if (!this.db) {
      const Database = require("better-sqlite3");
      const dbDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      const dbPath = path.join(dbDir, "kyk.db");
      this.db = new Database(dbPath);
      this.db.pragma("journal_mode = WAL");
    }
    return this.db;
  }

  async init(): Promise<void> {
    const db = this.getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        booking_date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        machine_number INTEGER NOT NULL,
        floor INTEGER NOT NULL,
        room TEXT NOT NULL,
        bed INTEGER NOT NULL,
        cancel_code TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (booking_date, time_slot, machine_number)
      );

      CREATE TABLE IF NOT EXISTS maintenance (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        target TEXT NOT NULL,
        reason TEXT,
        created_at TEXT NOT NULL,
        UNIQUE (type, target)
      );

      CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
      CREATE INDEX IF NOT EXISTS idx_bookings_bed ON bookings(room, bed, booking_date);
    `);
  }

  async getBookingsForDate(date: string): Promise<Booking[]> {
    const db = this.getDb();
    const stmt = db.prepare(
      "SELECT * FROM bookings WHERE booking_date = ? ORDER BY time_slot ASC, machine_number ASC"
    );
    return stmt.all(date).map(mapBookingRow);
  }

  async getBookingById(id: string): Promise<Booking | null> {
    const db = this.getDb();
    const row = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
    return row ? mapBookingRow(row) : null;
  }

  async findBooking(date: string, timeSlot: string, machineNumber: number): Promise<Booking | null> {
    const db = this.getDb();
    const row = db
      .prepare(
        "SELECT * FROM bookings WHERE booking_date = ? AND time_slot = ? AND machine_number = ?"
      )
      .get(date, timeSlot, machineNumber);
    return row ? mapBookingRow(row) : null;
  }

  async getActiveBookingsForBed(room: string, bed: number): Promise<Booking[]> {
    const db = this.getDb();
    const todayStr = formatDate(getIstanbulDate());
    const rows = db
      .prepare(`
        SELECT * FROM bookings
        WHERE room = ? 
          AND bed = ? 
          AND booking_date >= ?
        ORDER BY booking_date ASC, time_slot ASC
      `)
      .all(room, bed, todayStr);
    const bookings = rows.map(mapBookingRow);
    return bookings.filter((b: Booking) => !isSlotPast(b.booking_date, b.time_slot));
  }

  async createBooking(booking: Booking): Promise<Booking> {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT INTO bookings (
        id, booking_date, time_slot, machine_number, floor, room, bed, cancel_code, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      booking.id,
      booking.booking_date,
      booking.time_slot,
      booking.machine_number,
      booking.floor,
      booking.room,
      booking.bed,
      booking.cancel_code || "",
      booking.created_at
    );
    return booking;
  }

  async deleteBooking(id: string): Promise<boolean> {
    const db = this.getDb();
    const res = db.prepare("DELETE FROM bookings WHERE id = ?").run(id);
    return res.changes > 0;
  }

  async deleteBookingWithCode(room: string, bed: number, cancelCode: string): Promise<Booking | null> {
    const db = this.getDb();
    const code = cancelCode.trim().toUpperCase();
    const row = db
      .prepare(
        "SELECT * FROM bookings WHERE room = ? AND bed = ? AND UPPER(cancel_code) = ? ORDER BY booking_date DESC, time_slot DESC"
      )
      .get(room, bed, code);
    if (!row) return null;
    db.prepare("DELETE FROM bookings WHERE id = ?").run(row.id);
    return mapBookingRow(row);
  }

  async getMaintenances(): Promise<Maintenance[]> {
    const db = this.getDb();
    const rows = db.prepare("SELECT * FROM maintenance").all();
    return rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      target: r.target,
      reason: r.reason,
      created_at: r.created_at,
    }));
  }

  async addMaintenance(type: "machine" | "date", target: string, reason?: string): Promise<void> {
    const db = this.getDb();
    const id = `${type}_${target}`;
    db.prepare(`
      INSERT INTO maintenance (id, type, target, reason, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(type, target) DO UPDATE SET reason = excluded.reason
    `).run(id, type, target, reason || "");
  }

  async removeMaintenance(type: "machine" | "date", target: string): Promise<void> {
    const db = this.getDb();
    db.prepare("DELETE FROM maintenance WHERE type = ? AND target = ?").run(type, target);
  }

  async searchBookings(query: string, date?: string): Promise<Booking[]> {
    const db = this.getDb();
    const q = `%${query.trim()}%`;
    if (date) {
      const rows = db
        .prepare(`
          SELECT * FROM bookings
          WHERE booking_date = ?
            AND (room LIKE ? OR (room || '-' || bed) LIKE ?)
          ORDER BY time_slot ASC, machine_number ASC
        `)
        .all(date, q, q);
      return rows.map(mapBookingRow);
    } else {
      const rows = db
        .prepare(`
          SELECT * FROM bookings
          WHERE room LIKE ? OR (room || '-' || bed) LIKE ?
          ORDER BY booking_date DESC, time_slot ASC
          LIMIT 100
        `)
        .all(q, q);
      return rows.map(mapBookingRow);
    }
  }

  async cleanupOldBookings(daysThreshold = 7): Promise<number> {
    const db = this.getDb();
    const res = db
      .prepare(`
        DELETE FROM bookings
        WHERE booking_date < date('now', '-' || ? || ' days')
      `)
      .run(daysThreshold);
    return res.changes;
  }
}

function mapBookingRow(row: any): Booking {
  return {
    id: String(row.id),
    booking_date: String(row.booking_date),
    time_slot: String(row.time_slot),
    machine_number: Number(row.machine_number),
    floor: Number(row.floor),
    room: String(row.room),
    bed: Number(row.bed),
    cancel_code: String(row.cancel_code || ""),
    created_at: typeof row.created_at === "object" ? row.created_at.toISOString() : String(row.created_at),
  };
}

// Single instance adapter:
// 1. If DATABASE_URL / POSTGRES_URL is present -> Postgres (Neon)
// 2. If running on Vercel without Postgres -> ServerlessJsonAdapter (/tmp)
// 3. Otherwise (local dev) -> SqliteAdapter
let adapter: DbAdapter;
if (isPostgres) {
  adapter = new PostgresAdapter();
} else if (process.env.VERCEL) {
  adapter = new ServerlessJsonAdapter();
} else {
  adapter = new SqliteAdapter();
}

let isInitialized = false;

export async function getDb(): Promise<DbAdapter> {
  if (!isInitialized) {
    try {
      await adapter.init();
      isInitialized = true;
    } catch (err) {
      console.error("Database initialization error:", err);
      throw err;
    }
  }
  return adapter;
}
