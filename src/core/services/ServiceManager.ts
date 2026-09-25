// ============================================================
// Sanctuary — Service Manager
// ============================================================

import type { Service, ServiceItem, ServiceItemType, ServiceItemData } from '../../shared/types';
import { DatabaseService } from '../database/DatabaseService';
import { generateId, now } from '../../shared/utils';
import { Logger } from './Logger';

const logger = new Logger('ServiceManager');

export class ServiceManager {
  private db: DatabaseService;
  private activeService: Service | null = null;
  private autosaveTimer: ReturnType<typeof setInterval> | null = null;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Create a new service
   */
  createService(name: string, description: string = ''): Service {
    const service: Service = {
      id: generateId(),
      name,
      description,
      date: new Date().toISOString().split('T')[0],
      items: [],
      isAutosaved: false,
      lastAutosavedAt: null,
      createdAt: now(),
      updatedAt: now(),
    };

    this.db.execute(
      `INSERT INTO services (id, name, description, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [service.id, service.name, service.description, service.date, service.createdAt, service.updatedAt]
    );

    this.activeService = service;
    logger.info('Service created', { id: service.id, name: service.name });
    return service;
  }

  /**
   * Load a service by ID
   */
  loadService(id: string): Service | null {
    const row = this.db.queryOne<{
      id: string;
      name: string;
      description: string;
      date: string;
      is_autosaved: number;
      last_autosaved_at: string | null;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM services WHERE id = ?', [id]);

    if (!row) return null;

    const items = this.loadServiceItems(id);

    const service: Service = {
      id: row.id,
      name: row.name,
      description: row.description,
      date: row.date,
      items,
      isAutosaved: row.is_autosaved === 1,
      lastAutosavedAt: row.last_autosaved_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    this.activeService = service;
    logger.info('Service loaded', { id, name: service.name, itemCount: items.length });
    return service;
  }

  /**
   * Save a service
   */
  saveService(service: Service): boolean {
    try {
      this.db.transaction(() => {
        // Update service record
        this.db.execute(
          `UPDATE services SET name = ?, description = ?, date = ?, updated_at = ?
           WHERE id = ?`,
          [service.name, service.description, service.date, now(), service.id]
        );

        // Delete existing items and re-insert
        this.db.execute('DELETE FROM service_items WHERE service_id = ?', [service.id]);

        for (const item of service.items) {
          this.db.execute(
            `INSERT INTO service_items (id, service_id, type, title, item_order, data, notes, duration, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.id,
              service.id,
              item.type,
              item.title,
                item.order || 0,
                JSON.stringify(item.data),
              item.notes || '',
              item.duration || null,
              item.createdAt || now(),
              now(),
            ]
          );
        }
      });

      this.activeService = service;
      logger.info('Service saved', { id: service.id });
      return true;
    } catch (error) {
      logger.error('Failed to save service', { id: service.id, error: String(error) });
      return false;
    }
  }

  /**
   * Delete a service
   */
  deleteService(id: string): boolean {
    try {
      this.db.execute('DELETE FROM services WHERE id = ?', [id]);
      if (this.activeService?.id === id) {
        this.activeService = null;
      }
      logger.info('Service deleted', { id });
      return true;
    } catch (error) {
      logger.error('Failed to delete service', { id, error: String(error) });
      return false;
    }
  }

  /**
   * List all services
   */
  listServices(): Array<{ id: string; name: string; date: string; itemCount: number; updatedAt: string }> {
    return this.db.query<{
      id: string;
      name: string;
      date: string;
      item_count: number;
      updated_at: string;
    }>(
      `SELECT s.id, s.name, s.date, s.updated_at,
              COUNT(si.id) as item_count
       FROM services s
       LEFT JOIN service_items si ON s.id = si.service_id
       GROUP BY s.id
       ORDER BY s.updated_at DESC`
    ).map((row) => ({
      id: row.id,
      name: row.name,
      date: row.date,
      itemCount: row.item_count,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Add an item to the active service
   */
  addItem(type: ServiceItemType, title: string, data: ServiceItemData): ServiceItem | null {
    if (!this.activeService) return null;

    const item: ServiceItem = {
      id: generateId(),
      serviceId: this.activeService.id,
      type,
      title,
      order: this.activeService.items.length,
      data,
      notes: '',
      duration: null,
      createdAt: now(),
      updatedAt: now(),
    };

    this.activeService.items.push(item);
    return item;
  }

  /**
   * Remove an item from the active service
   */
  removeItem(itemId: string): boolean {
    if (!this.activeService) return false;

    const index = this.activeService.items.findIndex((i) => i.id === itemId);
    if (index === -1) return false;

    this.activeService.items.splice(index, 1);

    // Re-order
    this.activeService.items.forEach((item, i) => {
      item.order = i;
    });

    return true;
  }

  /**
   * Update an item in the active service
   */
  updateItem(itemId: string, updates: Partial<Pick<ServiceItem, 'title' | 'notes' | 'duration'>>): boolean {
    if (!this.activeService) return false;

    const item = this.activeService.items.find(i => i.id === itemId);
    if (!item) return false;

    if (updates.title !== undefined) item.title = updates.title;
    if (updates.notes !== undefined) item.notes = updates.notes;
    if (updates.duration !== undefined) item.duration = updates.duration;

    item.updatedAt = now();
    return true;
  }

  /**
   * Reorder items in the active service
   */
  reorderItems(itemIds: string[]): boolean {
    if (!this.activeService) return false;

    const reordered: ServiceItem[] = [];
    for (let i = 0; i < itemIds.length; i++) {
      const item = this.activeService.items.find((it) => it.id === itemIds[i]);
      if (item) {
        item.order = i;
        reordered.push(item);
      }
    }

    this.activeService.items = reordered;
    return true;
  }

  /**
   * Get the active service
   */
  getActiveService(): Service | null {
    return this.activeService;
  }

  /**
   * Start autosave timer
   */
  startAutosave(intervalMs: number = 30000): void {
    this.stopAutosave();
    this.autosaveTimer = setInterval(() => {
      if (this.activeService) {
        this.saveService(this.activeService);
        this.activeService.isAutosaved = true;
        this.activeService.lastAutosavedAt = now();
        logger.debug('Service autosaved', { id: this.activeService.id });
      }
    }, intervalMs);
  }

  /**
   * Stop autosave timer
   */
  stopAutosave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }

  // ---- Private ----

  private loadServiceItems(serviceId: string): ServiceItem[] {
    const rows = this.db.query<{
      id: string;
      service_id: string;
      type: string;
      title: string;
      item_order: number;
      data: string;
      notes: string;
      duration: number | null;
      created_at: string;
      updated_at: string;
    }>(
      'SELECT * FROM service_items WHERE service_id = ? ORDER BY item_order',
      [serviceId]
    );

    return rows.map((row) => ({
      id: row.id,
      serviceId: row.service_id,
      type: row.type as ServiceItemType,
      title: row.title,
      order: row.item_order,
      data: JSON.parse(row.data) as ServiceItemData,
      notes: row.notes,
      duration: row.duration,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
}
