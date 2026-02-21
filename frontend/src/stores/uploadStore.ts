import { create } from 'zustand';
import toast from 'react-hot-toast';
import api from '../services/api';

// --- Types ---

export interface UploadSession {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  status: string;
  totalRows: number;
  processedRows: number;
  errorRows: number;
  columnMapping: Record<string, string> | null;
  aiMappingConfidence: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadSessionRow {
  id: string;
  sessionId: string;
  rowNumber: number;
  rawData: Record<string, string>;
  mappedData: Record<string, string> | null;
  status: string;
  matchConfidence: number | null;
  matchedPartId: string | null;
  errors: string[] | null;
  listingId: string | null;
  createdAt: string;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
}

interface RowsPagination {
  page: number;
  limit: number;
  total: number;
}

interface UploadState {
  currentSession: UploadSession | null;
  sessions: UploadSession[];
  currentStep: number;
  parsedHeaders: string[];
  sampleRows: Record<string, string>[];
  columnMappings: ColumnMapping[];
  rows: UploadSessionRow[];
  rowsPagination: RowsPagination;
  isLoading: boolean;
  error: string | null;

  createSession: (file: File) => Promise<void>;
  parseFile: () => Promise<void>;
  getAIMappings: () => Promise<void>;
  saveMapping: (mappings: ColumnMapping[]) => Promise<void>;
  runMatching: () => Promise<void>;
  fetchRows: (page?: number, limit?: number, status?: string) => Promise<void>;
  updateRow: (rowId: string, data: Record<string, string>) => Promise<void>;
  importRows: () => Promise<void>;
  fetchSessions: () => Promise<void>;
  setStep: (step: number) => void;
  reset: () => void;
}

const initialState = {
  currentSession: null,
  sessions: [],
  currentStep: 0,
  parsedHeaders: [],
  sampleRows: [],
  columnMappings: [],
  rows: [],
  rowsPagination: { page: 1, limit: 25, total: 0 },
  isLoading: false,
  error: null,
};

export const useUploadStore = create<UploadState>()((set, get) => ({
  ...initialState,

  createSession: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/upload/session', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      set({
        currentSession: data.data,
        currentStep: 0,
        isLoading: false,
      });
    } catch (err) {
      const message = (err as { message?: string })?.message || 'Failed to create upload session';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  parseFile: async () => {
    const session = get().currentSession;
    if (!session) return;

    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post(`/upload/session/${session.id}/parse`);

      set({
        parsedHeaders: data.data.headers,
        sampleRows: data.data.sampleRows,
        currentSession: data.data.session ?? get().currentSession,
        isLoading: false,
      });
    } catch (err) {
      const message = (err as { message?: string })?.message || 'Failed to parse file';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  getAIMappings: async () => {
    const session = get().currentSession;
    if (!session) return;

    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post(`/upload/session/${session.id}/map`);

      set({
        columnMappings: data.data.mappings,
        currentSession: data.data.session ?? get().currentSession,
        isLoading: false,
      });
    } catch (err) {
      const message = (err as { message?: string })?.message || 'Failed to get AI mappings';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  saveMapping: async (mappings: ColumnMapping[]) => {
    const session = get().currentSession;
    if (!session) return;

    set({ isLoading: true, error: null });
    try {
      const { data } = await api.put(`/upload/session/${session.id}/mapping`, { mappings });

      set({
        columnMappings: mappings,
        currentSession: data.data.session ?? get().currentSession,
        isLoading: false,
      });
      toast.success('Column mappings saved');
    } catch (err) {
      const message = (err as { message?: string })?.message || 'Failed to save mappings';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  runMatching: async () => {
    const session = get().currentSession;
    if (!session) return;

    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post(`/upload/session/${session.id}/match`);

      set({
        currentSession: data.data.session ?? get().currentSession,
        isLoading: false,
      });
    } catch (err) {
      const message = (err as { message?: string })?.message || 'Failed to run matching';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  fetchRows: async (page = 1, limit = 25, status?: string) => {
    const session = get().currentSession;
    if (!session) return;

    set({ isLoading: true, error: null });
    try {
      const params: Record<string, string | number> = { page, limit };
      if (status) params.status = status;

      const { data } = await api.get(`/upload/session/${session.id}/rows`, { params });

      set({
        rows: data.data.rows,
        rowsPagination: data.data.pagination ?? { page, limit, total: data.data.rows.length },
        isLoading: false,
      });
    } catch (err) {
      const message = (err as { message?: string })?.message || 'Failed to fetch rows';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  updateRow: async (rowId: string, rowData: Record<string, string>) => {
    const session = get().currentSession;
    if (!session) return;

    set({ isLoading: true, error: null });
    try {
      const { data } = await api.put(`/upload/session/${session.id}/rows/${rowId}`, rowData);

      set((state) => ({
        rows: state.rows.map((r) => (r.id === rowId ? data.data : r)),
        isLoading: false,
      }));
    } catch (err) {
      const message = (err as { message?: string })?.message || 'Failed to update row';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  importRows: async () => {
    const session = get().currentSession;
    if (!session) return;

    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post(`/upload/session/${session.id}/import`);

      set({
        currentSession: data.data.session ?? get().currentSession,
        isLoading: false,
      });
      toast.success('Import completed successfully');
    } catch (err) {
      const message = (err as { message?: string })?.message || 'Failed to import rows';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/upload/sessions');

      set({
        sessions: data.data,
        isLoading: false,
      });
    } catch (err) {
      const message = (err as { message?: string })?.message || 'Failed to fetch sessions';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  setStep: (step: number) => {
    set({ currentStep: step });
  },

  reset: () => {
    set({ ...initialState });
  },
}));
